import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { AccountModel } from '../models/Account.js'

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
})

async function registerUser(name: string, email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' })
  return { token: res.body.token as string, id: res.body.user.id as string }
}

describe('POST /api/accounts', () => {
  it('creates an account for the authenticated user and never leaks userId', async () => {
    const userA = await registerUser('User A', 'usera@example.com')

    const res = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'Checking', type: 'checking', balance: 100, currency: 'usd' })

    expect(res.status).toBe(201)
    expect(res.body.account).toMatchObject({
      name: 'Checking',
      type: 'checking',
      balance: 100,
      currency: 'USD',
      status: 'active',
    })
    expect(res.body.account.id).toBeTypeOf('string')
    expect(res.body.account.userId).toBeUndefined()
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .send({ name: 'Checking', type: 'checking', currency: 'USD' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/accounts', () => {
  it('lists only the authenticated user\'s own accounts', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking', type: 'checking', currency: 'USD' })
    await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: 'B Savings', type: 'savings', currency: 'USD' })

    const res = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)

    expect(res.status).toBe(200)
    expect(res.body.accounts).toHaveLength(1)
    expect(res.body.accounts[0].name).toBe('A Checking')
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/accounts')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/accounts/:id', () => {
  it('returns the account for its owner, 404 for another user, and 404 for an invalid id', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking', type: 'checking', currency: 'USD' })
    const accountId = created.body.account.id

    const owned = await request(app)
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(owned.status).toBe(200)
    expect(owned.body.account.id).toBe(accountId)

    const foreign = await request(app)
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(foreign.status).toBe(404)

    const invalid = await request(app)
      .get('/api/accounts/not-a-valid-id')
      .set('Authorization', `Bearer ${userA.token}`)
    expect(invalid.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/accounts/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/accounts/:id', () => {
  it('updates the account for its owner, 404 for another user, and 400 for an invalid payload', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking', type: 'checking', balance: 100, currency: 'USD' })
    const accountId = created.body.account.id

    const updated = await request(app)
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking Renamed' })
    expect(updated.status).toBe(200)
    expect(updated.body.account).toMatchObject({ name: 'A Checking Renamed', balance: 100 })

    const balanceEdit = await request(app)
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ balance: 999999 })
    expect(balanceEdit.status).toBe(400)

    const foreign = await request(app)
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: 'Hijacked' })
    expect(foreign.status).toBe(404)

    const invalidPayload = await request(app)
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'not-a-real-type' })
    expect(invalidPayload.status).toBe(400)
  })

  it('leaves balance and status untouched when a partial update omits them', async () => {
    const userA = await registerUser('User A', 'usera@example.com')

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking', type: 'checking', balance: 500, currency: 'USD', status: 'frozen' })
    const accountId = created.body.account.id

    const renamed = await request(app)
      .put(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking Renamed' })

    expect(renamed.status).toBe(200)
    expect(renamed.body.account).toMatchObject({
      name: 'A Checking Renamed',
      balance: 500,
      status: 'frozen',
    })
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).put('/api/accounts/507f1f77bcf86cd799439011').send({ name: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/accounts/:id', () => {
  it('deletes the account for its owner and leaves it untouched for another user', async () => {
    const userA = await registerUser('User A', 'usera@example.com')
    const userB = await registerUser('User B', 'userb@example.com')

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'A Checking', type: 'checking', currency: 'USD' })
    const accountId = created.body.account.id

    const foreignDelete = await request(app)
      .delete(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userB.token}`)
    expect(foreignDelete.status).toBe(404)

    const stillThere = await request(app)
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(stillThere.status).toBe(200)

    const ownDelete = await request(app)
      .delete(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(ownDelete.status).toBe(204)
    expect(ownDelete.body).toEqual({})

    const afterDelete = await request(app)
      .get(`/api/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userA.token}`)
    expect(afterDelete.status).toBe(404)
  })

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).delete('/api/accounts/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })
})
