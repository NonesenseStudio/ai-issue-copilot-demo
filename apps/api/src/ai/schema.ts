import { z } from "zod";

export const issueDraftSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000),
    priority: z.enum(["low", "medium", "high"]),
    acceptanceCriteria: z.array(z.string().trim().min(1)).max(10),
  })
  .strict();

export const generateRequestSchema = z
  .object({
    requirement: z.string().trim().min(10).max(3000),
  })
  .strict();

export type IssueDraft = z.infer<typeof issueDraftSchema>;
