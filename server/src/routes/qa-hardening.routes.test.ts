import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'
import { BudgetModel } from '../models/Budget.js'
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
  await BudgetModel.deleteMany({})
  await InvestmentModel.deleteMany({})
})

async function registerUser(email: string) {
  const res = await request(app).post('/api/auth/register').send({ name: 'QA', email, password: 'password123' })
  return res.body.token as string
}
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` })

async function newAccount(token: string, extra: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/accounts')
    .set(bearer(token))
    .send({ name: 'Acct', type: 'checking', balance: 1000, currency: 'USD', ...extra })
  return res.body.account as { id: string; balance: number }
}
async function balanceOf(token: string, id: string) {
  const res = await request(app).get(`/api/accounts/${id}`).set(bearer(token))
  return res.body.account.balance as number
}

describe('balance arithmetic', () => {
  it('does not drift on repeated fractional amounts (0.1 + 0.2 style)', async () => {
    const t = await registerUser('a@example.com')
    const acct = await newAccount(t, { balance: 0 })
    for (const amount of [0.1, 0.2, 0.1, 0.2, 0.1, 0.2]) {
      await request(app)
        .post('/api/transactions')
        .set(bearer(t))
        .send({ accountId: acct.id, amount, type: 'income', category: 'x', date: '2026-11-01' })
    }
    expect(await balanceOf(t, acct.id)).toBe(0.9)
  })

  it('rejects amounts with more than two decimals and absurd magnitudes', async () => {
    const t = await registerUser('a@example.com')
    const acct = await newAccount(t)
    const base = { accountId: acct.id, type: 'income', category: 'x', date: '2026-11-01' }
    for (const amount of [0.001, 1e308, 10.123]) {
      const res = await request(app).post('/api/transactions').set(bearer(t)).send({ ...base, amount })
      expect(res.status).toBe(400)
    }
    expect(await balanceOf(t, acct.id)).toBe(1000)
  })
})

describe('account lifecycle rules', () => {
  it('refuses to delete an account that still has transactions (no orphans), but allows deleting an empty one', async () => {
    const t = await registerUser('a@example.com')
    const used = await newAccount(t)
    const empty = await newAccount(t, { name: 'Empty' })
    await request(app)
      .post('/api/transactions')
      .set(bearer(t))
      .send({ accountId: used.id, amount: 5, type: 'expense', category: 'x', date: '2026-11-01' })

    expect((await request(app).delete(`/api/accounts/${used.id}`).set(bearer(t))).status).toBe(409)
    expect(await TransactionModel.countDocuments({})).toBe(1)
    expect((await request(app).delete(`/api/accounts/${empty.id}`).set(bearer(t))).status).toBe(204)
  })

  it('also protects the destination account of a transfer from deletion', async () => {
    const t = await registerUser('a@example.com')
    const from = await newAccount(t)
    const to = await newAccount(t, { name: 'To' })
    await request(app)
      .post('/api/transactions')
      .set(bearer(t))
      .send({ accountId: from.id, toAccountId: to.id, amount: 5, type: 'transfer', category: 'x', date: '2026-11-01' })
    expect((await request(app).delete(`/api/accounts/${to.id}`).set(bearer(t))).status).toBe(409)
  })

  it('rejects new transactions on frozen or closed accounts and leaves the balance alone', async () => {
    const t = await registerUser('a@example.com')
    const frozen = await newAccount(t, { status: 'frozen' })
    const closed = await newAccount(t, { status: 'closed', name: 'Closed' })
    for (const acct of [frozen, closed]) {
      const res = await request(app)
        .post('/api/transactions')
        .set(bearer(t))
        .send({ accountId: acct.id, amount: 5, type: 'expense', category: 'x', date: '2026-11-01' })
      expect(res.status).toBe(409)
      expect(await balanceOf(t, acct.id)).toBe(1000)
    }
  })
})

describe('input hardening', () => {
  it('rejects oversized and malformed fields', async () => {
    const t = await registerUser('a@example.com')
    const acct = await newAccount(t)
    const tx = { accountId: acct.id, amount: 5, type: 'expense', category: 'x', date: '2026-11-01' }

    expect((await request(app).post('/api/transactions').set(bearer(t)).send({ ...tx, category: 'x'.repeat(101) })).status).toBe(400)
    expect((await request(app).post('/api/transactions').set(bearer(t)).send({ ...tx, notes: 'n'.repeat(1001) })).status).toBe(400)
    expect((await request(app).post('/api/accounts').set(bearer(t)).send({ name: 'n', type: 'checking', currency: '12$' })).status).toBe(400)
    expect((await request(app).post('/api/accounts').set(bearer(t)).send({ name: 'n', type: 'checking', currency: 'USD', balance: 1e300 })).status).toBe(400)
    expect((await request(app).post('/api/auth/register').send({ name: 'x', email: 'b@example.com', password: 'p'.repeat(73) })).status).toBe(400)
    expect(
      (await request(app).post('/api/investments').set(bearer(t)).send({ type: 'stock', name: 'x', quantity: 1e20, purchasePrice: 1, currentValue: 1 })).status,
    ).toBe(400)
  })

  it('treats query-string operators as plain strings, never as Mongo operators', async () => {
    const t = await registerUser('a@example.com')
    const res = await request(app).get('/api/transactions?category[$ne]=x&type[$ne]=x').set(bearer(t))
    expect(res.status).toBeLessThan(500)
  })

  it('sends security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})

describe('cross-user isolation on every mutating resource route', () => {
  it('returns 404 for budgets and investments owned by someone else', async () => {
    const a = await registerUser('a@example.com')
    const b = await registerUser('b@example.com')
    const budget = (await request(app).post('/api/budgets').set(bearer(a)).send({ category: 'Food', monthlyLimit: 10, month: 11, year: 2026 })).body.budget
    const inv = (await request(app).post('/api/investments').set(bearer(a)).send({ type: 'stock', name: 'X', quantity: 1, purchasePrice: 1, currentValue: 1 })).body.investment

    for (const [path, body] of [
      [`/api/budgets/${budget.id}`, { monthlyLimit: 99 }],
      [`/api/investments/${inv.id}`, { name: 'hijack' }],
    ] as const) {
      expect((await request(app).put(path).set(bearer(b)).send(body)).status).toBe(404)
      expect((await request(app).delete(path).set(bearer(b))).status).toBe(404)
    }
    expect(await BudgetModel.countDocuments({})).toBe(1)
    expect(await InvestmentModel.countDocuments({})).toBe(1)
  })
})

describe('budget edge cases', () => {
  it('counts only expenses of the same category (case-insensitive) in the budget month, and reports over-budget exactly at limit+0.01', async () => {
    const t = await registerUser('a@example.com')
    const acct = await newAccount(t)
    const post = (b: object) =>
      request(app).post('/api/transactions').set(bearer(t)).send({ accountId: acct.id, ...b })
    await post({ amount: 50, type: 'expense', category: 'food', date: '2026-11-05' })
    await post({ amount: 50.01, type: 'expense', category: 'FOOD', date: '2026-11-30' })
    await post({ amount: 500, type: 'income', category: 'Food', date: '2026-11-06' })
    await post({ amount: 500, type: 'expense', category: 'Food', date: '2026-12-01' }) // next month
    await request(app).post('/api/budgets').set(bearer(t)).send({ category: 'Food', monthlyLimit: 100, month: 11, year: 2026 })

    const res = await request(app).get('/api/budgets').set(bearer(t))
    expect(res.body.budgets[0].usage.spent).toBeCloseTo(100.01, 2)
    expect(res.body.budgets[0].usage.isOverBudget).toBe(true)
  })

  it('computes usage for many budgets at once without cross-month or cross-category leakage', async () => {
    const t = await registerUser('a@example.com')
    const acct = await newAccount(t)
    const post = (b: object) =>
      request(app).post('/api/transactions').set(bearer(t)).send({ accountId: acct.id, type: 'expense', ...b })
    await post({ amount: 10, category: ' Food ', date: '2026-10-31' })
    await post({ amount: 20, category: 'food', date: '2026-11-01' })
    await post({ amount: 5, category: 'Rent', date: '2026-11-01' })
    for (const b of [
      { category: 'Food', month: 10, year: 2026 },
      { category: 'Food', month: 11, year: 2026 },
      { category: 'Rent', month: 11, year: 2026 },
      { category: 'Travel', month: 11, year: 2026 },
    ]) {
      await request(app).post('/api/budgets').set(bearer(t)).send({ ...b, monthlyLimit: 100 })
    }
    const res = await request(app).get('/api/budgets').set(bearer(t))
    const spent = Object.fromEntries(
      res.body.budgets.map((b: { category: string; month: number; usage: { spent: number } }) => [`${b.category}-${b.month}`, b.usage.spent]),
    )
    expect(spent).toEqual({ 'Food-10': 10, 'Food-11': 20, 'Rent-11': 5, 'Travel-11': 0 })
  })
})
