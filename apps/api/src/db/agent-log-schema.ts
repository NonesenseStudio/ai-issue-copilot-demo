import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

import { agentRuns } from "./agent-schema.js";

export const agentStepLogs = pgTable(
  "agent_step_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    runId: uuid("run_id")
      .notNull()
      .references(() => agentRuns.id, {
        onDelete: "cascade",
      }),

    step: text("step").notNull(),

    attempt: integer("attempt").notNull().default(1),

    status: text("status")
      .$type<"running" | "completed" | "failed">()
      .notNull(),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    errorCode: text("error_code"),

    startedAt: timestamp("started_at").defaultNow().notNull(),

    finishedAt: timestamp("finished_at"),
  },
  (table) => [index("agent_step_logs_run_idx").on(table.runId)],
);
