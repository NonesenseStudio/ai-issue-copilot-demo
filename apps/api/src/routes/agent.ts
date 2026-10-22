import { Hono } from "hono";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { agentRuns } from "../db/agent-schema.js";
import { startAgent, executeAgent } from "../agent/executor.js";
import { createGithubIssue } from "@/integrations/github.js";
import { buildGithubIssueBody } from "@/agent/github.js";
import { agentStepLogs } from "@/db/agent-log-schema.js";

export const agentRoutes = new Hono();

agentRoutes.post("/agent/runs", async (c) => {
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
    const id = await startAgent(parsed.data.requirement);

    // 教学版同步等待 AI 生成草稿
    await executeAgent(id);

    return c.json({ data: { id } }, 201);
  } catch (error) {
    console.error("Agent failed:", error);
    return c.json({ error: "Agent execution failed" }, 502);
  }
});

agentRoutes.get("/agent/runs/:id", async (c) => {
  const id = c.req.param("id");

  if (!z.string().uuid().safeParse(id).success) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.id, id))
    .limit(1);

  if (!run) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ data: run });
});

agentRoutes.post("/agent/runs/:id/approve", async (c) => {
  const id = c.req.param("id");

  if (!z.string().uuid().safeParse(id).success) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  // 只有 waiting_approval 可以被领取
  const [run] = await db
    .update(agentRuns)
    .set({
      status: "executing",
      updatedAt: new Date(),
    })
    .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "waiting_approval")))
    .returning();

  if (!run) {
    return c.json({ error: "Run not awaiting approval" }, 409);
  }

  if (!run.draft) {
    await db
      .update(agentRuns)
      .set({ status: "failed", error: "Missing draft" })
      .where(eq(agentRuns.id, id));

    return c.json({ error: "Missing draft" }, 409);
  }

  try {
    // 复用第 3 周已实现的 GitHub API
    // 按实际函数签名调整参数
    const body = buildGithubIssueBody(run.draft.body, run.id);

    const result = await createGithubIssue({
      title: run.draft.title,
      body,
    });

    await db
      .update(agentRuns)
      .set({
        status: "completed",
        githubUrl: result.html_url,
        updatedAt: new Date(),
      })
      .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "executing")));

    return c.json({
      data: {
        status: "completed",
        url: result.html_url,
      },
    });
  } catch (error) {
    console.error("GitHub outcome uncertain", {
      runId: id,
      error,
    });

    await db
      .update(agentRuns)
      .set({
        status: "needs_reconciliation",
        error: "GITHUB_OUTCOME_UNKNOWN",
        updatedAt: new Date(),
      })
      .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "executing")));

    return c.json(
      {
        error: "GitHub outcome requires verification",
        runId: id,
      },
      502,
    );
  }
});

agentRoutes.post("/agent/runs/:id/reject", async (c) => {
  const id = c.req.param("id");

  if (!z.string().uuid().safeParse(id).success) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const [run] = await db
    .update(agentRuns)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "waiting_approval")))
    .returning({ id: agentRuns.id });

  if (!run) {
    return c.json({ error: "Run not awaiting approval" }, 409);
  }

  return c.json({
    data: { status: "rejected" },
  });
});

agentRoutes.get("/agent/runs/:id/logs", async (c) => {
  const id = c.req.param("id");

  if (!z.string().uuid().safeParse(id).success) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const [run] = await db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(eq(agentRuns.id, id))
    .limit(1);

  if (!run) {
    return c.json({ error: "Not found" }, 404);
  }

  const logs = await db
    .select()
    .from(agentStepLogs)
    .where(eq(agentStepLogs.runId, id))
    .orderBy(asc(agentStepLogs.startedAt));

  return c.json({ data: logs });
});
