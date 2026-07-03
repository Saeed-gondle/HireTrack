import { z } from "zod";
export const jobSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(["OPEN", "CLOSED", "DRAFT"]).default("DRAFT").optional(),
  category: z
    .enum([
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
    ])
,
  job_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  job_location: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
  location: z.string().optional(),
});
export const jobUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED", "DRAFT"]).default("DRAFT").optional(),
  category: z
    .enum([
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
      "Other"
    ])
    .optional(),
  job_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  job_location: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
});
export type JobInput = z.infer<typeof jobSchema>;
