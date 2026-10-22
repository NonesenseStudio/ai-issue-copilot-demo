<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import {
  createAgentRun,
  getAgentRun,
  getAgentLogs,
  decideAgentRun,
  type AgentRun,
  type AgentStepLog,
} from "../api/agent";
import AgentTimeline from "@/components/AgentTimeline.vue";

const requirement = ref("");
const run = ref<AgentRun | null>(null);
const logs = ref<AgentStepLog[]>([]);
const loading = ref(false);
const error = ref("");
const POLL_INTERVAL_MS = 2000;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let refreshing = false;
let refreshRequested = false;
let queuedRefreshShowsError = false;

async function refresh(showError = true) {
  if (!run.value) return;
  if (refreshing) {
    refreshRequested = true;
    queuedRefreshShowsError ||= showError;
    return;
  }

  refreshing = true;
  refreshRequested = false;
  queuedRefreshShowsError = false;
  let shouldShowError = showError;

  try {
    do {
      refreshRequested = false;
      const runId: string | undefined = run.value?.id;
      if (!runId) break;
      if (shouldShowError) error.value = "";

      try {
        const result = await getAgentRun(runId);
        if (run.value?.id === runId) {
          run.value = result.data;
          if (result.data.status === "needs_reconciliation") error.value = "";

          const logResult = await getAgentLogs(runId);
          if (run.value?.id === runId) logs.value = logResult.data;
        }
      } catch (e) {
        if (
          shouldShowError &&
          run.value?.id === runId &&
          run.value.status !== "needs_reconciliation"
        ) {
          error.value = (e as Error).message;
        }
      }

      shouldShowError = queuedRefreshShowsError;
      queuedRefreshShowsError = false;
    } while (refreshRequested);
  } finally {
    refreshing = false;
  }
}

function updatePolling(status: string | undefined) {
  if (status === "running" || status === "executing") {
    if (pollingTimer === null) {
      pollingTimer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    }
    return;
  }

  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

watch(() => run.value?.status, updatePolling, { immediate: true });
onUnmounted(() => updatePolling(undefined));

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "等待执行",
    running: "执行中",
    waiting_approval: "等待人工审批",
    executing: "执行中",
    completed: "已完成",
    failed: "执行失败",
    rejected: "已拒绝",
    needs_reconciliation: "等待人工核实",
  };

  return labels[status] ?? status;
}

const stepLabels: Record<string, string> = {
  retrieve_knowledge: "检索知识库",
  generate_issue: "生成 Issue 草稿",
  create_github_issue: "创建 GitHub Issue",
};

async function start() {
  if (!requirement.value.trim() || loading.value) return;

  loading.value = true;
  error.value = "";
  run.value = null;
  logs.value = [];

  try {
    const result = await createAgentRun(requirement.value);
    run.value = (await getAgentRun(result.data.id)).data;
    const logResult = await getAgentLogs(result.data.id);
    logs.value = logResult.data;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

async function decide(decision: "approve" | "reject") {
  if (!run.value || loading.value) return;

  loading.value = true;
  error.value = "";

  if (decision === "approve") run.value.status = "executing";

  try {
    await decideAgentRun(run.value.id, decision);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    await refresh(false);
    loading.value = false;
  }
}
</script>

<template>
  <section class="agent-workflow">
    <h2>AI Agent 工作流</h2>

    <textarea v-model="requirement" rows="4" placeholder="输入研发需求..." />

    <button
      :disabled="loading || requirement.trim().length < 10"
      @click="start"
    >
      {{ loading ? "处理中..." : "启动 Agent" }}
    </button>

    <p v-if="error" role="alert">{{ error }}</p>

    <template v-if="run">
      <h3>执行状态：{{ statusLabel(run.status) }}</h3>

      <AgentTimeline :logs="logs" />

      <ol>
        <li v-for="step in run.steps" :key="step.step">
          {{ stepLabels[step.step] ?? step.step }} —
          {{ statusLabel(step.status) }}
        </li>
      </ol>

      <div v-if="run.status === 'waiting_approval' && run.draft">
        <h3>等待人工审批</h3>
        <h4>{{ run.draft.title }}</h4>
        <pre>{{ run.draft.body }}</pre>

        <button :disabled="loading" @click="decide('approve')">
          确认创建 GitHub Issue
        </button>
        <button :disabled="loading" @click="decide('reject')">拒绝</button>
      </div>

      <a
        v-if="run.githubUrl"
        :href="run.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        查看 GitHub Issue
      </a>

      <p v-if="run.error && run.status !== 'needs_reconciliation'">
        {{ run.error }}
      </p>

      <button :disabled="loading" @click="refresh()">刷新执行状态</button>
    </template>
  </section>
</template>

<style scoped>
.agent-workflow {
  display: grid;
  gap: 12px;
  padding: 16px;
}

textarea {
  width: 100%;
  box-sizing: border-box;
}

pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

button {
  width: fit-content;
  padding: 8px 14px;
}
</style>
