# Implemented Features

**This file only lists features that exist in code, are integrated, and have been verified to actually work.** Nothing is added here based on a plan, a design, or an intention — only on inspected, working code.

## Project scaffolding (Phase 0)
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `client/` (Vite + React + TypeScript app), `server/` (Express + TypeScript API)
- **Important files:**
  - `client/src/App.tsx`, `client/src/pages/Landing.tsx`, `client/src/services/api.ts` (axios instance with JWT-attach interceptor, not yet used by any real request)
  - `server/src/server.ts` (Express app entry), `server/src/config/db.ts` (non-blocking Mongoose connection), `server/src/routes/health.routes.ts` + `server/src/controllers/health.controller.ts`, `server/src/middleware/errorHandler.ts`
- **API/database dependencies:** `GET /api/health` — no database write/read yet; reports live Mongoose connection state (`connected`/`disconnected`).
- **Testing status:** No automated tests. Manually verified: `tsc` type-checks clean in both `client/` and `server/`; `eslint .` clean in `server/`; both `npm run dev` commands start successfully; `curl http://localhost:4000/api/health` returned `{"status":"ok","database":"disconnected","uptime":...}` with no `MONGODB_URI` configured.
- **Known limitations:** No real MongoDB instance has been connected yet — the `database: connected` path is implemented but unverified end-to-end. No UI beyond a placeholder landing page. No auth, no real routes beyond `/api/health`.

## Everything else
Not implemented. See `FEATURES.md` for the full inventory and `PROJECT_PLAN.md` for what's next (Phase 1 — Authentication).
