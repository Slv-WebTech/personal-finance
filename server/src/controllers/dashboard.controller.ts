import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { AccountModel } from '../models/Account.js'
import { TransactionModel } from '../models/Transaction.js'
import { InvestmentModel } from '../models/Investment.js'

// Read-only financial snapshot for the signed-in user. Balances are grouped by
// currency because accounts may use different currencies and are never summed across them.
export async function summary(req: Request, res: Response) {
  const userId = new mongoose.Types.ObjectId(req.auth!.sub)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  const [balances, monthly, investments] = await Promise.all([
    AccountModel.aggregate<{ _id: string; total: number; accounts: number }>([
      { $match: { userId, status: { $ne: 'closed' } } },
      { $group: { _id: '$currency', total: { $sum: '$balance' }, accounts: { $sum: 1 } } },
    ]),
    TransactionModel.aggregate<{ _id: string; total: number }>([
      { $match: { userId, type: { $in: ['income', 'expense'] }, date: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    InvestmentModel.aggregate<{ _id: null; invested: number; currentValue: number; holdings: number }>([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          invested: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          currentValue: { $sum: { $multiply: ['$quantity', '$currentValue'] } }, // per-unit values
          holdings: { $sum: 1 },
        },
      },
    ]),
  ])

  const income = monthly.find((m) => m._id === 'income')?.total ?? 0
  const expense = monthly.find((m) => m._id === 'expense')?.total ?? 0
  const inv = investments[0]

  res.json({
    balances: balances.map((b) => ({ currency: b._id, total: b.total, accounts: b.accounts })),
    thisMonth: { income, expense, net: income - expense },
    investments: {
      holdings: inv?.holdings ?? 0,
      invested: inv?.invested ?? 0,
      currentValue: inv?.currentValue ?? 0,
    },
  })
}
