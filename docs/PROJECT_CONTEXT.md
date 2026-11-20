# Project Context

> **Product name: Tallybird** — "Your money, tallied in one place." (The GitHub repo slug stays `personal-finance`.)

## Project name
Personal Finance Dashboard ("Project 30"), shipped under the product name Tallybird

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
**Working MVP, not deployed.** As of 2026-11-20: authentication, accounts, transactions (incl. transfers), budgets, investments and a dashboard summary are implemented end-to-end (API, UI, tests: 99 server + 6 client), with a QA/security hardening pass (`QA-REPORT.md`) and GitHub Actions CI. Not built: reports & charts (Phase 7) and notifications (Phase 8). No production deployment exists; the Docker full-stack setup is unverified. See `DEV_CONTEXT.md` for the live status and `PROJECT_PLAN.md` for the roadmap.

## Technology stack
Locked decisions (see `DECISIONS.md` for rationale):

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript, built with Vite 8; react-router 7; CSS Modules |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Atlas in production) via Mongoose |
| Auth | JWT (access tokens) + bcrypt (password hashing) |
| Charts | Planned: Recharts (primary), Chart.js as a documented fallback — not installed yet |
| HTTP client | axios (frontend services layer) |
| Deployment | Vercel (frontend), Render or Railway (backend), MongoDB Atlas (database) |
| Package manager | npm |
| Testing / CI | Vitest + Supertest (server), Vitest + Testing Library (client), GitHub Actions |

## Major architectural decisions
See `ARCHITECTURE.md` for the full picture and `DECISIONS.md` for the ADR log. In brief: layered Express backend (routes → controllers → models → middleware), REST API (unversioned at launch), JWT-based stateless auth with role-based authorization middleware, React frontend organized by layer (components/pages/services/context/hooks/types) with Context/hooks for state (no Redux unless a concrete need for it emerges).

## Important constraints
- No real bank integration at launch — all account and transaction data is manually entered by the user. Do not claim or imply live Open Banking connectivity anywhere (UI copy, docs, resume material) unless that integration is actually built.
- No real money movement. This is a tracking/analytics tool, not a payments product.
- Solo-developer, portfolio-scoped project — prefer the smallest correct implementation over enterprise infrastructure (no microservices, no Kubernetes, no message queues) unless a genuine need arises.

## Assumptions
- Single currency per account; accounts may use different currencies but nothing is converted (the dashboard groups balances by currency). Real multi-currency support is a future feature.
- Transactions are entered manually or in bulk-import form later — no live bank feed at launch.
- One user record maps to one login; "Financial Advisor" managing multiple customers' data is a future scope question, not assumed to work at launch.

## Dependencies / integrations
Runtime: express, mongoose, zod, bcrypt, jsonwebtoken, helmet, express-rate-limit, cors (server); react, react-router-dom, axios (client). Charting is the main planned addition. Dependencies are added to `package.json` only as they're introduced.

## Current limitations
No reports/charts, notifications, password reset, recurring transactions, CSV import/export, or multi-currency conversion. Advisor/admin roles exist in the data model but nothing uses them. Balance updates are not atomic across a process crash; the JWT lives in `localStorage` for 7 days with no revocation; registration reveals whether an email exists. Full list in `TECHNICAL_DEBT.md`.

## Important terminology
- **Account** — a bank account record (name, type, balance, currency, status) owned by a user.
- **Transaction** — a single money movement: income, expense, transfer, or investment, tied to an account and category.
- **Category** — a spending classification (Food, Transport, Shopping, Utilities, Entertainment, Healthcare, ...) used for both transactions and budgets.
- **Budget** — a monthly, category-scoped spending limit.
- **Investment** — a holding (stock, mutual fund, fixed deposit, crypto, gold) tracked for value and profit/loss.
- **Net Worth** — total assets (account balances + investment values) minus liabilities, if liabilities are modeled.
- **Savings Rate** — (income − expenses) / income for a given period.
- **Budget Usage** — amount spent in a category / that category's budget limit, for the current month.
