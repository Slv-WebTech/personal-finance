import { api } from './api'
import { toApiError } from './httpError'
import type { Investment, InvestmentInput } from '../types/investment'

export async function listInvestments(): Promise<Investment[]> {
  try {
    const { data } = await api.get<{ investments: Investment[] }>('/investments')
    return data.investments
  } catch (err) {
    throw toApiError(err)
  }
}

export async function createInvestment(input: InvestmentInput): Promise<Investment> {
  try {
    const { data } = await api.post<{ investment: Investment }>('/investments', input)
    return data.investment
  } catch (err) {
    throw toApiError(err)
  }
}

export async function updateInvestment(id: string, input: Partial<InvestmentInput>): Promise<Investment> {
  try {
    const { data } = await api.put<{ investment: Investment }>(`/investments/${id}`, input)
    return data.investment
  } catch (err) {
    throw toApiError(err)
  }
}

export async function deleteInvestment(id: string): Promise<void> {
  try {
    await api.delete(`/investments/${id}`)
  } catch (err) {
    throw toApiError(err)
  }
}
