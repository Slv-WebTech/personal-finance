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
- Next: Phase 1 — Authentication (register/login/JWT/bcrypt/roles).
