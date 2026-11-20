import { describe, expect, it } from 'vitest'
import { balanceDelta } from './balance.js'

describe('balanceDelta', () => {
  it('returns a positive delta for income', () => {
    expect(balanceDelta('income', 100)).toBe(100)
  })

  it('returns a negative delta for expense', () => {
    expect(balanceDelta('expense', 100)).toBe(-100)
  })

  it('returns a negative delta for transfer', () => {
    expect(balanceDelta('transfer', 50)).toBe(-50)
  })

  it('returns a negative delta for investment', () => {
    expect(balanceDelta('investment', 75)).toBe(-75)
  })

  it('handles fractional amounts without floating point surprises for typical currency values', () => {
    expect(balanceDelta('income', 10.5)).toBe(10.5)
    expect(balanceDelta('expense', 10.5)).toBe(-10.5)
  })
})

import { balanceLegs } from './balance.js'

describe('balanceLegs', () => {
  it('returns one leg for non-transfers and legacy transfers', () => {
    expect(balanceLegs('expense', 10, 'a')).toEqual([{ accountId: 'a', delta: -10 }])
    expect(balanceLegs('transfer', 10, 'a')).toEqual([{ accountId: 'a', delta: -10 }])
  })

  it('returns a credit leg for a transfer with a destination', () => {
    expect(balanceLegs('transfer', 10, 'a', 'b')).toEqual([
      { accountId: 'a', delta: -10 },
      { accountId: 'b', delta: 10 },
    ])
  })

  it('ignores toAccountId for non-transfer types', () => {
    expect(balanceLegs('income', 10, 'a', 'b')).toEqual([{ accountId: 'a', delta: 10 }])
  })
})
