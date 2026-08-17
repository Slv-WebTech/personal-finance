# Implemented Features

**This file only lists features that exist in code, are integrated, and have been verified to actually work.** Nothing is added here based on a plan, a design, or an intention — only on inspected, working code.

## Project scaffolding (Phase 0)
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `client/` (Vite + React + TypeScript app), `server/` (Express + TypeScript API)
- **Important files:**
  - `client/src/App.tsx`, `client/src/pages/Landing.tsx`, `client/src/services/api.ts` (axios instance with JWT-attach interceptor, not yet used by any real request)
  - `server/src/server.ts` (Express app entry), `server/src/config/db.ts` (non-blocking Mongoose connection), `server/src/routes/health.routes.ts` + `server/src/controllers/health.controller.ts`, `server/src/middleware/errorHandler.ts`
- **API/database dependencies:** `GET /api/health` — no database write/read yet; reports live Mongoose connection state (`connected`/`disconnected`).
- **Testing status:** No automated tests. Manually verified: `tsc` type-checks clean in both `client/` and `server/`; `eslint .` clean in `server/`; both `npm run dev` commands start successfully; `curl http://localhost:4000/api/health` returned both states — `{"status":"ok","database":"disconnected",...}` with no `MONGODB_URI` set, and `{"status":"ok","database":"connected",...}` against the local Docker MongoDB (see below).
- **Known limitations:** No UI beyond a placeholder landing page. No auth, no real routes beyond `/api/health`. No automated tests exist for any of this yet.

## Local development infrastructure
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `docker-compose.yml` (repo root, `mongo:7` container), `server/.env` (untracked, real `MONGODB_URI` + generated `JWT_SECRET`), local git repository (`git init`, initial commit made)
- **Testing status:** Verified — container starts via `docker compose up -d`, `mongosh` ping returned `{ok: 1}`, server connected to it successfully.
- **Known limitations:** Local only — no MongoDB Atlas (production) cluster provisioned yet, no git remote configured yet.

## Authentication (Phase 1)
- **Implementation status:** DONE, verified 2026-08-17
- **Where it exists:** `server/src/models/User.ts`, `server/src/utils/password.ts` (bcrypt hash/compare), `server/src/utils/jwt.ts` (sign/verify, 7-day expiry), `server/src/utils/validators.ts` (zod schemas), `server/src/middleware/validate.ts`, `server/src/middleware/auth.ts` (`requireAuth`, `requireRole` — role-gating exists but is not yet exercised by any route), `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`
- **API/database dependencies:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (protected) — all backed by the real `users` collection via Mongoose.
- **Testing status:** 10 automated tests (Vitest), all passing:
  - Unit: password hash/verify round-trip + rejection (`password.test.ts`), JWT sign/verify round-trip + rejection of an invalid token (`jwt.test.ts`)
  - Integration (`auth.routes.test.ts`, via Supertest against a dedicated `personal-finance-test` database, never the dev database): register success, duplicate-email rejection (409), invalid-payload rejection (400), client-supplied `role` is ignored, login success/failure (401), `GET /me` with a valid token (200) and without one (401)
  - Manually verified via curl against the real dev database (test user deleted afterward): full register → login → `/me` flow, plus `/me` with a garbage token (401)
- **Known limitations:** No password-reset flow. No rate limiting on login/register (brute-force risk, tracked as a near-term hardening item in `ARCHITECTURE.md`). No mechanism exists to create `advisor`/`admin` accounts — registration always creates a `customer` by design (see `DECISIONS.md`); that's an open product question, not a bug. `requireRole` exists but has no caller yet — it'll be exercised starting Phase 2 (resource ownership) or whenever an admin-only route is built.

## Everything else
Not implemented. See `FEATURES.md` for the full inventory and `PROJECT_PLAN.md` for what's next (Phase 2 — Account Management).
