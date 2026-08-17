# Changelog

Human-readable development history. Concise entries — date, what changed, why it matters.

## 2026-08-14 — Documentation baseline established
- Inspected the working directory (`D:\personal-finance`): confirmed it was completely empty — no git repository, no source files, no existing project to audit.
- Confirmed two foundational stack decisions with the user: **MongoDB** (over PostgreSQL) and **TypeScript** for both client and server (over plain JavaScript).
- Made two implementation-level calls without needing user input (logged in `DECISIONS.md`): **Vite** over Create React App, **Recharts** as the primary charting library over Chart.js.
- Created the full `/docs` structure: `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_PLAN.md`, `PROJECT_STYLE.md`, `PROJECT_SCORE.md`, `DEV_CONTEXT.md`, `SITE_MAP.md`, `ARCHITECTURE.md`, `FEATURES.md`, `IMPLEMENTED_FEATURES.md`, `FUTURE_FEATURES.md`, `TECHNICAL_DEBT.md`, `DECISIONS.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`, `INTERVIEW_GUIDE.md`.
- No application code written yet at this point. Project health scored 1/10 in `PROJECT_SCORE.md` — honestly reflecting a pre-implementation state, not a quality judgment on the plan itself.

## 2026-08-14 — Phase 0: project scaffolding
- Scaffolded `client/`: Vite + React + TypeScript (via `npm create vite@latest`), added `react-router-dom` and `axios`, built out the `components/pages/dashboard/charts/services/hooks/context/types` folder structure from `ARCHITECTURE.md`, added a minimal `Landing` page and an axios instance with a JWT-attach interceptor (`client/src/services/api.ts`, unused by any real request yet).
- Scaffolded `server/`: Express 5 + TypeScript, native ESM + `NodeNext` module resolution, `tsx` for dev, ESLint flat config + Prettier, layered `routes/controllers/models/middleware/utils` folders, a non-blocking Mongoose connection helper (`server/src/config/db.ts`), a centralized error-handling middleware, and a first real endpoint: `GET /api/health`.
- Two implementation decisions made during scaffolding and logged in `DECISIONS.md`: server module system (ESM/NodeNext/tsx over CommonJS/ts-node), and staying on Express 5 rather than pinning to 4.
- Verified (not just written): both `tsc` checks pass clean, server `eslint .` passes clean, both `npm run dev` processes start successfully, `GET /api/health` responds correctly with no `MONGODB_URI` configured. Real MongoDB connectivity is still unverified — no connection string has been provisioned yet.
- Updated `PROJECT_PLAN.md` (Phase 0 → DONE), `IMPLEMENTED_FEATURES.md` (first real entry), `PROJECT_SCORE.md` (1/10 → 2/10), `DEV_CONTEXT.md`.

## 2026-08-14 — Git init + local MongoDB via Docker
- Set up local MongoDB: `docker-compose.yml` at the repo root (`mongo:7`, named volume for persistence, port 27017), started via `docker compose up -d`. Chose Docker over MongoDB Atlas for local dev per user's choice — no account/browser sign-up needed, matches `DEV_CONTEXT.md`'s "local MongoDB is fine for dev" note.
- Created the real `server/.env` (gitignored) with a generated dev `JWT_SECRET` and `MONGODB_URI` pointing at the local container. Verified end-to-end: server started, `GET /api/health` returned `database: "connected"` (previously only the `disconnected` path had been tested).
- Added root `README.md` (quick-start instructions) and root `.gitignore`.
- Ran `git init` and made the initial commit (56 files: full `/docs` set, Phase 0 client/server scaffolding, `docker-compose.yml`, root README/.gitignore). Confirmed `server/.env` was correctly excluded from the commit. No remote configured.
- Updated `DEV_CONTEXT.md` and `DEPLOYMENT.md` (added a "Local development" section documenting the Docker MongoDB setup).
- Next: Phase 1 — Authentication (register/login/JWT/bcrypt/roles).

## 2026-08-17 — Documentation sync pass
- User asked to update all documentation with current status before further coding. Re-read every file in `/docs` and fixed 16 stale claims left over from before the git/MongoDB session (e.g. `PROJECT_CONTEXT.md`/`docs/README.md` still said "pre-implementation," `ARCHITECTURE.md`/`DATABASE.md`/`SITE_MAP.md` said nothing was built when Phase 0 code existed, `API_DOCUMENTATION.md` didn't list the real `/api/health` endpoint at all).
- No code changed in this pass — documentation only.

## 2026-08-17 — Phase 1: Authentication
- Implemented: `server/src/models/User.ts` (Mongoose schema), `utils/password.ts` (bcrypt hash/compare), `utils/jwt.ts` (sign/verify, 7-day expiry), `utils/validators.ts` (zod schemas for register/login), `middleware/validate.ts` (generic zod-validation middleware), `middleware/auth.ts` (`requireAuth` + `requireRole`), `controllers/auth.controller.ts`, `routes/auth.routes.ts`. Wired into the app via a new `server/src/app.ts` (Express app factory split out of `server.ts` specifically so tests can import it without starting a real server/DB connection).
- Security decision made and enforced in code (not just documented): `POST /api/auth/register` never accepts a client-supplied `role` — every account is created as `customer`. Zod strips the field and the controller hardcodes it independently. Advisor/admin account creation remains unbuilt and is an open product question, not an oversight.
- Two implementation decisions logged in `DECISIONS.md`: switched the backend test runner from the originally-planned Jest to **Vitest** (avoids Jest's ESM friction against the server's NodeNext setup), and set a **7-day JWT expiry** (no refresh tokens yet).
- Testing: added real automated tests for the first time — 10 Vitest tests across 3 files (password hashing, JWT round-trip, and a Supertest integration suite covering register/login/`/me` against a dedicated `personal-finance-test` MongoDB database, never the dev database). All passing. `bcrypt` (native) installed cleanly on this Windows machine with no build-tool issues.
- Verified beyond the test suite: `tsc`/`eslint` clean, and a manual curl smoke test of the full register → login → `/me` flow (plus invalid-token and missing-token cases) against the real dev database — test user deleted afterward.
- Updated `PROJECT_PLAN.md` (Phase 1 → DONE), `IMPLEMENTED_FEATURES.md`, `FEATURES.md` (Authentication → IMPLEMENTED, backend-only), `API_DOCUMENTATION.md` (`/api/auth/*` → IMPLEMENTED with real response shapes), `DATABASE.md` (`users` → IMPLEMENTED), `ARCHITECTURE.md`, `TESTING.md` (Jest → Vitest, real test commands), `TECHNICAL_DEBT.md` (two accepted gaps: no rate limiting on auth routes, no password-reset flow), `PROJECT_SCORE.md` (2/10 → 3/10), `DECISIONS.md`.
- Next: Phase 2 — Account Management.
