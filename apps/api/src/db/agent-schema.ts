import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

import type { AgentStatus, StepResult, IssueDraft } from "../agent/types.js";

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),

  requirement: text("requirement").notNull(),

  status: text("status").$type<AgentStatus>().notNull().default("pending"),

  steps: jsonb("steps").$type<StepResult[]>().notNull().default([]),

  draft: jsonb("draft").$type<IssueDraft | null>(),

  githubUrl: text("github_url"),

  retryCount: integer("retry_count").notNull().default(0),

  error: text("error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
