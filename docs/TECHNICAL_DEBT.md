# Technical Debt

**Current state (2026-11-20):** only open items are listed. Items resolved by the 2026-11-20 hardening pass (login/register rate limiting, client test runner, float drift, orphaned transactions, N+1 budget query, unbounded input) were removed — see `CHANGELOG.md` and `QA-REPORT.md`.

## Open debt

### Correctness / data
- **Balance updates are not atomic across the account and transaction documents.** Each affected account gets a single-document pipeline update (rounded to cents), then the transaction is written, with a compensating reverse update if that write fails. A process crash between the two steps can leave a balance off by one transaction. MongoDB multi-document transactions need a replica set; local compose is a standalone instance. **Resolve:** run a single-node replica set locally (production Atlas already is one) and wrap balance + transaction writes in `session.withTransaction()`.
- **Money is stored as floating-point `Number`.** Mitigated by 2-decimal input validation, a 1e12 cap and `$round` to cents on writes, but sums elsewhere (dashboard, budget usage) still add floats. **Resolve:** integer minor units; needs a data migration and an API-contract decision.
- **Budget months and dashboard "this month" are UTC.** A user in another timezone sees month boundaries shift. **Resolve:** store a user timezone and bucket in it.
- **No currency conversion.** A transfer between accounts of different currencies moves the raw number. Dashboard balances are grouped per currency; "this month" income/expense sums across currencies unconverted.
- **Currency is shape-checked only** (`^[A-Z]{3}$`), not validated against ISO 4217.
- **Budget category matching uses a case-insensitive regex / lower-cased aggregation key**, which cannot use an index. **Resolve (if budgets grow):** store a normalised `categoryKey`.

### Security
- **Registration reveals whether an email exists** (409). Fixing this needs an email-verification flow or a deliberate product decision.
- **7-day JWT in `localStorage`, no refresh tokens, no revocation.** Moving to httpOnly cookies + refresh rotation would also require CSRF protection; this is a security/product decision.
- **Password policy is length-only** (8-72); `12345678` is accepted. No password-reset flow.
- **Rate limiting keys on `req.ip` with no `trust proxy` configured**; behind a reverse proxy all clients may share one bucket. Configure before deploying behind a proxy.
- **MongoDB in compose has no authentication** (bound to `127.0.0.1`, local development only).
- **`requireRole` has no caller**, and nothing can create `advisor`/`admin` users (open product question).

### Product / UX gaps
- **No client-side pagination UI or search.** The transactions page loads the first 200 and filters in the browser, so account/type filters only see those 200. Accounts and budgets/investments lists are unpaginated.
- **Not built:** reports and charts (Phase 7), notifications and overspend alerts (Phase 8), OpenAPI spec, seed data, recurring transactions.
- **No duplicate-transaction prevention on the server** — deliberate (identical transactions are legitimate); the create form's submit guard only stops accidental double-clicks. If a real double-submit problem appears, add a per-submission idempotency key rather than a field-matching heuristic.

### Tooling / verification
- **Docker setup (Dockerfiles, compose `app` profile) is unverified** on a machine with a working Docker engine, and CI does not build the images.
- **Thin client tests:** only `Alert`, `Modal` and `cx` have tests (6 total); pages, `AuthContext` and services are untested. No browser E2E suite.
- **Accessibility/contrast not measured** with a tool (axe/Lighthouse); dark mode not systematically verified.
- **Single JS chunk** (~336 kB, ~105 kB gzip); route-level code splitting is an optional later win.

## Pre-emptive risk areas to watch (not debt yet)
- **Recurring transactions.** Decide up front whether recurrence is generated eagerly (a document per occurrence) or computed on read — retrofitting is expensive.
- **MongoDB referential integrity.** No foreign keys; every controller touching a relation must verify ownership. Done and tested for accounts, transactions (including `toAccountId`), budgets and investments; apply the same discipline to notifications.
- **Financial calculation correctness.** Keep money math in pure, tested functions (`utils/balance.ts`, `budgetUsage.ts`, `investmentReturns.ts`); do the same for Phase 7 figures (savings rate, net worth, category totals).

## Process
When real debt is introduced (a deliberate shortcut, a TODO, an outdated dependency, a missing test), add it here with what it is, why, and what it would take to resolve. Review whenever `PROJECT_SCORE.md` is re-scored.
