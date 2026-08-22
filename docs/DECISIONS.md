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
