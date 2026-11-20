export interface DashboardSummary {
  balances: Array<{ currency: string; total: number; accounts: number }>
  thisMonth: { income: number; expense: number; net: number }
  investments: { holdings: number; invested: number; currentValue: number }
}
