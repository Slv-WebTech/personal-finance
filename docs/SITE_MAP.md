# Site Map

**Status: PARTIALLY IMPLEMENTED.** `/` (Landing), `/login`, `/register`, `/app` (a placeholder post-auth landing page — see below), and the catch-all 404 (`NotFound`) are real, working routes, verified against `client/src/App.tsx` (`tsc -b`/lint/build all clean). Everything else below — `/dashboard` and everything under it, plus `/forgot-password` and `/admin/users` — remains PLANNED and maps the intended application per `PROJECT_CONTEXT.md`'s application flow (Login → Dashboard → Manage Accounts → Add Transactions → Create Budget → Analyze Spending → Financial Reports); none of it has a backend yet (Phase 2-8 all PLANNED in `PROJECT_PLAN.md`). Keep this file synchronized with `client/` routes as they're built.

```
Application
├── Landing (/)                                    [implemented]
├── Authentication
│   ├── Login (/login)                             [implemented]
│   ├── Register (/register)                       [implemented]
│   └── Forgot Password (/forgot-password)        [inferred — not explicit in spec; confirm before building]
├── App Home (/app)                                [implemented — placeholder-only landing page shown right after login/register; protected route (redirects to /login if unauthenticated); NOT part of the Dashboard subtree below — see Notes]
├── Dashboard (/dashboard)
│   ├── Overview (/dashboard)
│   ├── Accounts (/accounts)
│   ├── Transactions (/transactions)
│   ├── Budgets (/budgets)
│   ├── Investments (/investments)
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
| `/app` | App Home | Landing spot right after login/register; honest placeholder — welcome message + a "what's coming" roadmap list (Accounts/Transactions/Budgets/Investments/Reports/Notifications, each tagged "Planned"). **Not the Dashboard Overview below** — see Notes | Customer (any authenticated user) | `AppHome`, `ProtectedRoute` | — | IMPLEMENTED — placeholder only, not the real Phase 4 dashboard |
| `/dashboard` | Overview | Total balance, income/expense, savings rate, budget usage, net worth | Customer, Advisor, Admin | `DashboardCards`, `IncomeExpenseChart` | `GET /api/dashboard/summary` | PLANNED |
| `/accounts` | Accounts | List/create/edit/delete bank accounts | Customer | `AccountList`, `AccountForm` | `GET/POST/PUT/DELETE /api/accounts` | PLANNED |
| `/transactions` | Transactions | List/filter/create/edit/delete transactions | Customer | `TransactionTable`, `TransactionForm` | `GET/POST/PUT/DELETE /api/transactions` | PLANNED |
| `/budgets` | Budgets | Create monthly budgets, view usage | Customer | `BudgetList`, `BudgetUsageChart` | `GET/POST/PUT/DELETE /api/budgets` | PLANNED |
| `/investments` | Investments | Track holdings, profit/loss, allocation | Customer | `InvestmentList`, `AllocationChart` | `GET/POST/PUT/DELETE /api/investments` | PLANNED |
| `/reports` | Reports | Charts + PDF/Excel export | Customer | `ReportCharts`, `ExportButton` | `GET /api/dashboard/summary`, transaction/budget/investment endpoints | PLANNED |
| `/notifications` | Notifications | Alert feed | Customer | `NotificationList` | `GET /api/notifications` | PLANNED |
| `/settings` | Settings | Account preferences (currency, theme, etc.) | Customer | — | Not yet specced | PLANNED |
| `/profile` | Profile | User profile info | Customer, Advisor, Admin | — | `GET /api/auth/me` | PLANNED |
| `/admin/users` | User Management | Admin oversight of users | Admin | — | Not yet specced | PLANNED (scope unconfirmed) |
| `*` (any unmatched path) | Not Found | Real 404 page; previously an unmatched path had no handling at all | Public | `NotFound` | — | IMPLEMENTED |

## Notes
- Advisor-specific views are not mapped — the product scope of what a Financial Advisor sees (see open question in `PROJECT_PLAN.md`) needs to be settled before routes are added for it.
- `/forgot-password` and `/admin/*` are marked "inferred" because they aren't explicitly in the product spec; don't build them on the assumption they're required — confirm scope first.
- `/app` vs. the future `/dashboard`: `/app` is an intentionally minimal, honest placeholder — a page for an authenticated user to land on until the real Phase 4 Overview page (`/dashboard`) exists. They are not the same feature and shouldn't be conflated. Whether `/app` eventually redirects to `/dashboard`, gets replaced by it, or continues to serve some other purpose once Phase 4 ships is an open question, not a decided plan.
