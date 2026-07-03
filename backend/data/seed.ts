import { db } from "../src/config/db.js";
import {
  usersTable,
  companiesTable,
  jobsTable,
  applicationsTable,
  companyMembersTable,
  interviewsTable,
  auditLogs,
  invitations,
  emailLogsTable,
} from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  category: any;
  job_type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  job_location: "REMOTE" | "ONSITE" | "HYBRID";
  location?: string;
  companySlug: string;
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
  scheduled_at_offset_days: number;
}

interface DummyData {
  users: RawUser[];
  companies: RawCompany[];
  jobs: RawJob[];
  applications: RawApplication[];
  interviews: RawInterview[];
}

const seedDatabase = async () => {
  console.log("Reading dummy_data.json...");
  
  try {
    const dataPath = path.join(__dirname, "dummy_data.json");
    if (!fs.existsSync(dataPath)) {
      console.error(`Error: dummy_data.json not found at ${dataPath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(dataPath, "utf-8");
    const data: DummyData = JSON.parse(raw);

    console.log(`Loaded ${data.users.length} users, ${data.companies.length} companies, ${data.jobs.length} jobs, ${data.applications.length} applications, and ${data.interviews.length} interviews.`);

    console.log("Clearing existing database tables...");
    await db.delete(interviewsTable);
    await db.delete(auditLogs);
    await db.delete(invitations);
    await db.delete(applicationsTable);
    await db.delete(companyMembersTable);
    await db.delete(jobsTable);
    await db.delete(companiesTable);
    await db.delete(usersTable);
    await db.delete(emailLogsTable);

    // 1. Seed Users
    console.log("Inserting users...");
    const userEmailToIdMap = new Map<string, string>();
    
    for (const u of data.users) {
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
        .returning({ id: usersTable.id });
      
      userEmailToIdMap.set(u.email, inserted.id);
    }
    console.log(`Successfully inserted ${userEmailToIdMap.size} users.`);

    // 2. Seed Companies
    console.log("Inserting companies...");
    const companySlugToIdMap = new Map<string, string>();
    const companySlugToOwnerIdMap = new Map<string, string>();
    const recruiterEmails = data.users
      .filter((u) => u.role === "RECRUITER")
      .map((u) => u.email);

    for (let i = 0; i < data.companies.length; i++) {
      const c = data.companies[i];
      const ownerEmail = recruiterEmails[i % recruiterEmails.length];
      const ownerId = userEmailToIdMap.get(ownerEmail)!;

      const [inserted] = await db
        .insert(companiesTable)
        .values({
          owner: ownerId,
          name: c.name,
          description: c.description,
          slug: c.slug,
          logo_url: c.logo_url,
        })
        .returning({ id: companiesTable.id });

      companySlugToIdMap.set(c.slug, inserted.id);
      companySlugToOwnerIdMap.set(c.slug, ownerId);

      // Link owner user to this company
      await db
        .update(usersTable)
        .set({ company: inserted.id })
        .where(eq(usersTable.id, ownerId));
    }
    console.log(`Successfully inserted ${companySlugToIdMap.size} companies.`);

    // 3. Seed Company Members
    console.log("Inserting company members...");
    const companyMembers = data.users
      .filter(u => u.role === "RECRUITER" || u.role === "ADMIN")
      .map(u => {
        const userId = userEmailToIdMap.get(u.email)!;
        // Find company associated with this user
        // Recruiter's company slug mapping
        const userIndex = data.users.indexOf(u);
        const companyIndex = userIndex % data.companies.length;
        const companySlug = data.companies[companyIndex].slug;
        const companyId = companySlugToIdMap.get(companySlug)!;
        
        return {
          company: companyId,
          user: userId,
          role: u.role,
        };
      });

    if (companyMembers.length > 0) {
      await db.insert(companyMembersTable).values(companyMembers);
      console.log(`Successfully inserted ${companyMembers.length} company members.`);
    }

    // 4. Seed Jobs
    console.log("Inserting jobs...");
    const jobTitleToIdMap = new Map<string, string>();

    for (const j of data.jobs) {
      const companyId = companySlugToIdMap.get(j.companySlug)!;
      const ownerId = companySlugToOwnerIdMap.get(j.companySlug)!;

      const [inserted] = await db
        .insert(jobsTable)
        .values({
          company: companyId,
          createdBy: ownerId,
          title: j.title,
          description: j.description,
          status: j.status,
          category: j.category,
          job_type: j.job_type,
          job_location: j.job_location,
          location: j.location,
        })
        .returning({ id: jobsTable.id });

      jobTitleToIdMap.set(j.title, inserted.id);
    }
    console.log(`Successfully inserted ${jobTitleToIdMap.size} jobs.`);

    // 5. Seed Applications (including some future dates)
    console.log("Inserting applications...");
    const appKeyToIdMap = new Map<string, string>();
    const totalApps = data.applications.length;

    for (let i = 0; i < totalApps; i++) {
      const a = data.applications[i];
      const candidateId = userEmailToIdMap.get(a.candidateEmail)!;
      const jobId = jobTitleToIdMap.get(a.jobTitle)!;

      // Make the last 10 applications set in the future, others in the past
      let createdAt = new Date(Date.now() - (totalApps - i) * 24 * 60 * 60 * 1000); // in the past
      if (i >= totalApps - 10) {
        createdAt = new Date(Date.now() + (i - (totalApps - 10) + 1) * 2 * 24 * 60 * 60 * 1000); // in the future
      }

      const [inserted] = await db
        .insert(applicationsTable)
        .values({
          job: jobId,
          candidate: candidateId,
          current_stage: a.current_stage,
          resume_url: a.resume_url,
          created_at: createdAt,
        })
        .returning({ id: applicationsTable.id });

      appKeyToIdMap.set(`${a.candidateEmail}::${a.jobTitle}`, inserted.id);

      // Increment application count on the job
      await db
        .update(jobsTable)
        .set({
          application_count: (await db
            .select({ count: jobsTable.application_count })
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1))[0]?.count! + 1
        })
        .where(eq(jobsTable.id, jobId));
    }
    console.log(`Successfully inserted ${appKeyToIdMap.size} applications.`);

    // 6. Seed Interviews
    console.log("Inserting interviews...");
    let interviewCount = 0;
    
    for (const iv of data.interviews) {
      const appKey = `${iv.applicationRef.candidateEmail}::${iv.applicationRef.jobTitle}`;
      const applicationId = appKeyToIdMap.get(appKey);

      if (!applicationId) continue;

      const scheduledAt = Math.floor(
        (Date.now() + iv.scheduled_at_offset_days * 24 * 60 * 60 * 1000) / 1000
      );

      await db.insert(interviewsTable).values({
        application: applicationId,
        interview_type: iv.interview_type,
        scheduled_at: scheduledAt,
        reminder_sent: false,
      });
      interviewCount++;
    }
    console.log(`Successfully inserted ${interviewCount} interviews.`);

    console.log("Database seeded successfully with rich dummy data!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
