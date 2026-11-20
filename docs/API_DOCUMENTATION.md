# API Documentation

**Status: `/api/health`, `/api/auth/*`, `/api/accounts/*`, `/api/transactions/*`, `/api/budgets/*`, `/api/investments/*` and `/api/dashboard/summary` are real and tested.** Notifications (Phase 8) and any reports endpoints (Phase 7) are the target contract only. There is no OpenAPI spec yet (see `FUTURE_FEATURES.md`). Update an entry's status to `IMPLEMENTED` only once it's built, tested, and returns what's documented here.

## Conventions
- Unversioned paths (`/api/...`, see `DECISIONS.md`). JSON request/response bodies; request bodies are limited to **100 kb**.
- Protected endpoints expect `Authorization: Bearer <JWT>` (7-day expiry, no refresh).
- CORS allows only the configured `CORS_ORIGIN` (default `http://localhost:5173`); helmet security headers are on.
- Every resource is scoped to the caller. A resource that doesn't exist **or** belongs to another user returns **404** (never 403), as does a malformed ObjectId.

### Error shape
All errors are `{ "error": { "message": string, "details"?: unknown[] } }`.

| Status | When | Notes |
|---|---|---|
| 400 | Validation failure | `message: "Validation failed"`, `details` is the array of zod issues (`path`, `message`, ...). Also malformed JSON (`"Bad request"`, no internals). |
| 401 | Missing/invalid/expired token, bad login | `"Missing or invalid Authorization header"`, `"Invalid or expired token"`, `"Invalid email or password"` |
| 403 | Role check failed (`requireRole`) | No route uses it yet |
| 404 | Not found / not yours / bad id | `"Account not found"`, `"Transaction not found"`, ... |
| 409 | Conflict | Duplicate email, duplicate budget, account has transactions, account not active |
| 413 | Body over 100 kb | `"Payload too large"` |
| 429 | Rate limit exceeded | `{ "error": { "message": "Too many attempts, please try again later" } }` plus `RateLimit-*` headers (draft-7). Applies **only** to `POST /api/auth/login` and `POST /api/auth/register`: 20 requests per 15 minutes per IP. `GET /api/auth/me` is not limited. Disabled when `NODE_ENV=test`. |
| 500 | Unexpected error | Always `"Internal server error"`; details are logged server-side only |

### Input bounds (all create/update payloads)
- Money (`amount`, `balance`, `monthlyLimit`, `purchasePrice`, `currentValue`): finite number, `<= 1e12`, at most 2 decimal places. `amount`, `monthlyLimit`, prices must also be `> 0`. `quantity`: `> 0`, `<= 1e12`.
- Text: `name` <= 100, `category` <= 100, `notes` <= 1000, `paymentMethod` <= 50, `email` <= 254 characters. Strings are trimmed; required text must be non-empty.
- `currency`: 3 letters, upper-cased (`^[A-Z]{3}$`); not checked against ISO 4217.
- `password`: 8-72 characters (bcrypt only uses the first 72 bytes).

## Infrastructure — `/api/health`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/health` | Liveness check: `{ status, database: "connected"\|"disconnected", uptime }` | No | IMPLEMENTED |

## Auth — `/api/auth`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | Create a user: `{ name, email, password }`. **Any client-supplied `role` is ignored — every registration creates a `customer`.** Returns `201 { token, user }`. 409 if the email is already registered (this reveals that the email exists — known limitation), 400 on invalid payload, 429 when rate limited. | No | IMPLEMENTED |
| POST | `/api/auth/login` | Authenticate, return `{ token, user }`. 401 `Invalid email or password` for both unknown email and wrong password; response time is equalised with a dummy bcrypt compare. 429 when rate limited. | No | IMPLEMENTED |
| GET | `/api/auth/me` | Return `{ user }` for the token's owner. 401 if missing/invalid/expired; 404 if the user no longer exists. | Yes | IMPLEMENTED |

`user` is `{ id, name, email, role }` — never includes `passwordHash`.

## Accounts — `/api/accounts`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/accounts` | List the caller's accounts, newest first. Returns `{ accounts: Account[] }` (not paginated). | Yes | IMPLEMENTED |
| POST | `/api/accounts` | Create: `{ name, type, balance?, currency, status? }` (`balance` defaults to 0 and is the **opening balance**; `status` defaults to `active`). Returns `201 { account }`. 400 on invalid payload. | Yes | IMPLEMENTED |
| GET | `/api/accounts/:id` | Get one account. Returns `{ account }`. | Yes | IMPLEMENTED |
| PUT | `/api/accounts/:id` | Update any subset of `{ name, type, currency, status }`; an omitted field is left untouched. **`balance` is not accepted — sending it (or any unknown field) is a 400**, because balances change only through transactions. Returns `{ account }`. | Yes | IMPLEMENTED |
| DELETE | `/api/accounts/:id` | Delete an account. `204` on success. **409** `"This account has transactions and cannot be deleted. Set its status to Closed instead."` if any transaction references it as source or transfer destination. | Yes | IMPLEMENTED |

`Account`: `{ id, name, type: 'savings'|'checking'|'credit'|'investment', balance, currency, status: 'active'|'closed'|'frozen', createdAt, updatedAt }` — never includes `userId`.

## Transactions — `/api/transactions`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/transactions` | List, newest date first (ties by creation time). Optional filters (AND-combined): `accountId`, `type`, `category` (exact match), `startDate`, `endDate`; invalid values for `accountId`/`type`/dates are ignored. **Pagination:** `page` (default 1) and `limit` (default 200, max 500, min 1). Returns `{ transactions: Transaction[], pagination: { page, limit, total } }` where `total` is the count matching the filters. | Yes | IMPLEMENTED |
| POST | `/api/transactions` | Create: `{ accountId, toAccountId?, amount, type, category, date, paymentMethod?, notes? }`. Applies the balance effect (below). `201 { transaction }`. 400 invalid payload (incl. `toAccountId` on a non-transfer, or equal to `accountId`); 404 if any referenced account doesn't exist or isn't yours; **409** `"Transactions can only be added to active accounts"` if any referenced account is `frozen` or `closed`. | Yes | IMPLEMENTED |
| GET | `/api/transactions/:id` | Get one. `{ transaction }`. | Yes | IMPLEMENTED |
| PUT | `/api/transactions/:id` | Update any subset of the create fields; `toAccountId: null` clears the destination (it is also cleared automatically if `type` changes away from `transfer`). Old balance legs are reversed and new ones applied. A move to an unowned account is 404 with both balances untouched; **409** if the edit newly references a non-active account (existing records on a since-frozen account can still be corrected). | Yes | IMPLEMENTED |
| DELETE | `/api/transactions/:id` | Delete and reverse its balance effect (both legs of a transfer). `204`. | Yes | IMPLEMENTED |

**Balance effect:** `income` credits `accountId`; `expense`, `investment` and `transfer` debit it. A `transfer` with `toAccountId` also credits the destination (two legs); without one it only debits (legacy single-leg behaviour). Balances are rounded to cents. No currency conversion is performed between accounts of different currencies.

`Transaction`: `{ id, accountId, toAccountId?, amount, type: 'income'|'expense'|'transfer'|'investment', category, date, paymentMethod?, notes?, createdAt, updatedAt }`.

## Budgets — `/api/budgets`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/budgets` | List, optionally filtered by `month`/`year`. Each has a live-computed `usage` (one aggregation query for the whole list). `{ budgets: Budget[] }`. | Yes | IMPLEMENTED |
| POST | `/api/budgets` | Create `{ category, monthlyLimit, month (1-12), year (2000-2100) }`. `201 { budget }`. 409 if a budget for that category (case-insensitive) / month / year exists. | Yes | IMPLEMENTED |
| GET | `/api/budgets/:id` | One budget with usage. `{ budget }`. | Yes | IMPLEMENTED |
| PUT | `/api/budgets/:id` | Update any subset of the create fields. Same 400/404/409 semantics. | Yes | IMPLEMENTED |
| DELETE | `/api/budgets/:id` | Delete. `204`. | Yes | IMPLEMENTED |

`Budget`: `{ id, category, monthlyLimit, month, year, createdAt, updatedAt, usage: { spent, limit, remaining, percentUsed, isOverBudget } }`. `spent` is the sum of that user's `expense` transactions whose trimmed, case-insensitive category matches and whose date falls in that calendar month (UTC), rounded to cents.

## Investments — `/api/investments`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/investments` | List holdings, newest first, each with computed `value`, `profitLoss`, `profitLossPercent`, `percentOfPortfolio` (across the returned set). `{ investments: Investment[] }`. | Yes | IMPLEMENTED |
| POST | `/api/investments` | Create `{ type, name, quantity, purchasePrice, currentValue }` (prices are per unit). `201 { investment }` (no `percentOfPortfolio`). | Yes | IMPLEMENTED |
| GET | `/api/investments/:id` | One holding (no `percentOfPortfolio`). | Yes | IMPLEMENTED |
| PUT | `/api/investments/:id` | Update any subset; returns `{ investment }`. | Yes | IMPLEMENTED |
| DELETE | `/api/investments/:id` | Delete. `204`. | Yes | IMPLEMENTED |

`Investment`: `{ id, type: 'stock'|'mutual_fund'|'fixed_deposit'|'crypto'|'gold', name, quantity, purchasePrice, currentValue, createdAt, updatedAt, value, profitLoss, profitLossPercent, percentOfPortfolio? }`.

## Dashboard — `/api/dashboard`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/dashboard/summary` | Read-only snapshot for the caller | Yes | IMPLEMENTED |

Response: `{ balances: [{ currency, total, accounts }], thisMonth: { income, expense, net }, investments: { holdings, invested, currentValue } }`.
- `balances` groups non-`closed` accounts by currency; totals are never summed across currencies.
- `thisMonth` covers the current calendar month in UTC and sums `income` and `expense` transactions (not converted across currencies).
- `invested` = Σ quantity × purchasePrice and `currentValue` = Σ quantity × currentValue over all holdings.
- Savings rate, net worth and budget-usage roll-ups from the original target contract are not implemented (Phase 7).

## Notifications — `/api/notifications`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/notifications` | List the user's notifications | Yes | PLANNED (Phase 8) |
| PATCH | `/api/notifications/:id/read` | Mark a notification read | Yes | PLANNED (Phase 8) |

## Not yet specced
Reports/export endpoints, password reset, refresh tokens, admin user-management and advisor-scoped endpoints are not documented because the product scope isn't decided yet (see open questions in `PROJECT_PLAN.md`). Add the spec here first once scope is confirmed.
