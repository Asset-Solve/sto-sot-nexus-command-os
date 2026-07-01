# CLAUDE.md - Repository Operating Memory

This repository builds enterprise-grade transactional ERP web applications. Never optimize for pretty prototype screens at the expense of backend transaction behavior.

## Load Order

1. Read `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`.
2. Read `EXECUTION_SEQUENCE_00_TO_20.md`.
3. Read the specific prompt in `prompts/` for the current stage.
4. Load only the relevant skill from `.claude/skills/`.
5. Read the smallest set of docs required for the task.

## Always Preserve

- Fit-to-standard and clean-core reasoning before custom build.
- Connector-backed lookups.
- Backend-only ERP integration.
- Object-specific native APIs and approved integration layers.
- Source-of-record ownership and field-level write policy.
- Workflow states and approvals.
- Transactional outbox for every write.
- Idempotency, correlation ID, retry, DLQ.
- Read-back, reconciliation, and audit.
- Tenant isolation, RBAC, ABAC, SoD, data classification.
- AI model routing, evidence, citations, evals, prompt-injection defense, and approval gates.
- Stage gate evidence before moving to the next phase.

## Stop Before Coding If

- The data object owner is unknown.
- The API/write method is not proven.
- The screen contract does not list fields, actions, integrations, and tests.
- A controlled action lacks approval gates.
- A connector mode is unclear.
- A target transaction lacks read-back and reconciliation.
- AI is being asked to approve, post, replay, reverse, or override controlled ERP actions.

## Claude Code Usage

- Use skills for reusable staged procedures.
- Use subagents for domain research, fit-to-standard analysis, integration mapping, security review, and testing review.
- Use hooks to block dangerous commands, secret leakage, direct ERP calls, or stage-gate bypasses when configured.
- Keep the main thread focused on decisions and gate reports.

