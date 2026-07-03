ALTER TYPE "public"."job_category" ADD VALUE 'Operations' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Customer Support' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Engineering' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Product Management' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Design' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Legal' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Administration' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Supply Chain' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Education & Training' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Healthcare' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Research & Development' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Consulting' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Project Management' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."job_category" ADD VALUE 'Business Development' BEFORE 'Other';--> statement-breakpoint
CREATE TABLE "companyMembers" (
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_role" "user_role" DEFAULT 'RECRUITER',
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "companyMembers_company_id_user_id_pk" PRIMARY KEY("company_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"company_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "application_count" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "createdBy" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "companyMembers" ADD CONSTRAINT "companyMembers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companyMembers" ADD CONSTRAINT "companyMembers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;