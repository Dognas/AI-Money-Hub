# AI Money Hub

An AI-powered personal finance platform: a suite of financial calculators, saved calculation history, a personal dashboard, and **Money97 AI™** — an in-app AI financial advisor — behind Google sign-in.

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS, Radix UI, wouter (routing), TanStack Query |
| Backend    | Node.js 22, Express 5, TypeScript, esbuild |
| Database   | PostgreSQL, Drizzle ORM |
| Auth       | Google OAuth 2.0 / OpenID Connect |
| AI         | Anthropic API (Claude) |
| Package manager | pnpm workspaces (monorepo) |

## Monorepo layout

```
artifacts/
  ai-money-hub/     # React frontend (Vite) — pages, components, hooks
  api-server/        # Express API — routes, auth, middleware
  mockup-sandbox/     # Design/prototype sandbox
lib/
  db/                 # Drizzle schema + Postgres client (shared package)
  api-zod/            # Shared Zod request/response schemas
  api-client-react/   # Generated React Query hooks from the API spec
  api-spec/           # OpenAPI spec (source of truth for the API contract)
  replit-auth-web/    # Frontend auth hook (works with any OIDC provider, not Replit-specific)
scripts/
  copy-client-dist.mjs  # Copies the built frontend into the API server's dist/ for single-process deployment
```

## Local development

Requires Node.js 22+ and pnpm.

```bash
corepack enable   # or: npm install -g pnpm
pnpm install
cp .env.example .env   # fill in DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, ANTHROPIC_API_KEY
```

Run the API and frontend as separate dev servers (hot reload on both):

```bash
pnpm --filter @workspace/api-server run dev      # http://localhost:5000
pnpm --filter @workspace/ai-money-hub run dev    # http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Typecheck every package |
| `pnpm run build` | Typecheck + build every package |
| `pnpm run build:hostinger` | Production build: builds the frontend, builds the API, copies the frontend into the API's `dist/public` so one process serves both |
| `pnpm run start` | Runs the built API server (`node dist/index.mjs`), which also serves the built frontend |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema changes to the database (dev only) |

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Hostinger production deployment guide.

## Authentication

Login is Google OAuth 2.0 / OIDC (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`), implemented with the standard [`openid-client`](https://www.npmjs.com/package/openid-client) library, so it isn't locked to Google specifically — pointing `ISSUER_URL` at any other OIDC-compliant provider works too.

> This app previously authenticated exclusively through Replit's own OIDC issuer, which only works for apps hosted on Replit. That has been replaced with standard Google OAuth so the app can run anywhere, including Hostinger.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
