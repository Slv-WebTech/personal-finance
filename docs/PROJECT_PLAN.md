# Project Plan

Status legend: `PLANNED` (not started) · `IN_PROGRESS` · `DONE` (exists and verified working) · `BLOCKED`

Nothing is marked `DONE` until code exists, is integrated, and has been verified to behave correctly. See `IMPLEMENTED_FEATURES.md` for the factual record.

## Completed

### Phase 0 — Project scaffolding
- **Objective:** Stand up an empty-but-runnable client + server skeleton.
- **Priority:** Highest (blocks everything else)
- **Dependencies:** None
- **Implementation considerations:** `client/` (Vite + React + TS) and `server/` (Express + TS) as sibling folders per the agreed structure; ESLint + Prettier in both; `.env.example` in server; MongoDB connection via Mongoose with a health-check route.
- **Acceptance criteria:** `npm run dev` starts the client (verified); `npm run dev` starts the server and it runs correctly whether or not `MONGODB_URI` is configured (verified — logs a warning and stays up if unset, per `db.ts`'s non-blocking connect); a `GET /api/health` route returns 200 with `{status, database, uptime}` (verified via curl).
- **Status:** DONE (2026-08-14) — verified: client `tsc -b` clean, server `tsc --noEmit` clean, server `eslint .` clean, both dev servers manually started and confirmed responding, then stopped. MongoDB connectivity confirmed the same day against a local Docker container (`GET /api/health` → `database: "connected"`) — see the "Local MongoDB via Docker" decision in `DECISIONS.md` and the follow-up entry in `CHANGELOG.md`.

### Phase 1 — Authentication
- **Objective:** Register, login, JWT issuance/verification, role field on user (customer/advisor/admin), bcrypt password hashing.
- **Priority:** High
- **Dependencies:** Phase 0
- **Implementation considerations:** `POST /api/auth/register`, `POST /api/auth/login`; auth middleware for protected routes; password never returned in any response.
- **Acceptance criteria:** A new user can register, log in, receive a JWT, and access a protected test route with it (verified via `GET /api/auth/me`); invalid credentials are rejected; passwords are hashed at rest.
- **Status:** DONE (2026-08-17) — verified: `tsc`/`eslint` clean, 10 Vitest tests passing (unit: password hashing, JWT sign/verify; integration: register/duplicate-email/invalid-payload/role-stripping, login success/failure, `/me` authed/unauthed), plus a manual curl smoke test of the full register → login → `/me` flow against the real dev database (test user cleaned up afterward). Security note: registration always creates a `customer` — a client-supplied `role` field is silently ignored (see `DECISIONS.md`); advisor/admin account provisioning remains an open question (`PROJECT_PLAN.md` open questions below).

### Phase 2 — Account Management
- **Objective:** CRUD for bank accounts (name, type, balance, currency, status), scoped to the logged-in user.
- **Priority:** High
- **Dependencies:** Phase 1
- **Implementation considerations:** First real exercise of the "ownership checks in controllers, not the database layer" pattern — every query filters on `{ _id, userId }` together, and a cross-user access attempt returns 404 (not 403), deliberately never distinguishing "doesn't exist" from "exists but isn't yours."
- **Status:** DONE (2026-08-22) — verified: `tsc`/`eslint` clean on both client and server, 21 Vitest tests passing (create/list/get/update/delete, cross-user ownership 404s, invalid-ObjectId 404, invalid-payload 400, unauthenticated 401 on every route, plus a regression test for a bug caught during review — see below), `vite build` succeeds. Frontend: full CRUD UI (`/accounts`, protected route) — list/table view, create/edit modal, delete-confirmation modal, loading/empty/error states, all built on the design-system component library (plus three new reusable primitives added for this phase: `Modal`, `Table`, `Select`). **Bug caught and fixed before shipping:** the initial `updateAccountSchema` was `createAccountSchema.partial()`, but Zod re-applies a field's `.default(...)` whenever that field is omitted, even under `.partial()` — a PUT that only renamed an account would have silently reset its `balance` to 0 and `status` to `'active'`. Verified empirically (`node -e` against the real Zod version) before and after the fix; `updateAccountSchema` is now defined independently with plain `.optional()` and no defaults. A regression test covers this specifically. See `DECISIONS.md`.

### Phase 3 — Transaction Management
- **Objective:** CRUD for transactions (income/expense/transfer/investment), linked to an account and category; account balance updates correctly on transaction create/edit/delete.
- **Priority:** High
- **Dependencies:** Phase 2
- **Implementation considerations:** Balance recalculation must be correct under edit and delete, not just create — this was the project's flagged correctness risk (see `TECHNICAL_DEBT.md`).
- **Status:** DONE (2026-08-22) — verified: 43 backend Vitest tests passing (up from 21), including a dedicated pure-function unit suite for the balance math (`server/src/utils/balance.test.ts`) and integration tests covering every balance-integrity edge case: create (income increases, expense/transfer/investment decrease), update with only the amount changed, update with the type changed (e.g. income→expense, verifying the *net* delta is applied, not just the new one), update moving a transaction to a different owned account (old account's effect reversed, new account's applied), update rejecting a move to an unowned account with **both accounts' balances verified untouched**, delete reversing the balance, and ownership/auth checks on every route. `tsc`/`eslint` clean on client and server, `vite build` succeeds. **A real test-infrastructure bug was found and fixed in the process:** Vitest was running test files concurrently by default, but all integration test files share one physical `personal-finance-test` database and reuse the same hardcoded fixture emails — adding a third test file surfaced races (duplicate-key errors, collections wiped mid-test by another file's `beforeEach`). Fixed via `fileParallelism: false` in `server/vitest.config.ts`. See `DECISIONS.md` for both this and the balance-model decisions (how each transaction `type` affects balance, given the schema has no second "to account" field for transfers).
- **Frontend:** `/transactions` — list with account/type filters, create/edit/delete, all against the design-system component library.
- **Later additions (2026-11-20):** transfers with optional `toAccountId` (two-leg), balances rounded to cents, frozen/closed accounts reject new transactions (409), `page`/`limit` pagination. The "transfer is single-leg" statement above describes the original design; see `DECISIONS.md` for the supersession.

### Phase 4 — Financial Dashboard
- **Objective:** Aggregate view: total balance, monthly income, monthly expenses, savings rate, budget usage, net worth.
- **Priority:** High
- **Dependencies:** Phase 3 (in practice also Phases 5-6 for budget/investment figures)
- **Status:** DONE (2026-11-20) at summary level — `GET /api/dashboard/summary` (per-currency balances excluding closed accounts, this month's income/expense/net, investment totals) with a test suite, plus the "Your snapshot" card on `/app`. Savings rate, net worth, budget-usage roll-up and charts were deferred to Phase 7; there is no separate `/dashboard` page.

### Phase 5 — Budget Management
- **Objective:** Create monthly category budgets, compute spend-to-date per category, overspending alerts.
- **Priority:** High
- **Dependencies:** Phase 3
- **Status:** DONE (2026-08-22) — backend verified: 17 new Vitest tests (60/60 total across the whole backend suite), `tsc`/`eslint` clean. Usage (`spent`/`remaining`/`percentUsed`/`isOverBudget`) is always computed live at read time from real expense transactions in that budget's exact month/year (case-insensitive category match) — never stored/cached, so it can't go stale relative to the transactions it's derived from. Duplicate category+month+year is rejected with 409 (checked case-insensitively in the controller, backed by a case-sensitive unique index as defense-in-depth). Frontend (`/budgets` — month/year picker, card-based usage view with a progress bar per budget, create/edit/delete) built and integrated the same day; see `IMPLEMENTED_FEATURES.md` for its own verification details. See `DECISIONS.md` for the usage-computation and duplicate-detection decisions.

### Phase 6 — Investment Tracker
- **Objective:** CRUD for investment holdings, profit/loss calculation, portfolio allocation view.
- **Priority:** Medium
- **Dependencies:** Phase 2
- **Status:** DONE (2026-08-22) — backend verified: 18 new Vitest tests (78/78 total), `tsc`/`eslint` clean. Resolved `DATABASE.md`'s open question (`currentValue` is per-unit, matching `purchasePrice`). Profit/loss, profit/loss %, holding value, and portfolio allocation % are all pure, unit-tested functions (`server/src/utils/investmentReturns.ts`), computed live on every read, never stored. Frontend: `/investments` — portfolio summary (total value, total profit/loss), a `Card` grid with a `ProgressBar` per holding for allocation %, create/edit/delete. Client `tsc -b`/lint/`vite build` all clean.

## In Progress
_(none)_

## Next

### Phase 7 — Charts & Reports
- **Objective:** Income vs. expense, monthly spending, budget usage, category breakdown, savings trend, investment growth charts; PDF/Excel export.
- **Priority:** Medium
- **Dependencies:** Phases 3–6 (needs real data to chart)
- **Status:** PLANNED

### Phase 8 — Notifications
- **Objective:** In-app alerts for budget overspend, bills due, salary received, investment maturity, unusual spending.
- **Priority:** Medium
- **Dependencies:** Phases 3, 5, 6
- **Status:** PLANNED

## Later
Bonus features from the product spec — see `FUTURE_FEATURES.md` for full detail and prioritization: AI spending insights, AI financial assistant, credit score tracking, bill reminder system, multi-currency support, QR code payments, push notifications, financial forecasting, goal-based savings planner.

## Blocked
_(none currently)_

## Hardening / technical backlog
See `TECHNICAL_DEBT.md` (integer minor units, Mongo multi-document transactions, refresh tokens/httpOnly cookies, timezone-aware budget months, client pagination UI/search, OpenAPI spec, seed data).

## Open product questions (not yet decided — do not implement around an assumption)
- What can a **Financial Advisor** role actually see/do? (Manage one customer? Multiple? Read-only?)
- What can an **Administrator** actually manage through the UI vs. just having elevated data access?
- Is bulk/CSV transaction import in scope for MVP or a later feature?
