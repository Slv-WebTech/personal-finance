import { api } from './api'
import { toApiError } from './httpError'
import type { Budget, BudgetInput } from '../types/budget'

export interface BudgetFilters {
  month?: number
  year?: number
}

export async function listBudgets(filters: BudgetFilters = {}): Promise<Budget[]> {
  try {
    const params = new URLSearchParams()
    if (filters.month) params.set('month', String(filters.month))
    if (filters.year) params.set('year', String(filters.year))

    const query = params.toString()
    const { data } = await api.get<{ budgets: Budget[] }>(query ? `/budgets?${query}` : '/budgets')
    return data.budgets
  } catch (err) {
    throw toApiError(err)
  }
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  try {
    const { data } = await api.post<{ budget: Budget }>('/budgets', input)
    return data.budget
  } catch (err) {
    throw toApiError(err)
  }
}

export async function updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
  try {
    const { data } = await api.put<{ budget: Budget }>(`/budgets/${id}`, input)
    return data.budget
  } catch (err) {
    throw toApiError(err)
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    await api.delete(`/budgets/${id}`)
  } catch (err) {
    throw toApiError(err)
  }
}
