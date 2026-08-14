# Project Style Guide

**Status: this is the standard to build against, not a description of existing UI.** No screens exist yet. Follow this guide from the first component onward; update it if a real implementation reveals a better pattern (and note the change in `DECISIONS.md` if it's a meaningful shift).

## UI Style

- **Visual direction:** clean, minimal fintech dashboard — card-based layout, generous whitespace, data-first (numbers and charts are the content, chrome stays quiet).
- **Base component: dashboard card**
  ```css
  .dashboard-card {
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  ```
  Treat this as the baseline card primitive; extend, don't fork it, for variants (e.g. a "stat card," "chart card").
- **Color system:** not finalized. When charts and UI are actually built, run the `dataviz` skill's palette process rather than hand-picking hex values here — this keeps chart colors accessible and consistent across light/dark. Do not hardcode a color palette into this doc speculatively.
- **Typography:** system font stack by default (no custom font loaded) unless a specific need arises — avoids an unnecessary asset dependency for a portfolio project.
- **Spacing:** 20px as the standard card padding (per `.dashboard-card` above); use consistent multiples of 4px/8px for anything else.
- **Border radius:** 10px on cards; smaller (4–6px) on inputs/buttons/badges to keep a visual hierarchy between containers and controls.
- **Shadows:** none by default (border-based separation per `.dashboard-card`); introduce shadow only if flat cards prove hard to distinguish from the page background in dark mode.
- **Buttons / forms / tables / modals / navigation:** no components exist yet — define these concretely as each is first implemented, then move that definition here (not before, to avoid speculative/unused patterns).
- **Loading / empty / error states:** every data-bearing view (dashboard cards, tables, charts) must have explicit loading, empty, and error states before it's considered done — do not ship a bare spinner-only or blank-on-error view.
- **Responsive behavior:**
  ```css
  @media (max-width: 768px) {
    .dashboard-card { width: 100%; }
  }
  ```
  768px is the mobile breakpoint per the product spec; cards go full-width below it.
- **Accessibility expectations:** semantic HTML first (real `<button>`, `<table>`, `<label>` elements), visible focus states, sufficient color contrast (especially for chart colors and alert/error states — verify via the `dataviz` skill's contrast guidance), no color-only signaling for budget-exceeded/alert states (pair with an icon or text).
- **Animations/transitions:** subtle only (hover/focus states, panel open/close). No animation should be load-bearing for understanding the UI.

## UX Style

- **Interaction patterns:** primary actions (add transaction, create budget) should be reachable from the dashboard in one click/tap, not buried in a settings-style menu.
- **Navigation principles:** persistent nav for the core sections (Dashboard, Accounts, Transactions, Budgets, Investments, Reports); role-gated items (e.g. admin) only render for that role.
- **Feedback patterns:** every mutating action (create/edit/delete transaction, account, budget) gives explicit success/failure feedback — no silent failures.
- **Error handling UX:** surface actionable error messages (what went wrong, what to do), never a raw stack trace or generic "Something went wrong" with no next step.
- **Confirmation behavior:** destructive actions (delete account, delete transaction) require an explicit confirm step.
- **Mobile behavior:** full functional parity with desktop at MVP — no mobile-only feature gaps, per the "access from any device" product goal.

## Code Style

- **Language:** TypeScript in both `client/` and `server/` — see `DECISIONS.md`. Avoid `any`; prefer explicit interfaces/types for API request/response shapes, shared where practical.
- **Naming conventions:**
  - Components: `PascalCase` (`AccountCard.tsx`, `BudgetUsageChart.tsx`)
  - Hooks: `camelCase` prefixed with `use` (`useAccounts.ts`)
  - Utilities/services/non-component files: `camelCase` (`formatCurrency.ts`, `transactionService.ts`)
  - Mongoose models: singular `PascalCase` (`Account`, `Transaction`) mapping to pluralized MongoDB collections (Mongoose default)
  - Routes/controllers: resource-named (`accounts.routes.ts`, `accounts.controller.ts`)
- **File naming:** matches the primary export's name; one component per file.
- **Folder conventions:** feature-adjacent within the existing top-level split — see `ARCHITECTURE.md` for the full tree. Don't introduce a new top-level grouping style (e.g. don't mix feature-folders and type-folders) without updating this doc first.
- **Function conventions:** small, single-purpose; financial calculations (savings rate, budget usage, profit/loss) live in pure, independently testable utility functions — never inlined into a component or controller where they can't be unit tested directly.
- **State management:** React Context + hooks for cross-cutting state (auth/session, maybe current-user preferences). Local component state (`useState`) by default otherwise. Do not add Redux, Zustand, or another state library unless a concrete, documented need for it shows up (Rule: don't add dependencies speculatively).
- **API patterns:** REST, JSON bodies, resource-based routes (`/api/accounts`, `/api/transactions`), standard HTTP status codes; error responses use a consistent shape (`{ error: { message, code? } }`) — finalize the exact shape when the first endpoint is built and record it in `API_DOCUMENTATION.md`.
- **Error handling:** centralized Express error-handling middleware on the backend (no per-route try/catch duplicating the same response shape); frontend services layer normalizes errors before they reach components.
- **Validation:** validate all external input at the API boundary (request bodies/params) — use a schema validator (e.g. zod) rather than ad hoc `if` checks, since it pairs naturally with the TypeScript types already in use.
- **Comments:** default to none. Only comment the *why* (a non-obvious constraint, a workaround, a subtle invariant) — never restate what the code already says.
- **Logging:** structured, minimal server-side logging for errors and auth events; no financial data (balances, transaction amounts) in log lines beyond what's needed to debug, and never log passwords or tokens.
- **Testing conventions:** see `TESTING.md`.
