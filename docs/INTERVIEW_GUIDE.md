# Interview Guide

**Status: not yet applicable.** This document only has value once real, working functionality exists to describe — right now there is no implementation, so there are no genuine STAR stories, no real technical challenges overcome, and no verified skills demonstrated. Per this project's own rule ("never exaggerate project experience... do not claim features that were not implemented"), this file stays a structural skeleton until that changes.

**Do not fill in the sections below with hypothetical or planned content presented as if it happened.** Populate each section only after the corresponding work is actually done and verified (cross-reference `IMPLEMENTED_FEATURES.md`).

## How this file gets populated
Update it incrementally, tied to real milestones:
- After Phase 1 (Auth) ships → first real technical-decision write-up (JWT/bcrypt choice) and first skill-matrix entries.
- After Phase 3 (Transactions) ships → first real STAR story candidate (balance-integrity correctness is a genuinely interesting challenge — see `TECHNICAL_DEBT.md`'s pre-emptive risk note on it).
- After Phase 4/5 (Dashboard/Budgets) ship → first real "why this architecture" material (financial calculation design).
- After first deployment (`DEPLOYMENT.md`) → deployment-related interview material.

## Section index (to be filled in as real work lands)
1. Elevator pitch — _pending: no working product to pitch yet_
2. 60-second explanation — _pending_
3. 2–3 minute detailed explanation (problem, solution, architecture, features, challenges, decisions) — _pending; `PROJECT_CONTEXT.md` and `ARCHITECTURE.md` have the planned version of this, but "planned" isn't interview-safe to present as done_
4. STAR stories — _pending: none exist yet; do not draft one for something that hasn't happened_
5. Technical skills demonstrated (skill matrix) — _pending: nothing to cite as evidence yet_
6. Skill impact (before/after per skill) — _pending_
7. Engineering skills growth — _pending_
8. Before vs. after comparison — _pending_
9. Project impact (usage/metrics/qualitative) — _pending: this is a portfolio project with no users; when this section is written, impact should be described qualitatively (what it demonstrates) rather than with invented usage numbers_
10. Resume bullets — _pending: draft only from features that are actually `IMPLEMENTED` per `IMPLEMENTED_FEATURES.md`, with no invented percentages_
11. LinkedIn/portfolio descriptions (short/medium/detailed) — _pending_
12. Common interview questions (beginner/intermediate/advanced) — _pending_
13. Answers to interview questions — _pending_
14. "Why did you choose X?" — the reasoning for the real decisions already exists in `DECISIONS.md` (MongoDB, TypeScript, Vite, Recharts, unversioned REST, axios) and can be turned into interview-ready phrasing at any time, since those decisions are real even though the code isn't built yet.
15. "What was the hardest part?" — _pending: candidate is the account-balance-integrity problem flagged in `TECHNICAL_DEBT.md`, but only becomes a real story once actually solved, not while it's still a predicted risk_
16. "What would you improve?" — can partially draw from `TECHNICAL_DEBT.md` and `FUTURE_FEATURES.md` once there's a real implementation to improve on.
17. "What did you learn?" — _pending_
18. Interview strength score — _pending: scoring this now would just restate `PROJECT_SCORE.md`'s 1/10 baseline_
19. Personal skill growth summary — _pending_
20. Project story (idea → problem → planning → architecture → implementation → challenges → debugging → testing → deployment → current state → future vision) — the **idea → problem → planning → architecture** stages are genuinely complete right now (see `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`); everything from **implementation** onward is not yet real.
21. Standing rule — never claim technologies, features, metrics, users, or performance results that don't actually exist in this project. Applies to every section above, permanently.
