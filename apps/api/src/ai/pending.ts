import { randomUUID } from "node:crypto";
import type { GithubIssueInput } from "./tools.js";

type PendingAction = {
  id: string;
  args: GithubIssueInput;
  expiresAt: number;
  state: "pending" | "executing" | "completed";
  resultUrl?: string;
};

const actions = new Map<string, PendingAction>();

export function createPendingAction(args: GithubIssueInput) {
  const action: PendingAction = {
    id: randomUUID(),
    args,
    expiresAt: Date.now() + 10 * 60 * 1000,
    state: "pending",
  };

  actions.set(action.id, action);
  return action;
}

export function getPendingAction(id: string) {
  const action = actions.get(id);

  if (!action) return null;

  if (Date.now() > action.expiresAt) {
    actions.delete(id);
    return null;
  }

  return action;
}

export function claimPendingAction(id: string) {
  const action = getPendingAction(id);

  if (!action || action.state !== "pending") {
    return null;
  }

  // 同步状态转换，避免同一进程内重复执行
  action.state = "executing";
  return action;
}

export function completePendingAction(id: string, url: string) {
  const action = getPendingAction(id);
  if (!action) return;

  action.state = "completed";
  action.resultUrl = url;
}
