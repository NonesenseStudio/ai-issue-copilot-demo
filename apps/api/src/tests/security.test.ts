import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

function createTestApp() {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({ status: "ok" }));

  app.use(
    "/api/*",
    basicAuth({
      username: "test-user",
      password: "test-password",
    }),
  );

  app.get("/api/issues", (c) => c.json({ data: [] }));

  return app;
}

describe("API authentication", () => {
  it("allows health check", async () => {
    const app = createTestApp();
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
  });

  it("rejects unauthenticated requests", async () => {
    const app = createTestApp();
    const res = await app.request("/api/issues");

    expect(res.status).toBe(401);
  });

  it("rejects invalid credentials", async () => {
    const app = createTestApp();

    const auth = Buffer.from("test-user:wrong-password").toString("base64");

    const res = await app.request("/api/issues", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    expect(res.status).toBe(401);
  });

  it("allows valid credentials", async () => {
    const app = createTestApp();

    const auth = Buffer.from("test-user:test-password").toString("base64");

    const res = await app.request("/api/issues", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    expect(res.status).toBe(200);
  });
});
