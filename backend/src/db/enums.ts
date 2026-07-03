import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", [
  "ADMIN",
  "RECRUITER",
  "CANDIDATE",
]);
export const jobStatusEnum = pgEnum("job_status", ["DRAFT", "OPEN", "CLOSED"]);
export const JobType = pgEnum("job_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);
export const jobLocation = pgEnum("job_location", [
  "REMOTE",
  "ONSITE",
  "HYBRID",
]);
export const applicationStatus = pgEnum("current_stage", [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
]);
export const emailStatusEnum = pgEnum("email_status", [
  "QUEUED",
  "SENT",
  "FAILED",
]);
export const interviewTypeEnum = pgEnum("interview_type", [
  "PHONE",
  "ONSITE",
  "VIDEO",
]);
export const jobCategoryEnum = pgEnum("job_category", [
  "IT",
  "HR",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "Customer Support",
  "Engineering",
  "Product Management",
  "Design",
  "Legal",
  "Administration",
  "Supply Chain",
  "Education & Training",
  "Healthcare",
  "Research & Development",
  "Consulting",
  "Project Management",
  "Business Development",
  "Other",
]);