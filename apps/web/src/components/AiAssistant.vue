<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import {
  streamChat,
  proposeIssue,
  confirmGithubIssue,
  type ToolProposal,
} from "@/api/ai";

const message = ref("");
const answer = ref("");
const loading = ref(false);
const error = ref("");

const proposal = ref<ToolProposal | null>(null);
const proposing = ref(false);
const confirming = ref(false);
const githubUrl = ref("");
const toolError = ref("");

let controller: AbortController | null = null;

async function sendMessage() {
  if (!message.value.trim() || loading.value) return;

  controller = new AbortController();
  loading.value = true;
  answer.value = "";
  error.value = "";

  try {
    await streamChat(message.value, {
      signal: controller.signal,
      onDelta(text: any) {
        answer.value += text;
      },
    });
  } catch (e) {
    if (!(e instanceof DOMException && e.name === "AbortError")) {
      error.value = (e as Error).message;
    }
  } finally {
    loading.value = false;
    controller = null;
  }
}

async function prepareGithubIssue() {
  if (message.value.trim().length < 10) return;

  proposing.value = true;
  proposal.value = null;
  githubUrl.value = "";
  toolError.value = "";

  try {
    proposal.value = await proposeIssue(message.value.trim());
  } catch (error) {
    toolError.value = (error as Error).message;
  } finally {
    proposing.value = false;
  }
}

async function executeGithubIssue() {
  if (!proposal.value || confirming.value) return;

  confirming.value = true;
  toolError.value = "";

  try {
    const result = await confirmGithubIssue(proposal.value.actionId);

    githubUrl.value = result.url;
    proposal.value = null;
  } catch (error) {
    toolError.value = (error as Error).message;
    // 失败后禁用原提案的重复提交
    proposal.value = null;
  } finally {
    confirming.value = false;
  }
}

function rejectProposal() {
  proposal.value = null;
}

function cancel() {
  controller?.abort();
}

onUnmounted(cancel);
</script>

<template>
  <section class="assistant">
    <h2>AI 研发助手</h2>

    <textarea v-model="message" placeholder="输入你想分析的开发需求" rows="4" />

    <div class="actions">
      <button :disabled="loading || !message.trim()" @click="sendMessage">
        {{ loading ? "生成中..." : "发送" }}
      </button>

      <button v-if="loading" @click="cancel">停止生成</button>
    </div>

    <p v-if="error" role="alert">
      {{ error }}
    </p>

    <article class="answer">
      <pre>{{ answer }}</pre>
      <span v-if="loading">生成中...</span>
    </article>
  </section>

  <section class="github-panel">
    <h3>GitHub Issue 工具调用</h3>

    <p>使用上方输入的需求，生成待确认的 GitHub Issue。</p>

    <button
      :disabled="proposing || confirming || message.trim().length < 10"
      @click="prepareGithubIssue"
    >
      {{ proposing ? "正在分析..." : "准备创建 GitHub Issue" }}
    </button>

    <div v-if="proposal" class="proposal">
      <h4>待确认操作</h4>

      <p>
        <strong>工具：</strong>
        {{ proposal.tool }}
      </p>

      <p>
        <strong>标题：</strong>
        {{ proposal.arguments.title }}
      </p>

      <p><strong>描述：</strong></p>
      <pre>{{ proposal.arguments.body }}</pre>

      <p>目标：服务端配置的 GitHub 测试仓库</p>

      <div class="actions">
        <button :disabled="confirming" @click="executeGithubIssue">
          {{ confirming ? "正在创建..." : "确认创建" }}
        </button>

        <button :disabled="confirming" @click="rejectProposal">取消</button>
      </div>
    </div>

    <p v-if="toolError" role="alert">
      {{ toolError }}
    </p>

    <p v-if="githubUrl">
      创建成功：
      <a :href="githubUrl" target="_blank" rel="noopener noreferrer">
        查看 GitHub Issue
      </a>
    </p>
  </section>
</template>

<style scoped>
.assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.actions {
  display: flex;
  gap: 8px;
}
.answer {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
}
.github-panel,
.proposal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-top: 16px;
}

.proposal {
  background: #f8fafc;
}

.proposal pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
