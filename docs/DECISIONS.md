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

### Decision: Local MongoDB via Docker (not Atlas) for development
**Date:** 2026-08-14
**Context:** Needed a working `MONGODB_URI` to move past Phase 0. Docker Desktop was confirmed installed and running on this machine; no local MongoDB binary was installed.
**Options considered:** MongoDB Atlas free-tier cluster (matches the production target in `DEPLOYMENT.md`, but requires the user to sign up/log in and create a cluster in the browser — not something that can be done on their behalf) vs. a local MongoDB container via Docker Compose (no account needed, works immediately, easy to reset/wipe).
**Decision:** Docker (`docker-compose.yml`, `mongo:7`, named volume `mongo-data`, port 27017).
**Reason:** User's explicit choice.
**Consequences:** Local dev now depends on Docker Desktop being installed and running. Production still targets MongoDB Atlas (see `DEPLOYMENT.md`) — switching environments is just a different `MONGODB_URI` value, no code change. `docker compose down -v` would destroy local data (the named volume) — not something to run casually.

---

### Decision: Vitest (not Jest) for backend testing
**Date:** 2026-08-17
**Context:** `TESTING.md` originally specified Jest + Supertest for the backend, written before the Phase 0 decision to use native ESM + NodeNext on the server. Jest's ESM support is still experimental/flag-gated and known to cause friction with NodeNext-resolved TypeScript.
**Options considered:** Jest + Supertest (as originally planned, but fighting the server's module system) vs. Vitest + Supertest (zero-config ESM/TS support, same assertion/mocking ergonomics).
**Decision:** Vitest + Supertest for the backend (Supertest itself is unchanged — it's test-runner agnostic).
**Reason:** Avoids a real, known class of configuration pain for no offsetting benefit; Vitest is already the plan for frontend component tests (`TESTING.md`), so this also reduces the number of distinct test runners in the project from two to one.
**Consequences:** `server/vitest.config.ts` + `server/vitest.setup.ts` added. Test command is `npm test` → `vitest run`. `TESTING.md` updated to match.

---

### Decision: Registration never accepts a client-supplied `role`
**Date:** 2026-08-17
**Context:** The `User` model has a `role` field (`customer` \| `advisor` \| `admin`) per `DATABASE.md`, and `POST /api/auth/register` is a public, unauthenticated endpoint.
**Options considered:** Accept `role` in the register payload (lets a caller self-assign `admin` — a privilege-escalation vulnerability) vs. always hardcode `role: 'customer'` server-side, ignoring anything the client sends.
**Decision:** Always `customer`. The `registerSchema` (zod) doesn't even define a `role` field, so it's stripped before the controller runs; the controller also hardcodes `role: 'customer'` independently as a second layer of defense.
**Reason:** A public registration endpoint must never be able to mint a privileged account. This is a correctness/security requirement, not a style preference.
**Consequences:** There is currently no way to create an `advisor` or `admin` account at all. This is intentional, not a bug — it's flagged as an open product question in `PROJECT_PLAN.md` ("what can a Financial Advisor / Administrator actually do") and must be answered with a real, deliberately-scoped provisioning mechanism (e.g. an admin-only invite endpoint, a manual DB seed, etc.) before those roles are usable — not by quietly opening up the public register endpoint.

---

### Decision: JWT expiry of 7 days
**Date:** 2026-08-17
**Context:** `signToken` needed a concrete expiry; not specified anywhere in prior docs.
**Decision:** 7 days, no refresh-token mechanism yet.
**Reason:** Reasonable default for a portfolio project — long enough to not be annoying during development/demoing, short enough to not be a glaring security smell in an interview conversation about the project.
**Consequences:** No silent re-authentication — once a token expires, the client must log in again. If session UX becomes a real concern later, a refresh-token flow is the natural next step (not built, not currently planned).

---

### Decision: GitHub remote on the personal account, via a dedicated SSH host alias and repo-local commit identity
**Date:** 2026-08-17
**Context:** This machine has both a work and a personal GitHub identity configured in `~/.ssh/config` (`github-work`/`github-personal` aliases, plus a default `github.com` host mapped to the work key) and a global git config defaulting to the work name/email. The user wanted this project pushed to their personal GitHub account (`Slv-WebTech`).
**Options considered:** Push via the default `github.com` SSH host (simpler, but would authenticate as — and by default commit as — the work identity) vs. explicitly using the `github-personal` host alias plus a repo-local `git config user.name`/`user.email` override.
**Decision:** Remote is `git@github-personal:Slv-WebTech/personal-finance.git`; commit identity is set locally in this repo only (`Slv-WebTech <70682890+Slv-WebTech@users.noreply.github.com>`, the account's GitHub-provided noreply address) — the machine's global git config is untouched.
**Reason:** The first two commits were accidentally pushed under the work identity (global git config default) before this was caught via GitHub's contributor view; rewriting was needed. Getting this right at the remote/identity level prevents it from recurring on every future commit in this repo.
**Consequences:** The two initial commits were rewritten (`git commit-tree`, preserving trees/dates/messages exactly) and force-pushed (`--force-with-lease`) — safe here since the repo was brand new with no other collaborators. Commits in this repo also never carry a `Co-Authored-By: Claude` trailer, overriding the general convention. See `DEPLOYMENT.md`'s "Source control" section for the exact remote URL and identity to use.

---

### Decision: Documentation-first workflow
**Date:** 2026-08-14
**Context:** User provided an explicit project protocol requiring inspection and documentation before any implementation.
**Decision:** Adopted as described — `/docs` structure created and kept synchronized before/alongside all future code changes.
**Reason:** User's explicit, standing instruction for how this project should be run.
**Consequences:** Every future feature follows Understand → Plan → Check consistency → Implement → Verify → Document (see the protocol); documentation must be kept truthful to actual code state, never aspirational.

---

### Decision: CSS Modules as the frontend styling approach
**Date:** 2026-08-22
**Context:** The frontend had no styling approach decided beyond the raw, unmodified Vite starter-template CSS (`index.css`/`App.css`) — no CSS framework, CSS-in-JS library, or component-kit had been chosen, and a real design system + first component library needed to be built.
**Options considered:**
- Tailwind CSS — utility-first, fast to write, but a new dependency and a different authoring style than plain CSS.
- A CSS-in-JS library like styled-components/Emotion — co-locates styles with components, but adds a runtime dependency and a bundle-size/performance cost.
- A full UI kit like MUI/Chakra — fastest to a "finished" look, but pulls in an opinionated design language that would fight the goal of a distinctive, non-generic visual identity, plus a large dependency.
- Plain CSS Modules (`*.module.css`) — co-located per component, scoped class names, zero new dependency; Vite supports it natively out of the box.
**Decision:** CSS Modules, with a small hand-written helper (`client/src/utils/cx.ts`) for conditional class-name merging instead of adding a `classnames`/`clsx` dependency.
**Reason:** Matches this project's standing "don't add dependencies speculatively" convention (see `PROJECT_STYLE.md`'s state-management note making the same call about Redux/Zustand); avoids importing someone else's design language (a UI kit) when the goal was a distinctive, restrained visual identity; needs zero build configuration since Vite already supports `.module.css` natively.
**Consequences:** Every component that needs scoped styling gets a co-located `.module.css` file (more files than a single global stylesheet or a CSS-in-JS approach would produce, but each stays small and colocated); no dynamic/runtime theming beyond what plain CSS custom properties + `prefers-color-scheme` already provide (which was sufficient for the light/dark palette actually needed).

---

### Decision: Design token palette — cobalt accent + neutral ink/canvas base, replacing the Vite-template default purple
**Date:** 2026-08-22
**Context:** The Vite React+TS starter template ships a default accent color (`#aa3bff`, a bright purple/violet, with a corresponding dark-mode variant) baked into the placeholder `index.css` inherited from Phase 0 scaffolding — never a deliberate product design decision, just template leftovers. A real color system had to be chosen for the first real UI (Landing, Login, Register, the authenticated placeholder home).
**Options considered:**
- Keep the template's purple accent — zero effort, but reads as generic/unbranded; purple/violet gradients are the default look of countless AI-generated dashboard templates, which this project's own design brief explicitly wanted to avoid.
- A green-forward "money" palette — thematically on-the-nose for a finance app, but risks visually conflating the brand color with the semantic "positive/income" color used elsewhere in the UI.
- A cobalt-blue accent (`#3457d5` light / `#6e8bff` dark) paired with a neutral ink/canvas base and semantic success/danger/warning colors kept fully independent of the brand accent.
**Decision:** Cobalt-blue brand accent, neutral base, semantic colors independent of the accent.
**Reason:** Avoids the generic purple "AI dashboard" look while keeping the brand accent visually distinct from the semantic colors a finance app needs for income/expense/alert states (a green accent would have made "primary button" and "positive number" look like the same signal).
**Consequences:** Chart color choices for future phases (Phase 7, Charts & Reports) should still go through the `dataviz` skill's palette process, per `PROJECT_STYLE.md`'s existing instruction, rather than reusing the UI accent color directly for data series — this decision only settles the *UI chrome* palette, not future chart colors.

---

### Decision: `/app` as an honest post-login placeholder, not a preview of the real `/dashboard`
**Date:** 2026-08-22
**Context:** Login and Register needed *somewhere* to redirect a user after a successful auth, to prove the end-to-end flow actually works — but the real financial dashboard (`/dashboard`, Phase 4: aggregate balance/income/expense/savings-rate/net-worth view) has no backend yet and is still several phases away.
**Options considered:**
- Build a visual-only mockup of the real dashboard using fake/sample data — would look more "finished," but is exactly the kind of non-functional, fabricated-feature mockup this project's protocol forbids, and would need to be fully rebuilt — not just re-skinned — once Phase 4's real aggregation endpoint exists.
- Skip a post-login destination entirely and just leave the user on the login page after success — technically avoids fabrication, but fails to demonstrate the auth flow actually works end-to-end, and is a worse user experience.
- A new, honestly-labeled placeholder route (`/app`) that welcomes the user and lists the real product roadmap (Accounts/Transactions/Budgets/Investments/Reports/Notifications) as explicitly "Planned," with zero fake data.
**Decision:** The third option — `/app`, a real (if intentionally minimal) authenticated page, protected by a new route guard, with an honest empty state.
**Reason:** Proves the full register/login/session/logout flow works end-to-end against real backend behavior, without fabricating the Phase 4 feature ahead of its backend existing.
**Consequences:** `/app` and the future real `/dashboard` are two distinct routes for now — whether `/app` eventually redirects to or is replaced by `/dashboard` once Phase 4 ships is an open question, not yet decided (see the corresponding note added to `SITE_MAP.md` in a parallel doc-update pass).

---

### Decision: Session bootstrap re-validates the stored token against the server on every load, rather than trusting a cached user object
**Date:** 2026-08-22
**Context:** `AuthContext` needed a strategy for restoring session state after a page reload, given only a JWT persisted in `localStorage` (under the key `'token'`, the same key the pre-existing axios interceptor in `services/api.ts` already reads).
**Options considered:**
- Also cache the `user` object itself in `localStorage` alongside the token, and trust it immediately on load — faster perceived load, no extra network request, but risks showing stale/wrong user data, and doesn't detect an expired or server-invalidated token until the next API call fails.
- Call `GET /api/auth/me` on every load before trusting any user data, treating the token as unverified until the server confirms it.
**Decision:** The second option — always re-validate via `GET /api/auth/me` on load; only the token is persisted client-side, never a cached user object.
**Reason:** An expired or otherwise invalid token needs to be caught immediately (clearing it and sending the user to `/login`) rather than surfacing confusing 401s from later API calls; this is a small, one-time cost (one extra request per full page load) in exchange for correctness.
**Consequences:** There's a brief `'loading'` state on every fresh page load while this check is in flight (handled by `ProtectedRoute` showing a spinner, and by `Login`/`Register` checking `status` before deciding whether to redirect); this is a deliberate three-state (`'loading' | 'authenticated' | 'unauthenticated'`) status model rather than a simple boolean, specifically to distinguish "haven't checked yet" from "checked, and there's no session."

---

### Decision: `updateXSchema` is never `createXSchema.partial()` when the create schema has field defaults
**Date:** 2026-08-22
**Context:** Phase 2's (Account Management) first draft defined `updateAccountSchema` as `createAccountSchema.partial()`, mirroring a common Zod shortcut. `createAccountSchema` has `.optional().default(0)` on `balance` and `.optional().default('active')` on `status`. Verified empirically with a throwaway `node -e` script against the project's actual installed Zod version: `createAccountSchema.partial().safeParse({ name: 'Renamed only' })` returns `{ name: 'Renamed only', balance: 0, status: 'active' }` — Zod re-applies a field's `.default(...)` whenever that field is absent from the input, and `.partial()`'s added `.optional()` wrapper does not suppress that. A `PUT /api/accounts/:id` sent with only `{ name }` would have had `req.body` expanded by `validateBody` to include `balance: 0, status: 'active'`, which the controller's `Object.assign(account, req.body)` would then apply — silently resetting the account's real balance and status.
**Options considered:** keep `.partial()` for brevity and add application-level filtering to strip any key not present in the raw request body before applying it (fragile — easy to forget on the next resource, and works against Zod rather than with it); define the update schema as its own independent object literal, with plain `.optional()` on every field and no `.default(...)` anywhere.
**Decision:** the second option. `updateAccountSchema` is a standalone `z.object({...})` — same field types/enums as `createAccountSchema`, but `.optional()` only, never `.default(...)`.
**Reason:** correctness — an update must leave an omitted field untouched, not silently coerce it to a default. This is a general Zod behavior, not specific to accounts, so it applies to every future resource with an update endpoint.
**Consequences:** **every future Phase (3 onward) that adds an update/PATCH endpoint for a resource whose create schema has any `.default(...)` field must define its update schema independently the same way — never `createXSchema.partial()` in that situation.** A regression test (`server/src/routes/accounts.routes.test.ts`: "leaves balance and status untouched when a partial update omits them") covers this specifically for accounts; the equivalent test should be added for every future resource's update endpoint. This was caught during review before being shipped, not found in production — see `IMPLEMENTED_FEATURES.md`'s Account Management entry and `PROJECT_PLAN.md`'s Phase 2 entry. (Note: `transactions` has no `.default(...)` fields at all, so `updateTransactionSchema = createTransactionSchema.partial()` was verified safe and used as-is for Phase 3 — verified empirically with the same `node -e` technique before relying on it.)

---

### Decision: `transfer` and `investment` transactions both decrease the source account's balance (no second "to account" field)
**Update 2026-11-20:** partially superseded — transfers may now carry an optional `toAccountId` (see "Transfers via an optional `toAccountId`" below). A transfer without a destination still behaves exactly as described here.
**Date:** 2026-08-22
**Context:** `DATABASE.md`'s `transactions` schema draft (written before Phase 3 was built) has a single `accountId` field — no `toAccountId`/destination account. Building Phase 3 required deciding, concretely, how each of the four transaction types (`income`/`expense`/`transfer`/`investment`) affects that one account's balance, including whether `transfer` should instead be modeled as a movement between two of the user's own tracked accounts (which would require a schema change).
**Options considered:**
- Add a second account reference so `transfer` moves money between two of the user's own tracked accounts (more complete/useful, but a bigger schema change than the already-drafted single-`accountId` shape, and not something to invent unilaterally mid-implementation without confirming the product actually wants inter-account transfers modeled that way).
- Keep the single-`accountId` schema exactly as already drafted, and treat every non-`income` type consistently as a balance decrease — `transfer` represents money leaving this account to somewhere not tracked by the app (e.g., an external account or a person), and `investment` represents money leaving the account to fund a purchase (the resulting holding itself will be tracked separately, once Phase 6's `investments` collection exists).
**Decision:** The second option — `income` is `+amount`; `expense`, `transfer`, and `investment` are all `-amount`. Implemented as a single pure function, `server/src/utils/balance.ts`'s `balanceDelta(type, amount)`, unit-tested directly (per this project's standing rule that financial calculations live in pure, independently testable functions — see `PROJECT_STYLE.md`).
**Reason:** Faithful to the schema as already drafted (not a unilateral redesign), unblocks Phase 3 without needing a new product decision on inter-account transfers, and is the only reading of "one account per transaction" that doesn't require inventing a field the draft schema doesn't have.
**Consequences:** If a genuine two-account transfer feature is wanted later, it needs a real schema change (a `toAccountId` field, and controller logic to move the amount between two owned accounts) — this is a clean, isolated follow-up, not blocked by anything built here. Flag this as an open product question if a future session considers building it, rather than assuming the current single-account model already covers it.

---

### Decision: balance updates use an atomic single-document `$inc` + compensating rollback, not a multi-document MongoDB transaction
**Date:** 2026-08-22
**Context:** Phase 3 needed to keep an `Account`'s `balance` and its `Transaction` records consistent across create/update/delete. Real ACID multi-document transactions in MongoDB require the deployment to be a replica set (even a single-node one) — this project's local Docker MongoDB (`docker-compose.yml`, `mongo:7`, no `--replSet` flag — see the 2026-08-14 "Local MongoDB via Docker" decision) is a plain standalone instance and does not support them.
**Options considered:**
- Convert local MongoDB to a single-node replica set (`--replSet` + a one-time `rs.initiate()`) so `mongoose`'s session/transaction APIs (`session.withTransaction()`) can be used for true atomicity. Would also better match the production target (MongoDB Atlas clusters are always replica sets). Rejected for now as a separate, deliberate infrastructure change rather than something to fold into a feature-build session — it touches the already-verified local dev setup (`DEV_CONTEXT.md` calls out Docker MongoDB as working infra) and deserves its own focused verification pass, not a change made as a side effect of Phase 3.
- An atomic single-document `$inc` on the `Account` (MongoDB guarantees single-document writes are atomic on their own), applied before the `Transaction` write, with a compensating reverse `$inc` if that write fails. Not perfectly atomic *across* the two documents (a crash in the narrow window between the two writes would leave them inconsistent), but correct in the overwhelmingly common case, requires no infrastructure change, and every code path (create/update/delete, including the update logic that must reverse an old delta and apply a new one, possibly against two different accounts) is covered by an integration test that asserts the actual resulting balance, not just the HTTP status.
**Decision:** The second option, for now.
**Reason:** Ships real, well-tested balance-integrity behavior today without an infrastructure change that's out of scope for a single feature phase; the failure window it accepts (a crash between two specific writes) is narrow and the trade-off is explicitly documented rather than silently accepted.
**Consequences:** **Recorded as accepted technical debt, not a closed question — see `TECHNICAL_DEBT.md`.** If this project is ever deployed for real use (beyond a portfolio/demo context) or the failure window becomes a real concern, convert local MongoDB to a replica set and use `session.withTransaction()` for the accounts↔transactions balance updates specifically (Atlas already supports this in production without any change there).

---

### Decision: Vitest runs test files sequentially (`fileParallelism: false`), not concurrently
**Date:** 2026-08-22
**Context:** Adding `transactions.routes.test.ts` as a third integration test file (alongside `auth.routes.test.ts` and `accounts.routes.test.ts`) surfaced a latent bug in the test setup: all integration test files share one physical `personal-finance-test` MongoDB database (see `server/vitest.setup.ts`) and reuse the same hardcoded fixture emails (`usera@example.com`/`userb@example.com`) and each file's `beforeEach` wipes the relevant collections. Vitest's default is to run test *files* concurrently, so with three files doing this, real failures appeared: duplicate-key errors from two files registering the same email around the same time, and assertions failing because one file's `beforeEach` had wiped a collection out from under another file's in-flight test.
**Options considered:**
- Give every test file unique fixture emails/data (reduces email collisions specifically, but doesn't stop one file's collection-wide `beforeEach` wipe from disrupting another file's concurrently-running test — the deeper problem is shared mutable state across concurrent files, not just naming).
- Isolate each test file into its own database (more invasive change to the connection setup in `vitest.setup.ts`, and loses the simplicity of one shared local test database).
- Run test files sequentially (`fileParallelism: false` in `server/vitest.config.ts`) so no two files ever touch the shared database at the same time.
**Decision:** The third option.
**Reason:** Smallest possible fix for the actual root cause (concurrent access to shared mutable state), requires no change to any test's fixture data or the database-connection strategy, and matches how these tests were implicitly written to begin with (each assuming exclusive access to the test database for its own `beforeEach`/test bodies).
**Consequences:** The full backend test suite takes somewhat longer wall-clock time to run (files execute one after another instead of in parallel) — an acceptable trade-off at this project's current test-suite size (43 tests across 6 files, ~19s total). Every future test file added in later phases automatically benefits from this fix without needing its own workaround.

---

### Decision: Budget usage is computed live at read time, never stored or cached
**Date:** 2026-08-22
**Context:** Phase 5 needed a way to know how much a user has spent against a budget's category in its month. The spent amount depends on the `transactions` collection, which changes independently of `budgets` (a transaction can be added, edited, or deleted at any time, in a category that happens to match an existing budget).
**Options considered:**
- Store a running `spentSoFar` (or similar) field on the `Budget` document, incrementally updated whenever a matching transaction is created/edited/deleted — faster reads (no aggregation per request), but requires the transactions controller to know about and update budgets whenever a transaction's category/amount/date/type changes, and to get every edge case right (a transaction's category changing away from a budgeted one, or into one, moving between budgeted months, etc.) — this is the same class of "keep two collections in sync" problem the balance-integrity work in Phase 3 was built to solve carefully, applied to a second collection budgets would now also depend on.
- Compute usage live, on every `GET /api/budgets`/`GET /api/budgets/:id`, by querying `transactions` for that exact budget's category (case-insensitive) and month, summing matching expenses in a pure function (`server/src/utils/budgetUsage.ts`).
**Decision:** The second option — usage is always computed live, never stored.
**Reason:** Eliminates an entire class of cache-invalidation bugs (a stored usage figure silently going stale relative to the transactions it's meant to reflect) for a one-time, small-scale read cost (a handful of budgets per user, one transactions query each) that's appropriate at this project's scale. Correctness over a marginal read-performance gain.
**Consequences:** If a user ever has a very large number of budgets, `GET /api/budgets` does one transactions query per budget (not batched) — acceptable at portfolio-project scale; worth revisiting (e.g. batching by distinct month/year across all of a user's budgets) if this project's scale assumptions ever change. Category matching between `transactions.category` and `budgets.category` is case-insensitive specifically so a transaction logged as "food" still counts against a "Food" budget — see the next decision for why budget creation itself also enforces case-insensitive uniqueness, to keep this consistent.

---

### Decision: Budget category uniqueness (per user/month/year) is enforced case-insensitively, not just via the database's case-sensitive unique index
**Date:** 2026-08-22
**Context:** `budgets` has a unique compound index on `(userId, category, month, year)`. MongoDB unique indexes are case-sensitive by default (no collation was configured), but budget usage (see above) matches `transactions.category` case-insensitively. Relying on the index alone would let a user create both a "Food" and a "food" budget for the same month as two distinct documents — and both would then match (and double-count) the exact same expense transactions when computing usage.
**Options considered:**
- Rely solely on the case-sensitive unique index (simplest, but inconsistent with the case-insensitive usage matching — see the double-counting scenario above).
- Add a case-insensitive collation to the index itself (MongoDB supports this) — would enforce it at the database layer directly, but is a less common, easy-to-forget pattern for anyone reading the schema later.
- Check for an existing budget with the same category (case-insensitive, via an escaped regex — user input is escaped before being embedded in the `RegExp` to prevent both incorrect matches and a regex-injection/ReDoS risk from a crafted category string) in the controller before create/update, in addition to keeping the plain unique index as a defense-in-depth backstop against a race between the check and the write.
**Decision:** The third option.
**Reason:** Keeps the uniqueness rule consistent with the usage-matching rule (both case-insensitive), keeps the enforcement logic visible in application code (`budgets.controller.ts`) rather than hidden in index configuration, and still has a database-level backstop for the narrow race-condition window between the check and the insert.
**Consequences:** A duplicate create/update attempt returns `409` with a clear message, checked in application code first — the database-level unique-index violation (`E11000`) is only ever expected to occur under a genuine race (two near-simultaneous requests), not the common case, and is not specially handled beyond what the generic error handler already does (a 500) — if this is ever observed happening in practice, it should be caught and mapped to a 409 too, but doing so pre-emptively without evidence it happens would be speculative.

---

### Decision: `investments.currentValue` is per-unit, matching `purchasePrice` (resolving `DATABASE.md`'s open question)
**Date:** 2026-08-22
**Context:** `DATABASE.md`'s `investments` schema draft explicitly left this undecided — "per-unit or total — decide and document once built" — with a lean toward per-unit already noted for consistency with `quantity`/`purchasePrice`.
**Options considered:**
- `currentValue` as the *total* current value of the whole holding (simpler for a user to type once for e.g. a fixed deposit, but inconsistent with `purchasePrice` being per-unit, and profit/loss math would need to mix a per-unit price against a total value, or the API would need to silently divide/multiply somewhere non-obvious).
- `currentValue` as a *per-unit* price, directly comparable to `purchasePrice` — total holding value (`currentValue * quantity`) and profit/loss (`(currentValue - purchasePrice) * quantity`) both fall out as simple, obvious pure functions.
**Decision:** Per-unit, per `DATABASE.md`'s own original lean.
**Reason:** Keeps `purchasePrice` and `currentValue` directly comparable (same unit), which is what makes the profit/loss and profit/loss-percent calculations simple, obvious, pure functions (`server/src/utils/investmentReturns.ts`) rather than needing an implicit unit conversion buried in the math.
**Consequences:** The Investments UI must label these fields clearly as per-unit prices (e.g. "Current value (per unit)"), not total holding value, to avoid a user entering a total and getting a wildly wrong profit/loss figure. For asset types where a user might naturally think in totals rather than per-unit (e.g. a fixed deposit), the UI should still ask for a per-unit-equivalent value (e.g. treat the whole deposit as "1 unit") rather than silently reinterpreting the field — this project's chosen consistency over per-asset-type special-casing.

### Decision: Transfers between tracked accounts use an optional `toAccountId` on the transaction
**Date:** 2026-11-20
**Context:** The single-`accountId` model could only represent a transfer as money leaving tracking, which made moving money between two of a user's own accounts impossible without two manual entries.
**Options considered:** (a) a second linked transaction document per transfer; (b) one transaction with an optional destination account; (c) leave as is.
**Decision:** (b). `toAccountId` is valid only when `type` is `transfer`, must differ from `accountId` and belong to the user. With it, the source is debited and the destination credited (`balanceLegs` in `utils/balance.ts`); without it the legacy single-leg behaviour is unchanged. Edits and deletes reverse the old legs and apply the new ones; changing the type away from `transfer` clears the destination.
**Consequences:** Backward compatible with existing data. No currency conversion between accounts of different currencies (raw amount moves). Deleting an account referenced as a destination is refused like any other referenced account.

### Decision: Account balance changes only through transactions
**Date:** 2026-11-20
**Context:** `PUT /api/accounts/:id` accepted `balance`, letting the stored balance silently diverge from the transaction ledger.
**Decision:** `balance` is accepted only as the opening balance on `POST /api/accounts`. `updateAccountSchema` is a strict object, so a `balance` (or any unknown field) in a PUT is a 400 rather than a silent no-op.
**Consequences:** Correcting a wrong opening balance requires an adjusting transaction. The UI's edit form does not offer the balance field.

### Decision: Refuse to delete an account that has transactions (409); close it instead
**Date:** 2026-11-20
**Context:** Deleting an account orphaned its transactions (and transfer legs), silently skewing history and budgets.
**Options considered:** cascade-delete the transactions; keep them orphaned; refuse.
**Decision:** Refuse with 409 if any transaction references the account as `accountId` or `toAccountId`; the message tells the user to set the status to `closed`. Empty accounts still delete. Closed accounts reject new transactions and are excluded from the dashboard balance total.
**Consequences:** History is never destroyed implicitly. There is no hard-delete path for an account with history.

### Decision: Money is limited to two decimals and balances are rounded to cents in the database
**Date:** 2026-11-20
**Context:** Repeated float `$inc` updates (0.1 + 0.2) produced balances like 0.30000000000000004.
**Options considered:** integer minor units (cleanest, needs a migration and API-contract change); decimal128; validate 2 decimals and round on write.
**Decision:** Validation caps money at 1e12 with at most 2 decimal places, and balance updates use an aggregation-pipeline update (`$round` of `balance + delta`, 2). Integer minor units remain a tracked debt item.
**Consequences:** Stored values stay exact to the cent for realistic usage; sums elsewhere (dashboard, budget usage) are still floats, rounded where returned (budget usage).

### Decision: Budget usage for a list is computed with a single aggregation
**Date:** 2026-11-20
**Context:** The original implementation ran one transactions query per budget (N+1); 12 budgets over 20k transactions took ~260 ms.
**Decision:** `GET /api/budgets` runs one `$match`/`$group` over the user's expense transactions across the min-max date range of the listed budgets, grouped by (year, month, trimmed lower-cased category), and each budget looks up its bucket. Same UTC month boundaries and case-insensitive matching as before; usage is still never stored.
**Consequences:** ~93 ms median on the same data. This supersedes the earlier note that a per-budget query was acceptable. Category matching still cannot use an index.
