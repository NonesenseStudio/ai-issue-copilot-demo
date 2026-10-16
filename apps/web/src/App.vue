<script setup lang="ts">
import { onMounted, ref } from "vue";
import { issueApi, type Issue, type Priority, aiApi } from "./api/issues";
import AiAssistant from "@/components/AiAssistant.vue";

const issues = ref<Issue[]>([]);
const title = ref("");
const description = ref("");
const priority = ref<Priority>("medium");

const loading = ref(false);
const submitting = ref(false);
const error = ref("");

const requirement = ref("");
const generating = ref(false);
const aiError = ref("");

async function loadIssues() {
  loading.value = true;
  error.value = "";

  try {
    const result = await issueApi.list();
    issues.value = result.data;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

async function createIssue() {
  if (!title.value.trim()) return;

  submitting.value = true;
  error.value = "";

  try {
    await issueApi.create({
      title: title.value.trim(),
      description: description.value,
      priority: priority.value,
    });

    title.value = "";
    description.value = "";
    await loadIssues();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}

async function closeIssue(issue: Issue) {
  try {
    // 第一周仅演示 PATCH 更新已有字段
    await issueApi.update(issue.id, {
      priority: "low",
    });
    await loadIssues();
  } catch (e) {
    error.value = (e as Error).message;
  }
}

async function deleteIssue(id: string) {
  try {
    await issueApi.remove(id);
    await loadIssues();
  } catch (e) {
    error.value = (e as Error).message;
  }
}

async function generateDraft() {
  if (requirement.value.trim().length < 10) {
    aiError.value = "请至少输入 10 个字符";
    return;
  }

  generating.value = true;
  aiError.value = "";

  try {
    const result = await aiApi.generateIssue(requirement.value.trim());

    const draft = result.data;

    title.value = draft.title;
    priority.value = draft.priority;

    description.value = [
      draft.description,
      "",
      "验收标准：",
      ...draft.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`),
    ].join("\n");
  } catch (error) {
    aiError.value = (error as Error).message;
  } finally {
    generating.value = false;
  }
}
onMounted(loadIssues);
</script>

<template>
  <main class="container">
    <h1>AI Issue Copilot</h1>
    <p>Week 1 · 全栈 CRUD</p>
    <section class="ai-panel">
      <h2>AI 生成 Issue</h2>

      <textarea
        v-model="requirement"
        placeholder="用自然语言描述你的开发需求..."
        rows="5"
        maxlength="3000"
      />

      <button type="button" :disabled="generating" @click="generateDraft">
        {{ generating ? "AI 生成中..." : "生成 Issue 草稿" }}
      </button>

      <p v-if="aiError" role="alert" class="error">
        {{ aiError }}
      </p>

      <p>生成后可在下方修改标题、描述和优先级， 确认后再保存。</p>
    </section>
    <form @submit.prevent="createIssue">
      <input
        v-model="title"
        placeholder="Issue 标题"
        maxlength="120"
        required
      />

      <textarea v-model="description" placeholder="Issue 描述" />

      <select v-model="priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button :disabled="submitting">
        {{ submitting ? "创建中..." : "创建 Issue" }}
      </button>
    </form>

    <p v-if="error" role="alert" class="error">
      {{ error }}
    </p>

    <p v-if="loading">加载中...</p>

    <ul v-else>
      <li v-for="issue in issues" :key="issue.id">
        <div>
          <strong>{{ issue.title }}</strong>
          <span> · {{ issue.priority }}</span>
          <p>{{ issue.description }}</p>
        </div>

        <div class="actions">
          <button @click="closeIssue(issue)">设为低优先级</button>
          <button @click="deleteIssue(issue.id)">删除</button>
        </div>
      </li>
    </ul>
    <AiAssistant />
  </main>
</template>

<style scoped>
.container {
  max-width: 760px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: system-ui, sans-serif;
}
form,
li {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
input,
textarea,
select,
button {
  padding: 10px;
  font: inherit;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
}
.actions {
  display: flex;
  gap: 8px;
}
.error {
  color: #c0392b;
}
.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>
