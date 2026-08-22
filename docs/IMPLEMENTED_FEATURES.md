# Implemented Features

**This file only lists features that exist in code, are integrated, and have been verified to actually work.** Nothing is added here based on a plan, a design, or an intention — only on inspected, working code.

## Project scaffolding (Phase 0)
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `client/` (Vite + React + TypeScript app), `server/` (Express + TypeScript API)
- **Important files:**
  - `client/src/App.tsx`, `client/src/pages/Landing.tsx` (originally a 2-line placeholder — since rebuilt into a real marketing page, see "Design System & Marketing/Auth UI" below), `client/src/services/api.ts` (axios instance with JWT-attach interceptor; originally not used by any real request — since wrapped by `services/authService.ts` and used by real auth calls, see "Authentication (Phase 1)" below)
  - `server/src/server.ts` (Express app entry), `server/src/config/db.ts` (non-blocking Mongoose connection), `server/src/routes/health.routes.ts` + `server/src/controllers/health.controller.ts`, `server/src/middleware/errorHandler.ts`
- **API/database dependencies:** `GET /api/health` — no database write/read yet; reports live Mongoose connection state (`connected`/`disconnected`).
- **Testing status:** No automated tests. Manually verified: `tsc` type-checks clean in both `client/` and `server/`; `eslint .` clean in `server/`; both `npm run dev` commands start successfully; `curl http://localhost:4000/api/health` returned both states — `{"status":"ok","database":"disconnected",...}` with no `MONGODB_URI` set, and `{"status":"ok","database":"connected",...}` against the local Docker MongoDB (see below).
- **Known limitations (as of this Phase 0 snapshot, 2026-08-14):** No UI beyond a placeholder landing page. No auth, no real routes beyond `/api/health`. No automated tests exist for any of this yet. (Superseded by later phases — see "Authentication (Phase 1)" and "Design System & Marketing/Auth UI" below for what has since been built.)

## Local development infrastructure
- **Implementation status:** DONE, verified 2026-08-14
- **Where it exists:** `docker-compose.yml` (repo root, `mongo:7` container), `server/.env` (untracked, real `MONGODB_URI` + generated `JWT_SECRET`), local git repository (`git init`, initial commit made)
- **Testing status:** Verified — container starts via `docker compose up -d`, `mongosh` ping returned `{ok: 1}`, server connected to it successfully.
- **Known limitations:** No MongoDB Atlas (production) cluster provisioned yet. Git remote exists (`Slv-WebTech/personal-finance` on GitHub, private, via the `github-personal` SSH alias — see `DEPLOYMENT.md`) but no application hosting (Vercel/Render/Railway) is connected.

## Authentication (Phase 1)
- **Implementation status:** DONE, verified 2026-08-17 (backend); client-side login/register/session UI added and verified (`tsc -b`, lint, build) 2026-08-22 — authentication is now usable end-to-end by a real user, not just backend-only.
- **Where it exists:**
  - Backend: `server/src/models/User.ts`, `server/src/utils/password.ts` (bcrypt hash/compare), `server/src/utils/jwt.ts` (sign/verify, 7-day expiry), `server/src/utils/validators.ts` (zod schemas), `server/src/middleware/validate.ts`, `server/src/middleware/auth.ts` (`requireAuth`, `requireRole` — role-gating exists but is not yet exercised by any route), `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`
  - Client: `client/src/types/auth.ts`, `client/src/services/authService.ts` (wraps the existing axios instance in `services/api.ts`, normalizes every failure into a typed `ApiError`), `client/src/context/AuthContext.tsx` + `client/src/hooks/useAuth.ts` (session state via React Context; on load, validates any existing `localStorage` token via a real `GET /api/auth/me` call before trusting it), `client/src/components/ProtectedRoute.tsx` (guards the auth-gated `/app` route), `client/src/pages/Login.tsx` and `client/src/pages/Register.tsx` (real forms wired to the real endpoints; Register client-side-validates password === confirm-password and maps the server's per-field Zod validation errors onto the matching input; both redirect to `/app` on success, or straight to `/app` if an already-authenticated user lands on `/login`/`/register`), `client/src/pages/AppHome.tsx` (the post-login landing page)
- **API/database dependencies:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (protected) — all backed by the real `users` collection via Mongoose. Same three endpoints as before; they are now actually called from real client UI instead of only from tests/curl.
- **Testing status:**
  - Backend: 10 automated tests (Vitest), all passing, unchanged since 2026-08-17:
    - Unit: password hash/verify round-trip + rejection (`password.test.ts`), JWT sign/verify round-trip + rejection of an invalid token (`jwt.test.ts`)
    - Integration (`auth.routes.test.ts`, via Supertest against a dedicated `personal-finance-test` database, never the dev database): register success, duplicate-email rejection (409), invalid-payload rejection (400), client-supplied `role` is ignored, login success/failure (401), `GET /me` with a valid token (200) and without one (401)
    - Manually verified via curl against the real dev database (test user deleted afterward): full register → login → `/me` flow, plus `/me` with a garbage token (401)
  - Client (new this session): **no automated frontend test coverage exists** for `Login.tsx`, `Register.tsx`, `AuthContext.tsx`, `useAuth.ts`, `authService.ts`, or `ProtectedRoute.tsx` — there is no frontend test runner configured yet (see `TESTING.md`). Verification this session was limited to `npx tsc -b` (clean), `npm run lint` (clean, one expected pre-approved warning), and `npm run build` (succeeds). There was **no manual click-through in a running browser** this session — that was explicitly skipped at the user's request, so the actual login/register/session flow has not been exercised end-to-end by a human or a browser automation tool.
- **Known limitations:** No password-reset flow. No rate limiting on login/register (brute-force risk, tracked as a near-term hardening item in `ARCHITECTURE.md`). No mechanism exists to create `advisor`/`admin` accounts — registration always creates a `customer` by design (see `DECISIONS.md`); that's an open product question, not a bug, and is unchanged by this session's work. `requireRole` exists but has no caller yet — it'll be exercised starting Phase 2 (resource ownership) or whenever an admin-only route is built. No automated frontend tests exist for the new client-side auth code, and no manual browser verification of it has been done yet (see Testing status above).

## Design System & Marketing/Auth UI
- **Implementation status:** DONE, verified 2026-08-22
- **Where it exists:**
  - Design tokens: `client/src/styles/tokens.css` (color, typography, spacing, radius, shadow, and motion tokens; light and dark values, dark applied via `prefers-color-scheme`) and `client/src/styles/global.css` (global resets/base styles built on those tokens)
  - Component library, `client/src/components/ui/`:
    - `Button` — primary UI button with variants, used across forms and CTAs
    - `TextField` — labeled text input with built-in error-message display, used by Login/Register
    - `Card` — bordered/elevated container for grouping content
    - `Alert` — inline banner for success/error/info messaging (e.g. login/register failures)
    - `Spinner` — loading indicator (e.g. while an auth request is in flight)
    - `Badge` — small status/label pill (e.g. the "Planned" tags on `AppHome`)
    - `Logo` — the app's wordmark/icon component
  - Styling approach: CSS Modules per component (`*.module.css`), composed with a small `cx` class-name helper — no new npm dependency was added for styling
  - Rebuilt marketing page: `client/src/pages/Landing.tsx` (+ `Landing.module.css`) — previously a 2-line placeholder, now a real hero section, an honest "what's being built next" feature-roadmap section (Accounts/Transactions/Budgets/Investments/Reports, explicitly not claimed as live), and a footer; no fabricated stats or testimonials, and it explicitly states there is no bank-account connection
  - Post-login placeholder: `client/src/pages/AppHome.tsx` (+ `.module.css`) — the page a user lands on after authenticating: a welcome message plus a "what's coming" roadmap list (Accounts/Transactions/Budgets/Investments/Reports/Notifications, each tagged "Planned"). This is explicitly **not** the real Phase 4 aggregate Financial Dashboard (`/dashboard`) — it is a placeholder only.
  - New 404 handling: `client/src/pages/NotFound.tsx` (+ `.module.css`) — previously any unmatched route had no handling at all.
- **API/database dependencies:** None directly — this is presentation-layer only. The auth-related pages under this umbrella (`Login.tsx`/`Register.tsx`) depend on the Authentication endpoints documented above.
- **Testing status:** Verified via `npx tsc -b` (clean), `npm run lint` (clean, one expected pre-approved warning), `npm run build` (succeeds). **No automated component tests exist** (no frontend test runner is configured — see `TESTING.md`), and **no manual browser click-through was performed** this session. In particular, the dark-mode styling in `tokens.css`/`global.css` was **written** to respond to `prefers-color-scheme: dark` but has **not been visually verified** rendered in a browser in dark mode — treat "supports dark mode" as a built-but-unverified claim, not a tested one.
- **Known limitations:** No automated frontend test suite exists yet, consistent with `TESTING.md`'s existing "known untested areas" note (frontend has zero automated tests, no test runner configured). No manual browser verification (light or dark mode, any component) has been performed this session. No accessibility audit has been done.

## Everything else
Not implemented. Account Management, Transaction Management, Budget Management, the real Financial Dashboard (`/dashboard`), Investment Tracker, Charts & Reports, and Notifications have no backend yet, so no functional UI exists for any of them (Phases 2-8 all remain `PLANNED`); the placeholder roadmap mentions of these features on `AppHome` and `Landing` are informational only, not implementations. See `FEATURES.md` for the full inventory and `PROJECT_PLAN.md` for what's next (Phase 2 — Account Management).
