# Architecture

**Status: PLANNED.** Nothing described below is built yet. This is the target architecture, decided so that Phase 0 scaffolding has a concrete shape to build toward rather than being invented ad hoc.

## Folder structure

```
finance-dashboard/
├── client/                    # React + TypeScript, built with Vite
│   ├── src/
│   │   ├── components/        # Shared, reusable UI components
│   │   ├── pages/              # Route-level views
│   │   ├── dashboard/          # Dashboard-specific composite components
│   │   ├── charts/             # Recharts/Chart.js wrapper components
│   │   ├── services/           # axios API client modules, one per resource
│   │   ├── hooks/               # Shared custom hooks (e.g. useAuth)
│   │   ├── context/             # React Context providers (auth/session)
│   │   ├── types/                # Shared TS types/interfaces
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
- **Routing:** React Router (client-side routes per `SITE_MAP.md`). Not yet installed.
- **State management:** React Context + hooks for cross-cutting concerns (auth/session state). Local `useState`/`useReducer` for component-local state. No Redux/Zustand unless a concrete need emerges — avoids an unjustified dependency for a project this size.
- **Data fetching:** `services/` layer wraps axios; components call service functions, never axios directly. This keeps the JWT-attachment and error-normalization logic in one place.
- **Component architecture:** presentational components in `components/` and `charts/`, route-level composition in `pages/` and `dashboard/`. Charts are wrapped so pages depend on a stable internal chart API even if the underlying library choice changes later.

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
