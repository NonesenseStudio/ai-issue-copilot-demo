<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { fetchAgentMetrics, type AgentMetrics } from "../api/metrics";

const metrics = ref<AgentMetrics | null>(null);
const loading = ref(false);
const error = ref("");

async function refresh() {
  loading.value = true;
  error.value = "";

  try {
    metrics.value = await fetchAgentMetrics();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

const cards = computed(() => {
  if (!metrics.value) return [];

  const m = metrics.value;

  const percent = (value: number | null) =>
    value === null ? "暂无数据" : `${(value * 100).toFixed(1)}%`;

  return [
    {
      label: "Agent 完成率",
      value: percent(m.completionRate),
    },
    {
      label: "Agent 失败率",
      value: percent(m.failureRate),
    },
    {
      label: "LLM 成功率",
      value: percent(m.llmSuccessRate),
    },
    {
      label: "平均调用耗时",
      value: `${m.avgDurationMs.toFixed(0)} ms`,
    },
    {
      label: "Token 总量",
      value: (m.inputTokens + m.outputTokens).toLocaleString(),
    },
    {
      label: "已知调用估算成本",
      value: `$${m.estimatedCostUsd.toFixed(5)}`,
    },
  ];
});

onMounted(refresh);
</script>

<template>
  <section class="metrics">
    <header>
      <h2>Agent 运行指标</h2>
      <button :disabled="loading" @click="refresh">
        {{ loading ? "加载中..." : "刷新" }}
      </button>
    </header>

    <p v-if="error" role="alert">{{ error }}</p>

    <div v-if="metrics" class="grid">
      <article v-for="card in cards" :key="card.label">
        <small>{{ card.label }}</small>
        <strong>{{ card.value }}</strong>
      </article>
    </div>

    <p v-if="metrics?.unpricedCalls">
      有 {{ metrics.unpricedCalls }} 次成功调用
      缺少成本数据，合计金额并非完整费用。
    </p>
  </section>
</template>

<style scoped>
.metrics {
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

article {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

strong {
  font-size: 24px;
}
</style>
