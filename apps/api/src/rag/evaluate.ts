export function calculateMetrics(
  retrieved: string[],
  relevant: string[],
  k = 3,
) {
  const topK = retrieved.slice(0, k);
  const relevantSet = new Set(relevant);

  const hits = new Set(topK.filter((id) => relevantSet.has(id)));

  const recall = relevantSet.size ? hits.size / relevantSet.size : 0;

  const firstRank = retrieved.findIndex((id) => relevantSet.has(id));

  const reciprocalRank = firstRank >= 0 ? 1 / (firstRank + 1) : 0;

  return { recall, reciprocalRank };
}
