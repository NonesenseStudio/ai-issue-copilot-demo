<script setup lang="ts">
import { computed } from "vue";
import type { AgentStepLog } from "../api/agent";

const props = defineProps<{
  logs: AgentStepLog[];
}>();

const items = computed(() =>
  props.logs.map((log) => ({
    ...log,
    duration: log.finishedAt
      ? Math.round(
          (new Date(log.finishedAt).getTime() -
            new Date(log.startedAt).getTime()) /
            1000,
        )
      : null,
  })),
);

const labels: Record<string, string> = {
  retrieve_knowledge: "检索知识库",
  generate_issue: "生成 Issue 草稿",
  create_github_issue: "创建 GitHub Issue",
};

const statusLabels: Record<AgentStepLog["status"], string> = {
  running: "执行中",
  completed: "已完成",
  failed: "执行失败",
};
</script>

<template>
  <section class="timeline">
    <h3>执行记录</h3>

    <ol>
      <li v-for="item in items" :key="item.id" :class="item.status">
        <div class="step-title">
          <strong>
            {{ labels[item.step] ?? item.step }}
          </strong>
          <span>{{ statusLabels[item.status] }}</span>
        </div>

        <p>执行次数：{{ item.attempt }}</p>
        <p v-if="item.duration !== null">耗时：{{ item.duration }} 秒</p>
        <p v-if="item.errorCode">错误：{{ item.errorCode }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline ol {
  list-style: none;
  padding-left: 16px;
  border-left: 2px solid #ddd;
}

.timeline li {
  padding: 12px 16px;
  margin-bottom: 12px;
}

.step-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.completed {
  border-left: 3px solid #16a34a;
}

.failed {
  border-left: 3px solid #dc2626;
}

.running {
  border-left: 3px solid #d97706;
}
</style>
