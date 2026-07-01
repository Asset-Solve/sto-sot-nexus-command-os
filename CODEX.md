# CODEX.md - Coding Agent Execution Rules

Use this file for OpenAI Codex or any coding agent that edits the repo.

## Default Codex Invocation

```text
Use $enterprise-ai-erp-builder.

Use case:
<use case>

Mode: guided gates.
Start at Stage 00. Stop at every gate for approval.
```

## Task Discipline

- Work from one prompt stage or approved implementation slice at a time.
- Read the master prompt, execution sequence, and relevant stage prompt before editing.
- Create a short implementation plan before edits.
- Inspect existing code and docs before changing them.
- Make minimal coherent changes.
- Add or update tests with the code.
- Run lint, typecheck, tests, build, contract checks, security checks, and relevant e2e checks.
- Summarize files changed, behavior changed, tests run, evidence generated, and residual risks.

## Forbidden Shortcuts

- Do not hard-code dropdowns in UI.
- Do not add fake buttons.
- Do not call SAP, Oracle, non-SAP, OT, historian, database, or secret systems from frontend.
- Do not bypass workflow, approval, outbox, idempotency, read-back, reconciliation, or audit.
- Do not put secrets in browser, repo, logs, prompts, fixtures, screenshots, or traces.
- Do not update posted records directly.
- Do not mark unsupported connector writes as supported.
- Do not let AI approve, post, replay, reverse, or override controlled ERP transactions.

## Subagent Use

- Use read-only subagents for exploration, research, codebase mapping, security review, and test gap analysis.
- Use implementation agents sequentially unless file ownership is explicitly separated.
- Ask subagents for summaries with evidence, not raw command dumps.

## Commit Gate

Before commit:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm security:scan
pnpm enterprise:check
```

No commit if a controlled write path lacks source-of-record proof, native integration proof, idempotency, approval, audit, read-back, or reconciliation.

