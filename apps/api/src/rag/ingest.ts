import { db } from "../db/client.js";
import { documents, documentChunks } from "../db/knowledge-schema.js";
import { splitText } from "./chunk.js";
import { embedTexts } from "./embedding.js";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";

export async function ingestDocument(filename: string, content: string) {
  const chunks = splitText(content);

  if (!chunks.length) {
    throw new Error("EMPTY_DOCUMENT");
  }

  // 本周限制文档大小，避免单次产生大量 API 费用
  if (content.length > 20000 || chunks.length > 30) {
    throw new Error("DOCUMENT_TOO_LARGE");
  }

  const contentHash = createHash("sha256").update(content).digest("hex");
  const existing = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.contentHash, contentHash))
    .limit(1);

  if (existing.length > 0) {
    return {
      documentId: existing[0].id,
      chunkCount: 0,
      duplicate: true,
    };
  }

  const embeddings: number[][] = [];

  // 小批量调用，降低单次请求规模
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10);
    embeddings.push(...(await embedTexts(batch)));
  }

  // 所有向量生成成功后再开启事务
  return db.transaction(async (tx) => {
    const [document] = await tx
      .insert(documents)
      .values({ filename, content, contentHash })
      .returning({ id: documents.id });

    await tx.insert(documentChunks).values(
      chunks.map((chunk, index) => ({
        documentId: document.id,
        chunkIndex: index,
        content: chunk,
        embedding: embeddings[index],
      })),
    );

    return {
      documentId: document.id,
      chunkCount: chunks.length,
    };
  });
}
