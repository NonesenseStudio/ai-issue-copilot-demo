import { Hono } from "hono";
import { db } from "@/db/client.js";
import { aiGenerations } from "@/db/schema.js";
import { generateIssue } from "@/ai/service.js";
import { generateRequestSchema } from "@/ai/schema.js";
import { parseBody } from "./parse-body.js";
import { streamSSE } from "hono/streaming";
import { createAIStream, extractSSEEvents } from "@/ai/stream.js";
import { z } from "zod";
import { proposeGithubIssue } from "@/ai/tools.js";
import { createPendingAction } from "@/ai/pending.js";

const aiRoutes = new Hono();

aiRoutes.post("/ai/generate-issue", async (c) => {
  const result = await parseBody(c, generateRequestSchema);

  if ("error" in result) {
    return c.json(result, 400);
  }

  const { requirement } = result.data as {
    requirement: string;
  };

  try {
    const draft = await generateIssue(requirement);

    // 只记录成功的生成结果
    await db.insert(aiGenerations).values({
      input: requirement,
      output: draft,
      model: process.env.OPENAI_MODEL!,
    });

    return c.json({ data: draft });
  } catch (error) {
    console.error("AI generation failed:", error);

    if (error instanceof Error && error.message === "AI_NOT_CONFIGURED") {
      return c.json(
        {
          error: "AI service not configured",
        },
        503,
      );
    }

    return c.json(
      {
        error: "AI generation failed",
      },
      502,
    );
  }
});

aiRoutes.post("/ai/chat/stream", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      message: z.string().trim().min(1).max(3000),
    })
    .strict()
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid message" }, 400);
  }

  return streamSSE(c, async (stream) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // 浏览器断开时取消上游请求
    stream.onAbort(() => controller.abort());

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    try {
      const upstream = await createAIStream(
        parsed.data.message,
        controller.signal,
      );

      reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const result = extractSSEEvents(buffer);
        buffer = result.remaining;

        for (const event of result.events) {
          if (event.type === "response.output_text.delta") {
            await stream.writeSSE({
              event: "delta",
              data: JSON.stringify({
                text: event.delta ?? "",
              }),
            });
          }

          if (event.type === "response.completed") {
            completed = true;
          }

          if (
            event.type === "response.failed" ||
            event.type === "response.incomplete"
          ) {
            throw new Error(event.type);
          }
        }
      }

      if (!completed) {
        throw new Error("AI_STREAM_INCOMPLETE");
      }

      await stream.writeSSE({
        event: "done",
        data: "{}",
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("AI stream failed:", error);
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            error: "AI stream failed",
          }),
        });
      }
    } finally {
      clearTimeout(timeout);
      await reader?.cancel().catch(() => {});
    }
  });
});

aiRoutes.post("/ai/tools/propose", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      requirement: z.string().trim().min(10).max(3000),
    })
    .strict()
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid requirement" }, 400);
  }

  try {
    const args = await proposeGithubIssue(parsed.data.requirement);

    const action = createPendingAction(args);
 
    return c.json({
      data: {
        actionId: action.id,
        tool: "create_github_issue",
        arguments: action.args,
        expiresAt: action.expiresAt,
      },
    });
  } catch (error) {
    console.error("Tool proposal failed:", error);

    return c.json({ error: "Tool proposal failed" }, 502);
  }
});

export { aiRoutes };
