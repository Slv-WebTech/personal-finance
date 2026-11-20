# Changelog

Human-readable development history. Concise entries — date, what changed, why it matters.

## 2026-08-14 — Documentation baseline established
- Inspected the working directory (`D:\personal-finance`): confirmed it was completely empty — no git repository, no source files, no existing project to audit.
- Confirmed two foundational stack decisions with the user: **MongoDB** (over PostgreSQL) and **TypeScript** for both client and server (over plain JavaScript).
- Made two implementation-level calls without needing user input (logged in `DECISIONS.md`): **Vite** over Create React App, **Recharts** as the primary charting library over Chart.js.
- Created the full `/docs` structure: `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_PLAN.md`, `PROJECT_STYLE.md`, `PROJECT_SCORE.md`, `DEV_CONTEXT.md`, `SITE_MAP.md`, `ARCHITECTURE.md`, `FEATURES.md`, `IMPLEMENTED_FEATURES.md`, `FUTURE_FEATURES.md`, `TECHNICAL_DEBT.md`, `DECISIONS.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`, `INTERVIEW_GUIDE.md`.
- No application code written yet at this point. Project health scored 1/10 in `PROJECT_SCORE.md` — honestly reflecting a pre-implementation state, not a quality judgment on the plan itself.

## 2026-08-14 — Phase 0: project scaffolding
- Scaffolded `client/`: Vite + React + TypeScript (via `npm create vite@latest`), added `react-router-dom` and `axios`, built out the `components/pages/dashboard/charts/services/hooks/context/types` folder structure from `ARCHITECTURE.md`, added a minimal `Landing` page and an axios instance with a JWT-attach interceptor (`client/src/services/api.ts`, unused by any real request yet).
- Scaffolded `server/`: Express 5 + TypeScript, native ESM + `NodeNext` module resolution, `tsx` for dev, ESLint flat config + Prettier, layered `routes/controllers/models/middleware/utils` folders, a non-blocking Mongoose connection helper (`server/src/config/db.ts`), a centralized error-handling middleware, and a first real endpoint: `GET /api/health`.
- Two implementation decisions made during scaffolding and logged in `DECISIONS.md`: server module system (ESM/NodeNext/tsx over CommonJS/ts-node), and staying on Express 5 rather than pinning to 4.
- Verified (not just written): both `tsc` checks pass clean, server `eslint .` passes clean, both `npm run dev` processes start successfully, `GET /api/health` responds correctly with no `MONGODB_URI` configured. Real MongoDB connectivity is still unverified — no connection string has been provisioned yet.
- Updated `PROJECT_PLAN.md` (Phase 0 → DONE), `IMPLEMENTED_FEATURES.md` (first real entry), `PROJECT_SCORE.md` (1/10 → 2/10), `DEV_CONTEXT.md`.

## 2026-08-14 — Git init + local MongoDB via Docker
- Set up local MongoDB: `docker-compose.yml` at the repo root (`mongo:7`, named volume for persistence, port 27017), started via `docker compose up -d`. Chose Docker over MongoDB Atlas for local dev per user's choice — no account/browser sign-up needed, matches `DEV_CONTEXT.md`'s "local MongoDB is fine for dev" note.
- Created the real `server/.env` (gitignored) with a generated dev `JWT_SECRET` and `MONGODB_URI` pointing at the local container. Verified end-to-end: server started, `GET /api/health` returned `database: "connected"` (previously only the `disconnected` path had been tested).
- Added root `README.md` (quick-start instructions) and root `.gitignore`.
- Ran `git init` and made the initial commit (56 files: full `/docs` set, Phase 0 client/server scaffolding, `docker-compose.yml`, root README/.gitignore). Confirmed `server/.env` was correctly excluded from the commit. No remote configured.
- Updated `DEV_CONTEXT.md` and `DEPLOYMENT.md` (added a "Local development" section documenting the Docker MongoDB setup).
- Next: Phase 1 — Authentication (register/login/JWT/bcrypt/roles).

## 2026-08-17 — Documentation sync pass
- User asked to update all documentation with current status before further coding. Re-read every file in `/docs` and fixed 16 stale claims left over from before the git/MongoDB session (e.g. `PROJECT_CONTEXT.md`/`docs/README.md` still said "pre-implementation," `ARCHITECTURE.md`/`DATABASE.md`/`SITE_MAP.md` said nothing was built when Phase 0 code existed, `API_DOCUMENTATION.md` didn't list the real `/api/health` endpoint at all).
- No code changed in this pass — documentation only.

## 2026-08-17 — Phase 1: Authentication
- Implemented: `server/src/models/User.ts` (Mongoose schema), `utils/password.ts` (bcrypt hash/compare), `utils/jwt.ts` (sign/verify, 7-day expiry), `utils/validators.ts` (zod schemas for register/login), `middleware/validate.ts` (generic zod-validation middleware), `middleware/auth.ts` (`requireAuth` + `requireRole`), `controllers/auth.controller.ts`, `routes/auth.routes.ts`. Wired into the app via a new `server/src/app.ts` (Express app factory split out of `server.ts` specifically so tests can import it without starting a real server/DB connection).
- Security decision made and enforced in code (not just documented): `POST /api/auth/register` never accepts a client-supplied `role` — every account is created as `customer`. Zod strips the field and the controller hardcodes it independently. Advisor/admin account creation remains unbuilt and is an open product question, not an oversight.
- Two implementation decisions logged in `DECISIONS.md`: switched the backend test runner from the originally-planned Jest to **Vitest** (avoids Jest's ESM friction against the server's NodeNext setup), and set a **7-day JWT expiry** (no refresh tokens yet).
- Testing: added real automated tests for the first time — 10 Vitest tests across 3 files (password hashing, JWT round-trip, and a Supertest integration suite covering register/login/`/me` against a dedicated `personal-finance-test` MongoDB database, never the dev database). All passing. `bcrypt` (native) installed cleanly on this Windows machine with no build-tool issues.
- Verified beyond the test suite: `tsc`/`eslint` clean, and a manual curl smoke test of the full register → login → `/me` flow (plus invalid-token and missing-token cases) against the real dev database — test user deleted afterward.
- Updated `PROJECT_PLAN.md` (Phase 1 → DONE), `IMPLEMENTED_FEATURES.md`, `FEATURES.md` (Authentication → IMPLEMENTED, backend-only), `API_DOCUMENTATION.md` (`/api/auth/*` → IMPLEMENTED with real response shapes), `DATABASE.md` (`users` → IMPLEMENTED), `ARCHITECTURE.md`, `TESTING.md` (Jest → Vitest, real test commands), `TECHNICAL_DEBT.md` (two accepted gaps: no rate limiting on auth routes, no password-reset flow), `PROJECT_SCORE.md` (2/10 → 3/10), `DECISIONS.md`.
- Committed both this pass and the doc-sync pass in one commit, then pushed to a new **private** GitHub repo, `Slv-WebTech/personal-finance`, over the `github-personal` SSH host alias (the machine's default `github.com` SSH host is mapped to a different, work, key).
- Caught (via GitHub's contributor view) that both commits had been authored under the machine's global git identity — a work name/email, wrong for a personal-account repo. Fixed by setting a repo-local git identity (`Slv-WebTech <70682890+Slv-WebTech@users.noreply.github.com>`) and rewriting both commits with `git commit-tree` (trees/dates/messages preserved exactly, verified via empty diff) followed by `git push --force-with-lease` — safe since the repo was brand new with no other collaborators. Logged as a decision in `DECISIONS.md` and as project memory so it doesn't recur.
- Next: Phase 2 — Account Management.

## 2026-08-22 — Premium UI/UX redesign pass (Landing + first-ever auth UI)
- Scope confirmed with the user via a multiple-choice question before any code was written: the repo only had a placeholder Landing page and a backend-only auth API, so full mockups for the still-unbuilt Phase 2-8 features (Accounts/Transactions/Budgets/Investments/Reports/Notifications/the real dashboard) would have meant non-functional fake screens, forbidden by this project's docs-first/no-fake-UI protocol. Confirmed scope: a real design system + redesigned Landing + the first client-side Login/Register UI wired to the existing, already-tested auth backend.
- Built a design-token foundation: `client/src/styles/tokens.css` (neutral ink/canvas palette plus one cobalt-blue brand accent, `#3457D5`/`#6E8BFF` dark, replacing the default Vite-template purple `#aa3bff`; independent success/danger/warning colors; 4px-based spacing scale; radius scale; a restrained shadow scale with borders as the default surface separator; typography scale; motion tokens; a shared focus-ring token) and `client/src/styles/global.css` (resets, base styles, focus-visible, reduced-motion), replacing the untouched Vite starter styles in `index.css`.
- Chose CSS Modules over Tailwind/CSS-in-JS/a UI kit — co-located `*.module.css` per component plus a small `client/src/utils/cx.ts` class-merging helper.
- Built the first reusable UI library, `client/src/components/ui/`: `Button`, `TextField` (label + error/hint text + password show/hide toggle), `Card`, `Alert` (error/success/warning/info banners with correct ARIA roles), `Spinner`, `Badge`, and `Logo` (new ascending-bars brand mark, replacing the default Vite logo and doubling as the new favicon).
- Deleted Vite-template leftovers after confirming zero references anywhere in the codebase: `client/src/App.css`, `client/src/assets/react.svg`, `client/src/assets/vite.svg`, `client/src/assets/hero.png`, `client/public/icons.svg`.
- Built the first client-side wiring for the Phase 1 auth backend: `client/src/types/auth.ts`, `client/src/services/authService.ts` (normalizes every API failure into a typed `ApiError`), `client/src/context/AuthContext.tsx` + `client/src/hooks/useAuth.ts` (session bootstrap via `GET /api/auth/me` against a `localStorage` token on load), `client/src/components/ProtectedRoute.tsx` (the app's first auth-gated route).
- Rebuilt `client/src/pages/Landing.tsx` (previously a 2-line placeholder) into a real marketing page honest about current scope (no bank-account connection, no fake stats/testimonials). Added `Login.tsx`/`Register.tsx` (via a new shared `AuthLayout` split-panel component), `AppHome.tsx` (an honest post-login placeholder — explicitly not the real Phase 4 dashboard, just a welcome message and a "Planned" roadmap list), and `NotFound.tsx`. Rewrote `App.tsx`'s routing to wire `AuthProvider` and `ProtectedRoute` around the new `/app` route.
- Verified: `tsc -b` clean, `npm run lint` clean (one expected warning on `AuthContext.tsx` for exporting both a context and a component from one file — the standard pattern), `npm run build` succeeds. Not manually verified in a running browser this session (skipped at the user's explicit request).
- Work split across four parallel subagents (UI primitives / auth plumbing / Landing / auth pages), each given fixed prop contracts up front so they could build concurrently, then integrated (routing, cleanup, verification) afterward.
- Explicitly not built: any UI for Accounts/Transactions/Budgets/Investments/Reports/Notifications, or the real aggregate dashboard — all still blocked on their own backend phases (2-8, still `PLANNED`).
- Next: Phase 2 — Account Management.

## 2026-08-22 — Phase 2: Account Management
- Backend and frontend built in parallel against a fixed contract (mirroring the earlier UI-pass approach), then integrated: `server/src/models/Account.ts`, `createAccountSchema`/`updateAccountSchema` in `validators.ts`, `accounts.controller.ts` (`list`/`create`/`getOne`/`update`/`remove`), `accounts.routes.ts` (mounted at `/api/accounts`, `requireAuth` on every route — first real use of the ownership-filtering pattern: every query scoped to `{ _id, userId }` together, cross-user access returns 404 not 403, deliberately never distinguishing "doesn't exist" from "isn't yours"). 21 Vitest tests passing (up from 10).
- Frontend: `client/src/pages/Accounts.tsx` — full list/create/edit/delete UI at a new protected `/accounts` route, with loading/empty/error states, reachable from a new nav. Added three reusable primitives to `components/ui/`: `Modal` (portal dialog, Escape/backdrop-close), `Table`, `Select`. Added `components/layout/AppShell.tsx` (header + nav + content) and refactored `AppHome.tsx` to use it instead of rendering the header directly.
- Extracted `ApiError`/`ApiFieldError` and the axios-error-normalizing `toApiError` helper out of the auth-specific files into `client/src/types/api.ts` + `client/src/services/httpError.ts`, so future resource services (transactions, budgets, investments, ...) can reuse them instead of each redefining the same logic. `types/auth.ts` now re-exports `ApiError` for backward compatibility with existing imports.
- **Caught and fixed a real bug before shipping it:** the first draft of `updateAccountSchema` was `createAccountSchema.partial()`. Verified empirically (`node -e` against the real installed Zod version) that Zod re-applies a field's `.default(...)` when that field is omitted, even under `.partial()` — so a PUT that only renamed an account would have silently reset its `balance` to 0 and `status` to `active`. Fixed by defining the update schema independently with plain `.optional()` fields and no defaults; added a dedicated regression test. Logged as a standing rule in `DECISIONS.md` for every future resource's update endpoint.
- Verified: server `tsc`/`eslint`/`vitest` (21/21) clean; client `tsc -b`/`lint`/`vite build` clean.
- Next: Phase 3 — Transaction Management (flagged correctness risk: account balance must update correctly on transaction create/edit/delete, not just create — see `TECHNICAL_DEBT.md`).

## 2026-08-22 — Phase 3: Transaction Management
- Backend written directly (not delegated) given the flagged balance-integrity risk: `server/src/models/Transaction.ts`, a pure unit-tested `balanceDelta(type, amount)` function (`server/src/utils/balance.ts` — income is `+amount`, expense/transfer/investment are all `-amount`), `createTransactionSchema`/`updateTransactionSchema`, `transactions.controller.ts`, `transactions.routes.ts` (mounted at `/api/transactions`).
- Balance updates use an atomic single-document `$inc` on the affected `Account`(s) with a compensating reverse `$inc` if the paired `Transaction` write fails — this project's local MongoDB is a standalone instance, not a replica set, so real multi-document transactions aren't available; logged as an explicit, accepted trade-off in `DECISIONS.md`/`TECHNICAL_DEBT.md`, with converting to a replica set flagged as the clear future improvement.
- Decided (and documented) that `transfer` and `investment` transactions both decrease the account balance, same as `expense` — the schema has only one `accountId` field (no second "destination account"), so a transfer is modeled as money leaving this app's tracked balance, not moving between two tracked accounts. See `DECISIONS.md`.
- 22 new tests covering every balance-integrity edge case by asserting the actual resulting balance, not just HTTP status: amount-only change, type change (net delta, not just the new delta), moving a transaction to a different owned account (old account reversed, new account applied), rejecting a move to an unowned account with both balances verified untouched, delete reversal, ownership/auth on every route.
- **Found and fixed a real test-infrastructure bug:** adding this third integration test file surfaced that Vitest was running test files concurrently against the one shared `personal-finance-test` database with overlapping hardcoded fixture emails — causing duplicate-key races and collections being wiped mid-test by another file's `beforeEach`. Fixed via `fileParallelism: false` in `server/vitest.config.ts`, benefiting every future test file. Total suite: 43/43 passing.
- Frontend: `client/src/pages/Transactions.tsx` — list with account/type filters, create/edit/delete against the design-system component library, reachable from a new `AppShell` nav item; `AppHome.tsx`'s "Transactions" roadmap entry now links there instead of showing "Planned."
- Consciously resolved the pre-flagged "duplicate transaction prevention" question from `TECHNICAL_DEBT.md`: the create form's submit-guard prevents accidental double-submission; deliberately no server-side idempotency key or value-matching heuristic, since two genuinely identical transactions are a normal, valid occurrence, not a bug to block.
- Next: Phase 4 — Financial Dashboard (depends on Transactions, Budgets, Investments — Budgets/Investments aren't built yet, so Phase 4 is not next; see `PROJECT_PLAN.md` for the actual dependency order — Phase 5 or 6 first).

## 2026-08-22 — Phase 5: Budget Management
- Backend: `server/src/models/Budget.ts`, pure unit-tested `utils/budgetUsage.ts`, `createBudgetSchema`/`updateBudgetSchema`, `budgets.controller.ts`, `budgets.routes.ts` (`/api/budgets`). Usage (`spent`/`limit`/`remaining`/`percentUsed`/`isOverBudget`) is computed live from transactions on every read, never stored. Duplicate category + month + year rejected case-insensitively (controller), with a unique compound index as a backstop.
- Frontend: `/budgets` — month/year picker, `Card` grid with the new `ProgressBar` primitive, create/edit/delete. 17 new tests (suite then 60).

## 2026-08-22 — Phase 6: Investment Tracker
- Backend: `Investment` model, pure unit-tested `utils/investmentReturns.ts` (profit/loss, percentage, holding value, portfolio allocation), validators, controller, `/api/investments`. `currentValue` is per-unit, matching `purchasePrice`. 18 new tests (suite then 78).
- Frontend: `/investments` — portfolio summary, per-holding allocation bar, create/edit/delete.

## 2026-11-20 — QA pass, security hardening, dashboard, tooling
Full QA findings are in `QA-REPORT.md`.

### Added
- `GET /api/dashboard/summary` (per-currency balances excluding closed accounts, this month's income/expense/net, investment totals) and a "Your snapshot" card on `/app`.
- Transfers between two tracked accounts via an optional `toAccountId` on transactions (two-leg, reversed correctly on edit/delete).
- Transaction list pagination: `page`, `limit` (default 200, max 500) and a `pagination` object in the response.
- Client test runner (Vitest + Testing Library): `Alert`, `Modal`, `cx` tests (6 tests).
- GitHub Actions CI (`.github/workflows/ci.yml`): server type-check/lint/tests with a `mongo:7` service; client lint/tests/build.
- `server/Dockerfile`, `client/Dockerfile` + `nginx.conf`, and a compose `app` profile (full stack in Docker; not yet verified on a machine with a working Docker engine).
- `qa-hardening.routes.test.ts`, `errorHandler.test.ts`, dashboard tests; server suite now 99 tests.
- Product name **Tallybird** adopted in the UI and docs (repo slug unchanged).

### Changed
- Account `balance` is settable only on create; `PUT /api/accounts/:id` rejects it (400). Balances move only through transactions.
- Deleting an account that has transactions (as source or destination) returns 409; close it instead.
- Frozen/closed accounts reject new transactions (409); edits only require newly referenced accounts to be active.
- `GET /api/budgets` computes usage for all budgets with a single aggregation (was one query per budget; ~260 ms to ~93 ms on 20k transactions).
- `AuthContext` only clears the stored token on 401/404 from `/auth/me`, so network errors, 429s and 5xx don't log the user out.
- Mobile (< 640px): tables render as stacked cards; header and nav fit.
- `docker-compose.yml`: MongoDB bound to `127.0.0.1`; `docker compose up -d` still starts only MongoDB.

### Security
- helmet headers; rate limit of 20 requests / 15 min / IP on `/api/auth/login` and `/register` (429); JSON body limit 100 kb; generic `500` responses (no internals); `JWT_SECRET` must be >= 32 characters or the server refuses to start; graceful shutdown on SIGINT/SIGTERM.
- Input bounds: max lengths, money <= 1e12 with <= 2 decimals, currency `^[A-Z]{3}$`, quantity <= 1e12, password 8-72 characters.
- Login timing equalised for unknown emails (dummy bcrypt compare).

### Fixed
- Float drift in balances: amounts limited to two decimals and balance updates use an aggregation-pipeline `$round` to cents.
- Orphaned transactions when deleting an account (now refused).
- Transactions accepted on frozen/closed accounts.
- Modal focus escaped the dialog and was not restored on close (focus trap + restore added).
- Rate limiter was counting `/auth/me`, and the client logged users out on any `/me` error.
- Budgets list N+1 query (see Changed).
