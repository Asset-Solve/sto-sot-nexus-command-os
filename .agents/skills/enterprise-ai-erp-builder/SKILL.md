---
name: enterprise-ai-erp-builder
description: Turn a raw ERP use case into an enterprise-grade transactional SaaS application through staged Codex/Claude workflow gates, native ERP integration proof, workflow controls, AI governance, implementation slices, tests, and release evidence.
---

# Enterprise AI ERP Builder

Use this skill when the user provides an ERP application use case and wants Codex to orchestrate the complete delivery workflow.

## Required Reading

Before acting, read these files completely:

1. `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`
2. `EXECUTION_SEQUENCE_00_TO_20.md`
3. `AI_DEVELOPMENT_COMPANY_PATTERN_RESEARCH.md`
4. `docs/governance/STAGE_GATE_SCORECARDS.md`
5. `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md`
6. `docs/ai/CODEX_CLAUDE_AGENT_SWARM_RUNBOOK.md`

Then read only the specific prompt and template files for the current stage.

## Default Mode

Default to `guided gates`.

- If the user gives only a use case, start at Stage 00.
- Infer non-blocking assumptions and record them.
- Ask only genuinely blocking questions.
- Do not implement application code until the required domain, data, integration, workflow, security, and screen gates are approved.

## Stage Loop

For every stage:

1. State the objective.
2. Read relevant prior artifacts.
3. Spawn read-only subagents for research/review when helpful.
4. Produce or update the required artifacts.
5. Evaluate the gate using `docs/governance/STAGE_GATE_SCORECARDS.md`.
6. Return a gate report with decision: `proceed`, `revise`, or `stop`.
7. In guided mode, wait for approval before the next stage.

## ERP No-Go Rules

Stop if:

- Source of record is unknown.
- Native/preferred write integration is unproven.
- A screen action lacks a backend domain endpoint.
- A controlled action lacks approval, SoD, audit, or payload preview.
- A write path lacks outbox, idempotency, read-back, and reconciliation.
- AI is asked to autonomously approve or post controlled transactions.
- Production readiness relies on manual undocumented steps.

