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
const clientDist = path.resolve(__dirname, "public");

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
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Serve the built frontend (single-process deployment, e.g. Hostinger Node
// hosting). If dist/public doesn't exist (e.g. local API-only dev), skip
// silently so `pnpm --filter api-server dev` keeps working against the
// separate Vite dev server as before.
if (existsSync(clientDist)) {
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
