import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { BudgetModel } from '../models/Budget.js'
import { TransactionModel } from '../models/Transaction.js'
import { computeBudgetUsage, monthDateRange } from '../utils/budgetUsage.js'

// User-supplied category text is embedded in a RegExp for case-insensitive
// matching below — escape regex metacharacters so it's treated as a literal
// string, not interpreted as a pattern (avoids both incorrect matches and a
// ReDoS-style injection via a crafted category value).
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function categoryMatch(category: string) {
  return new RegExp(`^${escapeRegExp(category.trim())}$`, 'i')
}

function toPublicBudget(budget: {
  _id: unknown
  category: string
  monthlyLimit: number
  month: number
  year: number
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: String(budget._id),
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    month: budget.month,
    year: budget.year,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  }
}

// One aggregation for any number of budgets (was one query per budget).
// Expenses are grouped by (year, month, lower-cased trimmed category) in UTC —
// the same month boundaries and case-insensitive matching as before — and each
// budget then looks up its own bucket.
async function usageForMany(
  userId: string,
  budgets: Array<{ category: string; month: number; year: number }>,
): Promise<number[]> {
  if (budgets.length === 0) return []

  const ranges = budgets.map((b) => monthDateRange(b.month, b.year))
  const from = new Date(Math.min(...ranges.map((r) => r.start.getTime())))
  const to = new Date(Math.max(...ranges.map((r) => r.end.getTime())))

  const buckets = await TransactionModel.aggregate<{
    _id: { year: number; month: number; category: string }
    total: number
  }>([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: from, $lt: to },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          category: { $toLower: { $trim: { input: '$category' } } },
        },
        total: { $sum: '$amount' },
      },
    },
  ])

  const totals = new Map(buckets.map((x) => [`${x._id.year}-${x._id.month}-${x._id.category}`, x.total]))
  return budgets.map((b) => {
    const total = totals.get(`${b.year}-${b.month}-${b.category.trim().toLowerCase()}`) ?? 0
    return Math.round(total * 100) / 100
  })
}

async function usageFor(userId: string, category: string, month: number, year: number) {
  const [spent] = await usageForMany(userId, [{ category, month, year }])
  return spent
}

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { userId: req.auth!.sub }
  const { month, year } = req.query as Record<string, string | undefined>
  if (month) filter.month = Number(month)
  if (year) filter.year = Number(year)

  const budgets = await BudgetModel.find(filter).sort({ year: -1, month: -1, category: 1 })

  const spentList = await usageForMany(String(req.auth!.sub), budgets)
  const withUsage = budgets.map((budget, i) => ({
    ...toPublicBudget(budget),
    usage: computeBudgetUsage(budget.monthlyLimit, spentList[i]),
  }))

  res.json({ budgets: withUsage })
}

export async function create(req: Request, res: Response) {
  const { category, month, year } = req.body as { category: string; month: number; year: number }

  const existing = await BudgetModel.findOne({
    userId: req.auth!.sub,
    month,
    year,
    category: categoryMatch(category),
  })
  if (existing) {
    res.status(409).json({ error: { message: 'A budget for this category and month already exists' } })
    return
  }

  const budget = await BudgetModel.create({ ...req.body, userId: req.auth!.sub })
  const spent = await usageFor(String(req.auth!.sub), budget.category, budget.month, budget.year)
  res.status(201).json({ budget: { ...toPublicBudget(budget), usage: computeBudgetUsage(budget.monthlyLimit, spent) } })
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  const budget = await BudgetModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!budget) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  const spent = await usageFor(String(req.auth!.sub), budget.category, budget.month, budget.year)
  res.json({ budget: { ...toPublicBudget(budget), usage: computeBudgetUsage(budget.monthlyLimit, spent) } })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  const budget = await BudgetModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!budget) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  const updates = req.body as Partial<{ category: string; monthlyLimit: number; month: number; year: number }>
  const newCategory = updates.category ?? budget.category
  const newMonth = updates.month ?? budget.month
  const newYear = updates.year ?? budget.year

  const duplicate = await BudgetModel.findOne({
    _id: { $ne: id },
    userId: req.auth!.sub,
    month: newMonth,
    year: newYear,
    category: categoryMatch(newCategory),
  })
  if (duplicate) {
    res.status(409).json({ error: { message: 'A budget for this category and month already exists' } })
    return
  }

  Object.assign(budget, updates)
  await budget.save()

  const spent = await usageFor(String(req.auth!.sub), budget.category, budget.month, budget.year)
  res.json({ budget: { ...toPublicBudget(budget), usage: computeBudgetUsage(budget.monthlyLimit, spent) } })
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  const budget = await BudgetModel.findOneAndDelete({ _id: id, userId: req.auth!.sub })
  if (!budget) {
    res.status(404).json({ error: { message: 'Budget not found' } })
    return
  }

  res.status(204).send()
}
