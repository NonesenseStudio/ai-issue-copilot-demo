import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "@/db/client.js";

const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => {
  return c.json({ status: "ok" });
});

healthRoutes.get("/health/ready", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);

    return c.json({
      status: "ready",
      database: "ok",
    });
  } catch {
    return c.json(
      {
        status: "not_ready",
        database: "unavailable",
      },
      503,
    );
  }
});

export { healthRoutes };
