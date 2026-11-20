import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'
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
  await AccountModel.deleteMany({})
  await TransactionModel.deleteMany({})
  await InvestmentModel.deleteMany({})
})

async function registerUser(email: string) {
  const res = await request(app).post('/api/auth/register').send({ name: 'U', email, password: 'password123' })
  return res.body.token as string
}

describe('GET /api/dashboard/summary', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/dashboard/summary')).status).toBe(401)
  })

  it('summarises only the caller\'s data', async () => {
    const a = await registerUser('a@example.com')
    const b = await registerUser('b@example.com')
    const auth = { Authorization: `Bearer ${a}` }
    const acct = await request(app).post('/api/accounts').set(auth).send({ name: 'C', type: 'checking', balance: 1000, currency: 'usd' })
    const accountId = acct.body.account.id
    const today = new Date().toISOString().slice(0, 10)
    await request(app).post('/api/transactions').set(auth).send({ accountId, amount: 500, type: 'income', category: 'Pay', date: today })
    await request(app).post('/api/transactions').set(auth).send({ accountId, amount: 120, type: 'expense', category: 'Food', date: today })
    await request(app).post('/api/investments').set(auth).send({ type: 'stock', name: 'X', quantity: 2, purchasePrice: 50, currentValue: 130 })
    await request(app).post('/api/accounts').set({ Authorization: `Bearer ${b}` }).send({ name: 'Other', type: 'savings', balance: 9999, currency: 'USD' })

    const res = await request(app).get('/api/dashboard/summary').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.balances).toEqual([{ currency: 'USD', total: 1380, accounts: 1 }])
    expect(res.body.thisMonth).toEqual({ income: 500, expense: 120, net: 380 })
    expect(res.body.investments).toEqual({ holdings: 1, invested: 100, currentValue: 260 })
  })
})
