import { describe, expect, it } from "vitest";
import { assertToolAllowed } from "../security/tool-policy.js";

describe("GitHub tool policy", () => {
  it("拒绝未审批的写入", () => {
    process.env.GITHUB_REPO = "demo/repo";

    expect(() =>
      assertToolAllowed({
        tool: "create_github_issue",
        status: "waiting_approval",
        approved: false,
        repo: "demo/repo",
      }),
    ).toThrow("APPROVAL_REQUIRED");
  });

  it("拒绝非白名单仓库", () => {
    process.env.GITHUB_REPO = "demo/repo";

    expect(() =>
      assertToolAllowed({
        tool: "create_github_issue",
        status: "executing",
        approved: true,
        repo: "other/repo",
      }),
    ).toThrow("REPOSITORY_NOT_ALLOWED");
  });

  it("允许已审批的目标仓库操作", () => {
    process.env.GITHUB_REPO = "demo/repo";

    expect(() =>
      assertToolAllowed({
        tool: "create_github_issue",
        status: "executing",
        approved: true,
        repo: "demo/repo",
      }),
    ).not.toThrow();
  });
});
