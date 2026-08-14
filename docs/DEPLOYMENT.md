# Deployment

**Status: nothing is deployed.** This documents the target deployment plan for when Phase 0+ produces something deployable.

## Targets
| Component | Platform | Notes |
|---|---|---|
| Frontend (`client/`) | Vercel | Static build via `vite build`; connect repo for auto-deploy on push once a remote repo exists. |
| Backend (`server/`) | Render or Railway | Long-running Node process; final platform choice deferred to when this is actually set up — no code-level difference between the two. |
| Database | MongoDB Atlas | Free-tier cluster sufficient for a portfolio project's traffic. |

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
No git repository exists yet (this working directory is not currently version-controlled), no hosting accounts are connected, and no build has ever been produced. This section will be rewritten with real URLs and verified deploy steps once a first deployment actually happens — do not list a deployed URL here until it's confirmed live.
