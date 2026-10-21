import { cosineDistance, desc, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { documents, documentChunks } from "../db/knowledge-schema.js";
import { embedTexts } from "./embedding.js";

export async function retrieveChunks(question: string, topK = 3) {
  const [queryEmbedding] = await embedTexts([question]);

  const similarity = sql<number>`
    1 - (${cosineDistance(documentChunks.embedding, queryEmbedding)})
  `;

  const results = await db
    .select({
      documentId: documents.id,
      filename: documents.filename,
      chunkIndex: documentChunks.chunkIndex,
      content: documentChunks.content,
      similarity,
    })
    .from(documentChunks)
    .innerJoin(documents, sql`${documentChunks.documentId} = ${documents.id}`)
    .orderBy(desc(similarity))
    .limit(Math.min(Math.max(topK, 1), 20));

  return results;
}
