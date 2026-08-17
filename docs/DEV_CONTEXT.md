# Dev Context

**This is the live "what's happening right now" doc. Update it after every meaningful session — an agent picking up "continue" reads this file first.**

Last updated: 2026-08-17

## Current objective
Move into Phase 2 (Account Management) now that Phase 1 (Authentication) is done and verified.

## Current development phase
Phase 2 not yet started. Phase 0 (scaffolding), git init, local MongoDB, and Phase 1 (Authentication) are all complete. See `PROJECT_PLAN.md`.

## Current task
None active. Awaiting direction to start Phase 2 (Account Management CRUD).

## Recently completed work
- 2026-08-14: Documentation baseline (`/docs` structure), Phase 0 scaffolding (client + server, verified runnable), git init + initial commit, local MongoDB via Docker. See prior entries in this file's git history / `CHANGELOG.md` for detail.
- 2026-08-17: **Documentation sync pass** — user asked to update all docs with current status before further coding. Re-read every `/docs` file and fixed 16 stale "no code exists yet" / "not yet provisioned" claims left over from before the git/MongoDB session.
- 2026-08-17: Completed **Phase 1 — Authentication**: `User` Mongoose model, bcrypt password hashing, JWT sign/verify (7-day expiry), zod request validation, `requireAuth`/`requireRole` middleware, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Split `server/src/app.ts` (Express app factory) out of `server.ts` so tests can import the app without starting a real listener/DB connection. Added Vitest + Supertest (switched from the originally-planned Jest — see `DECISIONS.md`); 10 tests passing (unit: password/JWT; integration: register/login/me against a dedicated `personal-finance-test` database). Manually smoke-tested the full flow against the real dev database via curl (test user cleaned up after). Full doc sync for Phase 1 across `PROJECT_PLAN.md`, `IMPLEMENTED_FEATURES.md`, `FEATURES.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, `ARCHITECTURE.md`, `TESTING.md`, `TECHNICAL_DEBT.md`, `PROJECT_SCORE.md` (2/10 → 3/10), `DECISIONS.md`.

## Files recently changed
- New (Phase 1): `server/src/models/User.ts`, `server/src/utils/password.ts`, `server/src/utils/jwt.ts`, `server/src/utils/validators.ts`, `server/src/middleware/validate.ts`, `server/src/middleware/auth.ts`, `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`, `server/src/app.ts`, `server/src/utils/password.test.ts`, `server/src/utils/jwt.test.ts`, `server/src/routes/auth.routes.test.ts`, `server/vitest.config.ts`, `server/vitest.setup.ts`.
- Modified: `server/src/server.ts` (now just bootstraps `createApp()` + DB connection), `server/package.json` (added `test` script + new deps: `bcrypt`, `jsonwebtoken`, `zod`, `vitest`, `supertest`).
- Docs: see the two 2026-08-17 `CHANGELOG.md` entries for the full list — doc-sync pass touched 16 files, Phase 1 touched 10.
- **Not yet committed to git**: everything from the doc-sync pass and Phase 1 (git status shows the repo has real uncommitted work — see "Next recommended action").

## Important implementation details
- Stack is locked: MongoDB + Mongoose, TypeScript (client + server), Vite (frontend build), npm, Recharts (primary charts), axios (HTTP client). See `DECISIONS.md`.
- Server uses **native ESM** + `NodeNext` — relative imports need an explicit `.js` extension in `.ts` source (e.g. `from '../models/User.js'`). Not a typo.
- `server/src/app.ts` exports `createApp()` (the Express app, no side effects); `server/src/server.ts` is the thin bootstrap that connects the DB and calls `.listen()`. **Import `createApp` in tests, never import `server.ts`.**
- `server/src/config/db.ts`'s `connectDatabase` is intentionally non-blocking (logs a warning and continues if `MONGODB_URI` is unset) — don't change this into a hard failure without discussing it first.
- **Auth security invariant: `POST /api/auth/register` must never accept a client-supplied `role`.** It always creates a `customer`. This is enforced twice (zod schema doesn't define the field; controller hardcodes it) — don't "simplify" this by trusting `req.body.role`. Advisor/admin account creation is intentionally unbuilt (open product question, see `PROJECT_PLAN.md`).
- JWT expiry is 7 days, no refresh-token flow. `requireRole` exists in `middleware/auth.ts` but has no caller yet — expected to be used starting Phase 2 (ownership checks) or wherever an admin-only route first appears.
- Real MongoDB connection is verified working end-to-end for both the dev database (`personal-finance`) and a separate test database (`personal-finance-test`, used only by the Vitest integration suite, dropped after each run).
- Local MongoDB container `personal-finance-mongo` is expected to already be running (`docker compose up -d` if not — check with `docker ps`).

## Known issues
None currently.

## Current blockers
None. All prerequisites for Phase 2 (real MongoDB, auth to build ownership checks against) are in place.

## Decisions made recently
See `DECISIONS.md` for the full log. Phase 1 additions: Vitest over Jest for backend testing (ESM friction avoidance), registration never accepts a client-supplied `role` (security), 7-day JWT expiry.

## Things that must NOT be changed without user confirmation
- The MongoDB and TypeScript decisions — explicit product/architecture choices made by the user, not defaults.
- Do not claim any feature is `DONE`/`IMPLEMENTED` in `PROJECT_PLAN.md`, `FEATURES.md`, or `IMPLEMENTED_FEATURES.md` without verified, working code (and, since Phase 1, without passing tests where tests are the established norm for that area).
- Don't change `server/src/config/db.ts`'s non-blocking-connect behavior into a hard startup failure without discussing it first.
- Don't let `POST /api/auth/register` accept a client-supplied `role` (see security invariant above).

## Next recommended action
Two things pending, either order:
1. **Commit the outstanding work.** The doc-sync pass and all of Phase 1 are uncommitted. Ask the user before committing (per standing git-safety rule) — don't commit silently.
2. **Begin Phase 2 — Account Management** (see `PROJECT_PLAN.md`): `Account` Mongoose model per `DATABASE.md`, CRUD routes scoped to the authenticated user (first real use of `requireAuth` + ownership-filtering pattern), tests following the Phase 1 pattern (Vitest unit + Supertest integration against `personal-finance-test`).

## Commands needed to run the project
- Start local MongoDB: `docker compose up -d` (repo root; container `personal-finance-mongo`)
- Client dev server: `cd client && npm run dev` (Vite, default port 5173, auto-increments if busy)
- Server dev process: `cd server && npm run dev` (tsx watch, port 4000 by default / `$PORT`)
- Client type-check: `cd client && npx tsc -b`
- Server type-check: `cd server && npx tsc -p tsconfig.json --noEmit`
- Server lint: `cd server && npm run lint`
- Server tests: `cd server && npm test` (Vitest; requires the MongoDB container running)

## Testing commands
- Backend: `cd server && npm test` — 10 tests passing as of 2026-08-17 (see `TESTING.md`).
- Frontend: not available yet — no test runner configured in `client/`.

## Build commands
- Client: `cd client && npm run build` (not yet manually verified — only `tsc -b` type-check has been run)
- Server: `cd server && npm run build` (compiles to `server/dist/`, not yet manually verified end-to-end)

## Deployment commands
Not available yet — no remote/hosting configured. See `DEPLOYMENT.md` for the planned targets.

## Environment requirements
- Node.js (v24 confirmed installed) and npm (v11 confirmed)
- Docker Desktop (confirmed installed and running) — used for local MongoDB via `docker-compose.yml`
- `server/.env` exists locally (gitignored, real dev `JWT_SECRET`) pointing at `mongodb://localhost:27017/personal-finance`; `client/.env` not yet created (copy from `client/.env.example` if `VITE_API_URL` needs overriding — the default already matches the local server)
