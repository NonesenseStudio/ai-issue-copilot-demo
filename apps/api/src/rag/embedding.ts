const EMBEDDING_MODEL = "embeddinggemma-2";
const EMBEDDING_DIMENSIONS = 768;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    embeddings: number[][];
  };

  if (
    result.embeddings.length !== texts.length ||
    result.embeddings.some(
      (embedding) =>
        embedding.length !== EMBEDDING_DIMENSIONS ||
        embedding.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new Error("Invalid Ollama embedding response");
  }

  return result.embeddings;
}
