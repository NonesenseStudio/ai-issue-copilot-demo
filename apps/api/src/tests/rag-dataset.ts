export type EvalCase = {
  question: string;
  relevantFiles: string[];
};

export const evalDataset: EvalCase[] = [
  {
    question: "创建 GitHub Issue 需要什么条件？",
    relevantFiles: ["sample-knowledge.md"],
  },
  {
    question: "Issue 有哪些优先级？",
    relevantFiles: ["sample-knowledge.md"],
  },
  {
    question: "项目使用什么数据库？",
    relevantFiles: ["sample-knowledge.md"],
  },
];
