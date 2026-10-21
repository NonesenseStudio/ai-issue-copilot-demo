<script setup lang="ts">
import { ref } from "vue";
import { uploadDocument, askKnowledge, type RagSource } from "../api/knowledge";

const question = ref("");
const answer = ref("");
const sources = ref<RagSource[]>([]);
const loading = ref(false);
const uploading = ref(false);
const status = ref("");
const error = ref("");

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || uploading.value) return;

  if (!/\.(md|txt)$/i.test(file.name)) {
    error.value = "仅支持 .md 和 .txt 文件";
    return;
  }

  if (file.size > 20000) {
    error.value = "文件不能超过 20KB";
    return;
  }

  uploading.value = true;
  error.value = "";
  status.value = "";

  try {
    const content = await file.text();
    const result = await uploadDocument(file.name, content);

    status.value = `上传成功，共生成 ${result.chunkCount} 个片段`;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function ask() {
  if (!question.value.trim() || loading.value) return;

  loading.value = true;
  error.value = "";
  answer.value = "";
  sources.value = [];

  try {
    const result = await askKnowledge(question.value);
    answer.value = result.answer;
    sources.value = result.sources;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="knowledge">
    <h2>项目知识库助手</h2>

    <div>
      <h3>导入知识文档</h3>
      <input
        type="file"
        accept=".md,.txt"
        :disabled="uploading"
        @change="handleUpload"
      />
      <p v-if="status">{{ status }}</p>
    </div>

    <div>
      <h3>知识库问答</h3>
      <textarea
        v-model="question"
        rows="3"
        placeholder="请输入关于项目的问题"
      />
      <button :disabled="loading || !question.trim()" @click="ask">
        {{ loading ? "检索中..." : "提问" }}
      </button>
    </div>

    <p v-if="error" role="alert">{{ error }}</p>

    <article v-if="answer">
      <h3>AI 回答</h3>
      <pre>{{ answer }}</pre>
    </article>

    <section v-if="sources.length">
      <h3>检索来源</h3>
      <div
        v-for="source in sources"
        :key="`${source.filename}-${source.chunkIndex}`"
      >
        <strong>
          [来源 {{ source.index }}]
          {{ source.filename }}
        </strong>
        <p>
          相似度：
          {{ source.similarity.toFixed(3) }}
        </p>
        <pre>{{ source.content }}</pre>
      </div>
    </section>
  </section>
</template>

<style scoped>
.knowledge {
  display: grid;
  gap: 20px;
  padding: 20px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
