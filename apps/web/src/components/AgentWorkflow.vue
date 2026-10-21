<script setup lang="ts">
import { ref } from "vue";
import {
  createAgentRun,
  getAgentRun,
  decideAgentRun,
  type AgentRun,
} from "../api/agent";

const requirement = ref("");
const run = ref<AgentRun | null>(null);
const loading = ref(false);
const error = ref("");

async function refresh() {
  if (!run.value) return;
  const result = await getAgentRun(run.value.id);
  run.value = result.data;
}

async function start() {
  if (!requirement.value.trim() || loading.value) return;

  loading.value = true;
  error.value = "";
  run.value = null;

  try {
    const result = await createAgentRun(requirement.value);
    run.value = (await getAgentRun(result.data.id)).data;
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

  try {
    await decideAgentRun(run.value.id, decision);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    try {
      await refresh();
    } catch (e) {
      error.value = (e as Error).message;
    }
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
      <h3>执行状态：{{ run.status }}</h3>

      <ol>
        <li v-for="step in run.steps" :key="step.step">
          {{ step.step }} — {{ step.status }}
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

      <p v-if="run.error">{{ run.error }}</p>

      <button :disabled="loading" @click="refresh">刷新执行状态</button>
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
