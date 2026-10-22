import { z } from "zod";

export const githubIssueArgsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(20000),
  })
  .strict();

export type ToolName =
  | "retrieve_knowledge"
  | "generate_issue"
  | "create_github_issue";

type ToolContext = {
  tool: ToolName;
  status: string;
  approved: boolean;
  repo: string;
};

export function assertToolAllowed(context: ToolContext): void {
  const allowedRepo = process.env.GITHUB_REPO;

  if (!allowedRepo) {
    throw new Error("GITHUB_REPO_NOT_CONFIGURED");
  }

  if (context.tool !== "create_github_issue") {
    return;
  }

  if (context.repo !== allowedRepo) {
    throw new Error("REPOSITORY_NOT_ALLOWED");
  }

  if (context.status !== "executing" || !context.approved) {
    throw new Error("APPROVAL_REQUIRED");
  }
}
