# Enterprise AI ERP Web Application Prompt Pack — v2 (with Automation Engine)

Turn Claude Code, OpenAI Codex, or a coordinated swarm from a prototype generator
into a disciplined enterprise ERP application **delivery team** — now driven by a
runnable **automation engine**. You give one input (a use case); the engine
sequences 21 gated stages (00 → 20), spawns the right agents, checks each gate
programmatically, and stops for you to validate the layer before it proceeds.

This pack targets SAP-grade and Oracle-grade transactional web applications. The
target is never a dashboard — it is a governed transactional platform with real
data ownership, native connectors, approvals, outbox write-back, read-back,
reconciliation, audit, security, observability, support, and release gates.

> **What's new in v2**
> - `orchestrator/` — a full runnable engine (pipeline manifest + runner CLI +
>   programmatic gates + Codex/Claude/dry-run drivers + CI).
> - `tools/enhance/` — a meta-engine that sequentially enhances the pack itself.
> - Spine docs, research, and governance rewritten with source-backed depth and
>   wired to the engine's gates and challenge register.
> - Default generated stack: **TypeScript full-stack** (Next.js + NestJS + Postgres).
> - This is a **versioned copy**; your original pack is untouched. See
>   `MIGRATION_AND_SYNC.md`.

## Fast start — the only command you need

```bash
pip install -r orchestrator/requirements.txt

# guided-gate build from a single use case:
python orchestrator/run.py --use-case "Plant maintenance work-order cockpit integrated with SAP PM"

# it runs Stage 00, validates the gate, writes a report, and stops. Approve + continue:
python orchestrator/run.py --approve 00 && python orchestrator/run.py --resume
```

On Windows, if `python` is not on PATH:

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "Plant maintenance work-order cockpit integrated with SAP PM"
```

Zero-setup preview (offline, no API keys) — walk the whole 00→20 flow and watch
the gate machinery with the dry-run simulator:

```bash
python orchestrator/run.py --use-case "Purchase-requisition approval cockpit for SAP MM" \
  --driver dryrun --mode full_auto_draft --yes
python orchestrator/gates/validate.py     # inspect every gate
```

Prefer the skills instead of the engine? Both still work and run the same stages:

```text
Codex:        Use $enterprise-ai-erp-builder.   Use case: <...>   Mode: guided gates.
Claude Code:  /enterprise-erp-orchestrator      Use case: <...>   Mode: guided gates.
```

## What the engine does

```
you: a use case
      │
      ▼
 run.py ──▶ for each stage 00..20:
              1. handoff to routed driver (Claude reasoning / Codex code) + swarm
              2. produce the stage's declared artifacts
              3. programmatic gate: artifacts + schemas + forbidden-pattern scans
                 + ERP stop-conditions + test suites
              4. write STAGE_NN_GATE_REPORT.md
              5. guided mode → stop for YOUR approval → next stage
```

Full operator guide: `orchestrator/README.md`. Machine-readable pipeline:
`orchestrator/pipeline.yaml`. Gate rules: `orchestrator/gates/rules.yaml`.

## How to use this pack

1. Start with `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md` (now includes the engine invocation).
2. Let the engine run `prompts/00_permanent_rules.md` first, or run it by hand.
3. Follow `EXECUTION_SEQUENCE_00_TO_20.md` — each stage shows its engine driver, automated checks, and guarded challenges.
4. Do not build UI screens before the domain model, connector matrix, workflow model, data model, and screen contracts exist. The engine enforces this by gate dependencies.
5. `.agents/skills/enterprise-ai-erp-builder/SKILL.md` for Codex; `.claude/skills/*/SKILL.md` for Claude Code.
6. `CODEX.md` for coding-agent execution/commit discipline; `CLAUDE.md` for repo memory.
7. Treat every generated screen as incomplete until lookup APIs, backend actions, workflow states, payload preview, outbox, read-back, reconciliation, audit, and tests are implemented — the gates check exactly this.

## Repository structure

```text
orchestrator/            # THE ENGINE
  pipeline.yaml          #   21-stage DAG: agents, routing, artifacts, gate criteria
  run.py                 #   stage runner CLI (guided/full-auto/repair, resume, approve)
  gates/validate.py      #   programmatic gate: artifacts, schemas, scans, stop-conditions, tests
  gates/rules.yaml       #   forbidden patterns, stop-conditions, test commands, CH index
  adapters/              #   codex / claude / dryrun drivers + routing
  schemas/               #   run-state schema
tools/
  enhance/               # META-ENGINE: sequentially enhance the pack (enhance.py + plan)
  sync_from_v1.py        # materialise unchanged files from the original pack into v2
  lint_pack.py           # parse yaml/json + leftover-marker scan
prompts/00..20 + README  # stage prompts
docs/                    # domain, integration, connectors, screens, security, testing,
                         # operations, architecture, governance, ai
schemas/ config/ api/    # canonical schemas, gate config, OpenAPI/AsyncAPI
.claude/ .agents/        # Claude + Codex skills
Makefile .github/        # convenience targets + CI
```

## Core operating principle

A prototype can survive with frontend plus backend. An ERP-grade system cannot.
The minimum platform stack is:

```text
Frontend -> API/BFF -> domain services -> workflow/approval -> connector registry
-> transactional outbox -> database/storage -> IAM/RBAC/ABAC/RLS -> hosting/deployment
-> CI/CD/version control -> security/scanning -> rate limiting -> caching
-> monitoring/logs/traces/alerts -> rollback/recovery -> audit/compliance/SLOs/support
```

## Output expected from the coding agent (stage order)

Intake & assumptions → market/fit-to-standard research → current-state audit →
capability model → process decomposition → data model (master/txn/reference/audit/
AI-evidence) → source-of-record register → native integration matrix → connector
catalog → canonical transaction & posting path → workflow/approval/SoD/audit →
screen contracts → repo skeleton → backend foundation → connector-backed lookups →
transaction services (approval/outbox/read-back/reconciliation) → guided UI
workbenches → AI backbone (router/orchestrator/tools/RAG/evals) → production
readiness → release evidence pack + post-launch monitoring.

## Key references

- `AI_DEVELOPMENT_COMPANY_PATTERN_RESEARCH.md` — source-backed delivery, SAP/Oracle, agent, and security research
- `EXECUTION_SEQUENCE_00_TO_20.md` — the 21 stages with engine annotations
- `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md` — CH-01…CH-19 mapped to gates
- `docs/governance/STAGE_GATE_SCORECARDS.md` — human + automated gate criteria
- `docs/ai/CODEX_CLAUDE_AGENT_SWARM_RUNBOOK.md` — headless Codex/Claude coordination
- `orchestrator/README.md` — the engine, end to end
- `MIGRATION_AND_SYNC.md` — how v2 relates to your original pack
- `VALIDATION_REPORT.md` — what was validated in this build
```
