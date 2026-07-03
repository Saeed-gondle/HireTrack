CREATE TYPE "public"."job_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."current_stage" AS ENUM('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."job_category" AS ENUM('IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Other');--> statement-breakpoint
CREATE TYPE "public"."job_location" AS ENUM('REMOTE', 'ONSITE', 'HYBRID');--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "job_id" TO "job";--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "candidate_id" TO "candidate";--> statement-breakpoint
ALTER TABLE "companies" RENAME COLUMN "owner_id" TO "owner";--> statement-breakpoint
ALTER TABLE "interviews" RENAME COLUMN "application_id" TO "application";--> statement-breakpoint
ALTER TABLE "jobs" RENAME COLUMN "company_id" TO "company";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "company_id" TO "skills";--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_jobs_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_candidate_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "companies_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "interviews" DROP CONSTRAINT "interviews_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "current_stage" SET DEFAULT 'APPLIED'::"public"."current_stage";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "current_stage" SET DATA TYPE "public"."current_stage" USING "current_stage"::"public"."current_stage";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "key" varchar(255) DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "application_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "category" "job_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "job_type" "job_type" DEFAULT 'FULL_TIME' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "job_location" "job_location" DEFAULT 'ONSITE' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "educations" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experiences" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "autoLoginToken" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "autoLoginTokenExpiry" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passwordReset" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isVerified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bookmarks" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_jobs_id_fk" FOREIGN KEY ("job") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_users_id_fk" FOREIGN KEY ("candidate") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_applications_id_fk" FOREIGN KEY ("application") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_key_unique" UNIQUE("key");

-- Job title fuzzy search
CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx
SELECT set_limit(0.2); -- looser match
ON jobs USING gin (lower(title) gin_trgm_ops);

-- Job description fuzzy search
CREATE INDEX IF NOT EXISTS jobs_description_trgm_idx
ON jobs USING gin (lower(coalesce(description, '')) gin_trgm_ops);

-- Candidate name fuzzy search
CREATE INDEX IF NOT EXISTS users_name_trgm_idx
ON users USING gin (lower(name) gin_trgm_ops);

-- Candidate email fuzzy search
CREATE INDEX IF NOT EXISTS users_email_trgm_idx
ON users USING gin (lower(email) gin_trgm_ops);

-- Skills JSONB fuzzy search by text representation
CREATE INDEX IF NOT EXISTS users_skills_trgm_idx
ON users USING gin (lower(coalesce(skills::text, '')) gin_trgm_ops);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx
ON jobs USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobs_description_trgm_idx
ON jobs USING gin (lower(coalesce(description, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_name_trgm_idx
ON users USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_email_trgm_idx
ON users USING gin (lower(email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_skills_trgm_idx
ON users USING gin (lower(coalesce(skills::text, '')) gin_trgm_ops);