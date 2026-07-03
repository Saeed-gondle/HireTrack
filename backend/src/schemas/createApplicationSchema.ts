import { z } from "zod";
export const createApplicationSchema = z.object({
    job_id: z.string(),
    resume_url: z.string(),
    parsed_resume_url: z.string().optional(),
})
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;