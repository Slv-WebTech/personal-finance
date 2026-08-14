# Future Features

Backlog beyond the MVP feature set in `PROJECT_PLAN.md`. None of these should be implemented before the core features (Auth through Notifications) reach `IMPLEMENTED` status in `FEATURES.md`, unless the user explicitly reprioritizes.

## High Priority
- **Dark Mode** — Low implementation complexity relative to user-facing value; mostly a CSS variable/theme-token exercise once the base UI exists. Dependency: base UI components must exist first.
- **Bill Reminder System** — Natural extension of the Notifications feature (reuses the same alert infrastructure). Dependency: Notifications.
- **Multi-Currency Support** — Extends the existing `Account.currency` field into real cross-currency aggregation (conversion rates, display normalization). Dependency: Account Management, Financial Dashboard. Risk: needs a reliable exchange-rate source; adds real complexity to net-worth calculation.

## Medium Priority
- **Financial Forecasting** — Projects future balance/spending from historical transaction data. Dependency: Transaction Management with enough historical data to forecast meaningfully. Risk: forecasting accuracy claims must be presented carefully (this is a portfolio project, not a licensed financial advisory tool).
- **Goal-Based Savings Planner** — Track progress toward a named savings goal. Dependency: Account Management, Financial Dashboard.
- **Push Notifications** — Real browser/device push (vs. in-app only). Dependency: Notifications (in-app) working first; requires a push service (e.g. web push) not yet chosen.
- **Real-Time Notifications** — WebSocket/SSE-based live updates instead of poll-on-load. Dependency: Notifications feature; adds real infrastructure complexity (persistent connections) that should be justified by actual need, not added speculatively.

## Low Priority
- **Credit Score Tracking** — Needs an external credit bureau data source; no such integration is planned or available. High complexity, unclear value without a real data provider.
- **QR Code Payments** — Implies actual payment initiation, which is outside this project's scope (see "no real money movement" constraint in `PROJECT_CONTEXT.md`). Likely stays out of scope entirely unless redefined as a non-functional UI demo only.
- **Audit Logs** — Useful for a real fintech product; lower priority for a portfolio project unless demonstrating compliance-style engineering is a specific goal.

## Experimental
- **AI Spending Insights** — Requires LLM integration and cost/latency tradeoffs not yet evaluated. Validate with a small prototype before committing to it as a real feature.
- **AI Financial Assistant** — Same as above, at higher complexity (conversational, needs access to the user's real financial data — raises real privacy/security design questions that need to be worked out before building it, not after).
- **OCR Receipt Scanning** — Needs an OCR service/library evaluation; unproven value vs. manual entry for this project's scope.
- **Voice Expense Entry** — Novelty feature; needs a browser speech API or third-party service evaluation.
- **Family Expense Sharing** — Significant data-model change (multi-user shared accounts, permissions) — really a distinct feature area, not a small add-on. Would need its own planning pass if pursued.
- **Open Banking API Integration** — Would replace manual transaction entry with real bank feeds. Large scope (aggregator selection, OAuth flows, compliance considerations) — explicitly out of scope for now per `PROJECT_CONTEXT.md` constraints; revisit only as a deliberate, separately-scoped initiative.
- **PWA** — Installable/offline support. Reasonable once the core app is stable; not before.

## Standard practice, not "future features"
Testing and CI/CD (GitHub Actions) are listed as "enhancement ideas" in the original product spec, but they should be built incrementally alongside each phase (see `TESTING.md`, `PROJECT_SCORE.md` recommendations) rather than deferred as bonus polish.
