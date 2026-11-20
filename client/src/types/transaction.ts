export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment'

export interface Transaction {
  id: string
  accountId: string
  toAccountId?: string
  amount: number
  type: TransactionType
  category: string
  date: string
  paymentMethod?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface TransactionInput {
  accountId: string
  toAccountId?: string | null
  amount: number
  type: TransactionType
  category: string
  date: string
  paymentMethod?: string
  notes?: string
}
