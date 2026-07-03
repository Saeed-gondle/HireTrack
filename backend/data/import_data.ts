/**
 * =====================================================================
 * HireTrack — Misc Data Import Script
 * =====================================================================
 * Reads `dummy_data.json` and inserts users, companies, jobs,
 * applications, and interviews into the database without touching
 * existing records (onConflictDoNothing / deduplication).
 *
 * Usage:
 *   npm run seed            (already defined in package.json)
 *   tsx ./data/import_data.ts
 * =====================================================================
 */

import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import { db } from "../src/config/db.js";
import {
  usersTable,
  companiesTable,
  jobsTable,
  applicationsTable,
  interviewsTable,
} from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Resolve __dirname in ESM ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Types matching dummy_data.json ────────────────────────────────────────
interface RawUser {
  name: string;
  email: string;
  role: "RECRUITER" | "CANDIDATE" | "ADMIN";
  password: string;
  isVerified: boolean;
  bio?: string;
  skills?: string[];
  educations?: string[];
  experiences?: string[];
}

interface RawCompany {
  name: string;
  description?: string;
  slug: string;
  logo_url?: string;
}

interface RawJob {
  title: string;
  description?: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  category:
    | "IT"
    | "HR"
    | "Finance"
    | "Marketing"
    | "Sales"
    | "Operations"
    | "Customer Support"
    | "Engineering"
    | "Product Management"
    | "Design"
    | "Legal"
    | "Administration"
    | "Supply Chain"
    | "Education & Training"
    | "Healthcare"
    | "Research & Development"
    | "Consulting"
    | "Project Management"
    | "Business Development"
    | "Other";
  job_type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  job_location: "REMOTE" | "ONSITE" | "HYBRID";
  location?: string;
  companySlug: string; // resolved to company uuid at runtime
}

interface RawApplication {
  candidateEmail: string;
  jobTitle: string;
  current_stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "REJECTED";
  resume_url?: string;
}

interface RawInterview {
  applicationRef: {
    candidateEmail: string;
    jobTitle: string;
  };
  interview_type: "PHONE" | "ONSITE" | "VIDEO";
  scheduled_at_offset_days: number; // days from now
}

interface DummyData {
  users: RawUser[];
  companies: RawCompany[];
  jobs: RawJob[];
  applications: RawApplication[];
  interviews: RawInterview[];
}

// ─── Helper: colour logging ─────────────────────────────────────────────────
const log = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m  ${msg}`),
  ok: (msg: string) => console.log(`\x1b[32m[OK]\x1b[0m    ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m[WARN]\x1b[0m  ${msg}`),
  error: (msg: string) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  section: (msg: string) =>
    console.log(`\n\x1b[35m━━━ ${msg} ━━━\x1b[0m`),
};

// ─── Main seeder ────────────────────────────────────────────────────────────
async function importData() {
  // 1. Load JSON data
  const dataPath = path.join(__dirname, "dummy_data.json");
  if (!fs.existsSync(dataPath)) {
    log.error(`dummy_data.json not found at: ${dataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: DummyData = JSON.parse(raw);

  log.info(`Loaded dummy_data.json`);
  log.info(
    `  → ${data.users.length} users | ${data.companies.length} companies | ${data.jobs.length} jobs | ${data.applications.length} applications | ${data.interviews.length} interviews`
  );

  // ─── Step 1: Upsert Users ────────────────────────────────────────────────
  log.section("Inserting Users");

  // We need a recruiter to own each company. Pick the first recruiter.
  // (companies require an `owner` FK → usersTable.id)
  const insertedUserMap = new Map<string, string>(); // email → uuid

  for (const u of data.users) {
    try {
      const [inserted] = await db
        .insert(usersTable)
        .values({
          name: u.name,
          email: u.email,
          role: u.role,
          password: u.password,
          isVerified: u.isVerified,
          bio: u.bio,
          skills: u.skills,
          educations: u.educations,
          experiences: u.experiences,
        })
        .onConflictDoNothing()
        .returning({ id: usersTable.id, email: usersTable.email });

      if (inserted) {
        insertedUserMap.set(inserted.email, inserted.id);
        log.ok(`  Created user: ${u.name} <${u.email}>`);
      } else {
        // Already exists — fetch the existing id
        const [existing] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, u.email))
          .limit(1);

        if (existing) {
          insertedUserMap.set(u.email, existing.id);
          log.warn(`  Skipped (already exists): ${u.email}`);
        }
      }
    } catch (err) {
      log.error(`  Failed to insert user ${u.email}: ${(err as Error).message}`);
    }
  }

  // ─── Step 2: Insert Companies ────────────────────────────────────────────
  log.section("Inserting Companies");

  const insertedCompanyMap = new Map<string, string>(); // slug → uuid

  // Assign each company to the first available recruiter
  const recruiterEmails = data.users
    .filter((u) => u.role === "RECRUITER")
    .map((u) => u.email);

  for (let i = 0; i < data.companies.length; i++) {
    const c = data.companies[i];
    // round-robin assignment across recruiters
    const ownerEmail = recruiterEmails[i % recruiterEmails.length];
    const ownerId = insertedUserMap.get(ownerEmail);

    if (!ownerId) {
      log.warn(`  No owner found for company ${c.name}, skipping.`);
      continue;
    }

    try {
      const [inserted] = await db
        .insert(companiesTable)
        .values({
          owner: ownerId,
          name: c.name,
          description: c.description,
          slug: c.slug,
          logo_url: c.logo_url,
        })
        .onConflictDoNothing()
        .returning({ id: companiesTable.id, slug: companiesTable.slug });

      if (inserted) {
        insertedCompanyMap.set(inserted.slug, inserted.id);
        log.ok(`  Created company: ${c.name} (slug: ${c.slug})`);

        // Link the owner user to this company
        await db
          .update(usersTable)
          .set({ company: inserted.id })
          .where(eq(usersTable.id, ownerId));
      } else {
        // Already exists — fetch the existing id
        const [existing] = await db
          .select({ id: companiesTable.id })
          .from(companiesTable)
          .where(eq(companiesTable.slug, c.slug))
          .limit(1);

        if (existing) {
          insertedCompanyMap.set(c.slug, existing.id);
          log.warn(`  Skipped (already exists): ${c.slug}`);
        }
      }
    } catch (err) {
      log.error(
        `  Failed to insert company ${c.slug}: ${(err as Error).message}`
      );
    }
  }

  // ─── Step 3: Insert Jobs ──────────────────────────────────────────────────
  log.section("Inserting Jobs");

  const insertedJobMap = new Map<string, string>(); // title → uuid

  for (const j of data.jobs) {
    const companyId = insertedCompanyMap.get(j.companySlug);

    if (!companyId) {
      log.warn(`  Company not found for slug "${j.companySlug}", skipping job "${j.title}".`);
      continue;
    }

    try {
      // Check if job already exists (same title + company)
      const [existing] = await db
        .select({ id: jobsTable.id })
        .from(jobsTable)
        .where(
          and(
            eq(jobsTable.title, j.title),
            eq(jobsTable.company, companyId)
          )
        )
        .limit(1);

      if (existing) {
        insertedJobMap.set(j.title, existing.id);
        log.warn(`  Skipped (already exists): "${j.title}"`);
        continue;
      }

      const [inserted] = await db
        .insert(jobsTable)
        .values({
          company: companyId,
          title: j.title,
          description: j.description,
          status: j.status,
          category: j.category,
          job_type: j.job_type,
          job_location: j.job_location,
          location: j.location,
        })
        .returning({ id: jobsTable.id });

      if (inserted) {
        insertedJobMap.set(j.title, inserted.id);
        log.ok(`  Created job: "${j.title}" at ${j.companySlug}`);
      }
    } catch (err) {
      log.error(`  Failed to insert job "${j.title}": ${(err as Error).message}`);
    }
  }

  // ─── Step 4: Insert Applications ─────────────────────────────────────────
  log.section("Inserting Applications");

  const insertedApplicationMap = new Map<string, string>(); // "email::jobTitle" → uuid

  for (const a of data.applications) {
    const candidateId = insertedUserMap.get(a.candidateEmail);
    const jobId = insertedJobMap.get(a.jobTitle);

    if (!candidateId) {
      log.warn(`  Candidate not found: ${a.candidateEmail}, skipping application.`);
      continue;
    }
    if (!jobId) {
      log.warn(`  Job not found: "${a.jobTitle}", skipping application.`);
      continue;
    }

    try {
      // Avoid duplicates: same candidate + same job
      const [existing] = await db
        .select({ id: applicationsTable.id })
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.candidate, candidateId),
            eq(applicationsTable.job, jobId)
          )
        )
        .limit(1);

      if (existing) {
        insertedApplicationMap.set(
          `${a.candidateEmail}::${a.jobTitle}`,
          existing.id
        );
        log.warn(
          `  Skipped (already exists): ${a.candidateEmail} → "${a.jobTitle}"`
        );
        continue;
      }

      const [inserted] = await db
        .insert(applicationsTable)
        .values({
          job: jobId,
          candidate: candidateId,
          current_stage: a.current_stage,
          resume_url: a.resume_url,
        })
        .returning({ id: applicationsTable.id });

      if (inserted) {
        insertedApplicationMap.set(
          `${a.candidateEmail}::${a.jobTitle}`,
          inserted.id
        );
        log.ok(
          `  Created application: ${a.candidateEmail} → "${a.jobTitle}" [${a.current_stage}]`
        );

        // Increment the job's application count
        await db
          .update(jobsTable)
          .set({ application_count: (await db
            .select({ count: jobsTable.application_count })
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1))[0]?.count! + 1 })
          .where(eq(jobsTable.id, jobId));
      }
    } catch (err) {
      log.error(
        `  Failed to insert application (${a.candidateEmail} → "${a.jobTitle}"): ${(err as Error).message}`
      );
    }
  }

  // ─── Step 5: Insert Interviews ────────────────────────────────────────────
  log.section("Inserting Interviews");

  for (const iv of data.interviews) {
    const appKey = `${iv.applicationRef.candidateEmail}::${iv.applicationRef.jobTitle}`;
    const applicationId = insertedApplicationMap.get(appKey);

    if (!applicationId) {
      log.warn(
        `  Application not found for ${appKey}, skipping interview.`
      );
      continue;
    }

    // scheduled_at is unix epoch (seconds)
    const scheduledAt = Math.floor(
      (Date.now() + iv.scheduled_at_offset_days * 24 * 60 * 60 * 1000) / 1000
    );

    try {
      const [inserted] = await db
        .insert(interviewsTable)
        .values({
          application: applicationId,
          interview_type: iv.interview_type,
          scheduled_at: scheduledAt,
          reminder_sent: false,
        })
        .returning({ id: interviewsTable.id });

      if (inserted) {
        log.ok(
          `  Created interview: ${iv.interview_type} for ${appKey} in +${iv.scheduled_at_offset_days}d`
        );
      }
    } catch (err) {
      log.error(
        `  Failed to insert interview for ${appKey}: ${(err as Error).message}`
      );
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  log.section("Done");
  log.ok(`Users inserted/mapped : ${insertedUserMap.size}`);
  log.ok(`Companies inserted/mapped : ${insertedCompanyMap.size}`);
  log.ok(`Jobs inserted/mapped : ${insertedJobMap.size}`);
  log.ok(`Applications inserted/mapped : ${insertedApplicationMap.size}`);
  log.ok(`Import complete — no existing records were deleted.`);

  process.exit(0);
}

importData().catch((err) => {
  log.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
