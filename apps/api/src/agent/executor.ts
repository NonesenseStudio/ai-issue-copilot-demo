import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { agentRuns } from "../db/agent-schema.js";
import { retrieveChunks } from "../rag/retrieve.js";
import { proposeGithubIssueWithUsage } from "../ai/tools.js";
import { trackLlmCall } from "../observability/track-llm.js";
import { estimateCost } from "../observability/ai-usage.js";
import {
  releaseBudget,
  reserveBudget,
  settleBudget,
} from "../security/budget.js";
import {
  AGENT_INSTRUCTIONS,
  buildKnowledgeContext,
} from "../security/prompt.js";
import { startStep, finishStep } from "./step-log.js";
import { claimPendingRun } from "./lease.js";

export async function startAgent(requirement: string) {
  const [run] = await db
    .insert(agentRuns)
    .values({ requirement })
    .returning({ id: agentRuns.id });

  return run.id;
}

export async function executeAgent(runId: string) {
  const { run, token } = await claimPendingRun(runId);

  const steps: Array<{
    step: "retrieve_knowledge" | "generate_issue";
    status: "completed" | "failed";
    startedAt: string;
    finishedAt: string;
    error?: string;
  }> = [];

  let currentStep: "retrieve_knowledge" | "generate_issue" =
    "retrieve_knowledge";
  let startedAt = new Date().toISOString();

  const logId = await startStep(runId, "retrieve_knowledge");
  try {
    const sources = await retrieveChunks(run.requirement, 3);
    await finishStep(logId, "completed");

    steps.push({
      step: currentStep,
      status: "completed",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    currentStep = "generate_issue";
    startedAt = new Date().toISOString();

    const knowledgeContext = buildKnowledgeContext(sources);
    const reservationUsd = 0.02;
    const price = {
      inputPerMillion: Number(process.env.LLM_INPUT_PRICE_PER_M),
      outputPerMillion: Number(process.env.LLM_OUTPUT_PRICE_PER_M),
    };
    let actualCostUsd: number | undefined;

    await reserveBudget("demo", reservationUsd);

    try {
      const draft = await trackLlmCall({
        runId,
        operation: "generate_issue",
        model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL!,
        price,
        execute: async () => {
          const result = await proposeGithubIssueWithUsage(run.requirement, {
            instructions: AGENT_INSTRUCTIONS,
            knowledgeContext,
          });
          if (result.usage) {
            actualCostUsd = estimateCost(result.usage, price);
          }
          return result;
        },
      });

      steps.push({
        step: currentStep,
        status: "completed",
        startedAt,
        finishedAt: new Date().toISOString(),
      });

      await db
        .update(agentRuns)
        .set({
          status: "waiting_approval",
          draft,
          steps,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentRuns.id, runId),
            eq(agentRuns.status, "running"),
            eq(agentRuns.leaseToken, token),
          ),
        );

      return draft;
    } finally {
      if (actualCostUsd === undefined) {
        await releaseBudget("demo", reservationUsd);
      } else {
        await settleBudget("demo", reservationUsd, actualCostUsd);
      }
    }
  } catch (error) {
    await finishStep(logId, "failed", "RETRIEVAL_FAILED");
    steps.push({
      step: currentStep,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      error: "Step execution failed",
    });

    await db
      .update(agentRuns)
      .set({
        status: "failed",
        steps,
        error: "Agent execution failed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentRuns.id, runId),
          eq(agentRuns.status, "running"),
          eq(agentRuns.leaseToken, token),
        ),
      );

    throw error;
  }
}
