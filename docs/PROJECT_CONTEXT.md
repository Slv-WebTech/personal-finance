# Project Context

## Project name
Personal Finance Dashboard ("Project 30")

## Purpose
A full-stack web application that lets an individual manage multiple bank accounts, track income and expenses, set monthly budgets, monitor investments, and view their overall financial health from a single dashboard.

## Problem being solved
Personal finances are typically scattered across multiple bank accounts, investment platforms, and mental math. There is no single place to see total balance, spending against budget, and net worth trends at a glance. This project consolidates that view manually (via user-entered data — see Assumptions) into one dashboard.

## Target users
Individual consumers managing personal finances. Three roles are modeled:
- **Customer** — manages their own accounts, transactions, budgets, investments.
- **Financial Advisor** — (role exists in the data model; scope of what an advisor can see/do across customers is not yet defined — see Open Questions in `DECISIONS.md` / raise before implementing advisor-specific views).
- **Administrator** — platform administration (user management, system oversight). Scope not yet detailed.

## Primary use cases
- Register and log in securely
- Add and manage multiple bank accounts (savings, checking, etc.)
- Record income, expense, transfer, and investment transactions
- View a consolidated financial dashboard (balance, income, expenses, savings rate, net worth)
- Create monthly, category-based budgets and track usage against them
- Track an investment portfolio (stocks, mutual funds, fixed deposits, crypto, gold) with profit/loss
- Receive alerts (budget exceeded, bills due, unusual spending, etc.)

## Product vision
A portfolio-grade project that mirrors a real fintech product closely enough to demonstrate enterprise-style full-stack engineering: secure auth, financial data modeling, analytics, budgeting logic, and dashboard-grade data visualization — built and documented to production standards, not a toy CRUD demo.

## Current project status
**Pre-implementation.** As of 2026-08-14, the working directory contains only this `/docs` structure. No client or server code, no database, no deployment exists yet. See `DEV_CONTEXT.md` for the live status and `PROJECT_PLAN.md` for the roadmap.

## Technology stack
Locked decisions (see `DECISIONS.md` for rationale):

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript, built with Vite |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Atlas in production) via Mongoose |
| Auth | JWT (access tokens) + bcrypt (password hashing) |
| Charts | Recharts (primary), Chart.js as a documented fallback for chart types Recharts doesn't cover well |
| HTTP client | axios (frontend services layer) |
| Deployment | Vercel (frontend), Render or Railway (backend), MongoDB Atlas (database) |
| Package manager | npm |

## Major architectural decisions
See `ARCHITECTURE.md` for the full picture and `DECISIONS.md` for the ADR log. In brief: layered Express backend (routes → controllers → models → middleware), REST API (unversioned at launch), JWT-based stateless auth with role-based authorization middleware, React frontend organized by feature (components/pages/dashboard/charts/services) with Context/hooks for state (no Redux unless a concrete need for it emerges).

## Important constraints
- No real bank integration at launch — all account and transaction data is manually entered by the user. Do not claim or imply live Open Banking connectivity anywhere (UI copy, docs, resume material) unless that integration is actually built.
- No real money movement. This is a tracking/analytics tool, not a payments product.
- Solo-developer, portfolio-scoped project — prefer the smallest correct implementation over enterprise infrastructure (no microservices, no Kubernetes, no message queues) unless a genuine need arises.

## Assumptions
- Single currency per account at launch; multi-currency *support* (i.e., displaying/aggregating across different account currencies) is a future feature, not MVP.
- Transactions are entered manually or in bulk-import form later — no live bank feed at launch.
- One user record maps to one login; "Financial Advisor" managing multiple customers' data is a future scope question, not assumed to work at launch.

## Dependencies / integrations
None yet installed. Planned third-party dependencies are listed per-layer in `ARCHITECTURE.md` and will be added to `package.json` as they're actually introduced (not speculatively).

## Current limitations
Everything is a limitation right now: there is no working software. This section should be rewritten once an MVP exists to describe real, current limitations (e.g., "no recurring transactions yet," "no CSV export yet").

## Important terminology
- **Account** — a bank account record (name, type, balance, currency, status) owned by a user.
- **Transaction** — a single money movement: income, expense, transfer, or investment, tied to an account and category.
- **Category** — a spending classification (Food, Transport, Shopping, Utilities, Entertainment, Healthcare, ...) used for both transactions and budgets.
- **Budget** — a monthly, category-scoped spending limit.
- **Investment** — a holding (stock, mutual fund, fixed deposit, crypto, gold) tracked for value and profit/loss.
- **Net Worth** — total assets (account balances + investment values) minus liabilities, if liabilities are modeled.
- **Savings Rate** — (income − expenses) / income for a given period.
- **Budget Usage** — amount spent in a category / that category's budget limit, for the current month.
