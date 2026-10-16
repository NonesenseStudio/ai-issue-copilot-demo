import { createGithubIssue } from "@/integrations/github.js";
import {
  getPendingAction,
  claimPendingAction,
  completePendingAction,
} from "@/ai/pending.js";
import { z } from "zod";
import { Hono } from "hono";

const integrationRoutes = new Hono();

integrationRoutes.post("/integrations/github/issues", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      actionId: z.uuid(),
    })
    .strict()
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid actionId" }, 400);
  }

  const { actionId } = parsed.data;
  const existing = getPendingAction(actionId);

  if (!existing) {
    return c.json({ error: "Action expired or not found" }, 404);
  }

  if (existing.state === "completed") {
    return c.json({
      data: {
        url: existing.resultUrl,
        alreadyExecuted: true,
      },
    });
  }

  const action = claimPendingAction(actionId);

  if (!action) {
    return c.json({ error: "Action already executing" }, 409);
  }

  try {
    const issue = await createGithubIssue(action.args);

    completePendingAction(actionId, issue.html_url);

    return c.json(
      {
        data: {
          number: issue.number,
          url: issue.html_url,
          alreadyExecuted: false,
        },
      },
      201,
    );
  } catch (error) {
    console.error("GitHub execution failed:", error);

    // 不自动恢复为 pending：
    // 超时后无法确定 GitHub 是否已经创建成功
    return c.json(
      {
        error:
          "Execution failed or status unknown. Check GitHub before retrying.",
      },
      502,
    );
  }
});

export { integrationRoutes };
