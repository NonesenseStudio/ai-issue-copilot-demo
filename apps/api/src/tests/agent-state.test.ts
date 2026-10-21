import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { agentRuns } from "../db/agent-schema.js";

describe("Agent approval state", () => {
  it("allows only one claim", async () => {
    const [run] = await db
      .insert(agentRuns)
      .values({
        requirement: "测试重复审批保护",
        status: "waiting_approval",
      })
      .returning();

    try {
      const claim = () =>
        db
          .update(agentRuns)
          .set({ status: "executing" })
          .where(
            and(
              eq(agentRuns.id, run.id),
              eq(agentRuns.status, "waiting_approval"),
            ),
          )
          .returning();

      const results = await Promise.all([claim(), claim()]);

      expect(results.filter((rows) => rows.length === 1)).toHaveLength(1);
    } finally {
      await db.delete(agentRuns).where(eq(agentRuns.id, run.id));
    }
  });
});
