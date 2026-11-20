# QA Report — Personal Finance (senior QA/SDET pass)

Date: 2026-11-20 · Scope: client (Vite/React), server (Express/Mongoose), live E2E in Chrome against a private MongoDB 8.2 instance (port 27117, own data dir, removed afterwards). No other databases were touched.

**Result: 9 defects found; all 9 fixed (F-9 and P-1 in a follow-up pass). Server suite 99/99 integration + unit tests pass; client 6/6; lint, type-check and build clean.**

## 1. UI (live in Chrome)

| Check | Result |
|---|---|
| Register / login / logout / wrong-password message / session survives reload | Pass |
| Accounts, transactions, transfers, budgets, investments, dashboard snapshot | Pass (balances verified after create, transfer, delete) |
| Desktop 1280 / tablet 768 layout | Pass — no horizontal page overflow, consistent spacing/alignment |
| Mobile 375 | Pass after fix F-9 (stacked cards, header and nav fit; re-verified live) |
| Accessibility basics | Labels on every form field, `lang`, one `h1` + `main` per page, visible focus ring, dialog has `aria-modal` + accessible name, Escape closes |
| Keyboard dialog behaviour | **Failed, fixed (F-8)** — Tab escaped the modal and focus was lost on close |
| Contrast | Not measurable with my tooling: badge/status colours use translucent backgrounds, my computed ratios were invalid (1.00). They look readable but need an axe/Lighthouse run. |

Note: Chrome's window resize does not change the viewport in this harness, so tablet/mobile were tested by rendering the app in same-origin iframes of 375/768 px. That exercises CSS media queries correctly but not touch input or mobile browser chrome.

## 2. API security and contracts

Executed as an attacker script against 20 protected endpoints plus targeted probes (35 checks).

| Area | Result |
|---|---|
| AuthN: all 20 protected routes without token | 401 on all |
| Forged tokens (alg=none, garbage, tampered signature) | Rejected |
| Broken access control (A vs B on accounts/transactions/budgets/investments: GET/PUT/DELETE, post to foreign account, move tx to foreign account) | 404 everywhere; foreign attempts never changed balances |
| Mass assignment (`userId`, `_id` on create; `role` on register) | Ignored |
| NoSQL injection (`{"$ne":""}` in login, `category[$ne]` in query string) | Rejected / treated as plain strings |
| Validation (negative/zero/string amount, bad date/type, blank category, month 13, dup email incl. case) | 400/409 |
| Malformed JSON | 400 generic, no stack/internal message |
| Headers | helmet active (nosniff, HSTS, CSP), no `X-Powered-By`; CORS limited to the configured origin |
| Rate limiting | 20 attempts / 15 min on login+register, verified 429 after limit; `/auth/me` not limited |

**Defects found and fixed**

- **F-1 (High) Unbounded input.** 100k-char category/password, `amount: 1e308`, `balance: 1e300`, `quantity: 1e20`, currency `"12$"` and fake codes were all accepted (HTTP 201). Fixed in `server/src/utils/validators.ts`: max lengths (name 100, category 100, notes 1000, payment method 50, email 254, password 8–72), money ≤ 1e12 with ≤ 2 decimals, currency `^[A-Z]{3}$`, quantity ≤ 1e12.
- **F-2 (Medium) User enumeration by timing.** Login for an unknown email took ~2 ms vs ~53 ms for a real one. Fixed: bcrypt compare against a dummy hash for unknown users (`auth.controller.ts`).
- **F-3 (Medium, found in earlier pass, re-verified)** Rate limiter counted `/auth/me`, and the client logged users out on any error (429/5xx). Fixed earlier; regression confirmed live.

Remaining (not fixed, by design or decision needed): registration still reveals whether an email exists (409); 7-day JWT in `localStorage`, no refresh/revocation; no CSRF concern today (Bearer header) but moving to cookies would require it; password policy is length-only (`12345678` accepted); currency is syntactically validated but not checked against ISO 4217.

## 3. Business logic and edge cases

- **F-4 (High) Float drift in balances.** `$inc` of 0.1/0.2 repeatedly can produce 0.30000000000000004-style balances. Fixed: amounts limited to 2 decimals and balance updates now use an aggregation-pipeline `$round(…, 2)` (`transactions.controller.ts`). Regression test: six fractional postings equal exactly 0.9.
- **F-5 (High) Deleting an account with transactions orphaned them** (and transfer legs), silently skewing history/budgets. Fixed: 409 "…Set its status to Closed instead"; empty accounts still delete. Transfer destination is protected too. UI surfaces the message (verified).
- **F-6 (Medium) Transactions accepted on frozen/closed accounts.** Fixed: 409 on create; on edit, only *newly referenced* accounts must be active so old records stay correctable.
- Verified correct: expense/income/transfer/investment signs, two-leg transfer create/edit/delete reversal, rollback on failed save, budget usage counts only expenses of the same category (case-insensitive) inside the calendar month (UTC boundaries), over-budget flips at limit + 0.01, per-user budget uniqueness, investment totals use per-unit values × quantity, dashboard excludes closed accounts and groups by currency.
- Known limitations (not fixed): balance updates are compensating `$inc` steps rather than a Mongo transaction (a process crash between steps can leave a one-off mismatch; needs a replica set); budgets and transactions are bucketed in UTC, so a user in another timezone sees month edges shift; no recurring transactions, no budget rollover, no multi-currency conversion (transfers between different-currency accounts move the raw number).

## 4. Performance

Dataset: 1 user, 20,000 transactions, 12 budgets, local MongoDB, median of 5 runs.

| Endpoint | Median | Max |
|---|---|---|
| GET /accounts | 12 ms | 15 ms |
| GET /dashboard/summary | 36 ms | 48 ms |
| POST /transactions | 26 ms | 54 ms |
| GET /transactions?category&type | 48 ms | 109 ms |
| GET /transactions (200/page) | 191 ms | 307 ms |
| GET /transactions?limit=500&page=20 | 109 ms | 159 ms |
| GET /budgets (12 budgets) | 260 ms → **93 ms** after P-1 fix | 507 → 114 ms |

- **P-1 (Medium) — Fixed.** `GET /budgets` ran one query per budget (N+1) and summed in JS. `budgets.controller.ts` now uses one `$match`/`$group` aggregation keyed on (year, month, trimmed lower-cased category) over the min–max date range of the listed budgets, then looks each budget up in the result (same UTC month boundaries and case-insensitive matching, rounded to cents). Re-measured on the same 20,000-transaction / 12-budget dataset: **260 ms → 93 ms median** (max 507 → 114 ms). New regression test covers many budgets, trimmed/mixed-case categories and no cross-month or cross-category leakage.
- Indexes present: `{userId}`, `{accountId}`, `{userId,date}`. The budget query uses the `userId,date` index (1,667 keys for 1,333 returned) — good. Case-insensitive regex on `category` cannot use an index; if budgets grow, store a normalised `categoryKey`.
- The client loads the first 200 transactions and filters in the browser; filter-by-account/type therefore only sees those 200 (see UX-2).
- Client bundle: 336 kB JS (104.7 kB gzip) + 32 kB CSS (5.7 kB gzip), single chunk — fine; route-level code splitting is an optional later win. 200-row table rendered in ~0.55 s DOM-ready, no virtualisation needed at this size.

## 5. UX

- **F-8 (Medium, fixed) Modal focus management.** Tab could leave an `aria-modal` dialog and focus was lost on close. Fixed in `client/src/components/ui/Modal.tsx` (focus trap, focus restored to the trigger, no focus-steal on re-render); 3 component tests added.
- **F-9 (Medium) — Fixed.** At 375 px the tables scrolled horizontally (Amount and Edit/Delete off-screen), the logo wrapped to two lines and the nav was cut off. Changes: `Table.module.css` turns each row into a labelled card below 640 px (cells carry `data-label` in `Accounts.tsx` / `Transactions.tsx`; the header row is kept visually hidden for screen readers); `AppHeader.module.css` keeps the wordmark on one line and hides the user name below 480 px; `AppShell.module.css` tightens nav spacing so all five tabs fit. Verified live at 375 px: no page overflow, no cell outside the viewport, nav fully visible (scrollWidth = clientWidth) on Home/Accounts/Transactions/Budgets/Investments; desktop table layout unchanged.
- **UX-1 (Low)** Every route has the same `<title>`; no skip-to-content link. Set per-route titles (WCAG 2.4.2) and add a skip link.
- **UX-2 (Low)** Transactions list: no search, no pagination UI, account/type filters apply to the loaded page only; the transfer row does not show its destination account.
- **UX-3 (Low)** Delete-confirm for an account that has transactions could pre-empt the failure by offering "Close account" instead of delete.
- Good: clear inline errors (login, validation, 409 messages), loading and empty states on every list, success toasts, destructive actions confirmed.

## 6. Tests added

| File | Purpose |
|---|---|
| `server/src/routes/qa-hardening.routes.test.ts` (11 tests) | rounding drift, decimal/magnitude rejection, account delete protection (incl. transfer destination), frozen/closed accounts, oversized/malformed fields, operator injection, security headers, cross-user PUT/DELETE on budgets and investments, budget edge cases |
| `client/src/components/ui/Modal.test.tsx` (3 tests) | dialog semantics, focus trap, Escape + focus restore |
| `server/vitest.setup.ts` | `TEST_MONGODB_URI` override so tests can target any MongoDB without editing code |

Totals: server 13 files / 99 tests pass; client 3 files / 6 tests pass. The attacker and load scripts were run ad hoc (not committed).

## 7. Recommendations (severity order)

1. **High — done:** input bounds, float-safe balances, account-delete and frozen-account rules.
2. **Medium — done:** responsive transaction/account tables and compact mobile header (F-9).
3. **Medium — done:** budget N+1 replaced by one aggregation (P-1); a stored `categoryKey` + index remains an option if budgets grow much larger.
4. **Medium — open:** move balance updates into a Mongo transaction (requires replica-set Mongo, which also fits the compose file) or derive balances from the ledger.
5. **Medium — open:** token strategy — httpOnly cookie + CSRF or short-lived access + refresh; add logout-everywhere.
6. **Low:** per-route titles, skip link, axe/Lighthouse contrast audit in CI, transaction search/pagination UI, ISO-4217 currency list, password strength check (breached-password list), timezone-aware month boundaries.
7. **Process:** add an E2E smoke test (Playwright) in CI using the Mongo service already defined in `.github/workflows/ci.yml`.

## What could not be tested, and why

- Docker/`docker compose --profile app` and the Dockerfiles: Docker's engine would not start on this machine; the full stack was run with a local `mongod` instead.
- Real mobile/tablet devices and touch input: only CSS-width emulation via iframes was possible (the 375 px fix was verified that way, not on a physical phone).
- Automated contrast/axe/Lighthouse and screen readers: not available in this environment.
- Registration rate limiting through the UI, and rate limiting behind a proxy (`trust proxy` is not set — all clients behind one proxy would share one limit bucket).
- Concurrency/race conditions on simultaneous balance updates and crash recovery between the two update steps.
- The shared MongoDB on port 27017 disappeared mid-session (another session's process); results above were produced on my own instance.
