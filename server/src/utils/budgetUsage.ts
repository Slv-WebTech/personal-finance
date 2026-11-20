export interface TransactionForBudget {
  type: string
  category: string
  amount: number
}

// Case-insensitive on purpose: category is free text (no enum), and a budget
// for "Food" should count an expense logged as "food" — the uniqueness check
// in the budgets controller enforces the same case-insensitive matching so
// two budgets can never silently double-count the same expenses.
export function sumExpensesForCategory(transactions: TransactionForBudget[], category: string): number {
  const normalized = category.trim().toLowerCase()
  return transactions
    .filter((t) => t.type === 'expense' && t.category.trim().toLowerCase() === normalized)
    .reduce((sum, t) => sum + t.amount, 0)
}

export interface BudgetUsage {
  spent: number
  limit: number
  remaining: number
  percentUsed: number
  isOverBudget: boolean
}

export function computeBudgetUsage(monthlyLimit: number, spent: number): BudgetUsage {
  return {
    spent,
    limit: monthlyLimit,
    remaining: monthlyLimit - spent,
    percentUsed: monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0,
    isOverBudget: spent > monthlyLimit,
  }
}

export function monthDateRange(month: number, year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  }
}
