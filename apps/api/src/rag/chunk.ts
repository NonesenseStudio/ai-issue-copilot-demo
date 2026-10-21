export function splitText(
  text: string,
  chunkSize = 800,
  overlap = 100,
): string[] {
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error("Invalid chunk parameters");
  }

  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) return [];

  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < normalized.length; start += step) {
    const chunk = normalized.slice(start, start + chunkSize);

    if (chunk.trim()) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= normalized.length) {
      break;
    }
  }

  return chunks;
}
