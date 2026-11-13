import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.email().max(200),
  message: z.string().min(10).max(2000),
  website: z.literal(""),
  startedAt: z.number(),
});

export type ContactInput = z.infer<typeof contactSchema>;
