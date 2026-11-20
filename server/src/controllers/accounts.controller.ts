import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'

function toPublicAccount(account: {
  _id: unknown
  name: string
  type: string
  balance: number
  currency: string
  status: string
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: String(account._id),
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

export async function list(req: Request, res: Response) {
  const accounts = await AccountModel.find({ userId: req.auth!.sub }).sort({ createdAt: -1 })
  res.json({ accounts: accounts.map(toPublicAccount) })
}

export async function create(req: Request, res: Response) {
  const account = await AccountModel.create({ ...req.body, userId: req.auth!.sub })
  res.status(201).json({ account: toPublicAccount(account) })
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  const account = await AccountModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!account) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  res.json({ account: toPublicAccount(account) })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params

  // Never distinguish "doesn't exist" from "exists but isn't yours" here or
  // below — that distinction would let one user probe which account ids
  // exist for another user.
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  const account = await AccountModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!account) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  Object.assign(account, req.body)
  await account.save()

  res.json({ account: toPublicAccount(account) })
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  const owned = await AccountModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!owned) {
    res.status(404).json({ error: { message: 'Account not found' } })
    return
  }

  // Deleting an account that still has transactions would orphan them and
  // silently corrupt reports; ask the user to close it instead.
  const hasTransactions = await TransactionModel.exists({
    userId: req.auth!.sub,
    $or: [{ accountId: id }, { toAccountId: id }],
  })
  if (hasTransactions) {
    res.status(409).json({
      error: { message: 'This account has transactions and cannot be deleted. Set its status to Closed instead.' },
    })
    return
  }

  await AccountModel.deleteOne({ _id: id, userId: req.auth!.sub })

  res.status(204).send()
}
