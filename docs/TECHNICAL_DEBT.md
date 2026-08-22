# Technical Debt

**Current state:** three known, accepted gaps — two from Phase 1, plus one introduced during the 2026-08-22 UI/UX redesign pass (all below). Phase 0 scaffolding, git init, and local MongoDB setup introduced no shortcuts.

## Current debt

- **No rate limiting on `/api/auth/login` or `/api/auth/register`.** Both are unauthenticated-by-nature endpoints, which makes them the obvious brute-force/credential-stuffing target. Flagged as a "near-term hardening item" in `ARCHITECTURE.md` before Phase 1 was built, and deliberately deferred rather than blocking Phase 1's completion. **Resolve:** add a rate-limiting middleware (e.g. `express-rate-limit`) scoped to these two routes before this project is ever exposed outside local development.
- **No password-reset flow.** Not part of Phase 1's scope (see `PROJECT_PLAN.md` acceptance criteria) and not yet scheduled. **Resolve:** design as a real feature (token generation, expiry, email delivery or equivalent) when prioritized — don't bolt on a minimal version without thinking through token security.
- **No automated tests for the new frontend auth logic** (`AuthContext`'s session-bootstrap logic, `Login`'s and `Register`'s form validation and error-mapping, `authService`'s error-normalization logic). Happened because the 2026-08-22 UI/UX redesign pass built the client's first-ever auth UI against an already-tested backend, but no frontend test runner exists yet in `client/` — verification this session was limited to `tsc -b`, lint, and `vite build`. **Resolve:** set up Vitest + React Testing Library for the client (per the strategy already documented in `TESTING.md`) and add tests for this logic before building further frontend features on top of it.

## Pre-emptive risk areas to watch (not debt yet — things to get right the first time)
These are drawn from the product spec's own "Top Challenges" list and this project's architecture — recorded here so they aren't accidentally deferred into debt without a conscious decision:

- **Account balance integrity under transaction edit/delete.** Getting balance updates right on *create* is easy; getting them right on *edit* (amount or account changed) and *delete* is where bugs actually hide. Cover this with tests from Phase 3 onward, not after a bug is found.
- **Duplicate transaction prevention.** No idempotency/duplicate-detection strategy is decided yet. Needs a decision (e.g., client-side debounce + server-side idempotency key, or a simpler duplicate-check heuristic) before Phase 3 ships, not left as an open gap.
- **Recurring transactions.** Not modeled in `DATABASE.md` yet. If added later, decide up front whether recurrence is generated eagerly (a document per occurrence) or computed on read — retrofitting this choice is expensive.
- **MongoDB referential integrity.** No foreign-key enforcement exists at the database layer (see `ARCHITECTURE.md`); every controller that touches a relation (e.g., transaction → account) must explicitly verify ownership. A missed check here is both a correctness and a security bug (cross-user data access).
- **Financial calculation correctness.** Savings rate, budget usage, net worth, profit/loss must be pure, tested functions (per `PROJECT_STYLE.md`) from the start — retrofitting tests onto untested financial math later is higher-risk than building it in.

## Process
When real debt is introduced (a deliberate shortcut, a TODO, an outdated dependency, a missing test), add it here with: what it is, why it happened, and what it would take to resolve. Don't let this file go stale — review it whenever `PROJECT_SCORE.md` is re-scored.
