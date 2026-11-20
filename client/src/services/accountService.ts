import { api } from './api'
import { toApiError } from './httpError'
import type { Account, AccountInput } from '../types/account'

export async function listAccounts(): Promise<Account[]> {
  try {
    const { data } = await api.get<{ accounts: Account[] }>('/accounts')
    return data.accounts
  } catch (err) {
    throw toApiError(err)
  }
}

export async function createAccount(input: AccountInput): Promise<Account> {
  try {
    const { data } = await api.post<{ account: Account }>('/accounts', input)
    return data.account
  } catch (err) {
    throw toApiError(err)
  }
}

export async function updateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  try {
    const { data } = await api.put<{ account: Account }>(`/accounts/${id}`, input)
    return data.account
  } catch (err) {
    throw toApiError(err)
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    await api.delete(`/accounts/${id}`)
  } catch (err) {
    throw toApiError(err)
  }
}
