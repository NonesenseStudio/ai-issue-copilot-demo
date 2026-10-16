import { z } from "zod";

export const createIssueSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000).default(""),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })
  .strict();

export const updateIssueSchema = createIssueSchema.partial();

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export type Issue = CreateIssueInput & {
  id: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
};

export const issues = new Map<string, Issue>();
