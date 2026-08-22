# Dev Context

**This is the live "what's happening right now" doc. Update it after every meaningful session — an agent picking up "continue" reads this file first.**

Last updated: 2026-08-22

## Current objective
Move into Phase 2 (Account Management). Phase 1 (Authentication) is now complete end-to-end — real backend (since 2026-08-17) plus a real, working frontend (as of today) — and a real design system + reusable UI component library now exists as the foundation for all future screens.

## Current development phase
Phase 2 not yet started. Phase 0 (scaffolding), git init, local MongoDB, and Phase 1 (Authentication) are all complete. See `PROJECT_PLAN.md`.

## Current task
None active. Awaiting direction to start Phase 2 (Account Management CRUD).

## Recently completed work
- 2026-08-22: **Premium UI/UX redesign pass** — scoped via explicit user confirmation to design system + Landing page + Auth UI only (not the full product; Accounts/Transactions/Budgets/Investments/Reports/Notifications UI remain unbuilt since their backends are still Phase 2-8 PLANNED work). Built a full design token system (`styles/tokens.css`: light/dark color palette with a new cobalt-blue brand accent replacing the old Vite-template purple, spacing/radius/shadow/typography/motion scales) + `styles/global.css`, adopted CSS Modules as the styling convention (co-located `*.module.css`, no new dependency, plus a small `utils/cx.ts` class-merging helper), and a reusable `components/ui/` library (Button, TextField, Card, Alert, Spinner, Badge, Logo) with a matching new favicon. Wired the previously UI-less Phase 1 auth backend to a real frontend: `AuthContext`/`useAuth`, `authService.ts`, `ProtectedRoute`, rewritten `Login`/`Register`/`Landing` pages, a new `AppHome` post-login page (an honest placeholder/empty-state, explicitly not the real Phase 4 dashboard), and a new `NotFound` page, all wired together in a rewritten `App.tsx` routing tree. Removed unused Vite-template leftovers (`App.css`, `react.svg`, `vite.svg`, `hero.png`, old `icons.svg`). Verified with `tsc -b` (clean), `npm run lint` (clean; one expected/pre-approved oxlint warning on `AuthContext.tsx` for exporting both a context and its provider component), and `npm run build` (succeeds — see Build commands below). Not manually verified in a running browser this session (explicitly skipped at the user's request — no Playwright/Cypress/click-through was done).
- 2026-08-14: Documentation baseline (`/docs` structure), Phase 0 scaffolding (client + server, verified runnable), git init + initial commit, local MongoDB via Docker. See prior entries in this file's git history / `CHANGELOG.md` for detail.
- 2026-08-17: **Documentation sync pass** — user asked to update all docs with current status before further coding. Re-read every `/docs` file and fixed 16 stale "no code exists yet" / "not yet provisioned" claims left over from before the git/MongoDB session.
- 2026-08-17: Completed **Phase 1 — Authentication**: `User` Mongoose model, bcrypt password hashing, JWT sign/verify (7-day expiry), zod request validation, `requireAuth`/`requireRole` middleware, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Split `server/src/app.ts` (Express app factory) out of `server.ts` so tests can import the app without starting a real listener/DB connection. Added Vitest + Supertest (switched from the originally-planned Jest — see `DECISIONS.md`); 10 tests passing (unit: password/JWT; integration: register/login/me against a dedicated `personal-finance-test` database). Manually smoke-tested the full flow against the real dev database via curl (test user cleaned up after). Full doc sync for Phase 1 across `PROJECT_PLAN.md`, `IMPLEMENTED_FEATURES.md`, `FEATURES.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, `ARCHITECTURE.md`, `TESTING.md`, `TECHNICAL_DEBT.md`, `PROJECT_SCORE.md` (2/10 → 3/10), `DECISIONS.md`.
- 2026-08-17: Committed the doc-sync pass + Phase 1 together, then pushed to a new **private GitHub repo** `Slv-WebTech/personal-finance` over the `github-personal` SSH host alias. Caught (via GitHub's contributor view) that both commits carried the machine's global work git identity instead of the personal account — fixed by setting a repo-local identity and rewriting both commits (`git commit-tree`, content verified identical via empty diff) + `git push --force-with-lease`. See `DEPLOYMENT.md`'s "Source control" section and `DECISIONS.md`.

## Files recently changed

**2026-08-22 (UI/UX redesign pass — design system + Landing + Auth UI):**
- New: `client/src/styles/tokens.css`, `client/src/styles/global.css`, `client/src/utils/cx.ts`.
- New (`components/ui/` library): `Button.tsx`, `TextField.tsx`, `Card.tsx`, `Alert.tsx`, `Spinner.tsx`, `Badge.tsx`, `Logo.tsx` + each component's co-located `.module.css`.
- New (layout): `client/src/components/layout/AuthLayout.tsx`, `client/src/components/layout/AppHeader.tsx` + their `.module.css` files.
- New (auth wiring): `client/src/types/auth.ts`, `client/src/services/authService.ts`, `client/src/context/AuthContext.tsx`, `client/src/hooks/useAuth.ts`, `client/src/components/ProtectedRoute.tsx`.
- New (pages): `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`, `client/src/pages/AppHome.tsx`, `client/src/pages/NotFound.tsx` + each page's `.module.css`, plus `client/src/pages/Landing.module.css`.
- New: `client/public/favicon.svg` (replaced — new brand mark).
- Modified: `client/src/App.tsx` (routing rewritten: `/`, `/login`, `/register` public; `/app` wrapped in `ProtectedRoute`; whole tree wrapped in `AuthProvider`), `client/src/pages/Landing.tsx` (rewritten from a 2-line placeholder into a full marketing page), `client/src/index.css` (now just imports `styles/tokens.css` + `styles/global.css`), `client/index.html` (real `<title>`/meta description).
- Deleted (confirmed zero references first): `client/src/App.css`, `client/src/assets/react.svg`, `client/src/assets/vite.svg`, `client/src/assets/hero.png`, `client/public/icons.svg`.
- **Git state: today's redesign changes are all in the working tree, uncommitted** (per the docs-first protocol, docs are updated before the commit). Everything from 2026-08-17 and earlier remains committed and pushed as before (`origin/master` up to date, two commits `c7374f6`/`8d2405a`, both authored as `Slv-WebTech`).

**Phase 1 (2026-08-17):**
- New: `server/src/models/User.ts`, `server/src/utils/password.ts`, `server/src/utils/jwt.ts`, `server/src/utils/validators.ts`, `server/src/middleware/validate.ts`, `server/src/middleware/auth.ts`, `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`, `server/src/app.ts`, `server/src/utils/password.test.ts`, `server/src/utils/jwt.test.ts`, `server/src/routes/auth.routes.test.ts`, `server/vitest.config.ts`, `server/vitest.setup.ts`.
- Modified: `server/src/server.ts` (now just bootstraps `createApp()` + DB connection), `server/package.json` (added `test` script + new deps: `bcrypt`, `jsonwebtoken`, `zod`, `vitest`, `supertest`).
- Docs: see the 2026-08-17 `CHANGELOG.md` entries for the full list.

## Important implementation details
- Stack is locked: MongoDB + Mongoose, TypeScript (client + server), Vite (frontend build), npm, Recharts (primary charts), axios (HTTP client). See `DECISIONS.md`.
- Server uses **native ESM** + `NodeNext` — relative imports need an explicit `.js` extension in `.ts` source (e.g. `from '../models/User.js'`). Not a typo.
- `server/src/app.ts` exports `createApp()` (the Express app, no side effects); `server/src/server.ts` is the thin bootstrap that connects the DB and calls `.listen()`. **Import `createApp` in tests, never import `server.ts`.**
- `server/src/config/db.ts`'s `connectDatabase` is intentionally non-blocking (logs a warning and continues if `MONGODB_URI` is unset) — don't change this into a hard failure without discussing it first.
- **Auth security invariant: `POST /api/auth/register` must never accept a client-supplied `role`.** It always creates a `customer`. This is enforced twice (zod schema doesn't define the field; controller hardcodes it) — don't "simplify" this by trusting `req.body.role`. Advisor/admin account creation is intentionally unbuilt (open product question, see `PROJECT_PLAN.md`).
- JWT expiry is 7 days, no refresh-token flow. `requireRole` exists in `middleware/auth.ts` but has no caller yet — expected to be used starting Phase 2 (ownership checks) or wherever an admin-only route first appears.
- Real MongoDB connection is verified working end-to-end for both the dev database (`personal-finance`) and a separate test database (`personal-finance-test`, used only by the Vitest integration suite, dropped after each run).
- Local MongoDB container `personal-finance-mongo` is expected to already be running (`docker compose up -d` if not — check with `docker ps`).
- **Git identity for this repo is set locally (not global)** to `Slv-WebTech <70682890+Slv-WebTech@users.noreply.github.com>` — verify with `git config user.email` (no `--global`) before committing if this ever looks wrong; the machine's global identity is a different, work, account. Never add a `Co-Authored-By: Claude` trailer to commits in this repo.
- Remote is `origin` → `git@github-personal:Slv-WebTech/personal-finance.git` — push/pull only over the `github-personal` SSH alias, not the default `github.com` host (mapped to a different key on this machine).
- **The `localStorage` key `'token'` now has two consumers, not one:** the pre-existing axios request interceptor in `client/src/services/api.ts`, and (new as of 2026-08-22) `client/src/context/AuthContext.tsx`, which reads it on mount to decide whether to attempt a session-restore (`GET /api/auth/me`) before trusting it. If this key is ever renamed, both call sites must change together or auth will silently break.
- Client styling convention is now locked in: **CSS Modules** (`*.module.css`, co-located next to the component/page that uses them) via Vite's native support — no `styled-components`/`emotion`/Tailwind/etc. was added. Design tokens live in `client/src/styles/tokens.css` (CSS custom properties) and `client/src/styles/global.css` (resets/base styles); `client/src/index.css` just imports both. New components should consume the existing tokens rather than hardcoding colors/spacing.
- `client/src/pages/AppHome.tsx` (the authenticated landing page at `/app`) is intentionally a placeholder/empty-state, not the real dashboard — don't mistake it for Phase 4 completion.

## Known issues
- No automated frontend tests exist yet for the new `Login`/`Register`/`AuthContext` logic — verification today was `tsc -b` + lint + build only, not a test suite (client still has no test runner configured at all, see `TESTING.md`'s "known untested areas" section, tracked separately from this file).
- Today's UI/UX work was not manually verified in a running browser (no Playwright/Cypress/click-through) — explicitly skipped at the user's request.

## Current blockers
None. All prerequisites for Phase 2 (real MongoDB, auth to build ownership checks against, and now a real UI component library to build screens with) are in place.

## Decisions made recently
See `DECISIONS.md` for the full log. Phase 1 additions: Vitest over Jest for backend testing (ESM friction avoidance), registration never accepts a client-supplied `role` (security), 7-day JWT expiry.

## Things that must NOT be changed without user confirmation
- The MongoDB and TypeScript decisions — explicit product/architecture choices made by the user, not defaults.
- Do not claim any feature is `DONE`/`IMPLEMENTED` in `PROJECT_PLAN.md`, `FEATURES.md`, or `IMPLEMENTED_FEATURES.md` without verified, working code (and, since Phase 1, without passing tests where tests are the established norm for that area).
- Don't change `server/src/config/db.ts`'s non-blocking-connect behavior into a hard startup failure without discussing it first.
- Don't let `POST /api/auth/register` accept a client-supplied `role` (see security invariant above).
- Don't push using the default `github.com` SSH host or the machine's global git identity — always `github-personal` + the repo-local `Slv-WebTech` identity (see above). Force-pushing was safe once (brand-new repo, no collaborators) — don't treat that as a standing license; confirm before any future force-push.

## Next recommended action
Begin **Phase 2 — Account Management** (see `PROJECT_PLAN.md`): `Account` Mongoose model per `DATABASE.md`, CRUD routes scoped to the authenticated user (first real use of `requireAuth` + ownership-filtering pattern), tests following the Phase 1 pattern (Vitest unit + Supertest integration against `personal-finance-test`). On the frontend side, build the Accounts UI against the new `components/ui/` library (Button/TextField/Card/Alert/etc.) and design tokens rather than one-off styles, and replace the corresponding "Planned" section of `AppHome.tsx` once the feature is real.

## Commands needed to run the project
- Start local MongoDB: `docker compose up -d` (repo root; container `personal-finance-mongo`)
- Client dev server: `cd client && npm run dev` (Vite, default port 5173, auto-increments if busy)
- Server dev process: `cd server && npm run dev` (tsx watch, port 4000 by default / `$PORT`)
- Client type-check: `cd client && npx tsc -b`
- Client lint: `cd client && npm run lint` (oxlint)
- Client build: `cd client && npm run build`
- Server type-check: `cd server && npx tsc -p tsconfig.json --noEmit`
- Server lint: `cd server && npm run lint`
- Server tests: `cd server && npm test` (Vitest; requires the MongoDB container running)

## Testing commands
- Backend: `cd server && npm test` — 10 tests passing as of 2026-08-17 (see `TESTING.md`).
- Frontend: not available yet — no test runner configured in `client/`.

## Build commands
- Client: `cd client && npm run build` — verified succeeding as of 2026-08-22 (`vite build`: ~299 KB JS / ~97 KB gzip, ~19 KB CSS / ~4 KB gzip).
- Server: `cd server && npm run build` (compiles to `server/dist/`, not yet manually verified end-to-end)

## Deployment commands
Not available yet — no application hosting configured (Vercel/Render/Railway/Atlas). A git remote exists (GitHub, source control only — see `DEPLOYMENT.md`'s "Source control" section), which is separate from deploying the running app. See `DEPLOYMENT.md` for the planned hosting targets.

## Environment requirements
- Node.js (v24 confirmed installed) and npm (v11 confirmed)
- Docker Desktop (confirmed installed and running) — used for local MongoDB via `docker-compose.yml`
- `server/.env` exists locally (gitignored, real dev `JWT_SECRET`) pointing at `mongodb://localhost:27017/personal-finance`; `client/.env` not yet created (copy from `client/.env.example` if `VITE_API_URL` needs overriding — the default already matches the local server)
