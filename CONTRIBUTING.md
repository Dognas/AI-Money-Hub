# Contributing

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
```

## Workflow

1. Branch from `main`: `git checkout -b feat/short-description`
2. Make changes. Keep commits scoped and use [Conventional Commits](https://www.conventionalcommits.org/) style messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
3. Before opening a PR:
   ```bash
   pnpm run typecheck
   pnpm run build
   ```
4. Open a PR against `main` describing what changed and why.

## Project conventions

- **Never commit secrets.** Real values live in `.env` (gitignored) or in Hostinger's environment variable panel — never in code or `.env.example`.
- **API contract first.** Request/response shapes are defined in `lib/api-spec` (OpenAPI) and `lib/api-zod` (Zod schemas) — update those before wiring up new endpoints, then regenerate frontend hooks:
  ```bash
  pnpm --filter @workspace/api-spec run codegen
  ```
- **DB schema changes** live in `lib/db/src/schema`. Push to your local/dev database with:
  ```bash
  pnpm --filter @workspace/db run push
  ```
- **Auth** uses standard OIDC (`openid-client`) against Google by default — see the "Authentication" section of `README.md` before touching `artifacts/api-server/src/lib/auth.ts` or `routes/auth.ts`.

## Code style

- TypeScript strict mode throughout — no `any` unless there's a strong reason (leave a comment explaining why).
- Run `pnpm exec prettier --write .` before committing if your editor doesn't format on save.
