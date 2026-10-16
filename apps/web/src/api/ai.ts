export async function streamChat(
  message: string,
  options: {
    signal?: AbortSignal;
    onDelta: (text: string) => void;
  },
): Promise<void> {
  const response = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let finished = false;

  function processBuffer() {
    buffer = buffer.replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = block
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim();

      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");

      if (!data) continue;

      if (event === "delta") {
        const payload = JSON.parse(data);
        options.onDelta(payload.text);
      }

      if (event === "error") {
        throw new Error("AI stream failed");
      }

      if (event === "done") {
        finished = true;
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      processBuffer();
    }

    if (!finished) {
      throw new Error("Stream ended unexpectedly");
    }
  } finally {
    reader.releaseLock();
  }
}

export interface ToolProposal {
  actionId: string;
  tool: "create_github_issue";
  arguments: {
    title: string;
    body: string;
  };
  expiresAt: number;
}

export interface GithubIssueResult {
  url: string;
  number?: number;
  alreadyExecuted: boolean;
}

export async function proposeIssue(requirement: string): Promise<ToolProposal> {
  const response = await fetch("/api/ai/tools/propose", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requirement }),
  });

  if (!response.ok) {
    throw new Error(`生成工具提案失败：${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function confirmGithubIssue(
  actionId: string,
): Promise<GithubIssueResult> {
  const response = await fetch("/api/integrations/github/issues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ actionId }),
  });

  if (!response.ok) {
    throw new Error(`创建 GitHub Issue 失败：${response.status}`);
  }

  const result = await response.json();
  return result.data;
}
