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

## In Progress
_(none — Phase 1 complete; Phase 2 not yet started)_

## Next

### Phase 2 — Account Management
- **Objective:** CRUD for bank accounts (name, type, balance, currency, status), scoped to the logged-in user.
- **Priority:** High
- **Dependencies:** Phase 1
- **Status:** PLANNED

### Phase 3 — Transaction Management
- **Objective:** CRUD for transactions (income/expense/transfer/investment), linked to an account and category; account balance updates correctly on transaction create/edit/delete.
- **Priority:** High
- **Dependencies:** Phase 2
- **Implementation considerations:** Balance recalculation must be correct under edit and delete, not just create — this is a known correctness risk (see "Prevent duplicate transactions" / balance integrity in `TECHNICAL_DEBT.md` once relevant).
- **Status:** PLANNED

### Phase 4 — Financial Dashboard
- **Objective:** Aggregate view: total balance, monthly income, monthly expenses, savings rate, budget usage, net worth.
- **Priority:** High
- **Dependencies:** Phase 3
- **Status:** PLANNED

### Phase 5 — Budget Management
- **Objective:** Create monthly category budgets, compute spend-to-date per category, overspending alerts.
- **Priority:** High
- **Dependencies:** Phase 3
- **Status:** PLANNED

### Phase 6 — Investment Tracker
- **Objective:** CRUD for investment holdings, profit/loss calculation, portfolio allocation view.
- **Priority:** Medium
- **Dependencies:** Phase 2
- **Status:** PLANNED

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
Bonus features from the product spec — see `FUTURE_FEATURES.md` for full detail and prioritization: dark mode, AI spending insights, AI financial assistant, credit score tracking, bill reminder system, multi-currency support, QR code payments, push notifications, financial forecasting, goal-based savings planner.

## Blocked
_(none currently)_

## Open product questions (not yet decided — do not implement around an assumption)
- What can a **Financial Advisor** role actually see/do? (Manage one customer? Multiple? Read-only?)
- What can an **Administrator** actually manage through the UI vs. just having elevated data access?
- Is bulk/CSV transaction import in scope for MVP or a later feature?
