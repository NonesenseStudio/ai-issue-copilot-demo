# AI Issue Copilot 开发规范

## Issue 优先级

Issue 优先级分为 low、medium、high。

high 用于影响核心业务流程的问题。

## GitHub Issue 创建规则

AI 只能生成待确认的 GitHub Issue 提案。

用户必须在页面点击确认后，
后端才能调用 GitHub API 创建 Issue。

## 数据存储

项目使用 PostgreSQL 存储 Issue 数据。
数据库通过 Docker Compose 在本地运行。
