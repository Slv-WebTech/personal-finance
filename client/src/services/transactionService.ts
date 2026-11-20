import { api } from './api'
import { toApiError } from './httpError'
import type { Transaction, TransactionInput } from '../types/transaction'

export interface TransactionFilters {
  accountId?: string
  type?: string
  category?: string
  startDate?: string
  endDate?: string
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams()
    if (filters.accountId) params.set('accountId', filters.accountId)
    if (filters.type) params.set('type', filters.type)
    if (filters.category) params.set('category', filters.category)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)

    const query = params.toString()
    const { data } = await api.get<{ transactions: Transaction[] }>(
      query ? `/transactions?${query}` : '/transactions',
    )
    return data.transactions
  } catch (err) {
    throw toApiError(err)
  }
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  try {
    const { data } = await api.post<{ transaction: Transaction }>('/transactions', input)
    return data.transaction
  } catch (err) {
    throw toApiError(err)
  }
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  try {
    const { data } = await api.put<{ transaction: Transaction }>(`/transactions/${id}`, input)
    return data.transaction
  } catch (err) {
    throw toApiError(err)
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await api.delete(`/transactions/${id}`)
  } catch (err) {
    throw toApiError(err)
  }
}
