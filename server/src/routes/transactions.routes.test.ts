import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'

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
})

async function registerUser(name: string, email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' })
  return { token: res.body.token as string, id: res.body.user.id as string }
}

async function createAccount(token: string, balance = 1000) {
  const res = await request(app)
    .post('/api/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Checking', type: 'checking', balance, currency: 'USD' })
  return res.body.account.id as string
}

async function getAccountBalance(token: string, accountId: string) {
  const res = await request(app)
    .get(`/api/accounts/${accountId}`)
    .set('Authorization', `Bearer ${token}`)
  return res.body.account.balance as number
}

describe('POST /api/transactions', () => {
  it('increases the account balance for an income transaction', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 250, type: 'income', category: 'Salary', date: '2026-08-01' })

    expect(res.status).toBe(201)
    expect(res.body.transaction).toMatchObject({ accountId, amount: 250, type: 'income', category: 'Salary' })
    expect(await getAccountBalance(user.token, accountId)).toBe(1250)
  })

  it('decreases the account balance for an expense transaction', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Groceries', date: '2026-08-01' })

    expect(await getAccountBalance(user.token, accountId)).toBe(900)
  })

  it('decreases the account balance for transfer and investment transactions', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 100, type: 'transfer', category: 'Transfer', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountId)).toBe(900)

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 50, type: 'investment', category: 'Stocks', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountId)).toBe(850)
  })

  it('rejects creating a transaction against another user\'s account, leaving its balance untouched', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountId = await createAccount(userA.token, 1000)

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Groceries', date: '2026-08-01' })

    expect(res.status).toBe(404)
    expect(await getAccountBalance(userA.token, accountId)).toBe(1000)
  })

  it('rejects an invalid account id and an invalid payload', async () => {
    const user = await registerUser('User A', 'usera@example.com')

    const invalidAccount = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId: 'not-a-valid-id', amount: 100, type: 'expense', category: 'Groceries', date: '2026-08-01' })
    expect(invalidAccount.status).toBe(404)

    const accountId = await createAccount(user.token, 1000)
    const invalidPayload = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: -50, type: 'expense', category: 'Groceries', date: '2026-08-01' })
    expect(invalidPayload.status).toBe(400)
    expect(await getAccountBalance(user.token, accountId)).toBe(1000)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/transactions').send({})
    expect(res.status).toBe(401)
  })
})

describe('GET /api/transactions', () => {
  it('lists only the authenticated user\'s own transactions, optionally filtered by account/type', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountA1 = await createAccount(userA.token, 1000)
    const accountA2 = await createAccount(userA.token, 500)
    const accountB = await createAccount(userB.token, 1000)

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId: accountA1, amount: 100, type: 'income', category: 'Salary', date: '2026-08-01' })
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId: accountA2, amount: 50, type: 'expense', category: 'Food', date: '2026-08-02' })
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ accountId: accountB, amount: 100, type: 'income', category: 'Salary', date: '2026-08-01' })

    const all = await request(app).get('/api/transactions').set('Authorization', `Bearer ${userA.token}`)
    expect(all.body.transactions).toHaveLength(2)

    const filteredByAccount = await request(app)
      .get(`/api/transactions?accountId=${accountA1}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(filteredByAccount.body.transactions).toHaveLength(1)
    expect(filteredByAccount.body.transactions[0].accountId).toBe(accountA1)

    const filteredByType = await request(app)
      .get('/api/transactions?type=expense')
      .set('Authorization', `Bearer ${userA.token}`)
    expect(filteredByType.body.transactions).toHaveLength(1)
    expect(filteredByType.body.transactions[0].type).toBe('expense')
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/transactions')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/transactions/:id', () => {
  it('returns the transaction for its owner, 404 for another user, and 404 for an invalid id', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountId = await createAccount(userA.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })
    const txId = created.body.transaction.id

    const owned = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(owned.status).toBe(200)

    const foreign = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(foreign.status).toBe(404)

    const invalid = await request(app)
      .get('/api/transactions/not-a-valid-id')
      .set('Authorization', `Bearer ${userA.token}`)
    expect(invalid.status).toBe(404)
  })
})

describe('PUT /api/transactions/:id — balance integrity', () => {
  it('adjusts the balance correctly when only the amount changes', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountId)).toBe(900)

    const updated = await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ amount: 300 })
    expect(updated.status).toBe(200)
    // was -100 applied; now should be -300 applied instead -> net additional -200
    expect(await getAccountBalance(user.token, accountId)).toBe(700)
  })

  it('adjusts the balance correctly when the type changes (income -> expense)', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 100, type: 'income', category: 'Salary', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountId)).toBe(1100)

    await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ type: 'expense' })
    // old delta was +100; new delta is -100; net change is -200
    expect(await getAccountBalance(user.token, accountId)).toBe(900)
  })

  it('moves the balance effect between accounts when accountId changes', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountFrom = await createAccount(user.token, 1000)
    const accountTo = await createAccount(user.token, 500)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId: accountFrom, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountFrom)).toBe(900)
    expect(await getAccountBalance(user.token, accountTo)).toBe(500)

    const updated = await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId: accountTo })
    expect(updated.status).toBe(200)

    expect(await getAccountBalance(user.token, accountFrom)).toBe(1000)
    expect(await getAccountBalance(user.token, accountTo)).toBe(400)
  })

  it('rejects moving a transaction to an account the user does not own, leaving both balances untouched', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountA = await createAccount(userA.token, 1000)
    const accountB = await createAccount(userB.token, 500)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId: accountA, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })
    expect(await getAccountBalance(userA.token, accountA)).toBe(900)

    const res = await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId: accountB })
    expect(res.status).toBe(404)

    expect(await getAccountBalance(userA.token, accountA)).toBe(900)
    expect(await getAccountBalance(userB.token, accountB)).toBe(500)
  })

  it('rejects updating another user\'s transaction, and rejects an invalid payload', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountId = await createAccount(userA.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })

    const foreign = await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ amount: 500 })
    expect(foreign.status).toBe(404)
    expect(await getAccountBalance(userA.token, accountId)).toBe(900)

    const invalidPayload = await request(app)
      .put(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'not-a-real-type' })
    expect(invalidPayload.status).toBe(400)
    expect(await getAccountBalance(userA.token, accountId)).toBe(900)
  })
})

describe('DELETE /api/transactions/:id', () => {
  it('reverses the balance effect and removes the transaction', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ accountId, amount: 250, type: 'income', category: 'Salary', date: '2026-08-01' })
    expect(await getAccountBalance(user.token, accountId)).toBe(1250)

    const deleted = await request(app)
      .delete(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${user.token}`)
    expect(deleted.status).toBe(204)

    expect(await getAccountBalance(user.token, accountId)).toBe(1000)

    const afterDelete = await request(app)
      .get(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${user.token}`)
    expect(afterDelete.status).toBe(404)
  })

  it('rejects deleting another user\'s transaction, leaving it and its balance untouched', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const accountId = await createAccount(userA.token, 1000)

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ accountId, amount: 100, type: 'expense', category: 'Food', date: '2026-08-01' })
    expect(await getAccountBalance(userA.token, accountId)).toBe(900)

    const res = await request(app)
      .delete(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(res.status).toBe(404)

    expect(await getAccountBalance(userA.token, accountId)).toBe(900)
    const stillThere = await request(app)
      .get(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(stillThere.status).toBe(200)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).delete('/api/transactions/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })
})

describe('transfers between accounts', () => {
  it('moves money between two accounts and reverses on edit/delete', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const from = await createAccount(user.token, 1000)
    const to = await createAccount(user.token, 100)
    const auth = { Authorization: `Bearer ${user.token}` }

    const created = await request(app)
      .post('/api/transactions')
      .set(auth)
      .send({ accountId: from, toAccountId: to, amount: 200, type: 'transfer', category: 'Transfer', date: '2026-08-01' })
    expect(created.status).toBe(201)
    expect(created.body.transaction.toAccountId).toBe(to)
    expect(await getAccountBalance(user.token, from)).toBe(800)
    expect(await getAccountBalance(user.token, to)).toBe(300)

    const edited = await request(app).put(`/api/transactions/${created.body.transaction.id}`).set(auth).send({ amount: 50 })
    expect(edited.status).toBe(200)
    expect(await getAccountBalance(user.token, from)).toBe(950)
    expect(await getAccountBalance(user.token, to)).toBe(150)

    const del = await request(app).delete(`/api/transactions/${created.body.transaction.id}`).set(auth)
    expect(del.status).toBe(204)
    expect(await getAccountBalance(user.token, from)).toBe(1000)
    expect(await getAccountBalance(user.token, to)).toBe(100)
  })

  it('rejects a destination for non-transfers, the same account, and another user\'s account', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')
    const a = await createAccount(userA.token, 1000)
    const b = await createAccount(userB.token, 1000)
    const auth = { Authorization: `Bearer ${userA.token}` }
    const base = { accountId: a, amount: 10, category: 'X', date: '2026-08-01' }

    expect((await request(app).post('/api/transactions').set(auth).send({ ...base, type: 'expense', toAccountId: b })).status).toBe(400)
    expect((await request(app).post('/api/transactions').set(auth).send({ ...base, type: 'transfer', toAccountId: a })).status).toBe(400)
    expect((await request(app).post('/api/transactions').set(auth).send({ ...base, type: 'transfer', toAccountId: b })).status).toBe(404)
    expect(await getAccountBalance(userB.token, b)).toBe(1000)
  })
})

describe('GET /api/transactions pagination', () => {
  it('returns pagination metadata and honours page/limit', async () => {
    const user = await registerUser('User A', 'usera@example.com')
    const accountId = await createAccount(user.token, 1000)
    const auth = { Authorization: `Bearer ${user.token}` }
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/transactions').set(auth).send({ accountId, amount: i, type: 'expense', category: 'X', date: `2026-08-0${i}` })
    }

    const res = await request(app).get('/api/transactions?limit=2&page=2').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.transactions).toHaveLength(1)
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 3 })
  })
})
