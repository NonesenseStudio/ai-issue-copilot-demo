export type AgentRun = {
  id: string;
  requirement: string;
  status: string;
  draft: {
    title: string;
    body: string;
  } | null;
  steps: Array<{
    step: string;
    status: string;
    startedAt: string;
    finishedAt: string;
    error?: string;
  }>;
  githubUrl: string | null;
  error: string | null;
};

export type AgentStepLog = {
  id: string;
  runId: string;
  step: string;
  attempt: number;
  status: "running" | "completed" | "failed";
  metadata: Record<string, unknown> | null;
  errorCode: string | null;
  startedAt: string;
  finishedAt: string | null;
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function createAgentRun(requirement: string) {
  return request<{ data: { id: string } }>("/api/agent/runs", {
    method: "POST",
    body: JSON.stringify({ requirement }),
  });
}

export async function getAgentRun(id: string) {
  return request<{ data: AgentRun }>(`/api/agent/runs/${id}`);
}

export async function decideAgentRun(
  id: string,
  decision: "approve" | "reject",
) {
  return request(`/api/agent/runs/${id}/${decision}`, { method: "POST" });
}

export async function getAgentLogs(runId: string) {
  return request<{ data: AgentStepLog[] }>(`/api/agent/runs/${runId}/logs`);
}
