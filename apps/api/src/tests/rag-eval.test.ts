import { describe, it, expect } from "vitest";
import { calculateMetrics } from "../rag/evaluate.js";

describe("RAG evaluation metrics", () => {
  it("calculates recall correctly", () => {
    const result = calculateMetrics(
      ["doc-a", "doc-b", "doc-c"],
      ["doc-b", "doc-c"],
      3,
    );

    expect(result.recall).toBe(1);
  });

  it("calculates reciprocal rank", () => {
    const result = calculateMetrics(["doc-a", "doc-b", "doc-c"], ["doc-b"], 3);

    expect(result.reciprocalRank).toBe(0.5);
  });

  it("returns zero when no relevant result", () => {
    const result = calculateMetrics(["doc-a", "doc-b"], ["doc-c"], 2);

    expect(result.recall).toBe(0);
    expect(result.reciprocalRank).toBe(0);
  });
});
