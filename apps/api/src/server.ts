import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { apiRoutes } from "./routes/index.js";
import { demoAuth } from "@/middleware/security.js";
import { simpleRateLimit } from "./middleware/rate-limit.js";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());
app.use("/api/*", demoAuth());
app.use("/api/ai/*", simpleRateLimit(10));
app.use("/api/integrations/github/*", simpleRateLimit(5));
app.route("/", apiRoutes);

// 未匹配路由
app.notFound((c) => c.json({ error: "Route not found" }, 404));

// 未捕获异常
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? "0.0.0.0",
});

console.log("API: http://localhost:3000");
