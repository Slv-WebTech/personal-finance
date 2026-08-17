# Deployment

**Status: nothing is deployed to production.** Local development infrastructure is set up (see below); this section documents the target production deployment plan for when there's a real feature to deploy.

## Local development
- **MongoDB:** runs via Docker (`docker-compose.yml` at the repo root, `mongo:7` image, named volume `mongo-data` for persistence, exposed on `localhost:27017`). Start with `docker compose up -d`, stop with `docker compose down` (add `-v` only if you intend to wipe local data — that's destructive).
- **Client/server:** run directly with `npm run dev` in each folder (see `README.md` / `DEV_CONTEXT.md` for exact commands) — no containerization for the apps themselves in development.
- Verified 2026-08-14: server connects to the Dockerized MongoDB successfully (`GET /api/health` returned `database: "connected"`).

## Production targets (not yet set up)
| Component | Platform | Notes |
|---|---|---|
| Frontend (`client/`) | Vercel | Static build via `vite build`; connect repo for auto-deploy on push. |
| Backend (`server/`) | Render or Railway | Long-running Node process; final platform choice deferred to when this is actually set up — no code-level difference between the two. |
| Database | MongoDB Atlas | Free-tier cluster; production swaps the local Docker Mongo for this — same `MONGODB_URI` env var, different value. |

## Environment variables (server)
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `PORT` | Server port |
| `CORS_ORIGIN` | Deployed frontend origin, for CORS restriction (see `ARCHITECTURE.md` security boundaries) |

None of these are provisioned yet. Set via each platform's secret store in production — never commit a real `.env`; only commit `server/.env.example` with placeholder values.

## CI/CD
Not set up. Planned: a GitHub Actions workflow running lint + build (+ tests once they exist) on pull requests, before any deploy step. This is listed as a "bonus feature" in the original product spec, but should be treated as standard practice once a remote git repository exists — see `FUTURE_FEATURES.md`.

## Current state
A local git repository exists (initialized 2026-08-14, no remote configured yet) and local MongoDB is running via Docker. No hosting accounts are connected, and no production build has ever been deployed. This section will be rewritten with real URLs and verified deploy steps once a first deployment actually happens — do not list a deployed URL here until it's confirmed live.
