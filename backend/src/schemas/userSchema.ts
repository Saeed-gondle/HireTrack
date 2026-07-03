import { z } from "zod";
export const userSignupSchema = z
  .object({
    email: z.string(),
    name: z.string(),
    role: z.enum(["RECRUITER", "CANDIDATE", "ADMIN"]).default("RECRUITER"),
    password: z.string(),
    confirm_password: z.string(),
    avatar_url: z.string().optional(),
    company: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"], // Error appears on confirmPassword field
  });
// email	text UNIQUE
// name	text
// role	enum: ADMIN | RECRUITER | CANDIDATE
// avatar_url	text
