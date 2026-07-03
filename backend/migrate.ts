import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";
// import dotenv from "dotenv";
// dotenv.config({ path: "./.env.local" });
// const client = postgres(process.env.DATABASE_URL!);
// const db = drizzle(client);

import { sql } from "drizzle-orm";
import { db } from "./src/config/db";

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx
  ON jobs USING gin (lower(title) gin_trgm_ops)
`);

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS jobs_description_trgm_idx
  ON jobs USING gin (lower(coalesce(description, '')) gin_trgm_ops)
`);

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS users_name_trgm_idx
  ON users USING gin (lower(name) gin_trgm_ops)
`);

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS users_email_trgm_idx
  ON users USING gin (lower(email) gin_trgm_ops)
`);

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS users_skills_trgm_idx
  ON users USING gin (lower(coalesce(skills::text, '')) gin_trgm_ops)
`);

await db.execute(sql`
  CREATE INDEX IF NOT EXISTS jobs_title_trgm_not_deleted_idx
  ON jobs USING gin (lower(title) gin_trgm_ops)
  WHERE deleted_at IS NULL
`);
