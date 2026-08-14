# Feature Inventory

Status legend: `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTING` · `PARTIALLY_IMPLEMENTED` · `BLOCKED` · `DEPRECATED`

All features below are `PLANNED` — none exist yet. See `IMPLEMENTED_FEATURES.md` for the (currently empty) factual record of what's actually verified working.

## Authentication
- **Purpose:** Secure registration/login; role-based access (Customer, Financial Advisor, Administrator).
- **User value:** Protects financial data; enables role-appropriate views.
- **Dependencies:** None (foundational).
- **Status:** PLANNED
- **Related pages:** `/login`, `/register`
- **Related APIs:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

## Account Management
- **Purpose:** CRUD for bank accounts (name, type, balance, currency, status).
- **User value:** Central place to see every account instead of separate bank logins.
- **Dependencies:** Authentication
- **Status:** PLANNED
- **Related pages:** `/accounts`
- **Related APIs:** `/api/accounts`

## Transaction Management
- **Purpose:** Record and manage income, expense, transfer, and investment transactions.
- **User value:** Ground-truth data every other feature (dashboard, budgets, reports) is computed from.
- **Dependencies:** Account Management
- **Status:** PLANNED
- **Related pages:** `/transactions`
- **Related APIs:** `/api/transactions`

## Budget Management
- **Purpose:** Monthly, category-scoped budgets with usage tracking and overspend alerts.
- **User value:** Turns raw transaction data into an actionable spending limit.
- **Dependencies:** Transaction Management
- **Status:** PLANNED
- **Related pages:** `/budgets`
- **Related APIs:** `/api/budgets`

## Financial Dashboard
- **Purpose:** Aggregate view — total balance, monthly income/expenses, savings rate, budget usage, net worth.
- **User value:** The single-glance "how am I doing financially" view — the core product promise.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** PLANNED
- **Related pages:** `/dashboard`
- **Related APIs:** `GET /api/dashboard/summary`

## Investment Tracker
- **Purpose:** Track stocks, mutual funds, fixed deposits, crypto, and gold holdings; profit/loss; portfolio allocation.
- **User value:** Extends the picture beyond cash accounts to full net worth.
- **Dependencies:** Account Management
- **Status:** PLANNED
- **Related pages:** `/investments`
- **Related APIs:** `/api/investments`

## Charts & Reports
- **Purpose:** Income vs. expense, spending trends, budget usage, category breakdown, savings trend, investment growth; PDF/Excel export.
- **User value:** Makes financial data legible at a glance and portable (export) for the user's own records.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** PLANNED
- **Related pages:** `/reports`, chart components embedded in `/dashboard`

## Notifications
- **Purpose:** Alerts for budget overspend, bills due, salary received, investment maturity, unusual spending.
- **User value:** Keeps the user informed without requiring them to check the dashboard proactively.
- **Dependencies:** Transaction Management, Budget Management, Investment Tracker
- **Status:** PLANNED
- **Related pages:** `/notifications`
- **Related APIs:** `/api/notifications`

## Bonus features
See `FUTURE_FEATURES.md` — dark mode, AI spending insights, AI financial assistant, credit score tracking, bill reminder system, multi-currency support, QR code payments, push notifications, financial forecasting, goal-based savings planner. None are in scope until the core features above reach `IMPLEMENTED`.
