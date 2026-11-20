import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { TransactionModel } from '../models/Transaction.js'
import { AccountModel } from '../models/Account.js'
import { balanceLegs, type BalanceLeg, type TransactionType } from '../utils/balance.js'

function toPublicTransaction(tx: {
  _id: unknown
  accountId: unknown
  toAccountId?: unknown
  amount: number
  type: string
  category: string
  date: Date
  paymentMethod?: string | null
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: String(tx._id),
    accountId: String(tx.accountId),
    toAccountId: tx.toAccountId ? String(tx.toAccountId) : undefined,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    date: tx.date,
    paymentMethod: tx.paymentMethod,
    notes: tx.notes,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  }
}

const DEFAULT_PAGE_SIZE = 200
const MAX_PAGE_SIZE = 500

async function applyLegs(legs: BalanceLeg[], sign: 1 | -1) {
  for (const leg of legs) {
    // Pipeline update rounds to cents so repeated float additions never drift (0.1 + 0.2).
    await AccountModel.updateOne({ _id: leg.accountId }, [
      { $set: { balance: { $round: [{ $add: ['$balance', sign * leg.delta] }, 2] } } },
    ], { updatePipeline: true })
  }
}

// Money may only be posted to accounts that are open for business.
async function allActive(userId: string, ids: string[]): Promise<boolean> {
  const unique = [...new Set(ids)]
  const count = await AccountModel.countDocuments({ _id: { $in: unique }, userId, status: 'active' })
  return count === unique.length
}

// Every referenced account must exist and belong to the user.
async function ownsAccounts(userId: string, ids: string[]): Promise<boolean> {
  if (!ids.every((id) => mongoose.isValidObjectId(id))) return false
  const unique = [...new Set(ids)]
  const count = await AccountModel.countDocuments({ _id: { $in: unique }, userId })
  return count === unique.length
}

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { userId: req.auth!.sub }

  const { accountId, type, category, startDate, endDate } = req.query as Record<string, string | undefined>

  if (accountId && mongoose.isValidObjectId(accountId)) {
    filter.accountId = accountId
  }
  if (type && ['income', 'expense', 'transfer', 'investment'].includes(type)) {
    filter.type = type
  }
  if (typeof category === 'string' && category) {
    filter.category = category
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {}
    if (startDate && !Number.isNaN(Date.parse(startDate))) dateFilter.$gte = new Date(startDate)
    if (endDate && !Number.isNaN(Date.parse(endDate))) dateFilter.$lte = new Date(endDate)
    if (Object.keys(dateFilter).length > 0) filter.date = dateFilter
  }

  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1)
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(req.query.limit)) || DEFAULT_PAGE_SIZE))

  const [transactions, total] = await Promise.all([
    TransactionModel.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    TransactionModel.countDocuments(filter),
  ])
  res.json({ transactions: transactions.map(toPublicTransaction), pagination: { page, limit, total } })
}

export async function create(req: Request, res: Response) {
  const { accountId, toAccountId, amount, type } = req.body as {
    accountId: string
    toAccountId?: string
    amount: number
    type: TransactionType
  }

  const ids = toAccountId ? [accountId, toAccountId] : [accountId]
  if (!(await ownsAccounts(req.auth!.sub, ids))) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  if (!(await allActive(req.auth!.sub, ids))) {
    res.status(409).json({ error: { message: 'Transactions can only be added to active accounts' } })
    return
  }

  const legs = balanceLegs(type, amount, accountId, toAccountId)

  // Balance changes are single-document atomic `$inc`s applied first, then the
  // record is created; if the create fails the increments are reversed. A
  // multi-document Mongo transaction would be stricter but requires a
  // replica-set deployment — see DECISIONS.md.
  await applyLegs(legs, 1)

  try {
    const transaction = await TransactionModel.create({ ...req.body, userId: req.auth!.sub })
    res.status(201).json({ transaction: toPublicTransaction(transaction) })
  } catch (err) {
    await applyLegs(legs, -1)
    throw err
  }
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  const transaction = await TransactionModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!transaction) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  res.json({ transaction: toPublicTransaction(transaction) })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  const existing = await TransactionModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!existing) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  const updates = req.body as Partial<{
    accountId: string
    toAccountId: string | null
    amount: number
    type: TransactionType
    category: string
    date: Date
    paymentMethod: string
    notes: string
  }>

  // Capture the pre-update legs now — `existing` is mutated by Object.assign below.
  const oldLegs = balanceLegs(
    existing.type as TransactionType,
    existing.amount,
    String(existing.accountId),
    existing.toAccountId ? String(existing.toAccountId) : undefined,
  )

  const newAccountId = updates.accountId ?? String(existing.accountId)
  const newAmount = updates.amount ?? existing.amount
  const newType = updates.type ?? (existing.type as TransactionType)
  let newToAccountId: string | undefined =
    updates.toAccountId === undefined
      ? existing.toAccountId
        ? String(existing.toAccountId)
        : undefined
      : (updates.toAccountId ?? undefined)
  if (newType !== 'transfer') newToAccountId = undefined

  if (newToAccountId && newToAccountId === newAccountId) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: [{ path: 'toAccountId', message: 'Destination account must differ from the source account' }],
      },
    })
    return
  }

  // Validate every account before touching any balance.
  const ids = newToAccountId ? [newAccountId, newToAccountId] : [newAccountId]
  if (!(await ownsAccounts(req.auth!.sub, ids))) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  // Only accounts newly referenced by this edit must be active; an existing
  // transaction on a since-frozen account can still be corrected.
  const oldIds = new Set(oldLegs.map((l) => l.accountId))
  const newlyReferenced = ids.filter((i) => !oldIds.has(i))
  if (newlyReferenced.length > 0 && !(await allActive(req.auth!.sub, newlyReferenced))) {
    res.status(409).json({ error: { message: 'Transactions can only be moved to active accounts' } })
    return
  }

  const newLegs = balanceLegs(newType, newAmount, newAccountId, newToAccountId)

  await applyLegs(oldLegs, -1)
  await applyLegs(newLegs, 1)

  try {
    Object.assign(existing, updates)
    existing.toAccountId = newToAccountId ? new mongoose.Types.ObjectId(newToAccountId) : undefined
    await existing.save()
    res.json({ transaction: toPublicTransaction(existing) })
  } catch (err) {
    await applyLegs(newLegs, -1)
    await applyLegs(oldLegs, 1)
    throw err
  }
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  const existing = await TransactionModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!existing) {
    res.status(404).json({ error: { message: 'Transaction not found' } })
    return
  }

  const legs = balanceLegs(
    existing.type as TransactionType,
    existing.amount,
    String(existing.accountId),
    existing.toAccountId ? String(existing.toAccountId) : undefined,
  )

  await applyLegs(legs, -1)

  try {
    await TransactionModel.deleteOne({ _id: id })
    res.status(204).send()
  } catch (err) {
    await applyLegs(legs, 1)
    throw err
  }
}
