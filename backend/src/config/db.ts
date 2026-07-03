import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./env";
import * as schema from "../db/schema";
import * as relations from "../db/relations";
// Create PostgreSQL connection with hardened settings
const client = postgres(config.databaseUrl, {
  max: 10, // Connection pool size (reduced for Neon free tier)
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 30, // Connection timeout
  ssl: "require", // Enforce SSL
  // NOTE: prepare MUST be false when using Neon's pooler endpoint (-pooler hostname).
  // Neon pgBouncer runs in transaction mode which does NOT support prepared statements.
  prepare: false,
  max_lifetime: 60 * 30, // Recycle connections every 30 min
  fetch_types: false, // Disable type fetching to avoid extra queries on connect
  connection: {
    application_name: "paystormx-backend",
  },
  onnotice: () => {}, // Suppress notice messages
});

// Warm up connection pool on startup to avoid cold-start timeouts
(async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await client`SELECT 1`;
      console.log("[DB] Connection pool warmed up successfully");
      break;
    } catch (err) {
      console.warn(
        `[DB] Warm-up attempt ${attempt}/3 failed:`,
        (err as Error).message,
      );
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
})();

// Create Drizzle instance
export const db = drizzle(client, { schema, ...relations });

// Export schema types
export * from "../db/schema";
