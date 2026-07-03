import { relations, SQL, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  uuid,
  jsonb,
  primaryKey,
  text,
  PgTable,
} from "drizzle-orm/pg-core";
import {
  roleEnum,
  jobStatusEnum,
  JobType,
  jobLocation,
  applicationStatus,
  emailStatusEnum,
  interviewTypeEnum,
  jobCategoryEnum,
} from "./enums";

export {
  roleEnum,
  jobStatusEnum,
  JobType,
  jobLocation,
  applicationStatus,
  emailStatusEnum,
  interviewTypeEnum,
  jobCategoryEnum,
};
// Users

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  skills: jsonb("skills").$type<string[]>(),
  bio: varchar({ length: 255 }),
  educations: jsonb("educations").$type<string[]>(),
  experiences: jsonb("experiences").$type<string[]>(),
  role: roleEnum("role").notNull().default("RECRUITER"),
  password: varchar({ length: 255 }).notNull(),
  autoLoginToken: varchar({ length: 255 }),
  autoLoginTokenExpiry: integer(),
  verification: jsonb("verification").$type<{
    code: number;
    expiry: string; // ISO date string
  }>(),
  passwordReset: jsonb("passwordReset").$type<{
    code: number;
    expiry: string; // ISO date string
  }>(),
  isVerified: boolean("isVerified").default(false),
  bookmarks: jsonb("bookmarks").$type<string[]>(),
  avatar_url: varchar({ length: 255 }),
  company: uuid("company").$type<string | null>(),
  created_at: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  deleted_at: integer(),
});
// COmpanies

export const companiesTable = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner: uuid("owner")
    .notNull()
    .references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  slug: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  deleted_at: integer(),
  logo_url: varchar({ length: 255 }),
});

//Comapnies Members

export const companyMembersTable = pgTable(
  "companyMembers",
  {
    company: uuid("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    user: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: roleEnum("user_role").default("RECRUITER"), // optional: 'admin', 'recruiter'
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.company, table.user] }), // composite primary key
    // Optionally add unique index on userId alone if a user can only be in one company
  }),
);

// jobs

export const jobsTable = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: uuid("company")
    .notNull()
    .references(() => companiesTable.id),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => usersTable.id),
  // recruiter: uuid("recruiter")
  //   .notNull()
  //   .references(() => usersTable.id),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  status: jobStatusEnum("status").notNull().default("DRAFT"),
  application_count: integer().default(0),
  category: jobCategoryEnum("category").notNull(),
  job_type: JobType("job_type").notNull().default("FULL_TIME"),
  job_location: jobLocation("job_location").notNull().default("ONSITE"),
  location: varchar({ length: 255 }),
  created_at: integer()
    .notNull()
    .default(sql`extract(epoch from now())`),
  deleted_at: integer(),
});

// Job Applications

export const applicationsTable = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  job: uuid("job")
    .notNull()
    .references(() => jobsTable.id),
  candidate: uuid("candidate")
    .notNull()
    .references(() => usersTable.id),
  key: varchar({ length: 255 })
    .notNull()
    .unique()
    .default(sql`gen_random_uuid()::text`),
  current_stage: applicationStatus("current_stage")
    .notNull()
    .default("APPLIED"),
  resume_url: varchar({ length: 255 }),
  parsed_resume_url: varchar({ length: 255 }),
  created_at: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// invitations

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  company: uuid("company_id")
    .references(() => companiesTable.id, { onDelete: "cascade" })
    .notNull(),
  invitedBy: uuid("invited_by")
    .references(() => usersTable.id)
    .notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Interviews

export const interviewsTable = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  application: uuid("application") 
    .notNull()
    .references(() => applicationsTable.id),
  scheduled_at: integer().notNull(),
  reminder_sent: boolean("reminder_sent").notNull().default(false),
  interview_type: interviewTypeEnum("interview_type").notNull(),
});

// Logs

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  application_id: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id),
  changed_by: uuid("changed_by")
    .notNull()
    .references(() => usersTable.id),
  from_stage: varchar({ length: 255 }).notNull(),
  to_stage: varchar({ length: 255 }).notNull(),
  changed_at: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
export const emailLogsTable = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  to_email: varchar("to_email").notNull(),
  template: varchar("template").notNull(),
  status: emailStatusEnum("status").notNull().default("QUEUED"),
  sent_at: timestamp("sent_at", { withTimezone: true, mode: "date" }),
});

export type User = typeof usersTable.$inferSelect; // Full DB row type
export type NewUser = typeof usersTable.$inferInsert; // Insert type (partial optional)
