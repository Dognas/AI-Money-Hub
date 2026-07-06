import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Previously this threw synchronously at import time, which crashes the
// entire Node process before it can even bind to a port if DATABASE_URL is
// missing/misconfigured — Hostinger's Nginx proxy then can't reach anything,
// producing a blank page / 502-504 with no obvious cause. Log loudly instead
// and let the pool fail per-query, so the server still boots, the frontend
// still loads, and /api/healthz still responds even with the DB down —
// making the real problem visible instead of an opaque gateway error.
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error(
    "[db] DATABASE_URL is not set. The server will start, but any " +
      "database query will fail until this is configured.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "",
});
export const db = drizzle(pool, { schema });

export * from "./schema";
