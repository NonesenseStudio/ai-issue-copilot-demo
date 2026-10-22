import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { agentStepLogs } from "../db/agent-log-schema.js";

export async function startStep(runId: string, step: string, attempt = 1) {
  const [log] = await db
    .insert(agentStepLogs)
    .values({
      runId,
      step,
      attempt,
      status: "running",
    })
    .returning({ id: agentStepLogs.id });

  return log.id;
}

export async function finishStep(
  logId: string,
  status: "completed" | "failed",
  errorCode?: string,
) {
  await db
    .update(agentStepLogs)
    .set({
      status,
      errorCode,
      finishedAt: new Date(),
    })
    .where(eq(agentStepLogs.id, logId));
}
