import type { MiddlewareHandler } from "hono";

export function simpleRateLimit(
  max = 10,
  windowMs = 60_000,
): MiddlewareHandler {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (c, next) => {
    // 仅限单用户、本地单实例演示环境
    const key = "demo-user";
    const now = Date.now();
    const current = requests.get(key);

    const entry =
      !current || now >= current.resetAt
        ? { count: 0, resetAt: now + windowMs }
        : current;

    entry.count++;
    requests.set(key, entry);

    if (entry.count > max) {
      c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));

      return c.json({ error: "请求过于频繁，请稍后重试" }, 429);
    }

    await next();
  };
}
