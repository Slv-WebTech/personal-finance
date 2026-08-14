# Testing

**Status: no test infrastructure exists yet.** This documents the intended strategy so testing is built in from Phase 1 onward, not retrofitted later (see the risk noted in `PROJECT_SCORE.md` and `TECHNICAL_DEBT.md`).

## Strategy
- **Backend unit tests:** Jest, targeting `server/src/utils` (financial calculations — savings rate, budget usage, net worth, profit/loss) and controller logic. These are the highest-value tests in the project: incorrect financial math is the most damaging class of bug here.
- **Backend integration tests:** Jest + Supertest against the Express app (in-memory or test-database MongoDB instance), covering auth flows and each resource's CRUD + ownership enforcement (a user cannot read/modify another user's data).
- **Frontend component tests:** Vitest + React Testing Library for components with real logic (forms, chart data transforms). Not required for pure presentational components with no logic.
- **End-to-end tests:** Playwright or Cypress (not yet chosen) for critical user flows only — see below. Introduce this once the core flows exist, not before.

## Test commands
Not available yet — no test runner is configured in either `client/` or `server/`. This section will list real, verified commands (e.g. `npm test`) once Phase 0/1 sets them up.

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
Everything — no code exists yet. This section should be rewritten to name real gaps once there is real code to have gaps in.
