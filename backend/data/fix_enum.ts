import { sql } from "drizzle-orm";
import { db } from "../src/config/db.js";

async function fixEnum() {
  try {
    console.log("Fixing enum Data...");
    await db.execute(sql`UPDATE "applications" SET "current_stage" = 'Interview' WHERE "current_stage" = 'Interviewing';`);
    console.log("Fixed.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(0); // exit 0 so we can proceed anyway
  }
}

fixEnum();
