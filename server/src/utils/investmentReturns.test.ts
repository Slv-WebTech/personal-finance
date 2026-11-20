import { describe, expect, it } from 'vitest'
import { computePortfolioAllocation, holdingValue, profitLoss, profitLossPercent } from './investmentReturns.js'

describe('profitLoss', () => {
  it('returns a positive value when currentValue exceeds purchasePrice', () => {
    expect(profitLoss(10, 15, 100)).toBe(500)
  })

  it('returns a negative value when currentValue is below purchasePrice', () => {
    expect(profitLoss(10, 8, 100)).toBe(-200)
  })

  it('returns 0 when currentValue equals purchasePrice', () => {
    expect(profitLoss(10, 10, 50)).toBe(0)
  })
})

describe('profitLossPercent', () => {
  it('computes percentage gain', () => {
    expect(profitLossPercent(100, 150)).toBe(50)
  })

  it('computes percentage loss', () => {
    expect(profitLossPercent(100, 75)).toBe(-25)
  })

  it('does not divide by zero when purchasePrice is 0', () => {
    expect(profitLossPercent(0, 50)).toBe(0)
  })
})

describe('holdingValue', () => {
  it('multiplies current per-unit value by quantity', () => {
    expect(holdingValue(25, 4)).toBe(100)
  })
})

describe('computePortfolioAllocation', () => {
  it('computes each holding\'s percentage of total portfolio value', () => {
    const result = computePortfolioAllocation([{ value: 300 }, { value: 100 }, { value: 600 }])
    expect(result.map((h) => h.percentOfPortfolio)).toEqual([30, 10, 60])
  })

  it('returns 0% for every holding when total portfolio value is 0', () => {
    const result = computePortfolioAllocation([{ value: 0 }, { value: 0 }])
    expect(result.every((h) => h.percentOfPortfolio === 0)).toBe(true)
  })

  it('returns an empty array for an empty portfolio', () => {
    expect(computePortfolioAllocation([])).toEqual([])
  })
})
