import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export type SearchResult = {
  documentId: string;
  filename: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

export async function keywordSearch(
  question: string,
  limit = 10,
): Promise<SearchResult[]> {
  const q = question.trim();

  if (!q) return [];

  const topK = Math.min(Math.max(limit, 1), 20);

  // 提取技术术语和英文关键词
  const terms = (q.match(/[a-zA-Z][a-zA-Z0-9_.-]*/g) ?? []).filter(
    (term) => term.length >= 2,
  );

  // 中文短语使用精确包含匹配
  const chineseTerms = q.match(/[\p{Script=Han}]{2,}/gu) ?? [];

  const keywords = [...new Set([...terms, ...chineseTerms])].slice(0, 10);

  if (keywords.length === 0) return [];

  const conditions = keywords.map(
    (term) => sql`
      c.content ILIKE ${"%" + term.replace(/[\\%_]/g, "\\$&") + "%"}
      ESCAPE '\'
    `,
  );

  const where = sql.join(conditions, sql` OR `);

  const result = await db.execute(sql`
    SELECT
      c.document_id AS "documentId",
      d.filename AS "filename",
      c.chunk_index AS "chunkIndex",
      c.content,
      0::float8 AS similarity
    FROM document_chunks c
    JOIN documents d
      ON d.id = c.document_id
    WHERE ${where}
    ORDER BY c.chunk_index ASC
    LIMIT ${topK}
  `);

  return result.rows as SearchResult[];
}
