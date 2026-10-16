import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 120 }).notNull(),

  description: text("description").notNull().default(""),

  priority: varchar("priority", { length: 10 }).notNull().default("medium"),

  status: varchar("status", { length: 10 }).notNull().default("open"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").primaryKey().defaultRandom(),

  input: text("input").notNull(),

  output: jsonb("output").notNull(),

  model: varchar("model", { length: 100 }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .defaultNow(),
});
