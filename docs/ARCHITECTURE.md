# Architecture

**Status: BUILT for Phases 0-6 (auth, accounts, transactions, budgets, investments, dashboard snapshot).** Reports/charts (Phase 7) and notifications (Phase 8) are not built. The layering is routes -> controllers -> models, with middleware and pure `utils`; the client is a React SPA calling the JSON API. See `IMPLEMENTED_FEATURES.md` for verified detail.

## Folder structure

```
personal-finance/
├── client/                    # React + TypeScript, built with Vite
│   ├── src/
│   │   ├── components/        # Shared, reusable UI components
│   │   │   ├── ui/             # Design-system primitives (Button, TextField, Card, Alert, Spinner, Badge, Logo, Modal, Table, Select, ProgressBar)
│   │   │   ├── layout/         # Layout shells (AuthLayout, AppHeader, AppShell)
│   │   │   └── ProtectedRoute.tsx  # Route-guard component (routing/auth infra, not shared UI)
│   │   ├── pages/              # Route-level views (Landing, Login, Register, AppHome, Accounts, Transactions, Budgets, Investments, NotFound)
│   │   ├── charts/             # Planned: chart wrappers for Phase 7 (not yet built)
│   │   ├── services/           # axios API client modules, one per resource (api.ts, httpError.ts, auth/account/transaction/budget/investment/dashboard services)
│   │   ├── hooks/               # Shared custom hooks (useAuth.ts)
│   │   ├── context/             # React Context providers (AuthContext.tsx — auth/session)
│   │   ├── types/                # Shared TS types/interfaces (auth, api, account, transaction, budget, investment, dashboard)
│   │   ├── styles/               # Design tokens (tokens.css) and global styles (global.css)
│   │   ├── utils/                # Shared helpers (cx.ts — class-name composition)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile, nginx.conf
│   └── package.json
│
├── server/                    # Express + Mongoose, TypeScript, native ESM
│   ├── src/
│   │   ├── app.ts              # createApp(): CORS, helmet, body limit, rate limit, routes, error handler
│   │   ├── config/             # db.ts (non-blocking Mongoose connect)
│   │   ├── routes/             # Express route definitions per resource
│   │   ├── controllers/        # Request handling, calls into models
│   │   ├── models/              # Mongoose schemas
│   │   ├── middleware/          # auth (JWT verify), role checks, error handler, validation
│   │   ├── utils/                # Pure helper functions (financial calculations, etc.)
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
│
├── .github/workflows/ci.yml   # CI: server (tsc, lint, tests w/ mongo:7) + client (lint, tests, build)
├── docker-compose.yml         # MongoDB; `app` profile also runs server + client
└── docs/                       # This documentation set
```

This mirrors the product spec's original structure, adapted for TypeScript (`.tsx`/`.ts` instead of `.js`) and with `src/` subfolders added since that's the Vite/TS convention.

## Frontend architecture
- **Framework:** React 19 + TypeScript, bundled with Vite 8 (chosen over Create React App — see `DECISIONS.md`).
- **Routing:** React Router (`react-router-dom` v7) — `App.tsx` defines the route tree per `SITE_MAP.md` (public: `/`, `/login`, `/register`; protected: `/app`, `/accounts`, `/transactions`, `/budgets`, `/investments`; catch-all 404).
- **State management:** React Context + hooks for cross-cutting concerns (auth/session state). Local `useState`/`useReducer` for component-local state. No Redux/Zustand unless a concrete need emerges — avoids an unjustified dependency for a project this size.
- **Styling:** CSS Modules (`ComponentName.module.css`, co-located next to each component's `.tsx` file) — no new npm dependency, since Vite supports this natively. Conditional class-name composition goes through a tiny shared helper, `utils/cx.ts` (`cx(...classes: Array<string | false | null | undefined>): string`), which replaces the need for a `classnames`/`clsx` package.
- **Design tokens:** `styles/tokens.css` defines CSS custom properties for the color palette (with a `prefers-color-scheme: dark` override block), plus spacing/radius/shadow/typography/motion scales and a shared focus-ring token. `styles/global.css` holds resets, base element styles, `:focus-visible` treatment, and a reduced-motion override. Both are imported by `index.css`.
- **Types:** `types/auth.ts` holds the shared auth-related types (`AuthUser`, `AuthResponse`, `RegisterPayload`, `LoginPayload`, `ApiFieldError`) plus an `ApiError` class used to normalize every API failure at the services layer.
- **Data fetching:** `services/` layer wraps axios; components call service functions, never axios directly. This keeps the JWT-attachment and error-normalization logic in one place. `services/api.ts` is the shared axios instance (request interceptor attaches the JWT from `localStorage`); `services/authService.ts` (`registerUser`/`loginUser`/`fetchCurrentUser`) wraps it and normalizes every failure — network errors included — into the `ApiError` type before it reaches a component. This is the first real instance of the services-layer error-normalization principle actually being exercised in code, not just planned.
- **Session bootstrap:** on app load, `AuthProvider` (`context/AuthContext.tsx`) checks `localStorage` for a JWT under the key `'token'` (the same key `services/api.ts`'s request interceptor reads/attaches) and, if present, calls `GET /api/auth/me` to validate it before trusting any cached user data; the stored token is cleared only when `/me` answers 401 or 404 — a network failure, 429 or 5xx leaves it in place so a blip doesn't log the user out. Only the token is persisted — there is deliberately no separate cached user object in `localStorage`, so the user is always re-fetched fresh from the server on load. `AuthContext.tsx` holds the context object plus the `AuthProvider` component, exposing session state (`user`, a three-state `status: 'loading' | 'authenticated' | 'unauthenticated'`, `login`/`register`/`logout`); the consuming hook lives separately in `hooks/useAuth.ts` so that `AuthContext.tsx` only exports components/context, keeping its exports "component-only" for React Fast Refresh — this is why oxlint's `react/only-export-components` rule flags this file with an expected warning rather than an error.
- **Route guarding:** `components/ProtectedRoute.tsx` guards every auth-gated route (`/app`, `/accounts`, `/transactions`, `/budgets`, `/investments`) — it renders a loading state while the session check is in flight, redirects to `/login` (preserving the originally-requested destination via router state) if unauthenticated, and renders the nested route otherwise. Wired into `App.tsx` as a parent `<Route>` wrapping `/app`, as a layout route wrapping them, with `AuthProvider` wrapping the whole `<Routes>` tree.
- **Component architecture:** `components/ui/` holds design-system primitives (`Button`, `TextField`, `Card`, `Alert`, `Spinner`, `Badge`, `Logo`, `Modal` — focus trap, focus restore, Escape/backdrop close —, `Table` — stacked cards under 640px —, `Select`, `ProgressBar`); `components/layout/` holds layout shells (`AuthLayout`, `AppHeader`, and `AppShell` — header + nav + content for every authenticated page); `components/ProtectedRoute.tsx` is routing/auth infrastructure rather than shared UI, so it sits at the top level rather than nested under `ui/` or `layout/`. Route-level composition lives in `pages/` — `Login.tsx`, `Register.tsx`, `AppHome.tsx` (post-login home with the dashboard "Your snapshot" card), the four resource pages, and `NotFound.tsx`. Charts are wrapped so pages depend on a stable internal chart API even if the underlying library choice changes later.
- **Not yet built:** `charts/` — no charting library is installed (Recharts remains the planned choice per `DECISIONS.md`); no client-side pagination/search UI (the transactions page loads the first 200 and filters in the browser).

## Backend architecture
- **Framework:** Node.js + Express + TypeScript.
- **Layering:** `routes` (HTTP surface, one file per resource) → `controllers` (request/response handling, ownership checks, balance updates) → `models` (Mongoose schemas) . `middleware` handles cross-cutting concerns (JWT auth, role-based authorization, centralized error handling, request validation). `utils` holds pure functions — critically, financial calculations (savings rate, budget usage, profit/loss) live here so they're independently unit-testable, not embedded in controllers.
- **Validation:** request bodies validated by zod schemas (`utils/validators.ts`, applied via `middleware/validate.ts`) before reaching controllers; bounds on lengths, money, currency and passwords are listed in `API_DOCUMENTATION.md`. Failures return 400 with the zod issues.
- **Startup:** `server.ts` refuses to start unless `JWT_SECRET` is >= 32 chars, connects to MongoDB (non-blocking: logs and continues if unavailable), listens, and shuts down gracefully on SIGINT/SIGTERM.
- **Errors:** `middleware/errorHandler.ts` logs the error and returns a generic `500 Internal server error` (4xx from body parsing become 400/413); internals are never sent to clients.
- **Money integrity:** balance changes are applied as per-document aggregation-pipeline updates rounded to cents, with a compensating reverse update if the transaction write fails (no multi-document transaction — standalone Mongo; see `DECISIONS.md`). Budget usage and dashboard figures are computed at read time with aggregations, never stored.

## Database architecture
- **Database:** MongoDB, accessed via Mongoose ODM.
- **Collections:** `users`, `accounts`, `transactions`, `budgets`, `investments`, `notifications`. Full schema drafts in `DATABASE.md`.
- **Integrity:** MongoDB has no foreign-key constraints, so referential integrity (e.g., a transaction's `accountId` pointing to a real, same-user account) must be enforced at the application layer (Mongoose validation + controller-level ownership checks), not the database layer. This is a deliberate trade-off of the MongoDB choice — see `DECISIONS.md`.

## API architecture
- **Style:** REST, JSON request/response bodies.
- **Versioning:** none at launch (`/api/accounts`, not `/api/v1/accounts`) — matches the product spec's literal examples and the project's scope; can be introduced later if ever needed.
- **Resources:** `/api/health`, `/api/auth`, `/api/accounts`, `/api/transactions`, `/api/budgets`, `/api/investments`, `/api/dashboard` (implemented); `/api/notifications` (planned). Full endpoint list in `API_DOCUMENTATION.md`.

## Authentication & authorization
- **Authentication:** JWT access tokens (7-day expiry, no refresh/revocation; stored client-side in `localStorage`), issued on login/register, verified by `requireAuth` on protected routes. Passwords hashed with bcrypt before storage; plaintext passwords never stored or logged.
- **Authorization:** role field on the user (`customer` / `advisor` / `admin`) with a `requireRole` middleware that exists but is not used by any route yet; registration only ever creates `customer`. Resource-level ownership (a user can only touch their own accounts/transactions) enforced in controllers by filtering queries on the authenticated user's ID — not by trusting client-supplied IDs.

## Data flow
`client/services` (axios, JWT attached via interceptor) → Express route → middleware (auth, validation) → controller → Mongoose model → MongoDB, and back. No server-side rendering; the client is a pure SPA calling a JSON API.

## External services
- **MongoDB Atlas** — hosted database (production). Local MongoDB acceptable for development.
- **Vercel** — frontend static hosting/build.
- **Render or Railway** — backend Node process hosting (final choice deferred to Phase-0/deployment time; both are viable, no code-level difference).
- No other external services (no email provider, no payment processor, no bank-feed integration) are wired in at launch — anything beyond this must be added deliberately and documented, not assumed.

## Deployment architecture
Client built via Vite (`vite build`) and deployed as a static site on Vercel. Server deployed as a long-running Node process on Render/Railway, connecting to MongoDB Atlas over its connection string. Environment variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`) managed via each platform's secret store — never committed. Docker images (`server/Dockerfile`, `client/Dockerfile` + nginx) and a compose `app` profile exist but are unverified. See `DEPLOYMENT.md`.

## Security boundaries
- JWT verification (`requireAuth`) gates every non-public route; `JWT_SECRET` must be >= 32 characters or the server won't start.
- bcrypt for password hashing; login timing equalised for unknown emails.
- Ownership enforced in controllers by filtering every query on the authenticated user's id; cross-user access returns 404.
- Input validation (zod) at the API boundary with length/magnitude bounds; JSON body limit 100 kb; mass-assignment prevented (`userId`/`role`/`_id` never taken from the client; account `balance` not updatable via PUT).
- `helmet` HTTP security headers; CORS restricted to `CORS_ORIGIN` (not `*`).
- Rate limit on `POST /api/auth/login` and `/register`: 20 requests / 15 min / IP (429). `trust proxy` is not configured yet (see `DEPLOYMENT.md`).
- Generic 500 responses; MongoDB published on `127.0.0.1` only in docker-compose.
- Known gaps: 7-day token in `localStorage` with no revocation, registration reveals existing emails, CSRF protection would be needed if cookies are adopted. See `TECHNICAL_DEBT.md`.
