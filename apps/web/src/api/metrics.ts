export type AgentMetrics = {
  completed: number;
  failed: number;
  rejected: number;
  uncertain: number;
  completionRate: number | null;
  failureRate: number | null;
  llmSuccessRate: number | null;
  avgDurationMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  unpricedCalls: number;
};

export async function fetchAgentMetrics(): Promise<AgentMetrics> {
  const response = await fetch("/api/metrics");

  if (!response.ok) {
    throw new Error(`Metrics request failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    data: AgentMetrics;
  };

  return result.data;
}
