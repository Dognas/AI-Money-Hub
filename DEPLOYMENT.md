# Deploying to Hostinger (Node.js Hosting)

This app deploys as a **single Node.js process** that serves both the API (under `/api/*`) and the built React frontend (everything else). That's what `pnpm run build:hostinger` produces.

## 1. Prerequisites in hPanel

- A **Node.js Hosting** plan (not shared/PHP hosting — this app needs a real Node runtime).
- A **PostgreSQL database**, created from hPanel → Databases. Copy its connection string for `DATABASE_URL`.
- **Node.js version 22.x** selected in the app's Node settings.

## 2. Google OAuth credentials

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID**, type **Web application**.
3. Authorized redirect URI: `https://YOUR_DOMAIN/api/callback`
4. Copy the Client ID and Client Secret into Hostinger's environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

## 3. Connect Git deployment

In hPanel → Node.js Hosting → your app → **Git**, connect the GitHub repository and branch (`main`). Hostinger will pull on each deploy/push.

- **Application startup file:** `artifacts/api-server/dist/index.mjs`
- **Install command:** `corepack enable && npx pnpm install --frozen-lockfile`
- **Build command:** `npm run build:hostinger`
- **Start command:** `npm run start` (equivalent to `node artifacts/api-server/dist/index.mjs` — no pnpm needed at runtime)

If Hostinger's Node app UI requires a single install/build/start rather than a full panel, use:

```bash
corepack enable
npx pnpm install --frozen-lockfile
npm run build:hostinger
npm run start
```

> **Why `npx pnpm` instead of `pnpm`:** Hostinger's build step runs in a shell where a globally-installed `pnpm` binary isn't guaranteed to be on `PATH`, even if the install step used it — each step can be a separate shell invocation. `npx pnpm` resolves and runs pnpm regardless, so this doesn't depend on how Hostinger wires its build pipeline. The root `package.json` scripts (`build`, `build:hostinger`, `typecheck`) all use `npx pnpm` internally for the same reason, and `start` avoids pnpm entirely by calling `node` directly.

## 4. Environment variables

Set these in hPanel → Node.js Hosting → your app → **Environment variables** (do **not** commit a real `.env`):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Provided automatically by Hostinger — don't hardcode it |
| `DATABASE_URL` | From step 1 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From step 2 |
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `BASE_PATH` | `/` |
| `LOG_LEVEL` | `info` |

Full reference: [`.env.example`](./.env.example).

## 5. Database schema

Push the Drizzle schema to the production database once, before first boot:

```bash
DATABASE_URL="<production connection string>" pnpm --filter @workspace/db run push
```

Run this from your local machine or a one-off Hostinger SSH/terminal session — not automatically on every deploy, to avoid accidental destructive migrations.

## 6. Verify after deploy

- `GET https://YOUR_DOMAIN/api/healthz` → `{"status":"ok"}`
- `GET https://YOUR_DOMAIN/` → the app shell loads
- Sign in with Google → redirected back and session cookie set
- A calculator saves history while logged in
- The Money97 AI assistant responds (confirms `ANTHROPIC_API_KEY` is wired up)

## Rollback

Git-based deploys on Hostinger redeploy from a given commit — to roll back, redeploy the previous commit/tag from hPanel's Git panel, or `git revert` and push.

## Notes on scale

`dist/index.mjs` is bundled to ~2.7 MB with esbuild — fine for Hostinger's Node runtime. The frontend bundle is ~757 KB minified (~213 KB gzipped); see the **Optimization** section of `CHANGELOG.md` if you want to code-split further before going live.
