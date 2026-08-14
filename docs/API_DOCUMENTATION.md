# API Documentation

**Status: PLANNED.** No endpoint listed here exists yet. This is the target contract for Phase 0–8 (`PROJECT_PLAN.md`). Update each entry's status to `IMPLEMENTED` only once it's built, tested, and actually returns what's documented here.

All endpoints are unversioned (`/api/...`, see `DECISIONS.md`). All protected endpoints expect `Authorization: Bearer <JWT>`. Error responses use `{ error: { message: string, code?: string } }` (finalize on first real implementation).

## Auth — `/api/auth`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | Create a new user (name, email, password, role) | No | PLANNED |
| POST | `/api/auth/login` | Authenticate, return JWT | No | PLANNED |
| GET | `/api/auth/me` | Return the current authenticated user's profile | Yes | PLANNED |

## Accounts — `/api/accounts`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/accounts` | List the current user's accounts | Yes | PLANNED |
| POST | `/api/accounts` | Create an account | Yes | PLANNED |
| GET | `/api/accounts/:id` | Get a single account (must belong to caller) | Yes | PLANNED |
| PUT | `/api/accounts/:id` | Update an account | Yes | PLANNED |
| DELETE | `/api/accounts/:id` | Delete an account | Yes | PLANNED |

## Transactions — `/api/transactions`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/transactions` | List transactions (filterable by account, category, date range, type) | Yes | PLANNED |
| POST | `/api/transactions` | Create a transaction; updates the related account balance | Yes | PLANNED |
| GET | `/api/transactions/:id` | Get a single transaction | Yes | PLANNED |
| PUT | `/api/transactions/:id` | Update a transaction; must correctly re-adjust account balance | Yes | PLANNED |
| DELETE | `/api/transactions/:id` | Delete a transaction; must correctly reverse account balance | Yes | PLANNED |

## Budgets — `/api/budgets`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/budgets` | List budgets (optionally filtered by month/year) | Yes | PLANNED |
| POST | `/api/budgets` | Create a monthly category budget | Yes | PLANNED |
| PUT | `/api/budgets/:id` | Update a budget | Yes | PLANNED |
| DELETE | `/api/budgets/:id` | Delete a budget | Yes | PLANNED |

## Investments — `/api/investments`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/investments` | List investment holdings | Yes | PLANNED |
| POST | `/api/investments` | Create a holding | Yes | PLANNED |
| PUT | `/api/investments/:id` | Update a holding (e.g. current value) | Yes | PLANNED |
| DELETE | `/api/investments/:id` | Delete a holding | Yes | PLANNED |

## Dashboard — `/api/dashboard`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/dashboard/summary` | Aggregate: total balance, monthly income/expense, savings rate, budget usage, net worth | Yes | PLANNED |

## Notifications — `/api/notifications`
| Method | Path | Purpose | Auth required | Status |
|---|---|---|---|---|
| GET | `/api/notifications` | List the user's notifications | Yes | PLANNED |
| PATCH | `/api/notifications/:id/read` | Mark a notification read | Yes | PLANNED |

## Not yet specced
Password reset, admin user-management endpoints, and advisor-scoped endpoints are not documented here because the underlying product scope isn't decided yet (see open questions in `PROJECT_PLAN.md`). Don't build against an assumed shape for these — add the spec here first once the scope is confirmed.
