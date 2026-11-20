export type AccountType = 'savings' | 'checking' | 'credit' | 'investment'
export type AccountStatus = 'active' | 'closed' | 'frozen'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface AccountInput {
  name: string
  type: AccountType
  balance?: number // only accepted on create; balances change via transactions
  currency: string
  status: AccountStatus
}
