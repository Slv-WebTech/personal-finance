import { api } from './api'
import { toApiError } from './httpError'
import type { DashboardSummary } from '../types/dashboard'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const { data } = await api.get<DashboardSummary>('/dashboard/summary')
    return data
  } catch (err) {
    throw toApiError(err)
  }
}
