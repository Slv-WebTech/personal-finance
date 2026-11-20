import { z } from 'zod'

// Shared field rules. Money is limited to two decimals and a sane magnitude so
// float arithmetic on balances stays exact and absurd values (1e308) are rejected.
const MAX_MONEY = 1_000_000_000_000
const money = (label: string) =>
  z
    .number()
    .finite(`${label} must be a valid number`)
    .max(MAX_MONEY, `${label} is too large`)
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, `${label} can have at most 2 decimal places`)
const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`)
const optionalText = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`).optional()
const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code (e.g. USD)')

// Registration never accepts a client-supplied `role` — every new account is
// a `customer`. Advisor/admin provisioning is an open product question
// (see PROJECT_PLAN.md) and must not be reachable through the public endpoint.
export const registerSchema = z.object({
  name: text('Name', 100),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  // bcrypt only uses the first 72 bytes, so longer passwords add no security.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(72),
})

export const createAccountSchema = z.object({
  name: text('Name', 100),
  type: z.enum(['savings', 'checking', 'credit', 'investment']),
  balance: money('Balance').optional().default(0),
  currency: currencyCode,
  status: z.enum(['active', 'closed', 'frozen']).optional().default('active'),
})

// NOT createAccountSchema.partial(): balance/status carry .default(...), and
// Zod re-applies a field's default whenever that field is omitted even under
// .partial() — a PUT that only renames an account would silently reset its
// balance to 0 and status to 'active'. Defined independently, with plain
// .optional() and no defaults, so an omitted field is simply left untouched.
export const createTransactionSchema = z
  .object({
    accountId: z.string().trim().min(1, 'Account is required'),
    toAccountId: z
      .string()
      .trim()
      .min(1)
      .nullish()
      .transform((v) => v ?? undefined),
    amount: money('Amount').positive('Amount must be greater than 0'),
    type: z.enum(['income', 'expense', 'transfer', 'investment']),
    category: text('Category', 100),
    date: z.coerce.date('A valid date is required'),
    paymentMethod: optionalText(50),
    notes: optionalText(1000),
  })
  .refine((v) => !v.toAccountId || v.type === 'transfer', {
    message: 'A destination account is only valid for transfers',
    path: ['toAccountId'],
  })
  .refine((v) => !v.toAccountId || v.toAccountId !== v.accountId, {
    message: 'Destination account must differ from the source account',
    path: ['toAccountId'],
  })

// Updates are validated field-by-field; cross-field rules (transfer destination
// vs. the final type/account) are enforced in the controller on the merged
// result. `toAccountId: null` explicitly clears the destination.
export const updateTransactionSchema = z.object({
  accountId: z.string().trim().min(1, 'Account is required').optional(),
  toAccountId: z.string().trim().min(1).nullable().optional(),
  amount: money('Amount').positive('Amount must be greater than 0').optional(),
  type: z.enum(['income', 'expense', 'transfer', 'investment']).optional(),
  category: text('Category', 100).optional(),
  date: z.coerce.date('A valid date is required').optional(),
  paymentMethod: optionalText(50),
  notes: optionalText(1000),
})

export const createBudgetSchema = z.object({
  category: text('Category', 100),
  monthlyLimit: money('Monthly limit').positive('Monthly limit must be greater than 0'),
  month: z.number().int('Month must be a whole number').min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().int('Year must be a whole number').min(2000, 'Year must be a valid year').max(2100, 'Year must be a valid year'),
})

// Safe to derive via .partial() — no field here carries a .default(...),
// verified empirically the same way as the transactions schema above.
export const updateBudgetSchema = createBudgetSchema.partial()

export const createInvestmentSchema = z.object({
  type: z.enum(['stock', 'mutual_fund', 'fixed_deposit', 'crypto', 'gold']),
  name: text('Name', 100),
  quantity: z.number().finite().positive('Quantity must be greater than 0').max(1e12, 'Quantity is too large'),
  purchasePrice: money('Purchase price').positive('Purchase price must be greater than 0'),
  currentValue: money('Current value').positive('Current value must be greater than 0'),
})

// Safe to derive via .partial() — no field here carries a .default(...),
// verified empirically the same way as transactions/budgets above.
export const updateInvestmentSchema = createInvestmentSchema.partial()

// `balance` is deliberately not updatable here: balances change only through
// transactions, so the ledger and the stored balance cannot diverge. `.strict()`
// turns an attempt to send it into a clear 400 instead of a silent no-op.
export const updateAccountSchema = z.strictObject({
  name: text('Name', 100).optional(),
  type: z.enum(['savings', 'checking', 'credit', 'investment']).optional(),
  currency: currencyCode.optional(),
  status: z.enum(['active', 'closed', 'frozen']).optional(),
})
