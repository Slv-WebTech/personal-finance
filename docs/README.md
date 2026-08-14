# Documentation Index — Personal Finance Dashboard

This directory is the durable source of truth for the project. If the conversation history that produced these docs is lost, this directory alone should be enough for a new developer or AI agent to understand the project and continue it correctly.

**Project status as of 2026-08-14: pre-implementation.** No application code exists yet. Everything described in these docs (beyond the docs themselves) is a plan, not a fact. See `PROJECT_PLAN.md` and `DEV_CONTEXT.md` for what happens next.

## Reading order for a new agent/developer

1. `PROJECT_CONTEXT.md` — what this project is and why
2. `DEV_CONTEXT.md` — current state, in-progress work, next action
3. `PROJECT_PLAN.md` — roadmap (Completed / In Progress / Next / Later / Blocked)
4. `ARCHITECTURE.md` — how the system is (to be) built
5. `PROJECT_STYLE.md` — UI/UX/code conventions to follow
6. Everything else, as needed for the task at hand

## File index

| File | Purpose |
|---|---|
| `PROJECT_CONTEXT.md` | Product vision, users, stack, constraints |
| `PROJECT_PLAN.md` | Roadmap with status per feature |
| `PROJECT_STYLE.md` | UI, UX, and code style guide |
| `PROJECT_SCORE.md` | Honest quality scorecard, updated over time |
| `DEV_CONTEXT.md` | Live "what's happening right now" doc |
| `SITE_MAP.md` | Route-by-route application map |
| `ARCHITECTURE.md` | Technical architecture and data flow |
| `FEATURES.md` | Full feature inventory with status |
| `IMPLEMENTED_FEATURES.md` | Only what is verified working, factually |
| `FUTURE_FEATURES.md` | Backlog beyond MVP, prioritized |
| `TECHNICAL_DEBT.md` | Known shortcuts, gaps, risks |
| `DECISIONS.md` | ADR-style log of significant technical decisions |
| `API_DOCUMENTATION.md` | REST endpoint reference |
| `DATABASE.md` | MongoDB collection schemas and indexes |
| `TESTING.md` | Testing strategy and commands |
| `DEPLOYMENT.md` | Deployment targets and process |
| `CHANGELOG.md` | Human-readable development history |
| `INTERVIEW_GUIDE.md` | Interview prep, populated as real work lands |

## Maintenance rule

After any meaningful development session, update `DEV_CONTEXT.md` and `CHANGELOG.md` at minimum, plus whichever other docs the change actually affects. Do not let this directory describe a state the code hasn't reached.
