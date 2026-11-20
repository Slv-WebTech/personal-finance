export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment'

// income increases the account balance; expense, transfer, and investment all
// decrease it (a transfer is modeled as a single account leaving this app's
// tracked balance — this schema has no second account leg, see DECISIONS.md;
// an investment transaction is money leaving the account to fund a purchase,
// tracked as its own holding separately in the future Investment Tracker).
export function balanceDelta(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : -amount
}

export interface BalanceLeg {
  accountId: string
  delta: number
}

// All balance movements a transaction causes. A transfer that names a
// destination account (`toAccountId`) moves money between two tracked accounts;
// without one it keeps the legacy single-leg behaviour (money leaves tracking).
export function balanceLegs(
  type: TransactionType,
  amount: number,
  accountId: string,
  toAccountId?: string | null,
): BalanceLeg[] {
  const legs: BalanceLeg[] = [{ accountId, delta: balanceDelta(type, amount) }]
  if (type === 'transfer' && toAccountId) {
    legs.push({ accountId: toAccountId, delta: amount })
  }
  return legs
}
