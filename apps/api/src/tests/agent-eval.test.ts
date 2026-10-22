import { describe, it, expect } from "vitest";

import { evaluateIssue } from "../agent/evaluate.js";

describe("Agent Issue Evaluation", () => {
  it("accepts a valid Issue", () => {
    const result = evaluateIssue({
      title: "实现用户登录与权限校验",
      body: `
        实现用户登录接口及权限校验机制。

        需要开发登录 API、输入校验和错误处理。

        验收标准：
        1. 正确账号能够登录。
        2. 错误密码返回 401。
        3. 未授权请求不能访问受保护资源。
      `,
    });

    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it("rejects an empty Issue", () => {
    const result = evaluateIssue({
      title: "",
      body: "",
    });

    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it("detects missing acceptance criteria", () => {
    const result = evaluateIssue({
      title: "实现用户登录与权限校验",
      body: `
        需要开发用户登录功能，包括登录 API、
        用户密码校验、错误响应处理以及
        未登录状态下的权限拦截逻辑。
        该功能需要保证接口行为一致。
      `,
    });

    expect(result.passed).toBe(false);

    expect(result.checks.find((c) => c.name === "包含验收标准")?.passed).toBe(
      false,
    );
  });
});
