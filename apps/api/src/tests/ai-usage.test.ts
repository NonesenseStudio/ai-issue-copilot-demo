import { describe, it, expect } from "vitest";
import { estimateCost } from "../observability/ai-usage.js";

describe("Token cost estimation", () => {
  const price = {
    inputPerMillion: 0.5,
    outputPerMillion: 2,
  };

  it("calculates cost correctly", () => {
    const cost = estimateCost(
      {
        inputTokens: 3000,
        outputTokens: 800,
      },
      price,
    );

    expect(cost).toBeCloseTo(0.0031, 8);
  });

  it("handles zero usage", () => {
    expect(
      estimateCost(
        {
          inputTokens: 0,
          outputTokens: 0,
        },
        price,
      ),
    ).toBe(0);
  });

  it("rejects negative tokens", () => {
    expect(() =>
      estimateCost(
        {
          inputTokens: -1,
          outputTokens: 100,
        },
        price,
      ),
    ).toThrow();
  });
});
