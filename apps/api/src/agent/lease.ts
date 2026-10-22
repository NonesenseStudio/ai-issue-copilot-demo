import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../db/client.js";
import { agentRuns } from "../db/agent-schema.js";

export async function claimPendingRun(runId: string) {
  const token = randomUUID();

  const [run] = await db
    .update(agentRuns)
    .set({
      status: "running",
      leaseToken: token,
      leaseUntil: new Date(Date.now() + 120_000),
      updatedAt: new Date(),
    })
    .where(and(eq(agentRuns.id, runId), eq(agentRuns.status, "pending")))
    .returning();

  if (!run) {
    throw new Error("RUN_NOT_AVAILABLE");
  }

  return { run, token };
}
