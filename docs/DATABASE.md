# Database

**Status: `users`, `accounts`, `transactions`, `budgets`, and `investments` are real; `notifications` below is still a DRAFT / PLANNED schema (Phase 8).** MongoDB 7 runs locally via Docker Compose. Update each collection's note here when its Mongoose model is actually built, and don't let this drift from the real schema code.

## Database: MongoDB (via Mongoose)
See `DECISIONS.md` for why MongoDB was chosen over PostgreSQL, and `ARCHITECTURE.md` for the referential-integrity implications (no FK enforcement — ownership/relations must be checked in application code).

## Collections

### `users` — IMPLEMENTED (`server/src/models/User.ts`)
| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercased, trimmed |
| `passwordHash` | String | required; bcrypt hash (10 salt rounds), never the plaintext password |
| `role` | String enum: `customer` \| `advisor` \| `admin` | required, default `customer`. In practice always `customer` today — `POST /api/auth/register` never lets a client set this (see `DECISIONS.md`); nothing yet creates `advisor`/`admin` users. |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### `accounts` — IMPLEMENTED (`server/src/models/Account.ts`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `name` | String | required (e.g. "Savings Account") |
| `type` | String enum: `savings` \| `checking` \| `credit` \| `investment` | required |
| `balance` | Number | required, default 0. **Semantics:** may be set once, as an opening balance, on `POST /api/accounts`; `PUT /api/accounts/:id` rejects it (400). After creation it changes only through transactions, rounded to 2 decimals by an aggregation-pipeline `$round`. |
| `currency` | String | required, upper-cased; API requires `^[A-Z]{3}$` (shape only — not checked against the real ISO 4217 list) |
| `status` | String enum: `active` \| `closed` \| `frozen` | required, default `active`. Only `active` accounts accept new transactions (409 otherwise). An account with any transaction referencing it (as `accountId` or `toAccountId`) cannot be deleted (409) — set it to `closed`. Closed accounts are excluded from the dashboard balance total. |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### `transactions` — IMPLEMENTED (`server/src/models/Transaction.ts`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `accountId` | ObjectId ref `accounts` | required, indexed; must belong to `userId` (enforced in controller, not the database — same pattern as `accounts`) |
| `amount` | Number | required, `min: 0` at the schema level; Zod additionally requires `> 0` at the API boundary. Always stored as a positive magnitude — the sign of its effect on balance is derived from `type`, never stored as a negative number. |
| `toAccountId` | ObjectId ref `accounts` | optional; only valid when `type` is `transfer`, must differ from `accountId` and belong to `userId`. When present the transfer is two-leg: source `-amount`, destination `+amount`. Without it a transfer is single-leg (money leaves tracking). |
| `type` | String enum: `income` \| `expense` \| `transfer` \| `investment` | required. **Balance effect (`server/src/utils/balance.ts`, pure and unit-tested — `balanceDelta` and `balanceLegs`):** `income` → `+amount` on `accountId`; `expense`, `investment` and `transfer` → `-amount` on `accountId`; a transfer with `toAccountId` additionally `+amount` on the destination. See `DECISIONS.md`. |
| `category` | String | required (free text — e.g. Food, Transport, Shopping, Utilities, Entertainment, Healthcare; no enum lock) |
| `date` | Date | required |
| `paymentMethod` | String | optional, max 50 chars (API) |
| `notes` | String | optional, max 1000 chars (API) |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes: `userId`, `accountId`, and compound `(userId, date desc)` for list/dashboard/report queries — all implemented. `toAccountId` has no index (the account-delete check queries it per account; fine at this scale). A case-insensitive regex on `category` cannot use an index; see `TECHNICAL_DEBT.md`.

Amount limits (API): `0 < amount <= 1e12`, at most 2 decimal places; `category` max 100 chars.

**Balance-integrity approach:** this project's standalone (non-replica-set) local MongoDB doesn't support multi-document ACID transactions. Balance updates instead use an atomic single-document pipeline update (`$round` of `balance + delta`, to 2 decimals) on each affected `Account`, applied before the `Transaction` write, with a compensating reverse update if that write fails — see `DECISIONS.md`. A process crash between the two steps can leave a balance off (`TECHNICAL_DEBT.md`). Every create/update/delete path is covered by an integration test that asserts the resulting balance directly (`server/src/routes/transactions.routes.test.ts`), not just that the HTTP call succeeded.

### `budgets` — IMPLEMENTED (`server/src/models/Budget.ts`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `category` | String | required (matched case-insensitively against `transactions.category` when computing usage) |
| `monthlyLimit` | Number | required, `> 0` and `<= 1e12`, 2 decimals (Zod) |
| `month` | Number (1–12) | required |
| `year` | Number | required |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes: `userId`, and unique compound `(userId, category, month, year)` — implemented, case-sensitive at the database level. Duplicate prevention is actually enforced case-insensitively one layer up, in `budgets.controller.ts` (a pre-create/pre-update lookup using an escaped, case-insensitive regex) — the DB index is defense-in-depth against a race, not the primary mechanism, since a case-sensitive-only index would let "Food" and "food" coexist as two documents that both match the same expenses in usage calculations. See `DECISIONS.md`.

**Usage is not stored anywhere** — `GET /api/budgets`/`GET /api/budgets/:id` compute `{ spent, limit, remaining, percentUsed, isOverBudget }` live, on every request, from the real `transactions` collection (`type: 'expense'`, matching `category` case-insensitively and trimmed, `date` within that budget's calendar month in UTC). The list endpoint does this with a single aggregation for all budgets, not one query per budget. This was a deliberate choice to avoid an entire class of cache-invalidation bugs (a stored/cached usage figure going stale the moment a matching transaction is added, edited, or deleted) — see `DECISIONS.md`.

### `investments` — IMPLEMENTED (`server/src/models/Investment.ts`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `type` | String enum: `stock` \| `mutual_fund` \| `fixed_deposit` \| `crypto` \| `gold` | required |
| `name` | String | required (ticker/fund/asset name) |
| `quantity` | Number | required, `> 0`, `<= 1e12` (Zod) |
| `purchasePrice` | Number | required, `> 0` — **per unit**, at acquisition (resolved open question below) |
| `currentValue` | Number | required, `> 0` — **per unit**, same convention as `purchasePrice` for direct comparability |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Profit/loss (`(currentValue - purchasePrice) * quantity`), profit/loss percent, total holding value (`currentValue * quantity`), and portfolio allocation percentage are all computed live on every read (`server/src/utils/investmentReturns.ts`, pure and unit-tested) — none of them are stored. Portfolio allocation is computed across whatever set of investments a given `GET /api/investments` call returns, so it's always relative to that user's full portfolio at that moment.

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `type` | String enum: `budget_exceeded` \| `bill_due` \| `salary_received` \| `investment_matured` \| `unusual_spending` | required |
| `message` | String | required |
| `read` | Boolean | required, default `false` |
| `createdAt` | Date | Mongoose timestamp |

## Open questions
- ~~Should `currentValue` on `investments` be per-unit or total holding value?~~ Resolved when Phase 6 was built: per-unit, matching `purchasePrice`. See `DECISIONS.md`.
- Recurring transactions are not modeled — see `TECHNICAL_DEBT.md`'s note on deciding the generation strategy before adding this.
