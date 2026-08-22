# Architecture

**Status: PARTIALLY BUILT.** The folder structure, layering (routes → controllers → models → middleware → utils), Express app, error-handling middleware, and non-blocking Mongoose connection exist since Phase 0 (`GET /api/health`). As of Phase 1, authentication is also real: JWT + bcrypt, the `requireAuth`/`requireRole` middleware, and the `users` collection — see `IMPLEMENTED_FEATURES.md`. Accounts, transactions, budgets, investments, dashboard, and notifications are still just the target to build toward, not built.

## Folder structure

```
finance-dashboard/
├── client/                    # React + TypeScript, built with Vite
│   ├── src/
│   │   ├── components/        # Shared, reusable UI components
│   │   │   ├── ui/             # Design-system primitives (Button, TextField, Card, Alert, Spinner, Badge, Logo)
│   │   │   ├── layout/         # Composed layout shells (AuthLayout, AppHeader)
│   │   │   └── ProtectedRoute.tsx  # Route-guard component (routing/auth infra, not shared UI)
│   │   ├── pages/              # Route-level views (Landing, Login, Register, AppHome, NotFound)
│   │   ├── dashboard/          # Dashboard-specific composite components (not yet built)
│   │   ├── charts/             # Recharts/Chart.js wrapper components (not yet built)
│   │   ├── services/           # axios API client modules, one per resource (api.ts, authService.ts)
│   │   ├── hooks/               # Shared custom hooks (useAuth.ts)
│   │   ├── context/             # React Context providers (AuthContext.tsx — auth/session)
│   │   ├── types/                # Shared TS types/interfaces (auth.ts)
│   │   ├── styles/               # Design tokens (tokens.css) and global styles (global.css)
│   │   ├── utils/                # Shared helpers (cx.ts — class-name composition)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/             # Express route definitions per resource
│   │   ├── controllers/        # Request handling, calls into models
│   │   ├── models/              # Mongoose schemas
│   │   ├── middleware/          # auth (JWT verify), role checks, error handler, validation
│   │   ├── utils/                # Pure helper functions (financial calculations, etc.)
│   │   └── server.ts
│   └── package.json
│
└── docs/                       # This documentation set
```

This mirrors the product spec's original structure, adapted for TypeScript (`.tsx`/`.ts` instead of `.js`) and with `src/` subfolders added since that's the Vite/TS convention.

## Frontend architecture
- **Framework:** React + TypeScript, bundled with Vite (chosen over Create React App — see `DECISIONS.md`).
- **Routing:** React Router (`react-router-dom` v7), a real dependency since Phase 0 and in active use — `App.tsx` defines a `<BrowserRouter>`/`<Routes>`/`<Route>` tree for client-side routes per `SITE_MAP.md`.
- **State management:** React Context + hooks for cross-cutting concerns (auth/session state). Local `useState`/`useReducer` for component-local state. No Redux/Zustand unless a concrete need emerges — avoids an unjustified dependency for a project this size.
- **Styling:** CSS Modules (`ComponentName.module.css`, co-located next to each component's `.tsx` file) — no new npm dependency, since Vite supports this natively. Conditional class-name composition goes through a tiny shared helper, `utils/cx.ts` (`cx(...classes: Array<string | false | null | undefined>): string`), which replaces the need for a `classnames`/`clsx` package.
- **Design tokens:** `styles/tokens.css` defines CSS custom properties for the color palette (with a `prefers-color-scheme: dark` override block), plus spacing/radius/shadow/typography/motion scales and a shared focus-ring token. `styles/global.css` holds resets, base element styles, `:focus-visible` treatment, and a reduced-motion override. Both are imported by `index.css`.
- **Types:** `types/auth.ts` holds the shared auth-related types (`AuthUser`, `AuthResponse`, `RegisterPayload`, `LoginPayload`, `ApiFieldError`) plus an `ApiError` class used to normalize every API failure at the services layer.
- **Data fetching:** `services/` layer wraps axios; components call service functions, never axios directly. This keeps the JWT-attachment and error-normalization logic in one place. `services/api.ts` is the shared axios instance (request interceptor attaches the JWT from `localStorage`); `services/authService.ts` (`registerUser`/`loginUser`/`fetchCurrentUser`) wraps it and normalizes every failure — network errors included — into the `ApiError` type before it reaches a component. This is the first real instance of the services-layer error-normalization principle actually being exercised in code, not just planned.
- **Session bootstrap:** on app load, `AuthProvider` (`context/AuthContext.tsx`) checks `localStorage` for a JWT under the key `'token'` (the same key `services/api.ts`'s request interceptor reads/attaches) and, if present, calls `GET /api/auth/me` to validate it before trusting any cached user data; an expired/invalid token is cleared automatically. Only the token is persisted — there is deliberately no separate cached user object in `localStorage`, so the user is always re-fetched fresh from the server on load. `AuthContext.tsx` holds the context object plus the `AuthProvider` component, exposing session state (`user`, a three-state `status: 'loading' | 'authenticated' | 'unauthenticated'`, `login`/`register`/`logout`); the consuming hook lives separately in `hooks/useAuth.ts` so that `AuthContext.tsx` only exports components/context, keeping its exports "component-only" for React Fast Refresh — this is why oxlint's `react/only-export-components` rule flags this file with an expected warning rather than an error.
- **Route guarding:** `components/ProtectedRoute.tsx` guards auth-gated routes (currently just `/app`) — it renders a loading state while the session check is in flight, redirects to `/login` (preserving the originally-requested destination via router state) if unauthenticated, and renders the nested route otherwise. Wired into `App.tsx` as a parent `<Route>` wrapping `/app`, with `AuthProvider` wrapping the whole `<Routes>` tree.
- **Component architecture:** `components/ui/` holds design-system primitives (`Button`, `TextField`, `Card`, `Alert`, `Spinner`, `Badge`, `Logo`); `components/layout/` holds composed layout shells (`AuthLayout` — the split-panel shell for Login/Register — and `AppHeader` — the authenticated area's top bar); `components/ProtectedRoute.tsx` is routing/auth infrastructure rather than shared UI, so it sits at the top level rather than nested under `ui/` or `layout/`. Route-level composition lives in `pages/` — `Login.tsx`, `Register.tsx`, `AppHome.tsx` (an intentionally minimal post-login placeholder, not the real Phase 4 aggregate `/dashboard`, which is still unbuilt), and `NotFound.tsx` (the router's catch-all 404) — and in `dashboard/`. Charts are wrapped so pages depend on a stable internal chart API even if the underlying library choice changes later.
- **Not yet built:** `charts/` and `dashboard/` remain empty — no charting library is installed yet (Recharts remains the locked future choice per `DECISIONS.md`, unchanged), and none of Phase 2-8's backends exist yet either.

## Backend architecture
- **Framework:** Node.js + Express + TypeScript.
- **Layering:** `routes` (HTTP surface, one file per resource) → `controllers` (request/response handling, calls services/models) → `models` (Mongoose schemas) . `middleware` handles cross-cutting concerns (JWT auth, role-based authorization, centralized error handling, request validation). `utils` holds pure functions — critically, financial calculations (savings rate, budget usage, profit/loss) live here so they're independently unit-testable, not embedded in controllers.
- **Validation:** request bodies validated at the route/controller boundary using a schema validator (zod proposed — pairs naturally with TS types; not yet installed).

## Database architecture
- **Database:** MongoDB, accessed via Mongoose ODM.
- **Collections:** `users`, `accounts`, `transactions`, `budgets`, `investments`, `notifications`. Full schema drafts in `DATABASE.md`.
- **Integrity:** MongoDB has no foreign-key constraints, so referential integrity (e.g., a transaction's `accountId` pointing to a real, same-user account) must be enforced at the application layer (Mongoose validation + controller-level ownership checks), not the database layer. This is a deliberate trade-off of the MongoDB choice — see `DECISIONS.md`.

## API architecture
- **Style:** REST, JSON request/response bodies.
- **Versioning:** none at launch (`/api/accounts`, not `/api/v1/accounts`) — matches the product spec's literal examples and the project's scope; can be introduced later if ever needed.
- **Resources:** `/api/auth`, `/api/accounts`, `/api/transactions`, `/api/budgets`, `/api/investments`, `/api/notifications`, `/api/dashboard`. Full endpoint list in `API_DOCUMENTATION.md`.

## Authentication & authorization
- **Authentication:** JWT access tokens, issued on login/register, verified by middleware on protected routes. Passwords hashed with bcrypt before storage; plaintext passwords never stored or logged.
- **Authorization:** role field on the user (`customer` / `advisor` / `admin`) checked by a role-gating middleware for role-restricted routes. Resource-level ownership (a user can only touch their own accounts/transactions) enforced in controllers by filtering queries on the authenticated user's ID — not by trusting client-supplied IDs.

## Data flow
`client/services` (axios, JWT attached via interceptor) → Express route → middleware (auth, validation) → controller → Mongoose model → MongoDB, and back. No server-side rendering; the client is a pure SPA calling a JSON API.

## External services
- **MongoDB Atlas** — hosted database (production). Local MongoDB acceptable for development.
- **Vercel** — frontend static hosting/build.
- **Render or Railway** — backend Node process hosting (final choice deferred to Phase-0/deployment time; both are viable, no code-level difference).
- No other external services (no email provider, no payment processor, no bank-feed integration) are wired in at launch — anything beyond this must be added deliberately and documented, not assumed.

## Deployment architecture
Client built via Vite (`vite build`) and deployed as a static site on Vercel. Server deployed as a long-running Node process on Render/Railway, connecting to MongoDB Atlas over its connection string. Environment variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`) managed via each platform's secret store — never committed. See `DEPLOYMENT.md`.

## Security boundaries
- JWT verification middleware gates all non-public routes.
- bcrypt for password hashing (never reversible encryption, never plaintext).
- Role-based authorization middleware for role-restricted routes; ownership checks in controllers for user-scoped resources.
- Input validation at the API boundary (schema validator) before data reaches a Mongoose model.
- CORS restricted to the deployed frontend origin (not `*`).
- `helmet` (or equivalent) for baseline HTTP security headers — planned, not yet installed.
- Rate limiting on auth routes (register/login) to reduce brute-force risk — planned as a near-term hardening item, not blocking MVP.
