export function buildGithubIssueBody(body: string, runId: string) {
  return [body, "", `<!-- ai-copilot-run:${runId} -->`].join("\n");
}
