
#!/usr/bin/env bash
set -euo pipefail

echo "=== AI Issue Copilot Release Check ==="

echo "[1/4] TypeScript / Build"
pnpm build

echo "[2/4] API Tests"
pnpm --filter api test

echo "[3/4] Security Tests"
pnpm --filter api exec vitest run \
  src/tests/tool-policy.test.ts \
  src/tests/budget.test.ts \
  src/tests/access.test.ts \
  src/tests/prompt-security.test.ts

echo "[4/4] RAG / Agent Regression"
pnpm --filter api exec vitest run \
  src/tests/rag-eval.test.ts \
  src/tests/agent-eval.test.ts

echo "Release checks passed."
