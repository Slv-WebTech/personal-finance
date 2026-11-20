# Feature Inventory

Status legend: `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTING` · `PARTIALLY_IMPLEMENTED` · `BLOCKED` · `DEPRECATED`

Authentication, Account Management, Transaction Management, Budget Management, Investment Tracker, and the Financial Dashboard (summary API + home-page snapshot) are `IMPLEMENTED`; **Charts & Reports** and **Notifications** remain `PLANNED`. See `IMPLEMENTED_FEATURES.md` for the factual record of what's verified working and `QA-REPORT.md` for the QA pass.

A shared design system and component library (`client/src/styles/`, `client/src/components/ui/`) backs every screen.

## Authentication
- **Purpose:** Secure registration/login; role-based access (Customer, Financial Advisor, Administrator).
- **User value:** Protects financial data; enables role-appropriate views.
- **Dependencies:** None (foundational).
- **Status:** IMPLEMENTED — API and JWT/RBAC infrastructure, plus client-side login/register/session UI, wired end-to-end: register, log in, stay logged in across a reload (session restored via `GET /api/auth/me`), reach the auth-gated `/app` home. Login/register are rate limited (20 / 15 min / IP). Role is limited to `customer` at signup (see `DECISIONS.md`) — advisor/admin provisioning is unbuilt. No password reset, refresh tokens or revocation.
- **Related pages:** `/login`, `/register`, `/app` (auth-gated landing page)
- **Related APIs:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (all implemented)

## Account Management
- **Purpose:** CRUD for bank accounts (name, type, balance, currency, status).
- **User value:** Central place to see every account instead of separate bank logins.
- **Dependencies:** Authentication
- **Status:** IMPLEMENTED — full CRUD, scoped to the logged-in user, with a real UI (list/create/edit/delete, all with loading/empty/error states). Balance is set only at creation (opening balance) and then moves only via transactions; accounts with transactions can't be deleted (close them instead); frozen/closed accounts reject new transactions.
- **Related pages:** `/accounts`
- **Related APIs:** `GET/POST /api/accounts`, `GET/PUT/DELETE /api/accounts/:id` (all implemented)

## Transaction Management
- **Purpose:** Record and manage income, expense, transfer, and investment transactions.
- **User value:** Ground-truth data every other feature (dashboard, budgets, reports) is computed from.
- **Dependencies:** Account Management
- **Status:** IMPLEMENTED — full CRUD, scoped to the logged-in user, with correct account-balance updates on create/edit/delete (including moving a transaction between accounts) verified by tests asserting the actual resulting balance, not just HTTP status. Transfers may name a destination account (`toAccountId`, two-leg). The list endpoint is paginated (`page`, `limit`); the UI loads the first page only and filters client-side.
- **Related pages:** `/transactions`
- **Related APIs:** `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id` (all implemented)

## Budget Management
- **Purpose:** Monthly, category-scoped budgets with usage tracking and overspend alerts.
- **User value:** Turns raw transaction data into an actionable spending limit.
- **Dependencies:** Transaction Management
- **Status:** IMPLEMENTED (without notifications) — create/edit/delete monthly category budgets, with usage (spent/remaining/% used/over-budget) always computed live from real transactions via one aggregation, never stored. A month/year picker on `/budgets` lets a user view any period. Overspend *alerts* belong to Phase 8 and are not built; months are UTC-bucketed.
- **Related pages:** `/budgets`
- **Related APIs:** `GET/POST /api/budgets`, `GET/PUT/DELETE /api/budgets/:id` (all implemented)

## Financial Dashboard
- **Purpose:** Aggregate view — total balance, monthly income/expenses, savings rate, budget usage, net worth.
- **User value:** The single-glance "how am I doing financially" view — the core product promise.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** IMPLEMENTED (summary level) — `GET /api/dashboard/summary` returns per-currency balances, this month's income/expense/net, and investment totals; surfaced as the "Your snapshot" card on `/app`. Not built: a separate `/dashboard` page, savings rate, net worth, budget-usage roll-up, charts (Phase 7).
- **Related pages:** `/app` (snapshot card)
- **Related APIs:** `GET /api/dashboard/summary` (implemented)

## Investment Tracker
- **Purpose:** Track stocks, mutual funds, fixed deposits, crypto, and gold holdings; profit/loss; portfolio allocation.
- **User value:** Extends the picture beyond cash accounts to full net worth.
- **Dependencies:** Account Management
- **Status:** IMPLEMENTED — create/edit/delete holdings; profit/loss, profit/loss %, and portfolio allocation % all computed live, never stored; a portfolio summary and per-holding allocation bar on `/investments`.
- **Related pages:** `/investments`
- **Related APIs:** `GET/POST /api/investments`, `GET/PUT/DELETE /api/investments/:id` (all implemented)

## Charts & Reports
- **Purpose:** Income vs. expense, spending trends, budget usage, category breakdown, savings trend, investment growth; PDF/Excel export.
- **User value:** Makes financial data legible at a glance and portable (export) for the user's own records.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** PLANNED
- **Related pages:** `/reports`, chart components embedded in `/dashboard`

## Notifications
- **Purpose:** Alerts for budget overspend, bills due, salary received, investment maturity, unusual spending.
- **User value:** Keeps the user informed without requiring them to check the dashboard proactively.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** PLANNED
- **Related pages:** `/notifications`
- **Related APIs:** `/api/notifications`

## Cross-cutting
- **Security hardening** (helmet, rate limit, input bounds, generic errors, startup secret check) — IMPLEMENTED 2026-11-20, see `IMPLEMENTED_FEATURES.md`.
- **CI** (GitHub Actions) — IMPLEMENTED. **Docker full-stack profile** — written, unverified (`DEPLOYMENT.md`).
- **Dark mode** — tokens respond to `prefers-color-scheme: dark`; not systematically verified.

## Bonus features
See `FUTURE_FEATURES.md` — AI spending insights, AI financial assistant, credit score tracking, bill reminder system, multi-currency support, QR code payments, push notifications, financial forecasting, goal-based savings planner. None are in scope until Charts & Reports and Notifications are done.
