# Deployment

**Status: nothing is deployed to production.** Local development and a Docker Compose full-stack mode exist; the Docker mode has **not yet been verified on a machine with a working Docker engine** (the Dockerfiles and compose profile were written and reviewed but not built end-to-end). Treat it as untested until someone runs it.

## Local development
- **MongoDB only:** `docker compose up -d` at the repo root starts `mongo:7` (container `personal-finance-mongo`, named volume `mongo-data`, published on `127.0.0.1:27017` only — not reachable from other machines). Stop with `docker compose down` (add `-v` only if you intend to wipe local data — destructive).
- **Client/server:** run directly with `npm run dev` in `server/` (port 4000) and `client/` (port 5173). Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` to a random value of **at least 32 characters** — the server refuses to start otherwise.
- Tests need MongoDB too (`cd server && npm test`; override with `TEST_MONGODB_URI`) — see `TESTING.md`.

## Docker full-stack mode (unverified)
```
JWT_SECRET=<32+ random characters> docker compose --profile app up --build
```
- `server` (built from `server/Dockerfile`) listens on `http://localhost:4000`, uses `MONGODB_URI=mongodb://mongo:27017/personal-finance` and `CORS_ORIGIN=http://localhost:8080`.
- `client` (built from `client/Dockerfile`, static build served by nginx using `client/nginx.conf`) is at `http://localhost:8080`.
- Plain `docker compose up -d` (no profile) still starts only MongoDB.
- `JWT_SECRET` defaults to empty in compose, so the server will fail fast if you forget it. Never commit a real secret.
- **Caveat:** the client bundle bakes in `VITE_API_URL` at build time (default `http://localhost:4000/api`); `client/Dockerfile` exposes it as the build argument `VITE_API_URL`, so a deployment on another host needs `--build-arg VITE_API_URL=...`. Not yet verified.

## Source control
- **Remote:** `origin` → `git@github-personal:Slv-WebTech/personal-finance.git` (private GitHub repo). Pushed over SSH via the `github-personal` host alias in `~/.ssh/config` — **not** the default `github.com` host on this machine, which is mapped to a different (work) SSH key.
- **Commit identity:** set locally for this repo (not global) to `Slv-WebTech <70682890+Slv-WebTech@users.noreply.github.com>`.

## Production targets (not yet set up)
| Component | Platform | Notes |
|---|---|---|
| Frontend (`client/`) | Vercel (or the nginx image) | Static build via `vite build`; set `VITE_API_URL` at build time. |
| Backend (`server/`) | Render or Railway (or the Docker image) | Long-running Node process; final platform choice deferred. |
| Database | MongoDB Atlas | Free-tier cluster; same `MONGODB_URI` variable. A replica-set deployment would also unlock multi-document transactions (see `TECHNICAL_DEBT.md`). |

## Environment variables (server)
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. If unset the server starts but skips the DB connection (warning logged) |
| `JWT_SECRET` | Secret used to sign/verify JWTs. **Required, >= 32 characters**, must not be the `.env.example` placeholder; startup fails otherwise |
| `PORT` | Server port (default 4000) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:5173`) |
| `TEST_MONGODB_URI` | Tests only: overrides the test database URI |

Client: `VITE_API_URL` (build time; default `http://localhost:4000/api`). Set secrets via each platform's secret store in production — never commit a real `.env`.

## Production checklist (before a first real deployment)
- Serve over HTTPS only (the 7-day JWT travels in an `Authorization` header and lives in `localStorage`).
- Set `CORS_ORIGIN` to the exact frontend origin; use a strong random `JWT_SECRET`.
- If behind a reverse proxy/load balancer, configure Express `trust proxy` so the login/register rate limiter (20 requests / 15 min / IP) keys on the real client IP. This is not configured today.
- Do not expose MongoDB publicly; use Atlas network allow-lists or a private network.
- Verify the Docker images build and run (first item above).

## CI/CD
CI exists: `.github/workflows/ci.yml` runs type-check, lint, tests (server with a `mongo:7` service) and the client build on every push and PR — see `TESTING.md`. There is no CD step (nothing deploys automatically) and CI does not build the Docker images.

## Current state
A git repository with a private GitHub remote, CI, local MongoDB via Docker, and an unverified full-stack Docker profile. No hosting accounts (Vercel/Render/Railway/Atlas) are connected and no build has been deployed. Do not list a deployed URL here until it is confirmed live.
