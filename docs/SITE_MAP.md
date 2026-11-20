# Site Map

**Status: PARTIALLY IMPLEMENTED.** Real, working routes (verified against `client/src/App.tsx`): `/` (Landing), `/login`, `/register`, `/app` (post-login home with the dashboard snapshot), `/accounts`, `/transactions`, `/budgets`, `/investments`, and the catch-all 404 (`NotFound`). All except `/`, `/login`, `/register` and `*` are behind `ProtectedRoute` (redirect to `/login`). Still PLANNED: `/reports` (Phase 7), `/notifications` (Phase 8), `/settings`, `/profile`, `/forgot-password`, `/admin/users`, and a standalone `/dashboard`. Keep this file synchronized with `client/` routes as they're built.

```
Application
├── Landing (/)                                    [implemented]
├── Authentication
│   ├── Login (/login)                             [implemented]
│   ├── Register (/register)                       [implemented]
│   └── Forgot Password (/forgot-password)        [inferred — not explicit in spec; confirm before building]
├── App Home (/app)                                [implemented — post-login home: welcome card + "Your snapshot" (dashboard summary) + roadmap links; protected route]
├── Accounts (/accounts)                           [implemented — protected route; full CRUD]
├── Transactions (/transactions)                   [implemented — protected route; full CRUD with balance integrity]
├── Budgets (/budgets)                             [implemented — protected route; month/year picker, live-computed usage]
├── Investments (/investments)                     [implemented — protected route; portfolio summary, allocation %]
├── Dashboard (/dashboard)                         [not built — the snapshot lives on /app]
│   ├── Overview (/dashboard)
│   ├── Reports (/reports)
│   ├── Notifications (/notifications)
│   ├── Settings (/settings)
│   └── Profile (/profile)
└── Admin                                          [inferred from Administrator role; scope not yet defined]
    └── User Management (/admin/users)
```

| Route | Page | Purpose | Access | Key components | API dependencies | Status |
|---|---|---|---|---|---|---|
| `/` | Landing | Real marketing page — hero section, honest "what's being built next" feature-roadmap section, footer | Public | `Landing` | — | IMPLEMENTED |
| `/login` | Login | Real form wired to `POST /api/auth/login`; redirects to `/app` on success or if already authenticated | Public | `Login` | `POST /api/auth/login` | IMPLEMENTED |
| `/register` | Register | Real form wired to `POST /api/auth/register`; client-side password/confirm-password check plus server-side field-error mapping; same redirect behavior as Login | Public | `Register` | `POST /api/auth/register` | IMPLEMENTED |
| `/forgot-password` | Forgot Password | Password reset request | Public | `ForgotPasswordForm` | Not yet specced | PLANNED (unconfirmed) |
| `/app` | App Home | Landing spot after login/register: welcome card, "Your snapshot" (per-currency balances, this month's income/expenses, investment value), and a roadmap list linking to the built pages with Reports/Notifications marked as not built | Customer (any authenticated user) | `AppHome`, `ProtectedRoute` | `GET /api/dashboard/summary` | IMPLEMENTED |
| `/dashboard` | Overview | Fuller dashboard: savings rate, budget usage, net worth, charts | Customer, Advisor, Admin | `DashboardCards`, `IncomeExpenseChart` | `GET /api/dashboard/summary` (exists, smaller than this) | PLANNED (Phase 7) |
| `/accounts` | Accounts | List/create/edit/delete bank accounts, with loading/empty/error states | Customer (protected route) | `Accounts` (uses `AppShell`, `Table`, `Modal`) | `GET/POST /api/accounts`, `GET/PUT/DELETE /api/accounts/:id` | IMPLEMENTED |
| `/transactions` | Transactions | List/filter (account, type — client-side over the first 200)/create/edit/delete transactions incl. transfers with a destination account, with loading/empty/error states; table collapses to stacked cards under 640px | Customer (protected route) | `Transactions` (uses `AppShell`, `Table`, `Modal`, `Select`) | `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id` | IMPLEMENTED |
| `/budgets` | Budgets | Create/edit/delete monthly category budgets; month/year picker; live-computed usage via a progress bar per budget | Customer (protected route) | `Budgets` (uses `AppShell`, `Card` grid, `ProgressBar`, `Modal`) | `GET/POST /api/budgets`, `GET/PUT/DELETE /api/budgets/:id` | IMPLEMENTED |
| `/investments` | Investments | Create/edit/delete holdings; portfolio summary (total value, profit/loss); allocation progress bar per holding | Customer (protected route) | `Investments` (uses `AppShell`, `Card` grid, `ProgressBar`, `Modal`) | `GET/POST /api/investments`, `GET/PUT/DELETE /api/investments/:id` | IMPLEMENTED |
| `/reports` | Reports | Charts + PDF/Excel export | Customer | `ReportCharts`, `ExportButton` | `GET /api/dashboard/summary`, transaction/budget/investment endpoints | PLANNED |
| `/notifications` | Notifications | Alert feed | Customer | `NotificationList` | `GET /api/notifications` | PLANNED |
| `/settings` | Settings | Account preferences (currency, theme, etc.) | Customer | — | Not yet specced | PLANNED |
| `/profile` | Profile | User profile info | Customer, Advisor, Admin | — | `GET /api/auth/me` | PLANNED |
| `/admin/users` | User Management | Admin oversight of users | Admin | — | Not yet specced | PLANNED (scope unconfirmed) |
| `*` (any unmatched path) | Not Found | Real 404 page; previously an unmatched path had no handling at all | Public | `NotFound` | — | IMPLEMENTED |

## Notes
- Advisor-specific views are not mapped — the product scope of what a Financial Advisor sees (see open question in `PROJECT_PLAN.md`) needs to be settled before routes are added for it.
- `/forgot-password` and `/admin/*` are marked "inferred" because they aren't explicitly in the product spec; don't build them on the assumption they're required — confirm scope first.
- `/app` vs. a future `/dashboard`: `/app` currently hosts the snapshot. Whether a richer `/dashboard` (Phase 7) replaces it, or `/app` redirects there, is an open question, not a decided plan.
