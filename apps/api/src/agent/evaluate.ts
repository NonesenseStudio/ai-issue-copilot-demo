export type IssueDraft = {
  title: string;
  body: string;
};

export type EvaluationResult = {
  passed: boolean;
  score: number;
  checks: {
    name: string;
    passed: boolean;
  }[];
};

export function evaluateIssue(draft: IssueDraft): EvaluationResult {
  const checks = [
    {
      name: "标题长度",
      passed:
        draft.title.trim().length >= 8 && draft.title.trim().length <= 120,
    },
    {
      name: "正文非空",
      passed: draft.body.trim().length >= 50,
    },
    {
      name: "包含验收标准",
      passed: /验收标准|Acceptance Criteria/i.test(draft.body),
    },
    {
      name: "包含实施内容",
      passed: /实现|开发|实施|Implementation/i.test(draft.body),
    },
  ];

  const passedCount = checks.filter((item) => item.passed).length;

  return {
    passed: passedCount === checks.length,
    score: passedCount / checks.length,
    checks,
  };
}
