import { db } from "../db/client.js";
import { aiCallLogs } from "../db/ai-metrics-schema.js";

import { estimateCost, type TokenUsage, type ModelPrice } from "./ai-usage.js";

type TrackedResult<T> = {
  data: T;
  usage: TokenUsage | null;
};

type TrackOptions<T> = {
  runId?: string;
  operation: string;
  model: string;
  price: ModelPrice;
  execute: () => Promise<TrackedResult<T>>;
};

export async function trackLlmCall<T>(options: TrackOptions<T>): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await options.execute();

    const durationMs = Math.round(performance.now() - startedAt);

    const usage = result.usage;

    await db.insert(aiCallLogs).values({
      runId: options.runId ?? null,
      operation: options.operation,
      model: options.model,
      status: "success",
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      durationMs,
      estimatedCostUsd: usage
        ? String(estimateCost(usage, options.price))
        : null,
    });

    return result.data;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);

    try {
      await db.insert(aiCallLogs).values({
        runId: options.runId ?? null,
        operation: options.operation,
        model: options.model,
        status: "failed",
        durationMs,
        errorCode: "LLM_OR_TRACKING_FAILED",
      });
    } catch (logError) {
      console.error("AI metric write failed", logError);
    }

    throw error;
  }
}
