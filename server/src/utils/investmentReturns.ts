// purchasePrice/currentValue are always per-unit (see DECISIONS.md — DATABASE.md
// left this an open question until Phase 6 was actually built).
export function profitLoss(purchasePrice: number, currentValue: number, quantity: number): number {
  return (currentValue - purchasePrice) * quantity
}

export function profitLossPercent(purchasePrice: number, currentValue: number): number {
  return purchasePrice > 0 ? ((currentValue - purchasePrice) / purchasePrice) * 100 : 0
}

export function holdingValue(currentValue: number, quantity: number): number {
  return currentValue * quantity
}

export function computePortfolioAllocation<T extends { value: number }>(
  holdings: T[],
): Array<T & { percentOfPortfolio: number }> {
  const total = holdings.reduce((sum, holding) => sum + holding.value, 0)
  return holdings.map((holding) => ({
    ...holding,
    percentOfPortfolio: total > 0 ? (holding.value / total) * 100 : 0,
  }))
}
