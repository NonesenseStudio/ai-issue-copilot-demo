export type Priority = "low" | "medium" | "high";

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
}

export type CreateIssueInput = Pick<
  Issue,
  "title" | "description" | "priority"
>;
export interface IssueDraft {
  title: string;
  description: string;
  priority: Priority;
  acceptanceCriteria: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.error ?? message;
    } catch {
      // 非 JSON 错误响应
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const issueApi = {
  list: () => request<{ data: Issue[] }>("/issues"),

  create: (input: CreateIssueInput) =>
    request<{ data: Issue }>("/issues", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Partial<CreateIssueInput>) =>
    request<{ data: Issue }>(`/issues/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/issues/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const aiApi = {
  generateIssue: (requirement: string) =>
    request<{ data: IssueDraft }>("/ai/generate-issue", {
      method: "POST",
      body: JSON.stringify({ requirement }),
    }),
};
