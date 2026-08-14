# Technical Debt

**Current state: none.** No code exists yet, so there is no debt to track. This file starts tracking the moment Phase 0 scaffolding begins.

## Pre-emptive risk areas to watch (not debt yet — things to get right the first time)
These are drawn from the product spec's own "Top Challenges" list and this project's architecture — recorded here so they aren't accidentally deferred into debt without a conscious decision:

- **Account balance integrity under transaction edit/delete.** Getting balance updates right on *create* is easy; getting them right on *edit* (amount or account changed) and *delete* is where bugs actually hide. Cover this with tests from Phase 3 onward, not after a bug is found.
- **Duplicate transaction prevention.** No idempotency/duplicate-detection strategy is decided yet. Needs a decision (e.g., client-side debounce + server-side idempotency key, or a simpler duplicate-check heuristic) before Phase 3 ships, not left as an open gap.
- **Recurring transactions.** Not modeled in `DATABASE.md` yet. If added later, decide up front whether recurrence is generated eagerly (a document per occurrence) or computed on read — retrofitting this choice is expensive.
- **MongoDB referential integrity.** No foreign-key enforcement exists at the database layer (see `ARCHITECTURE.md`); every controller that touches a relation (e.g., transaction → account) must explicitly verify ownership. A missed check here is both a correctness and a security bug (cross-user data access).
- **Financial calculation correctness.** Savings rate, budget usage, net worth, profit/loss must be pure, tested functions (per `PROJECT_STYLE.md`) from the start — retrofitting tests onto untested financial math later is higher-risk than building it in.

## Process
When real debt is introduced (a deliberate shortcut, a TODO, an outdated dependency, a missing test), add it here with: what it is, why it happened, and what it would take to resolve. Don't let this file go stale — review it whenever `PROJECT_SCORE.md` is re-scored.
