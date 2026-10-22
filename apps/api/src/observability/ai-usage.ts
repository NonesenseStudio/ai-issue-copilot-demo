export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type ModelPrice = {
  inputPerMillion: number;
  outputPerMillion: number;
};

export function estimateCost(usage: TokenUsage, price: ModelPrice): number {
  const { inputTokens, outputTokens } = usage;

  if (
    !Number.isSafeInteger(inputTokens) ||
    !Number.isSafeInteger(outputTokens) ||
    inputTokens < 0 ||
    outputTokens < 0
  ) {
    throw new Error("Invalid token usage");
  }

  const cost =
    (inputTokens * price.inputPerMillion) / 1_000_000 +
    (outputTokens * price.outputPerMillion) / 1_000_000;

  return Number(cost.toFixed(8));
}
