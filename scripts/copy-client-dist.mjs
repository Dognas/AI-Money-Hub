// Copies the built frontend (artifacts/ai-money-hub/dist/public) into the
// API server's build output (artifacts/api-server/dist/public) so a single
// `node dist/index.mjs` process can serve both the API and the static app.
// Must run AFTER both `ai-money-hub build` and `api-server build`, since the
// api-server build step wipes its own dist/ directory first.
import { cp, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const from = path.join(rootDir, "artifacts/ai-money-hub/dist/public");
const to = path.join(rootDir, "artifacts/api-server/dist/public");

try {
  await access(from);
} catch {
  console.error(
    `[copy-client-dist] Missing build output at ${from}. Run the ai-money-hub build first.`,
  );
  process.exit(1);
}

await cp(from, to, { recursive: true });
console.log(`[copy-client-dist] Copied ${from} -> ${to}`);
