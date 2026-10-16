import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client.js";
import { issues } from "@/db/schema.js";
import { createIssueSchema, updateIssueSchema } from "@/issues.js";
import { parseBody } from "./parse-body.js";

const issueRoutes = new Hono();

issueRoutes.get("/issues", async (c) => {
  const rows = await db.select().from(issues).orderBy(desc(issues.createdAt));

  return c.json({ data: rows });
});

issueRoutes.get("/issues/:id", async (c) => {
  const id = c.req.param("id");

  if (!z.uuid().safeParse(id).success) {
    return c.json({ error: "Invalid issue ID" }, 400);
  }

  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);

  if (!issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  return c.json({ data: issue });
});

issueRoutes.post("/issues", async (c) => {
  const result = await parseBody(c, createIssueSchema);

  if ("error" in result) {
    return c.json(result, 400);
  }

  const [issue] = await db.insert(issues).values(result.data).returning();

  return c.json({ data: issue }, 201);
});

issueRoutes.patch("/issues/:id", async (c) => {
  const id = c.req.param("id");

  if (!z.uuid().safeParse(id).success) {
    return c.json({ error: "Invalid issue ID" }, 400);
  }

  const result = await parseBody(c, updateIssueSchema);

  if ("error" in result) {
    return c.json(result, 400);
  }

  const [issue] = await db
    .update(issues)
    .set({
      ...result.data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(issues.id, id))
    .returning();

  if (!issue) {
    return c.json({ error: "Issue not found" }, 404);
  }

  return c.json({ data: issue });
});

issueRoutes.delete("/issues/:id", async (c) => {
  const id = c.req.param("id");

  if (!z.uuid().safeParse(id).success) {
    return c.json({ error: "Invalid issue ID" }, 400);
  }

  const deleted = await db
    .delete(issues)
    .where(eq(issues.id, id))
    .returning({ id: issues.id });

  if (deleted.length === 0) {
    return c.json({ error: "Issue not found" }, 404);
  }

  return c.body(null, 204);
});

export { issueRoutes };
