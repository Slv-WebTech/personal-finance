# Dev Context

> **Product name: Tallybird** — "Your money, tallied in one place." (The GitHub repo slug stays `personal-finance`; code, database names and docs paths keep that name.)

**This is the live "what's happening right now" doc. Update it after every meaningful session — an agent picking up "continue" reads this file first.**

Last updated: 2026-11-20

## Current state
All roadmap phases except **Phase 7 (Charts & Reports)** and **Phase 8 (Notifications)** are done end-to-end (API + UI + tests): Authentication, Accounts, Transactions (incl. two-leg transfers), Budgets, Investments, and the Dashboard (`GET /api/dashboard/summary` + the "Your snapshot" card on `/app`). A security/QA hardening pass has also landed (see `QA-REPORT.md`, `CHANGELOG.md` 2026-11-20). Tests: server 99 (Vitest + Supertest, needs MongoDB), client 6 (Vitest + Testing Library). GitHub Actions CI lives at `.github/workflows/ci.yml`. A Docker full-stack mode exists (`--profile app`) but has **not** been verified on a machine with a working Docker engine.

## Current objective
Reports & charts (Phase 7), then notifications (Phase 8). Nothing is in flight; no subagents are pending.

## Recently completed work
- 2026-11-20: **QA + hardening pass and doc sync.** Security: helmet, 20 req/15 min/IP rate limit on `/api/auth/login` + `/register`, 100 kb JSON body limit, generic 500s, `JWT_SECRET` >= 32 chars enforced at startup, graceful shutdown, input bounds (max lengths, money <= 1e12 with <= 2 decimals, `^[A-Z]{3}$` currency, password 8-72 chars), login timing equalised, Mongo bound to 127.0.0.1. Correctness: balances rounded to cents via aggregation-pipeline `$round`; transfers with optional `toAccountId`; account `balance` only settable on create (PUT rejects it); account delete refused (409) when transactions reference it; frozen/closed accounts reject new transactions (409); transaction list pagination; budgets usage via one aggregation query. Client: `Modal` focus trap + restore, mobile stacked-card tables, `AuthContext` only drops the token on 401/404, dashboard snapshot card. Added client test runner, CI, Dockerfiles. Full detail in `CHANGELOG.md` and `QA-REPORT.md`.
- 2026-08-22: Phases 2, 3, 5, 6 and the design system / auth UI (see `CHANGELOG.md` for the per-phase entries).
- 2026-08-17: Phase 1 (Authentication), documentation sync, private GitHub remote.
- 2026-08-14: Documentation baseline, Phase 0 scaffolding, local MongoDB via Docker.

## Important implementation details
- Stack is locked: MongoDB + Mongoose, TypeScript (client + server), Vite, npm, axios. Recharts is the planned chart library (not installed yet). See `DECISIONS.md`.
- Server uses **native ESM** + `NodeNext` — relative imports need an explicit `.js` extension in `.ts` source (e.g. `from '../models/User.js'`). Not a typo.
- `server/src/app.ts` exports `createApp()` (no side effects); `server/src/server.ts` is the thin bootstrap (asserts `JWT_SECRET`, connects the DB, listens, handles SIGINT/SIGTERM). **Import `createApp` in tests, never `server.ts`.** The login/register rate limiter is skipped when `NODE_ENV === 'test'` (Vitest sets it).
- `server/src/server.ts` **refuses to start** unless `JWT_SECRET` is set, >= 32 chars and not the `.env.example` placeholder.
- `server/src/config/db.ts`'s `connectDatabase` is intentionally non-blocking (logs a warning and continues if `MONGODB_URI` is unset or the connection fails) — don't change this into a hard failure without discussing it first.
- **Auth security invariant: `POST /api/auth/register` must never accept a client-supplied `role`.** It always creates a `customer` (zod schema omits the field; controller hardcodes it). Advisor/admin provisioning is an open product question. `requireRole` exists but has no caller yet.
- **Balance invariant: account `balance` changes only through transactions.** `POST /api/accounts` may set an opening balance; `PUT /api/accounts/:id` rejects `balance` (strict schema, 400). Balance updates are compensating `$inc`-style pipeline updates rounded to cents, not multi-document transactions (see `DECISIONS.md`, `TECHNICAL_DEBT.md`).
- Cross-user access returns 404, never 403, on every resource.
- JWT: 7-day expiry, no refresh tokens, no revocation; stored in `localStorage` under the key `'token'` (read by the axios interceptor in `services/api.ts` and by `AuthContext.tsx` — rename both together or auth breaks silently).
- Client styling: **CSS Modules** co-located with each component/page, design tokens in `client/src/styles/tokens.css`, resets in `global.css`. Don't add a CSS-in-JS/Tailwind dependency.
- **Git identity for this repo is set locally (not global)** to `Slv-WebTech <70682890+Slv-WebTech@users.noreply.github.com>` — verify with `git config user.email` (no `--global`) before committing. Remote `origin` is `git@github-personal:Slv-WebTech/personal-finance.git` — push only over the `github-personal` SSH alias.

## Known issues / limitations
See `TECHNICAL_DEBT.md` for the full list. Headlines: compensating-update balance writes are not atomic across a process crash; registration reveals whether an email exists (409); 7-day JWT in `localStorage` with no revocation; no ISO-4217 currency validation; Docker full-stack setup unverified; no pagination/search UI on the client.

## Current blockers
None.

## Things that must NOT be changed without user confirmation
- The MongoDB and TypeScript decisions — explicit product/architecture choices made by the user.
- Do not claim any feature is `DONE`/`IMPLEMENTED` in `PROJECT_PLAN.md`, `FEATURES.md`, or `IMPLEMENTED_FEATURES.md` without verified, working code and passing tests.
- Don't change `connectDatabase`'s non-blocking behavior without discussion.
- Don't let `POST /api/auth/register` accept a client-supplied `role`.
- Don't push using the default `github.com` SSH host or the machine's global git identity. Confirm before any force-push.

## Next recommended action
Start **Phase 7 — Charts & Reports** (see `PROJECT_PLAN.md`): add Recharts to the client, new read-only aggregation endpoints (income vs expense by month, category breakdown, budget usage trend), and a `/reports` page. Consider the open items in `TECHNICAL_DEBT.md` (integer minor units, timezone-aware budget months) before reports multiply the places money is summed.

## Commands needed to run the project
- Start local MongoDB only: `docker compose up -d` (container `personal-finance-mongo`, bound to `127.0.0.1:27017`)
- Full stack in Docker (unverified): `JWT_SECRET=<32+ random chars> docker compose --profile app up --build` → server on 4000, client on http://localhost:8080
- Server dev: `cd server && npm run dev` (tsx watch, port 4000 / `$PORT`; needs `server/.env` with a >= 32-char `JWT_SECRET`)
- Client dev: `cd client && npm run dev` (Vite, port 5173)
- Server type-check / lint / tests: `cd server && npx tsc --noEmit` / `npm run lint` / `npm test`
- Client lint / tests / build: `cd client && npm run lint` / `npm test` / `npm run build`

## Testing commands
- Server: `cd server && npm test` — 99 tests; requires MongoDB (default `mongodb://localhost:27017/personal-finance-test`, override with `TEST_MONGODB_URI`).
- Client: `cd client && npm test` — 6 tests (Vitest + Testing Library + jsdom).
- CI runs both (plus type-check, lint, build) on every push and PR. See `TESTING.md`.

## Deployment commands
Docker Compose full-stack mode only (above, unverified). No hosted deployment is configured — see `DEPLOYMENT.md`.

## Environment requirements
- Node.js 22+ (CI uses 22; 24 used locally) and npm
- Docker (for MongoDB, or MongoDB 7 installed another way)
- `server/.env` (gitignored; copy `server/.env.example`, set `JWT_SECRET` to 32+ random characters); optional `client/.env` for `VITE_API_URL` (default `http://localhost:4000/api`)
