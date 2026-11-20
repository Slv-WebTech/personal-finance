import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { InvestmentModel } from '../models/Investment.js'

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
  await InvestmentModel.deleteMany({})
})

async function registerUser(name: string, email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' })
  return { token: res.body.token as string, id: res.body.user.id as string }
}

describe('POST /api/investments', () => {
  it('creates an investment with computed profit/loss and value', async () => {
    const user = await registerUser('User A', 'usera@example.com')

    const res = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ type: 'stock', name: 'ACME Corp', quantity: 10, purchasePrice: 20, currentValue: 25 })

    expect(res.status).toBe(201)
    expect(res.body.investment).toMatchObject({
      type: 'stock',
      name: 'ACME Corp',
      quantity: 10,
      purchasePrice: 20,
      currentValue: 25,
      value: 250,
      profitLoss: 50,
      profitLossPercent: 25,
    })
  })

  it('rejects an invalid payload and an unauthenticated request', async () => {
    const user = await registerUser('User A', 'usera@example.com')

    const invalid = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ type: 'stock', name: 'ACME', quantity: -5, purchasePrice: 20, currentValue: 25 })
    expect(invalid.status).toBe(400)

    const unauthed = await request(app).post('/api/investments').send({})
    expect(unauthed.status).toBe(401)
  })
})

describe('GET /api/investments', () => {
  it('lists only the authenticated user\'s own investments, with portfolio allocation computed across them', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'stock', name: 'A', quantity: 10, purchasePrice: 10, currentValue: 10 }) // value 100
    await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'crypto', name: 'B', quantity: 1, purchasePrice: 300, currentValue: 300 }) // value 300
    await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ type: 'gold', name: 'C', quantity: 1, purchasePrice: 5000, currentValue: 5000 })

    const res = await request(app).get('/api/investments').set('Authorization', `Bearer ${userA.token}`)
    expect(res.status).toBe(200)
    expect(res.body.investments).toHaveLength(2)

    const total = res.body.investments.reduce((sum: number, inv: { value: number }) => sum + inv.value, 0)
    expect(total).toBe(400)
    const percents = res.body.investments.map((inv: { percentOfPortfolio: number }) => inv.percentOfPortfolio)
    expect(percents.sort((a: number, b: number) => a - b)).toEqual([25, 75])
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/investments')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/investments/:id', () => {
  it('returns the investment for its owner, 404 for another user, and 404 for an invalid id', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'stock', name: 'A', quantity: 10, purchasePrice: 10, currentValue: 12 })
    const id = created.body.investment.id

    const owned = await request(app).get(`/api/investments/${id}`).set('Authorization', `Bearer ${userA.token}`)
    expect(owned.status).toBe(200)

    const foreign = await request(app).get(`/api/investments/${id}`).set('Authorization', `Bearer ${userB.token}`)
    expect(foreign.status).toBe(404)

    const invalid = await request(app)
      .get('/api/investments/not-a-valid-id')
      .set('Authorization', `Bearer ${userA.token}`)
    expect(invalid.status).toBe(404)
  })
})

describe('PUT /api/investments/:id', () => {
  it('updates the investment (e.g. currentValue) for its owner, recomputing profit/loss, and 404s for another user', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'stock', name: 'A', quantity: 10, purchasePrice: 10, currentValue: 10 })
    const id = created.body.investment.id

    const updated = await request(app)
      .put(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ currentValue: 15 })
    expect(updated.status).toBe(200)
    expect(updated.body.investment).toMatchObject({ currentValue: 15, value: 150, profitLoss: 50 })

    const foreign = await request(app)
      .put(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ currentValue: 999 })
    expect(foreign.status).toBe(404)

    const invalidPayload = await request(app)
      .put(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'not-a-real-type' })
    expect(invalidPayload.status).toBe(400)
  })
})

describe('DELETE /api/investments/:id', () => {
  it('deletes the investment for its owner and 404s for another user', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/investments')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'stock', name: 'A', quantity: 10, purchasePrice: 10, currentValue: 10 })
    const id = created.body.investment.id

    const foreign = await request(app)
      .delete(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(foreign.status).toBe(404)

    const ownDelete = await request(app)
      .delete(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(ownDelete.status).toBe(204)

    const afterDelete = await request(app)
      .get(`/api/investments/${id}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(afterDelete.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).delete('/api/investments/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })
})
