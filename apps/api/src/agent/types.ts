export const agentStatuses = [
  "pending",
  "running",
  "waiting_approval",
  "executing",
  "completed",
  "failed",
  "rejected",
] as const;

export type AgentStatus = (typeof agentStatuses)[number];

export type AgentStep =
  | "retrieve_knowledge"
  | "generate_issue"
  | "create_github_issue";

export type StepResult = {
  step: AgentStep;
  status: "completed" | "failed";
  startedAt: string;
  finishedAt: string;
  error?: string;
};

export type IssueDraft = {
  title: string;
  body: string;
};
