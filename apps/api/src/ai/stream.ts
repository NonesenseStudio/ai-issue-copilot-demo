type StreamEvent = {
  type: string;
  delta?: string;
  response?: {
    status?: string;
  };
};

export async function createAIStream(
  message: string,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.deepseek.com/responses", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      instructions:
        "你是软件研发助手。请使用中文，帮助用户分析需求和拆解开发任务。",
      input: message,
      reasoning: {
        effort: "none",
      },
      text: {
        format: {
          type: "text",
          name: "string",
          schema: {},
        },
      },
      tools: null,
      tool_choice: "none",
      top_logprobs: null,
      user: "string",
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI_UPSTREAM_ERROR_${response.status}`);
  }

  return response.body;
}

export function extractSSEEvents(buffer: string): {
  events: StreamEvent[];
  remaining: string;
} {
  const events: StreamEvent[] = [];
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const remaining = blocks.pop() ?? "";

  for (const block of blocks) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!data || data === "[DONE]") continue;

    try {
      events.push(JSON.parse(data));
    } catch {
      // 忽略非 JSON 数据事件
    }
  }

  return { events, remaining };
}
