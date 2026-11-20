import { describe, expect, it } from 'vitest'
import { computeBudgetUsage, monthDateRange, sumExpensesForCategory } from './budgetUsage.js'

describe('sumExpensesForCategory', () => {
  const transactions = [
    { type: 'expense', category: 'Food', amount: 50 },
    { type: 'expense', category: 'food', amount: 25 },
    { type: 'expense', category: 'Transport', amount: 100 },
    { type: 'income', category: 'Food', amount: 1000 },
  ]

  it('sums only expense transactions matching the category, case-insensitively', () => {
    expect(sumExpensesForCategory(transactions, 'Food')).toBe(75)
  })

  it('ignores income transactions even if the category matches', () => {
    expect(sumExpensesForCategory(transactions, 'Food')).not.toBe(1075)
  })

  it('returns 0 for a category with no matching expenses', () => {
    expect(sumExpensesForCategory(transactions, 'Entertainment')).toBe(0)
  })
})

describe('computeBudgetUsage', () => {
  it('computes remaining and percentUsed when under budget', () => {
    expect(computeBudgetUsage(200, 75)).toEqual({
      spent: 75,
      limit: 200,
      remaining: 125,
      percentUsed: 37.5,
      isOverBudget: false,
    })
  })

  it('flags isOverBudget when spent exceeds the limit, with a negative remaining', () => {
    const usage = computeBudgetUsage(100, 150)
    expect(usage.isOverBudget).toBe(true)
    expect(usage.remaining).toBe(-50)
    expect(usage.percentUsed).toBe(150)
  })

  it('does not divide by zero when the limit is 0', () => {
    expect(computeBudgetUsage(0, 0).percentUsed).toBe(0)
  })
})

describe('monthDateRange', () => {
  it('returns a UTC start-of-month (inclusive) to start-of-next-month (exclusive) range', () => {
    const { start, end } = monthDateRange(2, 2026)
    expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('rolls over correctly for December', () => {
    const { start, end } = monthDateRange(12, 2026)
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})
