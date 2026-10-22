import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { agentRuns } from "./agent-schema.js";

export const aiCallLogs = pgTable(
  "ai_call_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    runId: uuid("run_id").references(() => agentRuns.id, {
      onDelete: "set null",
    }),

    operation: text("operation").notNull(),
    model: text("model").notNull(),

    status: text("status").$type<"success" | "failed">().notNull(),

    inputTokens: integer("input_tokens").notNull().default(0),

    outputTokens: integer("output_tokens").notNull().default(0),

    durationMs: integer("duration_ms").notNull(),

    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 14,
      scale: 8,
    }),

    errorCode: text("error_code"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_call_logs_run_idx").on(table.runId),
    index("ai_call_logs_created_idx").on(table.createdAt),
  ],
);
