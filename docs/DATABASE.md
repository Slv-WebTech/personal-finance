# Database

**Status: `users` is real (`server/src/models/User.ts`); everything else below is still a DRAFT / PLANNED schema.** MongoDB is running and connected (local Docker container, verified). Update each collection's note here when its Mongoose model is actually built, and don't let this drift from the real schema code.

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

### `accounts`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `name` | String | required (e.g. "Savings Account") |
| `type` | String enum: `savings` \| `checking` \| `credit` \| `investment` \| ... | required |
| `balance` | Number | required, default 0 |
| `currency` | String | required (ISO 4217 code, e.g. `USD`) |
| `status` | String enum: `active` \| `closed` \| `frozen` | required, default `active` |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### `transactions`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `accountId` | ObjectId ref `accounts` | required, indexed; must belong to `userId` (enforced in controller) |
| `amount` | Number | required |
| `type` | String enum: `income` \| `expense` \| `transfer` \| `investment` | required |
| `category` | String | required (e.g. Food, Transport, Shopping, Utilities, Entertainment, Healthcare) |
| `date` | Date | required |
| `paymentMethod` | String | optional |
| `notes` | String | optional |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Index: compound `(userId, date)` for dashboard/report queries.

### `budgets`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `category` | String | required |
| `monthlyLimit` | Number | required |
| `month` | Number (1–12) | required |
| `year` | Number | required |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Index: unique compound `(userId, category, month, year)` — prevents duplicate budgets for the same category/period.

### `investments`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `type` | String enum: `stock` \| `mutual_fund` \| `fixed_deposit` \| `crypto` \| `gold` | required |
| `name` | String | required (ticker/fund/asset name) |
| `quantity` | Number | required |
| `purchasePrice` | Number | required (per unit, at acquisition) |
| `currentValue` | Number | required (per unit or total — decide and document once built; per-unit is proposed for consistency with `quantity`) |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Profit/loss is a computed value (`(currentValue - purchasePrice) * quantity`), not stored — see `PROJECT_STYLE.md`'s note on keeping financial calculations as pure, testable functions.

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId ref `users` | required, indexed |
| `type` | String enum: `budget_exceeded` \| `bill_due` \| `salary_received` \| `investment_matured` \| `unusual_spending` | required |
| `message` | String | required |
| `read` | Boolean | required, default `false` |
| `createdAt` | Date | Mongoose timestamp |

## Open questions
- Should `currentValue` on `investments` be per-unit or total holding value? Decide when the Investment Tracker (Phase 6) is actually built.
- Recurring transactions are not modeled — see `TECHNICAL_DEBT.md`'s note on deciding the generation strategy before adding this.
