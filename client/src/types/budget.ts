export interface BudgetUsage {
  spent: number
  limit: number
  remaining: number
  percentUsed: number
  isOverBudget: boolean
}

export interface Budget {
  id: string
  category: string
  monthlyLimit: number
  month: number
  year: number
  createdAt: string
  updatedAt: string
  usage: BudgetUsage
}

export interface BudgetInput {
  category: string
  monthlyLimit: number
  month: number
  year: number
}
