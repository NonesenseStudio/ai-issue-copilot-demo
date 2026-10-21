import { Hono } from "hono";
import { z } from "zod";
import { ingestDocument } from "../rag/ingest.js";

export const knowledgeRoutes = new Hono();

knowledgeRoutes.post("/knowledge/documents", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      filename: z.string().trim().min(1).max(200),
      content: z.string().trim().min(1).max(20000),
    })
    .strict()
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid document" }, 400);
  }

  try {
    const result = await ingestDocument(
      parsed.data.filename,
      parsed.data.content,
    );

    return c.json({ data: result }, 201);
  } catch (error) {
    console.error("Document ingestion failed:", error);

    return c.json({ error: "Document ingestion failed" }, 502);
  }
});

import { answerWithKnowledge } from "../rag/answer.js";

knowledgeRoutes.post("/knowledge/ask", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      question: z.string().trim().min(1).max(2000),
    })
    .strict()
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid question" }, 400);
  }

  try {
    const result = await answerWithKnowledge(parsed.data.question);

    return c.json({ data: result });
  } catch (error) {
    console.error("RAG failed:", error);
    return c.json({ error: "RAG failed" }, 502);
  }
});
