# Tallybird - client

React 19 + TypeScript + Vite single-page app for [Tallybird](../README.md).

```bash
cp .env.example .env     # VITE_API_URL, defaults to http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
npm test                 # Vitest + Testing Library
npm run lint             # oxlint
npm run build            # type-check + production build into dist/
```

## Layout

- `src/pages/` - route components (Landing, Login, Register, AppHome, Accounts, Transactions, Budgets, Investments)
- `src/components/ui/` - design-system primitives (Button, Modal, Table, Select, Alert, ...) styled with CSS Modules and the tokens in `src/styles/tokens.css`
- `src/services/` - axios API clients, one per resource, plus `httpError.ts` (maps API errors to `ApiError`)
- `src/context/AuthContext.tsx` - session state; the token lives in `localStorage` and is dropped only on a 401/404 from `/auth/me`

See the [docs](../docs/README.md) for architecture and style guidance.
