import { z } from "zod";
export const newInvitaionSchema = z.object({
  email: z.string()
});
