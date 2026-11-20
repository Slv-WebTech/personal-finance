# Testing

**Status: server Vitest + Supertest suite (99 tests) and client Vitest + Testing Library suite (6 tests) both exist and run in GitHub Actions CI.** A manual QA / security pass is recorded in `QA-REPORT.md`. There is no automated end-to-end (browser) suite.

## Strategy
- **Backend unit tests:** Vitest, for pure logic in `server/src/utils` — balance math (`balance.test.ts`), budget usage (`budgetUsage.test.ts`), investment returns (`investmentReturns.test.ts`), password hashing and JWT (`password.test.ts`, `jwt.test.ts`). Incorrect financial math is the most damaging class of bug here, so these are the highest-value tests.
- **Backend integration tests:** Vitest + Supertest against `createApp()` (`server/src/app.ts`, exported separately from `server.ts` so tests never call `listen()`), run against a dedicated `personal-finance-test` MongoDB database — never the dev database. Each resource has a `*.routes.test.ts` (auth, accounts, transactions, budgets, investments, dashboard) covering CRUD, validation, auth (401) and ownership (cross-user 404). `qa-hardening.routes.test.ts` and `middleware/errorHandler.test.ts` cover the 2026-11-20 hardening (input bounds, rounding, frozen/closed accounts, account-delete refusal, pagination, generic errors).
- **Frontend component tests:** Vitest + React Testing Library + jsdom (`cd client && npm test`). Currently `Alert.test.tsx`, `Modal.test.tsx` (focus trap and focus restore) and `utils/cx.test.ts`.
- **End-to-end tests:** none automated. The critical flows were walked through manually in Chrome during the QA pass (`QA-REPORT.md`). Playwright or Cypress remains a future option.

**Decision note:** the original plan (see `DECISIONS.md`) was Jest for the backend; switched to Vitest during Phase 1 because Jest's ESM support is fiddly against the server's native-ESM + NodeNext setup.

## Test commands
- Server: `cd server && npm test` — 99 tests. **Requires a running MongoDB.** Default URI is `mongodb://localhost:27017/personal-finance-test`; set `TEST_MONGODB_URI` to point elsewhere (see `server/vitest.setup.ts`). `docker compose up -d` at the repo root starts a suitable MongoDB.
- Client: `cd client && npm test` — 6 tests, no database needed.
- Also run before committing: `cd server && npx tsc --noEmit && npm run lint`; `cd client && npm run lint && npm run build`.
- Test files run sequentially (`fileParallelism: false` in `server/vitest.config.ts`) because they share one physical test database and reuse fixture emails. The login/register rate limiter is disabled under test (`NODE_ENV=test`).

## CI
`.github/workflows/ci.yml` runs on every push and pull request (Node 22):
- **server job:** `mongo:7` service container, `JWT_SECRET` set to a CI-only value, then `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`.
- **client job:** `npm ci`, `npm run lint`, `npm test`, `npm run build`.

## Coverage expectations
No blanket coverage percentage target. Priorities: (1) financial calculation utilities, (2) auth and ownership enforcement, (3) transaction create/edit/delete → balance correctness, (4) budget usage logic. UI snapshot/visual coverage is not a priority.

## Critical flows
- Register → login → land on `/app` with the snapshot card. (manually verified, `QA-REPORT.md`)
- Add an account → add a transaction → balance reflects it; transfer between two accounts → both balances move; delete → balances revert. (server integration tests + manual)
- Create a budget → add expenses in that category → usage and over-budget flag update. (server integration tests + manual)

## Known gaps
- No component tests for pages (`Login`, `Register`, `Accounts`, `Transactions`, `Budgets`, `Investments`, `AppHome`), `AuthContext`, or the service layer.
- No browser E2E automation; no automated accessibility or contrast check (QA report notes contrast was not measured).
- No load/performance test in CI (one-off measurements are in `QA-REPORT.md`).
- Docker images have never been built in CI (see `DEPLOYMENT.md`).
- Health route and DB connection helper have no dedicated tests.
