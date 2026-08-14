# Dev Context

**This is the live "what's happening right now" doc. Update it after every meaningful session — an agent picking up "continue" reads this file first.**

Last updated: 2026-08-14

## Current objective
Move into Phase 1 (Authentication) now that Phase 0 scaffolding is done and verified.

## Current development phase
Phase 1 not yet started. Phase 0 (scaffolding) is complete. See `PROJECT_PLAN.md`.

## Current task
None active. Phase 0 just finished and was verified; awaiting direction to start Phase 1 (register/login/JWT/bcrypt/roles).

## Recently completed work
- 2026-08-14: Inspected the working directory — confirmed it was completely empty (no git repo, no files).
- 2026-08-14: Confirmed two foundational stack decisions with the user: MongoDB (over PostgreSQL), TypeScript (over plain JS) for both client and server.
- 2026-08-14: Created the full `/docs` structure.
- 2026-08-14: Completed **Phase 0 — Project scaffolding**: `client/` (Vite + React + TS, react-router-dom + axios installed, folder structure per `ARCHITECTURE.md`) and `server/` (Express 5 + TS, ESM/NodeNext + `tsx`, Mongoose/cors/dotenv, ESLint flat config + Prettier). Verified: both `tsc` checks clean, server `eslint .` clean, both dev servers start and were manually stopped after verification, `GET /api/health` confirmed responding correctly with no `MONGODB_URI` set.

## Files recently changed
- New: everything under `client/src/` and `server/src/`, plus `client/package.json`, `server/package.json`, `server/tsconfig.json`, `server/eslint.config.js`, `server/.prettierrc`, `client/.env.example`, `server/.env.example`, `.gitignore` in both.
- Updated: `docs/DECISIONS.md` (2 new entries: server ESM/tsx choice, Express 5), `docs/PROJECT_PLAN.md` (Phase 0 → DONE), `docs/IMPLEMENTED_FEATURES.md` (scaffolding entry added), `docs/CHANGELOG.md`.

## Important implementation details
- Stack is locked: MongoDB + Mongoose, TypeScript (client + server), Vite (frontend build), npm, Recharts (primary charts), axios (HTTP client). See `DECISIONS.md` for the full rationale on each.
- Server uses **native ESM** (`"type": "module"`) + `NodeNext` module resolution — relative imports need an explicit `.js` extension even in `.ts` source files (e.g. `import { getHealth } from '../controllers/health.controller.js'`). This is not a typo; it's required by NodeNext.
- Server dev runs via `tsx watch src/server.ts`; production build is `tsc` → `node dist/server.js`.
- `server/src/config/db.ts`'s `connectDatabase` is intentionally non-blocking: if `MONGODB_URI` is unset, it logs a warning and the server still starts. This was a deliberate scaffolding choice so the API is runnable/testable before Atlas is provisioned — don't "fix" this into a hard failure without discussing it, since Phase 1+ will need the server startable in environments without a DB yet configured (e.g. first clone).
- Express 5 is in use (not 4) — see `DECISIONS.md` for why this matters for async error handling.
- No real MongoDB connection has been tested end-to-end yet — `MONGODB_URI` is not provisioned. First real test of that path will naturally happen in Phase 1 when a user document needs to be written.

## Known issues
None currently.

## Current blockers
None. `MONGODB_URI` needs to be provisioned (local MongoDB or Atlas) before Phase 1 auth work can be tested end-to-end, but that doesn't block starting the auth code itself.

## Decisions made recently
See `DECISIONS.md` for the full log, including two added during Phase 0: server ESM+NodeNext+tsx (over CommonJS+ts-node), and staying on Express 5 (over pinning to 4).

## Things that must NOT be changed without user confirmation
- The MongoDB and TypeScript decisions — explicit product/architecture choices made by the user, not defaults. Do not silently switch to PostgreSQL or plain JS.
- Do not claim any feature is `DONE` in `PROJECT_PLAN.md` or `IMPLEMENTED_FEATURES.md` without verified, working code.
- Don't change `server/src/config/db.ts`'s non-blocking-connect behavior into a hard startup failure without discussing it first (see above).

## Next recommended action
Begin **Phase 1 — Authentication** (see `PROJECT_PLAN.md`): `User` Mongoose model, `POST /api/auth/register`, `POST /api/auth/login`, JWT issuance/verification middleware, bcrypt password hashing, `GET /api/auth/me`. Needs a real `MONGODB_URI` (local MongoDB is fine for dev) to test end-to-end.

## Commands needed to run the project
- Client dev server: `cd client && npm run dev` (Vite, default port 5173, auto-increments if busy)
- Server dev process: `cd server && npm run dev` (tsx watch, port 4000 by default / `$PORT`)
- Client type-check: `cd client && npx tsc -b`
- Server type-check: `cd server && npx tsc -p tsconfig.json --noEmit`
- Server lint: `cd server && npm run lint`

## Testing commands
Not available yet — no test runner configured. See `TESTING.md` for the planned approach; introduce alongside Phase 1.

## Build commands
- Client: `cd client && npm run build` (not yet manually verified — only `tsc -b` type-check has been run)
- Server: `cd server && npm run build` (compiles to `server/dist/`, not yet manually verified end-to-end)

## Deployment commands
Not available yet. See `DEPLOYMENT.md` for the planned targets.

## Environment requirements
- Node.js (v24 confirmed installed in this environment) and npm (v11 confirmed)
- A MongoDB connection string (local MongoDB or a MongoDB Atlas free-tier cluster) — not yet provisioned; server runs without it but Phase 1 needs it
- Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env` and fill in real values before running against a real database
