import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/db/schema.ts",
    "./src/db/knowledge-schema.ts",
    "./src/db/agent-schema.ts",
    "./src/db/agent-log-schema.ts",
    "./src/db/ai-metrics-schema.ts",
    "./src/db/budget-schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
