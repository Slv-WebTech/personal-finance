# Testing

**Status: backend test infrastructure exists and is in real use (Vitest + Supertest, since Phase 1).** Frontend test infrastructure is not set up yet.

## Strategy
- **Backend unit tests:** Vitest, targeting `server/src/utils` (financial calculations — savings rate, budget usage, net worth, profit/loss — plus password hashing and JWT sign/verify, already covered) and controller logic. These are the highest-value tests in the project: incorrect financial math is the most damaging class of bug here.
- **Backend integration tests:** Vitest + Supertest against the Express app (`createApp()` from `server/src/app.ts`, exported separately from `server.ts` specifically so tests can import it without triggering `listen()`), run against a dedicated `personal-finance-test` MongoDB database (same local Docker instance, different DB name — never the dev database) — covering auth flows (done) and, going forward, each resource's CRUD + ownership enforcement (a user cannot read/modify another user's data).
- **Frontend component tests:** Vitest + React Testing Library for components with real logic (forms, chart data transforms). Not required for pure presentational components with no logic. Not set up yet.
- **End-to-end tests:** Playwright or Cypress (not yet chosen) for critical user flows only — see below. Introduce this once the core flows exist, not before.

**Decision note:** the original plan (see `DECISIONS.md`) was Jest for the backend; switched to Vitest during Phase 1 because Jest's ESM support is genuinely fiddly against the server's native-ESM + NodeNext setup (a Phase 0 decision), while Vitest handles it with zero config. Same testing philosophy, less friction.

## Test commands
- Backend: `cd server && npm test` (Vitest, single run) — currently 10 tests across 3 files (`utils/password.test.ts`, `utils/jwt.test.ts`, `routes/auth.routes.test.ts`), all passing. Requires the local MongoDB container running (`docker compose up -d` at the repo root).
- Frontend: not available yet — no test runner configured in `client/`.

## Coverage expectations
No blanket coverage percentage target. Prioritize:
1. Financial calculation utilities — should be close to fully covered given how easy they are to unit test and how costly a bug would be.
2. Auth (register/login/JWT verification/role checks).
3. Transaction create/edit/delete → account balance correctness (see `TECHNICAL_DEBT.md` risk note).
4. Budget usage / overspend alert logic.

UI snapshot/visual coverage is not a priority — it's expensive to maintain and low-value for a dashboard that will change visually as it's built.

## Critical flows (candidates for E2E coverage once implemented)
- Register → login → land on dashboard.
- Add an account → add a transaction against it → balance reflects correctly.
- Create a budget → add expenses in that category → budget usage updates → overspend alert fires when the limit is crossed.

## Known untested areas
- Phase 0 code (health route, DB connection helper, error handler) — still only manually verified (`tsc`, `eslint`, manual `curl`), no automated tests. Low priority to add given how trivial this code is.
- Everything from Phase 2 onward (accounts, transactions, budgets, investments, dashboard, notifications) — not built yet, so not testable yet.
- Frontend has zero automated tests — no test runner configured in `client/` yet.
