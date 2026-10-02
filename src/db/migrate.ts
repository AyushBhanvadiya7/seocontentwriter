import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function run() {
  // Neon/Vercel supplies both: use the direct connection for schema changes,
  // and the pooled connection for normal application traffic.
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_UNPOOLED or DATABASE_URL is required to run database migrations."
    );
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
  });

  try {
    const db = drizzle(pool);
    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database migrations complete.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Database migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
