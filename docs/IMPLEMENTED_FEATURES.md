# Implemented Features

**This file only lists features that exist in code, are integrated, and have been verified to actually work.** Nothing is added here based on a plan, a design, or an intention — only on inspected, working code.

## Project scaffolding (Phase 0)
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `client/` (Vite + React + TypeScript app), `server/` (Express + TypeScript API)
- **Important files:**
  - `client/src/App.tsx`, `client/src/pages/Landing.tsx` (originally a 2-line placeholder — since rebuilt into a real marketing page, see "Design System & Marketing/Auth UI" below), `client/src/services/api.ts` (axios instance with JWT-attach interceptor; originally not used by any real request — since wrapped by `services/authService.ts` and used by real auth calls, see "Authentication (Phase 1)" below)
  - `server/src/server.ts` (Express app entry), `server/src/config/db.ts` (non-blocking Mongoose connection), `server/src/routes/health.routes.ts` + `server/src/controllers/health.controller.ts`, `server/src/middleware/errorHandler.ts`
- **API/database dependencies:** `GET /api/health` — no database write/read yet; reports live Mongoose connection state (`connected`/`disconnected`).
- **Testing status:** No automated tests. Manually verified: `tsc` type-checks clean in both `client/` and `server/`; `eslint .` clean in `server/`; both `npm run dev` commands start successfully; `curl http://localhost:4000/api/health` returned both states — `{"status":"ok","database":"disconnected",...}` with no `MONGODB_URI` set, and `{"status":"ok","database":"connected",...}` against the local Docker MongoDB (see below).
- **Known limitations (as of this Phase 0 snapshot, 2026-08-14):** No UI beyond a placeholder landing page. No auth, no real routes beyond `/api/health`. No automated tests exist for any of this yet. (Superseded by later phases — see "Authentication (Phase 1)" and "Design System & Marketing/Auth UI" below for what has since been built.)

## Local development infrastructure
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `docker-compose.yml` (repo root, `mongo:7` container), `server/.env` (untracked, real `MONGODB_URI` + generated `JWT_SECRET`), local git repository (`git init`, initial commit made)
- **Testing status:** Verified — container starts via `docker compose up -d`, `mongosh` ping returned `{ok: 1}`, server connected to it successfully.
- **Known limitations:** No MongoDB Atlas (production) cluster provisioned yet. Git remote exists (`Slv-WebTech/personal-finance` on GitHub, private, via the `github-personal` SSH alias — see `DEPLOYMENT.md`) but no application hosting (Vercel/Render/Railway) is connected.

## Authentication (Phase 1)
- **Implementation status:** DONE, verified 2026-08-17 (backend); client-side login/register/session UI added and verified (`tsc -b`, lint, build) 2026-08-22 — authentication is now usable end-to-end by a real user, not just backend-only.
- **Where it exists:**
  - Backend: `server/src/models/User.ts`, `server/src/utils/password.ts` (bcrypt hash/compare), `server/src/utils/jwt.ts` (sign/verify, 7-day expiry), `server/src/utils/validators.ts` (zod schemas), `server/src/middleware/validate.ts`, `server/src/middleware/auth.ts` (`requireAuth`, `requireRole` — role-gating exists but is not yet exercised by any route), `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`
  - Client: `client/src/types/auth.ts`, `client/src/services/authService.ts` (wraps the existing axios instance in `services/api.ts`, normalizes every failure into a typed `ApiError`), `client/src/context/AuthContext.tsx` + `client/src/hooks/useAuth.ts` (session state via React Context; on load, validates any existing `localStorage` token via a real `GET /api/auth/me` call before trusting it), `client/src/components/ProtectedRoute.tsx` (guards the auth-gated `/app` route), `client/src/pages/Login.tsx` and `client/src/pages/Register.tsx` (real forms wired to the real endpoints; Register client-side-validates password === confirm-password and maps the server's per-field Zod validation errors onto the matching input; both redirect to `/app` on success, or straight to `/app` if an already-authenticated user lands on `/login`/`/register`), `client/src/pages/AppHome.tsx` (the post-login landing page)
- **API/database dependencies:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (protected) — all backed by the real `users` collection via Mongoose. Same three endpoints as before; they are now actually called from real client UI instead of only from tests/curl.
- **Testing status:**
  - Backend: 10 automated tests (Vitest), all passing, unchanged since 2026-08-17:
    - Unit: password hash/verify round-trip + rejection (`password.test.ts`), JWT sign/verify round-trip + rejection of an invalid token (`jwt.test.ts`)
    - Integration (`auth.routes.test.ts`, via Supertest against a dedicated `personal-finance-test` database, never the dev database): register success, duplicate-email rejection (409), invalid-payload rejection (400), client-supplied `role` is ignored, login success/failure (401), `GET /me` with a valid token (200) and without one (401)
    - Manually verified via curl against the real dev database (test user deleted afterward): full register → login → `/me` flow, plus `/me` with a garbage token (401)
  - Hardening since (2026-11-20, covered by `qa-hardening.routes.test.ts` and the auth suite): password 8-72 chars, email max 254, name max 100; login timing equalised with a dummy bcrypt compare for unknown emails; rate limit of 20 requests / 15 min / IP on `/api/auth/login` and `/api/auth/register` (returns 429; skipped under Vitest); `AuthContext` only drops the stored token when `/me` answers 401/404, so a network blip or 5xx does not log the user out.
  - Client: no dedicated tests for `Login`/`Register`/`AuthContext` (the client suite is 6 tests — `Alert`, `Modal`, `cx`); the flow was exercised in a browser during the QA pass (`QA-REPORT.md`).
- **Known limitations:** No password-reset flow. Registration reveals whether an email exists (409). 7-day JWT stored in `localStorage`, no refresh tokens and no revocation. No mechanism exists to create `advisor`/`admin` accounts — registration always creates a `customer` by design (see `DECISIONS.md`); that's an open product question, not a bug. `requireRole` exists but has no caller yet.

## Design System & Marketing/Auth UI
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Design tokens: `client/src/styles/tokens.css` (color, typography, spacing, radius, shadow, and motion tokens; light and dark values, dark applied via `prefers-color-scheme`) and `client/src/styles/global.css` (global resets/base styles built on those tokens)
  - Component library, `client/src/components/ui/`:
    - `Button` — primary UI button with variants, used across forms and CTAs
    - `TextField` — labeled text input with built-in error-message display, used by Login/Register
    - `Card` — bordered/elevated container for grouping content
    - `Alert` — inline banner for success/error/info messaging (e.g. login/register failures)
    - `Spinner` — loading indicator (e.g. while an auth request is in flight)
    - `Badge` — small status/label pill (e.g. the "Planned" tags on `AppHome`)
    - `Logo` — the app's wordmark/icon component
  - Styling approach: CSS Modules per component (`*.module.css`), composed with a small `cx` class-name helper — no new npm dependency was added for styling
  - Rebuilt marketing page: `client/src/pages/Landing.tsx` (+ `Landing.module.css`) — previously a 2-line placeholder, now a real hero section, an honest "what's being built next" feature-roadmap section (Accounts/Transactions/Budgets/Investments/Reports, explicitly not claimed as live), and a footer; no fabricated stats or testimonials, and it explicitly states there is no bank-account connection
  - Post-login home: `client/src/pages/AppHome.tsx` (+ `.module.css`) at `/app` — a welcome message, the "Your snapshot" card fed by `GET /api/dashboard/summary` (see "Financial Dashboard" below), and a roadmap list linking to Accounts/Transactions/Budgets/Investments with Reports/Notifications still marked as not built.
  - Later primitives: `Modal` (portal dialog with focus trap and focus restore, Escape/backdrop close), `Table` (on viewports under 640px rows become stacked cards), `Select`, `ProgressBar`, and the `AppShell` layout (header + nav + content).
  - New 404 handling: `client/src/pages/NotFound.tsx` (+ `.module.css`) — previously any unmatched route had no handling at all.
- **API/database dependencies:** None directly — this is presentation-layer only. The auth-related pages under this umbrella (`Login.tsx`/`Register.tsx`) depend on the Authentication endpoints documented above.
- **Testing status:** `tsc -b`, `npm run lint` and `npm run build` are clean and run in CI. Client Vitest + Testing Library suite: 6 tests (`Alert`, `Modal` incl. focus trap/restore, `cx`). Browser behaviour was checked in the QA pass (`QA-REPORT.md`). The dark-mode styling (`prefers-color-scheme: dark`) was written but has not been systematically visually verified — treat it as built-but-unverified.
- **Known limitations:** Component test coverage is thin (only `Alert`, `Modal`, `cx`). No formal accessibility audit has been done (the `Modal` focus trap is the main a11y work so far).

## Account Management (Phase 2)
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Backend: `server/src/models/Account.ts`, `server/src/utils/validators.ts` (`createAccountSchema`, `updateAccountSchema`), `server/src/controllers/accounts.controller.ts` (`list`/`create`/`getOne`/`update`/`remove`, ownership-filtered on every query), `server/src/routes/accounts.routes.ts` (mounted at `/api/accounts` in `server/src/app.ts`, gated by `requireAuth` on every route — the first real exercise of this pattern).
  - Client: `client/src/types/account.ts`, `client/src/services/accountService.ts`, `client/src/pages/Accounts.tsx` (+ `.module.css`) — full list/create/edit/delete UI at the protected `/accounts` route, reachable from the nav in the new `AppShell` layout.
  - Three new reusable UI primitives added to `client/src/components/ui/` to support this (and future) CRUD screens: `Modal` (portal-based dialog, Escape/backdrop-close, focus-on-open), `Table` (styled wrapper around a native `<table>`), `Select` (labeled dropdown matching `TextField`'s visual language). Plus a new `client/src/components/layout/AppShell.tsx` (header + section nav + content wrapper) that `AppHome.tsx` was refactored to use as well, so every authenticated page shares one shell instead of duplicating the header.
- **API/database dependencies:** `GET/POST /api/accounts`, `GET/PUT/DELETE /api/accounts/:id` — all backed by the real `accounts` collection via Mongoose, scoped to `req.auth.sub` on every query.
- **Testing status:** 21 Vitest tests passing in `server/src/routes/accounts.routes.test.ts` (create with userId never leaked; list scoped to the caller; get/update/delete: owner success, cross-user 404, invalid-ObjectId 404, invalid-payload 400, unauthenticated 401; a dedicated regression test for the bug below). Client: `tsc -b`/lint clean, `vite build` succeeds; no automated frontend component tests and no manual browser click-through this session (same gap as the rest of the frontend — see `TESTING.md`).
- **Bug caught and fixed during this phase, before it shipped:** the first draft of `updateAccountSchema` was `createAccountSchema.partial()`. Zod re-applies a field's `.default(...)` whenever that field is absent from the input, even under `.partial()` — verified empirically with a throwaway `node -e` script against the actual installed Zod version, both before and after the fix. This meant a `PUT` that only renamed an account (omitting `balance`/`status`) would have silently reset `balance` to `0` and `status` to `'active'`. Fixed by defining `updateAccountSchema` independently with plain `.optional()` fields and no defaults; covered by a dedicated regression test. See `DECISIONS.md`.
- **Behaviour added by the 2026-11-20 hardening pass:** `balance` can only be set when creating an account (opening balance); `PUT /api/accounts/:id` uses a strict schema and rejects `balance` with 400, so balances move only through transactions. `DELETE` returns 409 if any transaction references the account (as source or destination) — set `status` to `closed` instead. `frozen`/`closed` accounts reject new transactions with 409. `currency` must match `^[A-Z]{3}$` (shape only, not a real ISO-4217 list).
- **Known limitations:** No pagination/filtering on `GET /api/accounts`. No soft-delete/undo.

## Transaction Management (Phase 3)
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Backend: `server/src/models/Transaction.ts`, `server/src/utils/balance.ts` (pure `balanceDelta(type, amount)`, unit-tested), `server/src/utils/validators.ts` (`createTransactionSchema`, `updateTransactionSchema`), `server/src/controllers/transactions.controller.ts`, `server/src/routes/transactions.routes.ts` (mounted at `/api/transactions`, `requireAuth` on every route).
  - Client: `client/src/types/transaction.ts`, `client/src/services/transactionService.ts`, `client/src/pages/Transactions.tsx` (+ `.module.css`) — full list/create/edit/delete UI at the protected `/transactions` route, with account and type filters (client-side), and three distinct empty states (no accounts at all / no transactions yet / current filters match nothing). Reachable from a new `AppShell` nav item; `AppHome.tsx`'s "Transactions" roadmap entry now links there.
- **API/database dependencies:** `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id` — backed by the real `transactions` collection, and by `AccountModel` writes for balance updates.
- **Testing status:** 22 new Vitest tests (`server/src/utils/balance.test.ts` + `server/src/routes/transactions.routes.test.ts`), all passing — total backend suite now 43/43. Coverage includes: income increases balance, expense/transfer/investment all decrease it, updating only the amount adjusts the balance by the correct net delta, updating the type (e.g. income→expense) adjusts by the *net* change between old and new deltas (not just the new one), moving a transaction to a different owned account correctly reverses the old account and applies the new one, attempting to move a transaction to an account the user doesn't own is rejected with **both accounts' balances verified unchanged**, deleting a transaction reverses its balance effect, and ownership/authentication checks on every route. Client: `tsc -b`/lint clean, `vite build` succeeds; no automated frontend component tests and no manual browser click-through this session (same gap as the rest of the frontend).
- **Later additions (2026-11-20):**
  - **Transfers:** a `transfer` may carry an optional `toAccountId`. With it, the source is debited and the destination credited (two legs); `toAccountId` is only valid for `type: transfer` and must differ from `accountId`. Without it, a transfer still just debits the source (money leaves tracking). `investment` transactions debit the source.
  - **Account status:** new transactions (and moves of a transaction to a newly referenced account) require every referenced account to be `active`; otherwise 409. Editing an existing transaction on a since-frozen account is still allowed.
  - **Pagination:** `GET /api/transactions` accepts `page` (default 1) and `limit` (default 200, max 500) and returns `pagination: { page, limit, total }`. The UI still loads the first page only (no pager).
  - **Rounding:** balance writes use an aggregation-pipeline update with `$round` to 2 decimals so repeated float additions never drift.
  - **Validation:** amount > 0, <= 1e12, at most 2 decimals; category <= 100, notes <= 1000, paymentMethod <= 50 chars.
- **Known limitations / accepted trade-offs:** Balance updates are per-document pipeline updates plus a compensating reverse update if the transaction write fails, not a multi-document MongoDB transaction (needs a replica set) — a process crash between the two steps can leave a balance off. See `DECISIONS.md`/`TECHNICAL_DEBT.md`. No server-side duplicate-transaction prevention (deliberate; identical transactions are valid).

## Budget Management (Phase 5)
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Backend: `server/src/models/Budget.ts`, `server/src/utils/budgetUsage.ts` (pure `sumExpensesForCategory`/`computeBudgetUsage`/`monthDateRange`, unit-tested), `server/src/utils/validators.ts` (`createBudgetSchema`, `updateBudgetSchema`), `server/src/controllers/budgets.controller.ts`, `server/src/routes/budgets.routes.ts` (mounted at `/api/budgets`).
  - Client: `client/src/types/budget.ts`, `client/src/services/budgetService.ts`, `client/src/pages/Budgets.tsx` (+ `.module.css`) — month/year picker, a `Card` grid (one per budget) with a `ProgressBar` for usage, create/edit/delete. Reachable from a new `AppShell` nav item; `AppHome.tsx`'s "Budgets" roadmap entry now links there.
- **API/database dependencies:** `GET/POST /api/budgets`, `GET/PUT/DELETE /api/budgets/:id` — backed by the real `budgets` collection; usage is computed live from the real `transactions` collection on every read, never stored.
- **Testing status:** 17 new Vitest tests (`budgetUsage.test.ts` + `budgets.routes.test.ts`) — total backend suite now 60/60. Coverage includes: usage correctly sums only same-month, same-category (case-insensitive) expense transactions and ignores income/other-month/other-user transactions, `isOverBudget`/`remaining` correctness when spending exceeds the limit, duplicate category+month+year rejected (case-insensitive) on both create and update, ownership 404s, invalid-payload 400s. Client: `tsc -b`/lint clean, `vite build` succeeds; no automated frontend component tests and no manual browser click-through this session.
- **Known limitations:** No overspend *alert/notification* yet (Phase 8 — the budget data and the `isOverBudget` flag exist and are correct, but nothing proactively surfaces it as an alert outside of viewing the `/budgets` page itself). Usage for a whole list is computed with a single aggregation over the user's expense transactions (grouped by UTC year/month/lower-cased category), not one query per budget. Month boundaries are UTC (not timezone-aware — see `TECHNICAL_DEBT.md`).

## Investment Tracker (Phase 6)
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Backend: `server/src/models/Investment.ts`, `server/src/utils/investmentReturns.ts` (pure `profitLoss`/`profitLossPercent`/`holdingValue`/`computePortfolioAllocation`, unit-tested), `server/src/utils/validators.ts` (`createInvestmentSchema`, `updateInvestmentSchema`), `server/src/controllers/investments.controller.ts`, `server/src/routes/investments.routes.ts` (mounted at `/api/investments`).
  - Client: `client/src/types/investment.ts`, `client/src/services/investmentService.ts`, `client/src/pages/Investments.tsx` (+ `.module.css`) — a portfolio summary (total value, total signed profit/loss), a `Card` grid (one per holding) each with a `ProgressBar` for `percentOfPortfolio`, create/edit/delete. Reachable from a new `AppShell` nav item; `AppHome.tsx`'s "Investments" roadmap entry now links there.
- **API/database dependencies:** `GET/POST /api/investments`, `GET/PUT/DELETE /api/investments/:id` — backed by the real `investments` collection. `purchasePrice`/`currentValue` are both per-unit (resolving `DATABASE.md`'s previously-open question); `GET /api/investments`'s list response additionally computes each holding's `percentOfPortfolio` across the full returned set.
- **Testing status:** 18 new Vitest tests (`investmentReturns.test.ts` + `investments.routes.test.ts`) — total backend suite now 78/78. Coverage includes profit/loss and percentage-return math for gains/losses/break-even, portfolio-allocation percentages summing correctly across multiple holdings (and handling a $0-total portfolio without dividing by zero), ownership 404s, invalid-payload 400s. Client: `tsc -b`/lint clean, `vite build` succeeds; no automated frontend component tests and no manual browser click-through this session.
- **Known limitations:** No historical price tracking (only the current per-unit value the user last entered) — profit/loss reflects a single point-in-time snapshot, not a trend over time (a trend view is Phase 7's, Charts & Reports', concern once built). No live market-price integration — all values are user-entered, consistent with this project's "no real bank/market integration" constraint (`PROJECT_CONTEXT.md`).

## Financial Dashboard (Phase 4)
- **Implementation status:** DONE (API + UI), verified 2026-11-20
- **Where it exists:** `server/src/controllers/dashboard.controller.ts`, `server/src/routes/dashboard.routes.ts` (`GET /api/dashboard/summary`, `requireAuth`); client `services/dashboardService.ts`, `types/dashboard.ts`, and the "Your snapshot" card in `client/src/pages/AppHome.tsx` (`/app`).
- **Behaviour:** one read-only snapshot — balances grouped by currency (never summed across currencies; closed accounts excluded), this calendar month's income / expense / net (UTC month), and investments (holdings, invested, current value). There is no separate `/dashboard` page and no savings rate / net worth / budget-usage widget yet; those belong with Phase 7.
- **Testing status:** `dashboard.routes.test.ts` (server suite, 99 tests total).

## Security & reliability hardening (2026-11-20)
- **Where:** `server/src/app.ts`, `server/src/server.ts`, `server/src/middleware/errorHandler.ts`, `server/src/utils/validators.ts`, `docker-compose.yml`.
- helmet headers; 100 kb JSON body limit; login/register rate limit (20 / 15 min / IP, 429); generic `500 Internal server error` (details logged server-side only); malformed JSON / oversize bodies return 400 / 413 without internals; `JWT_SECRET` must be >= 32 chars or the server refuses to start; graceful shutdown on SIGINT/SIGTERM; input length and money bounds; MongoDB published on `127.0.0.1` only.
- **Testing status:** `qa-hardening.routes.test.ts` and `errorHandler.test.ts`; see `QA-REPORT.md` for the QA pass and its findings.

## Tests and CI
- Server: 99 Vitest + Supertest tests (needs MongoDB). Client: 6 Vitest + Testing Library tests. GitHub Actions (`.github/workflows/ci.yml`) runs server type-check/lint/tests (with a `mongo:7` service) and client lint/tests/build on every push and PR. See `TESTING.md`.

## Containerisation
- `server/Dockerfile`, `client/Dockerfile` (+ `client/nginx.conf`), compose `app` profile. **Not verified on a machine with a working Docker engine** — see `DEPLOYMENT.md`.

## Everything else
Not implemented: Charts & Reports (Phase 7), Notifications (Phase 8), OpenAPI spec, seed data, refresh tokens / httpOnly cookies, password reset, advisor/admin functionality. The "Reports" and "Notifications" roadmap rows on `AppHome` and `Landing` are informational only. See `FEATURES.md` and `PROJECT_PLAN.md`.
