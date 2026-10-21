import { describe, it, expect } from "vitest";
import { issueDraftSchema } from "../ai/schema.js";

describe("AI issue schema", () => {
  it("rejects invalid priority", () => {
    const result = issueDraftSchema.safeParse({
      title: "实现登录",
      description: "开发登录功能",
      priority: "urgent",
      acceptanceCriteria: ["可以登录"],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid issue draft", () => {
    const result = issueDraftSchema.safeParse({
      title: "实现登录",
      description: "开发登录功能",
      priority: "high",
      acceptanceCriteria: ["可以登录"],
    });

    expect(result.success).toBe(true);
  });
});
