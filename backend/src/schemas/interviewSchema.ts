import { z } from "zod";
export const createInterviewSchema = z.object({
    application: z.string().uuid(),
    scheduled_at: z.number(),
    interview_type: z.enum(["PHONE", "ONSITE", "VIDEO"]),
})
export const updateInterviewSchema = z.object({
    scheduled_at: z.number().optional(),
    interview_type: z.enum(["PHONE", "ONSITE", "VIDEO"]).optional(),
})