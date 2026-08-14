# Decisions (ADR Log)

Architecture Decision Record. Append-only in spirit — if a decision is later reversed, add a new entry that supersedes it rather than editing history away.

---

### Decision: Use MongoDB (not PostgreSQL)
**Date:** 2026-08-14
**Context:** The product spec allowed either PostgreSQL or MongoDB.
**Options considered:**
- PostgreSQL — relational, enforces referential integrity and constraints natively; a strong fit for inherently relational data like accounts/transactions/budgets.
- MongoDB — document-based, flexible schema, faster iteration during early modeling.
**Decision:** MongoDB, via Mongoose.
**Reason:** User's explicit choice.
**Consequences:** No foreign-key enforcement at the database layer — referential integrity (e.g., a transaction belonging to the correct user's account) must be enforced in application code (see `ARCHITECTURE.md`, `TECHNICAL_DEBT.md`). Schema flexibility is useful for varying investment types and transaction metadata but requires discipline (Mongoose schema validation) to avoid data inconsistency.

---

### Decision: TypeScript for client and server (not plain JavaScript)
**Date:** 2026-08-14
**Context:** Product spec's example folder structure used `.js` files but didn't specify a language.
**Options considered:** Plain JavaScript (matches spec's literal file names) vs. TypeScript.
**Decision:** TypeScript in both `client/` and `server/`.
**Reason:** User's explicit choice — type safety across API contracts and financial calculations, and a stronger signal for an "enterprise-grade" portfolio project.
**Consequences:** File extensions differ from the spec's literal `App.js`/`server.js` examples (now `.tsx`/`.ts`); adds a build/type-check step to the dev loop.

---

### Decision: Vite over Create React App for the frontend build
**Date:** 2026-08-14
**Context:** Product spec didn't specify a bundler.
**Options considered:** Create React App (matches the spec's implied structure) vs. Vite.
**Decision:** Vite.
**Reason:** CRA is no longer actively maintained/recommended by the React team; Vite is the current standard with a materially faster dev server. Treated as an implementation detail (not a product decision), so made directly rather than asked.
**Consequences:** Entry point is `main.tsx` (Vite convention) rather than `index.js`; minor deviation from the spec's literal file naming, functionally equivalent.

---

### Decision: Recharts as the primary charting library (Chart.js as documented fallback)
**Date:** 2026-08-14
**Context:** Product spec listed both Chart.js and Recharts.
**Options considered:** Chart.js (imperative, canvas-based, needs a React wrapper) vs. Recharts (declarative, React-native components).
**Decision:** Recharts primary; Chart.js may be used for a specific chart type Recharts handles poorly, with that choice documented at the point it's made.
**Reason:** Recharts composes naturally with React + TypeScript without an extra wrapper library; reduces one layer of indirection.
**Consequences:** If a chart type is needed that Recharts genuinely can't do well (e.g. certain radial/gauge charts), Chart.js + `react-chartjs-2` gets added at that point — not preemptively.

---

### Decision: No API versioning at launch
**Date:** 2026-08-14
**Context:** Product spec's example routes (`POST /api/auth/register`) are unversioned.
**Decision:** Routes stay unversioned (`/api/<resource>`), not `/api/v1/<resource>`.
**Reason:** Matches the spec's literal examples; a portfolio-scoped single-client project has no near-term need for parallel API versions.
**Consequences:** If versioning is ever needed later, it's a breaking migration, not a config toggle — acceptable trade-off given the project's scope.

---

### Decision: axios for the frontend HTTP client
**Date:** 2026-08-14
**Context:** Product spec listed a `services/` folder without specifying an HTTP client.
**Decision:** axios, wrapped in `client/src/services/`.
**Reason:** Interceptor support makes it straightforward to centralize JWT attachment and error normalization in one place, per `PROJECT_STYLE.md`'s API pattern conventions.
**Consequences:** One additional dependency vs. using the native `fetch` API; judged worth it for the interceptor ergonomics.

---

### Decision: Server uses native ESM + NodeNext + tsx (not CommonJS/ts-node)
**Date:** 2026-08-14
**Context:** Phase 0 scaffolding needed a concrete module system and TS dev-execution tool; not specified in advance.
**Options considered:** CommonJS + `ts-node`/`ts-node-dev` (older, more examples online) vs. native ESM (`"type": "module"`) + `tsx` (modern, faster, no CJS/ESM interop friction with newer package versions).
**Decision:** ESM (`"type": "module"` in `server/package.json`, `"module": "NodeNext"` in `tsconfig.json`), `tsx watch` for dev, `tsc` for production build.
**Reason:** Avoids CJS/ESM interop issues with dependencies that have dropped CJS builds; `tsx` is faster and simpler than `ts-node-dev` for this use case.
**Consequences:** Relative imports in server source must include the `.js` extension (e.g. `from '../controllers/health.controller.js'`) even though the source file is `.ts` — this is a NodeNext requirement, not a typo, and future files must follow the same pattern.

---

### Decision: Express 5 (not Express 4)
**Date:** 2026-08-14
**Context:** `npm install express` (unpinned) resolved to Express 5.x, which is now npm's default/stable major version.
**Decision:** Keep Express 5 rather than pinning down to 4.
**Reason:** No reason to deliberately install an older major version for a brand-new project; Express 5 has better native async error handling (rejected promises in route handlers are caught automatically), which reduces a class of bug this project would otherwise need to guard against manually in every async controller.
**Consequences:** Some Express 4 tutorials/StackOverflow answers don't directly apply (removed APIs, different error-handling nuances). Keep this in mind if debugging against outdated examples.

---

### Decision: Documentation-first workflow
**Date:** 2026-08-14
**Context:** User provided an explicit project protocol requiring inspection and documentation before any implementation.
**Decision:** Adopted as described — `/docs` structure created and kept synchronized before/alongside all future code changes.
**Reason:** User's explicit, standing instruction for how this project should be run.
**Consequences:** Every future feature follows Understand → Plan → Check consistency → Implement → Verify → Document (see the protocol); documentation must be kept truthful to actual code state, never aspirational.
