import app from "./app";
import { logger } from "./lib/logger";

// Log-then-continue for unhandled promise rejections: one bad request
// shouldn't take the whole process down and turn into a 502 for everyone.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

// A truly corrupt process state should still exit, but log clearly first so
// this is diagnosable from Hostinger's logs instead of showing up as an
// unexplained gateway error with no trace of why the process died.
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception, shutting down");
  process.exit(1);
});

const rawPort = process.env["PORT"] ?? "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Bind explicitly to 0.0.0.0 rather than relying on the default, so the
// reverse proxy (Hostinger's Nginx) can always reach the process regardless
// of how the container/runtime resolves an unspecified host.
app.listen(port, "0.0.0.0", (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
