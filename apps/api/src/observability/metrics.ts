import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export async function getAgentMetrics() {
  const [runs, calls] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'completed'
        )::int AS completed,

        COUNT(*) FILTER (
          WHERE status = 'failed'
        )::int AS failed,

        COUNT(*) FILTER (
          WHERE status = 'rejected'
        )::int AS rejected,

        COUNT(*) FILTER (
          WHERE status = 'needs_reconciliation'
        )::int AS uncertain
      FROM agent_runs
    `),

    db.execute(sql`
      SELECT
        COUNT(*)::int AS total_calls,

        COUNT(*) FILTER (
          WHERE status = 'success'
        )::int AS successful_calls,

        COALESCE(
          AVG(duration_ms), 0
        ) AS avg_duration_ms,

        COALESCE(
          SUM(input_tokens), 0
        ) AS input_tokens,

        COALESCE(
          SUM(output_tokens), 0
        ) AS output_tokens,

        COALESCE(
          SUM(estimated_cost_usd), 0
        ) AS estimated_cost_usd,

        COUNT(*) FILTER (
          WHERE status = 'success'
            AND estimated_cost_usd IS NULL
        )::int AS unpriced_calls
      FROM ai_call_logs
    `),
  ]);

  const r = runs.rows[0];
  const c = calls.rows[0];

  const completed = Number(r.completed);
  const failed = Number(r.failed);
  const rejected = Number(r.rejected);

  const finished = completed + failed + rejected;
  const totalCalls = Number(c.total_calls);

  return {
    completed,
    failed,
    rejected,
    uncertain: Number(r.uncertain),

    completionRate: finished ? completed / finished : null,

    failureRate: finished ? failed / finished : null,

    llmSuccessRate: totalCalls ? Number(c.successful_calls) / totalCalls : null,

    avgDurationMs: Number(c.avg_duration_ms),
    inputTokens: Number(c.input_tokens),
    outputTokens: Number(c.output_tokens),
    estimatedCostUsd: Number(c.estimated_cost_usd),
    unpricedCalls: Number(c.unpriced_calls),
  };
}
