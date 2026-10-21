import type { RankedChunk } from "./hybrid.js";

export function rerankChunks(
  question: string,
  chunks: RankedChunk[],
  topK = 3,
): RankedChunk[] {
  const terms = [
    ...new Set(
      question
        .toLowerCase()
        .match(/[a-z][a-z0-9_.-]*|[\p{Script=Han}]{2,}/gu) ?? [],
    ),
  ];

  if (!terms.length) {
    return chunks.slice(0, topK);
  }

  const scored = chunks.map((chunk) => {
    const content = chunk.content.toLowerCase();

    const matched = terms.filter((term) => content.includes(term)).length;

    const coverage = matched / terms.length;

    return {
      chunk,
      score: chunk.rrfScore * 100 + coverage * 0.5,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}
