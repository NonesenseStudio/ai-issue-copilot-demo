import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiRoutes } from "./routes/index.js";

const app = new Hono();

app.use("*", cors());
app.route("/", apiRoutes);

// 未匹配路由
app.notFound((c) => c.json({ error: "Route not found" }, 404));

// 未捕获异常
app.onError((err, c) => {
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
  port: 3000,
  hostname: "0.0.0.0",
});

console.log("API: http://localhost:3000");
