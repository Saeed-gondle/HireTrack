import { z } from "zod";
export const companySchema = z.object({
    name: z.string().min(3, "Company name must be at least 3 characters long"),
    description: z.string().min(3, "Company description must be at least 3 characters long"),
    slug: z.string().min(3, "Company slug must be at least 3 characters long"),
    logo_url: z.string().url("Invalid URL").optional(),
})
