import { retrieveChunks } from "./retrieve.js";
import { keywordSearch, type SearchResult } from "./keyword.js";

export type RankedChunk = SearchResult & {
  rrfScore: number;
};

export function fuseRRF(
  lists: SearchResult[][],
  topK = 5,
  k = 60,
): RankedChunk[] {
  const scores = new Map<string, RankedChunk>();

  for (const list of lists) {
    list.forEach((item, index) => {
      const key = `${item.documentId}:${item.chunkIndex}`;

      const previous = scores.get(key);

      scores.set(key, {
        ...item,
        rrfScore: (previous?.rrfScore ?? 0) + 1 / (k + index + 1),
      });
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);
}

export async function hybridSearch(
  question: string,
  topK = 5,
): Promise<RankedChunk[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    retrieveChunks(question, 10),
    keywordSearch(question, 10),
  ]);

  return fuseRRF([vectorResults, keywordResults], topK);
}
