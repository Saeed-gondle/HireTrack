import { sql } from "drizzle-orm";
import { db } from "../src/config/db.js";

async function renameColumns() {
  try {
    console.log("Renaming columns manually...");
    await db.execute(sql`ALTER TABLE "users" RENAME COLUMN "company_id" TO "company";`);
    await db.execute(sql`ALTER TABLE "applications" RENAME COLUMN "job_id" TO "job";`);
    await db.execute(sql`ALTER TABLE "applications" RENAME COLUMN "candidate_id" TO "candidate";`);
    await db.execute(sql`ALTER TABLE "interviews" RENAME COLUMN "application_id" TO "application";`);
    console.log("Renaming done.");
    process.exit(0);
  } catch (error: Error) {
    console.error("Error or already renamed:", error.message);
    process.exit(0); // exit 0 so we can proceed anyway
  }
}

renameColumns();
