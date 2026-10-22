import { Hono } from "hono";
import { getAgentMetrics } from "../observability/metrics.js";

export const metricsRoutes = new Hono();

metricsRoutes.get("/metrics", async (c) => {
  const metrics = await getAgentMetrics();

  return c.json({
    data: metrics,
  });
});
