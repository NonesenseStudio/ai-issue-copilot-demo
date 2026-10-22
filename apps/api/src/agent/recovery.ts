import { and, eq, lt, isNotNull } from "drizzle-orm";

import { db } from "../db/client.js";
import { agentRuns } from "../db/agent-schema.js";

export async function recoverExpiredRuns() {
  const recovered = await db
    .update(agentRuns)
    .set({
      status: "pending",
      leaseUntil: null,
      leaseToken: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(agentRuns.status, "running"),
        isNotNull(agentRuns.leaseUntil),
        lt(agentRuns.leaseUntil, new Date()),
      ),
    )
    .returning({ id: agentRuns.id });

  return recovered;
}
