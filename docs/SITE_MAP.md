# Site Map

**Status: PLANNED.** Only `/` (a placeholder `Landing` page, wired via React Router in Phase 0) exists in code. Everything else below maps the intended application per `PROJECT_CONTEXT.md`'s application flow (Login → Dashboard → Manage Accounts → Add Transactions → Create Budget → Analyze Spending → Financial Reports). Keep this file synchronized with `client/` routes as they're built.

```
Application
├── Landing (/)
├── Authentication
│   ├── Login (/login)
│   ├── Register (/register)
│   └── Forgot Password (/forgot-password)        [inferred — not explicit in spec; confirm before building]
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
| `/` | Landing | Marketing/entry page | Public | `Landing` | — | PLACEHOLDER — page exists (`client/src/pages/Landing.tsx`), routed via React Router, but has no real content yet |
| `/login` | Login | Authenticate existing user | Public | `LoginForm` | `POST /api/auth/login` | PLANNED |
| `/register` | Register | Create new account | Public | `RegisterForm` | `POST /api/auth/register` | PLANNED |
| `/forgot-password` | Forgot Password | Password reset request | Public | `ForgotPasswordForm` | Not yet specced | PLANNED (unconfirmed) |
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

## Notes
- Advisor-specific views are not mapped — the product scope of what a Financial Advisor sees (see open question in `PROJECT_PLAN.md`) needs to be settled before routes are added for it.
- `/forgot-password` and `/admin/*` are marked "inferred" because they aren't explicitly in the product spec; don't build them on the assumption they're required — confirm scope first.
