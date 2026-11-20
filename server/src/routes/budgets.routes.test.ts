import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'
import { BudgetModel } from '../models/Budget.js'

const app = createApp()

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!)
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

beforeEach(async () => {
  await UserModel.deleteMany({})
  await AccountModel.deleteMany({})
  await TransactionModel.deleteMany({})
  await BudgetModel.deleteMany({})
})

async function registerUser(name: string, email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' })
  return { token: res.body.token as string, id: res.body.user.id as string }
}

async function createAccount(token: string) {
  const res = await request(app)
    .post('/api/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Checking', type: 'checking', balance: 5000, currency: 'USD' })
  return res.body.account.id as string
}

async function createExpense(token: string, accountId: string, category: string, amount: number, date: string) {
  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ accountId, amount, type: 'expense', category, date })
}

describe('POST /api/budgets', () => {
  it('creates a budget with computed usage', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token)
    await createExpense(user.token, accountId, 'Food', 60, '2026-08-05')

    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ category: 'Food', monthlyLimit: 200, month: 8, year: 2026 })

    expect(res.status).toBe(201)
    expect(res.body.budget).toMatchObject({ category: 'Food', monthlyLimit: 200, month: 8, year: 2026 })
    expect(res.body.budget.usage).toEqual({
      spent: 60,
      limit: 200,
      remaining: 140,
      percentUsed: 30,
      isOverBudget: false,
    })
  })

  it('rejects a duplicate category/month/year, case-insensitively', async () => {
    const user = await registerUser('User A', 'usera@example.com')

    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ category: 'Food', monthlyLimit: 200, month: 8, year: 2026 })

    const dup = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ category: 'food', monthlyLimit: 300, month: 8, year: 2026 })

    expect(dup.status).toBe(409)
  })

  it('rejects an invalid payload and an unauthenticated request', async () => {
    const user = await registerUser('User A', 'usera@example.com')

    const invalid = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ category: 'Food', monthlyLimit: -10, month: 8, year: 2026 })
    expect(invalid.status).toBe(400)

    const unauthed = await request(app).post('/api/budgets').send({})
    expect(unauthed.status).toBe(401)
  })
})

describe('GET /api/budgets', () => {
  it('lists only the authenticated user\'s own budgets, with usage computed only from expenses in that budget\'s month', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountA = await createAccount(userA.token)
    const accountB = await createAccount(userB.token)

    await createExpense(userA.token, accountA, 'Food', 50, '2026-08-05')
    await createExpense(userA.token, accountA, 'Food', 999, '2026-07-05') // different month, must not count
    await createExpense(userA.token, accountA, 'Food', 10, '2026-08-10') // income-free expense, should count
    await createExpense(userB.token, accountB, 'Food', 5000, '2026-08-05') // other user's, must not count

    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ category: 'Food', monthlyLimit: 100, month: 8, year: 2026 })

    const res = await request(app).get('/api/budgets').set('Authorization', `Bearer ${userA.token}`)
    expect(res.status).toBe(200)
    expect(res.body.budgets).toHaveLength(1)
    expect(res.body.budgets[0].usage.spent).toBe(60)
  })

  it('flags isOverBudget once spending exceeds the limit', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token)

    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ category: 'Food', monthlyLimit: 100, month: 8, year: 2026 })

    await createExpense(user.token, accountId, 'Food', 150, '2026-08-05')

    const res = await request(app).get('/api/budgets').set('Authorization', `Bearer ${user.token}`)
    expect(res.body.budgets[0].usage.isOverBudget).toBe(true)
    expect(res.body.budgets[0].usage.remaining).toBe(-50)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/budgets')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/budgets/:id', () => {
  it('updates a budget for its owner, 404s for another user, and rejects a rename that collides with an existing budget', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ category: 'Food', monthlyLimit: 200, month: 8, year: 2026 })
    const budgetId = created.body.budget.id

    const updated = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ monthlyLimit: 350 })
    expect(updated.status).toBe(200)
    expect(updated.body.budget.monthlyLimit).toBe(350)
    expect(updated.body.budget.category).toBe('Food')

    const foreign = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ monthlyLimit: 1 })
    expect(foreign.status).toBe(404)

    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ category: 'Transport', monthlyLimit: 100, month: 8, year: 2026 })

    const collide = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ category: 'Transport' })
    expect(collide.status).toBe(409)
  })
})

describe('DELETE /api/budgets/:id', () => {
  it('deletes a budget for its owner and 404s for another user', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ category: 'Food', monthlyLimit: 200, month: 8, year: 2026 })
    const budgetId = created.body.budget.id

    const foreign = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(foreign.status).toBe(404)

    const ownDelete = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(ownDelete.status).toBe(204)

    const afterDelete = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(afterDelete.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).delete('/api/budgets/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })
})
