import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

// After bundling, this file lives at dist/index.mjs, so the built frontend
// (copied there by the root `build:hostinger` script) lives at dist/public.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prefer the colocated copy (what build:hostinger produces), but fall back to
// the frontend package's own Vite output directly. This matters because not
// every host's build pipeline is guaranteed to run copy-client-dist.mjs (e.g.
// an auto-detected/monorepo-recursive build step that builds each workspace
// package independently) — without this fallback, a build that skips that
// one script silently serves nothing and every route 404s ("Cannot GET /").
const candidateClientDirs = [
  path.resolve(__dirname, "public"),
  path.resolve(__dirname, "../../ai-money-hub/dist/public"),
];
const clientDist = candidateClientDirs.find((dir) => existsSync(dir));

if (!clientDist) {
  // eslint-disable-next-line no-console
  console.error(
    "[static] No built frontend found in any of:",
    candidateClientDirs,
    "- the API will still work under /api/*, but no static frontend will be served.",
  );
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// In the merged single-process deployment (Hostinger) the frontend and API
// share an origin, so credentialed cross-origin requests aren't needed there.
// ALLOWED_ORIGINS still supports split deployments (e.g. a separate mobile
// client or a staging frontend on another domain) via a comma-separated list.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Outside production, fall back to reflecting any origin (matches the old
// behavior) so the separate Vite dev server (a different port = different
// origin) keeps working without extra setup. In production, no origins are
// allowed unless explicitly configured via ALLOWED_ORIGINS.
const corsOrigin =
  allowedOrigins.length > 0
    ? allowedOrigins
    : process.env.NODE_ENV === "production"
      ? false
      : true;

app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Serve the built frontend (single-process deployment, e.g. Hostinger Node
// hosting). If neither candidate directory exists (e.g. local API-only dev,
// or the frontend genuinely wasn't built), skip silently so
// `pnpm --filter api-server dev` keeps working against the separate Vite
// dev server as before.
if (clientDist) {
  app.use(express.static(clientDist));

  // Express 5's router (path-to-regexp v8) rejects a bare "*" pattern, so
  // this SPA fallback is registered as unpathed middleware instead.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
