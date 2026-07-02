# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] — GitHub / Hostinger migration

### Changed
- **Authentication**: replaced Replit's OIDC issuer (`replit.com/oidc` + `REPL_ID`, only usable on Replit) with standard **Google OAuth 2.0 / OIDC**, using the same `openid-client` library already in the codebase. Updated:
  - `artifacts/api-server/src/lib/auth.ts` — issuer defaults to `accounts.google.com`, requires `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Google is a confidential client, unlike Replit's).
  - `artifacts/api-server/src/routes/auth.ts` — login uses `access_type=offline` + `prompt=consent` (Google's refresh-token pattern) instead of the `offline_access` scope; user profile claims mapped from Google's `given_name`/`family_name`/`picture` instead of Replit-specific claim names; logout simplified to local session clearing (Google has no RP-Initiated Logout endpoint).
- **Deployment topology**: merged the frontend (Vite) and API (Express) into a single Node.js process for single-port hosts like Hostinger.
  - `artifacts/api-server/src/app.ts` — now serves the built frontend as static files with an SPA fallback when `dist/public` exists, alongside the existing `/api/*` routes.
  - Added `scripts/copy-client-dist.mjs` and a root `build:hostinger` script that builds both packages and copies the frontend build into the API server's `dist/public`.
  - Added a root `start` script (`node artifacts/api-server/dist/index.mjs`) as the single production entry point.

### Added
- `.env.example` documenting every required environment variable.
- `README.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`, `LICENSE`.
- Extended `.gitignore` for env files, logs, and untracked build output.

### Verified
- `pnpm run typecheck` passes across all 10 workspace packages.
- `pnpm run build:hostinger` produces a working bundle; the built server serves the frontend, the API, and the SPA fallback all from one process on one port (manually smoke-tested).

---

## Prior history (inherited from Replit)

- Integrate AI service using Replit's managed API for financial advice
- Add user authentication and AI financial advisor features
- Expand the financial calculator into a full AI-powered financial platform
- Add a daily AI coach to help users with financial planning
- UI components and project structure groundwork
