import type { GithubIssueInput } from "../ai/tools.js";

export async function createGithubIssue(input: GithubIssueInput): Promise<{
  number: number;
  html_url: string;
}> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("GITHUB_NOT_CONFIGURED");
  }

  const url =
    `https://api.github.com/repos/` +
    `${encodeURIComponent(owner)}/` +
    `${encodeURIComponent(repo)}/issues`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      'X-GitHub-Api-Version': '2026-03-10',
      "User-Agent": "ai-issue-copilot",
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      title: input.title,
      body: input.body,
    }),
  });

  if (!response.ok) {
    console.error("GitHub API error:", response.status);

    throw new Error(`GITHUB_API_ERROR_${response.status}`);
  }

  const result = (await response.json()) as {
    number: number;
    html_url: string;
  };

  return {
    number: result.number,
    html_url: result.html_url,
  };
}
