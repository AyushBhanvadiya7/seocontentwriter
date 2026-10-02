import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Configure a pooled PostgreSQL URL in your environment.");
}

const configuredPoolMax = Number.parseInt(
  process.env.DB_POOL_MAX || (process.env.VERCEL ? "1" : "10"),
  10
);

if (!Number.isInteger(configuredPoolMax) || configuredPoolMax < 1 || configuredPoolMax > 20) {
  throw new Error("DB_POOL_MAX must be an integer between 1 and 20.");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let pool = globalForDb.__arenaNextJsPostgresqlPool;

if (!pool) {
  pool = new Pool({
    connectionString: databaseUrl,
    // A single pooled connection per Vercel function instance avoids multiplying
    // connections as serverless instances scale out. Override only if the DB plan
    // and expected concurrency have been sized for it.
    max: configuredPoolMax,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    keepAlive: true,
  });
  pool.on("error", (error) => {
    // Never log a connection string or credentials.
    console.error("[database] idle connection error:", error.message);
  });
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export { pool };
export const db = drizzle(pool, { schema });
