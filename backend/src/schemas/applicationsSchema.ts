import { z } from "zod";

export const createApplicationSchema = z.object({
    job: z.string().uuid(),
    candidate: z.string().uuid(),
    current_stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "REJECTED"]).default("APPLIED"),
    resume_url: z.string(),
    parsed_resume_url: z.string(),
    created_at: z.date().default(new Date()).optional(),
})

export const updateApplicationSchema = z.object({
    job: z.string().uuid(),
    candidate: z.string().uuid(),
    current_stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "REJECTED"]),
    resume_url: z.string(),
    parsed_resume_url: z.string(),
})

