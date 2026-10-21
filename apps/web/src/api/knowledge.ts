export interface RagSource {
  index: number;
  filename: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/knowledge${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result = await response.json();
  return result.data as T;
}

export function uploadDocument(filename: string, content: string) {
  return post<{
    documentId: string;
    chunkCount: number;
  }>("/documents", { filename, content });
}

export function askKnowledge(question: string) {
  return post<{
    answer: string;
    sources: RagSource[];
  }>("/ask", { question });
}
