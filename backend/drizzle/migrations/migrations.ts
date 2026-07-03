// drizzle/migrations/20240417_customSeed.ts
import { sql } from "drizzle-orm";
import { type MigrationMeta } from "drizzle-orm/migrator";

export const up = async (db: any): Promise<void> => {
  await db.execute(sql`INSERT INTO users (name) VALUES ('Saeed')`);
  await db.execute(sql`INSERT INTO users (name) VALUES ('Ali')`);
};

export const down = async (db: any): Promise<void> => {
  await db.execute(sql`DELETE FROM users WHERE name IN ('Saeed', 'Ali')`);
};
