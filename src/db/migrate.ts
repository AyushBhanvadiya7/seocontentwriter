import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set, skipping migration (local build without a database).");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");

  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  // Don't fail the whole deploy if migrations can't run (e.g. DB not reachable yet at build time).
  process.exit(0);
});
