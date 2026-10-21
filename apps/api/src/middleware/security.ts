import { basicAuth } from "hono/basic-auth";
import type { MiddlewareHandler } from "hono";

export function demoAuth(): MiddlewareHandler {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;

  if (!username || !password) {
    throw new Error("Demo auth not configured");
  }

  const auth = basicAuth({
    username,
    password,
  });

  return (c, next) => {
    const path = c.req.path;
    if (path === "/api/health" || path.startsWith("/api/health/")) {
      return next();
    }

    return auth(c, next);
  };
}
