# Personal Finance Dashboard

An enterprise-style full-stack app to manage multiple bank accounts, track income/expenses, budget by category, monitor investments, and view overall financial health from one dashboard.

**Project status:** early development. Authentication (register/login/session) is complete end-to-end — real API plus a working frontend — and a design system with a reusable UI component library is in place. Everything past that (accounts, transactions, budgets, investments, reports, notifications, and the real financial dashboard) is still planned, not built. See [`docs/DEV_CONTEXT.md`](docs/DEV_CONTEXT.md) for the live state and [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for the roadmap.

## Documentation

Full project documentation — product context, architecture, style guide, API reference, database schema, decisions log, and more — lives in [`docs/`](docs/README.md). Start there.

## Stack

React + TypeScript (Vite) · Node.js + Express + TypeScript · MongoDB (Mongoose) · JWT + bcrypt · Recharts

## Getting started

Requires Node.js (LTS) and Docker (for local MongoDB).

```bash
# 1. Start MongoDB
docker compose up -d

# 2. Configure environment (generate your own JWT_SECRET; server/.env.example has the full list)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Install dependencies
cd client && npm install && cd ../server && npm install

# 4. Run both apps (separate terminals)
cd client && npm run dev      # http://localhost:5173
cd server && npm run dev      # http://localhost:4000

# 5. Verify
curl http://localhost:4000/api/health

# 6. Try it
# Open http://localhost:5173 — create an account and log in.
# Everything past login (accounts, transactions, budgets, etc.) is still a placeholder roadmap, not real yet.
```

## Repository layout

```
client/   React + TypeScript frontend (Vite)
server/   Express + TypeScript backend API
docs/     Project documentation (read this first)
docker-compose.yml   Local MongoDB for development
```
