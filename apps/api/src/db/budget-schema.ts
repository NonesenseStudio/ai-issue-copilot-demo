import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const aiBudgets = pgTable("ai_budgets", {
  scope: text("scope").primaryKey(),

  limitUsd: numeric("limit_usd", {
    precision: 14,
    scale: 8,
  }).notNull(),

  usedUsd: numeric("used_usd", {
    precision: 14,
    scale: 8,
  })
    .notNull()
    .default("0"),

  reservedUsd: numeric("reserved_usd", {
    precision: 14,
    scale: 8,
  })
    .notNull()
    .default("0"),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
