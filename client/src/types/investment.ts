export type InvestmentType = 'stock' | 'mutual_fund' | 'fixed_deposit' | 'crypto' | 'gold'

export interface Investment {
  id: string
  type: InvestmentType
  name: string
  quantity: number
  purchasePrice: number
  currentValue: number
  createdAt: string
  updatedAt: string
  value: number
  profitLoss: number
  profitLossPercent: number
  percentOfPortfolio?: number
}

export interface InvestmentInput {
  type: InvestmentType
  name: string
  quantity: number
  purchasePrice: number
  currentValue: number
}
