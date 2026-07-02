# AGENTS.md - Specialist Agent Registry

This pack builds enterprise-grade transactional ERP web applications. Agents must preserve source-of-record ownership, native integration proof, approval controls, outbox/read-back/reconciliation, audit, tenant isolation, and AI governance.

## Canonical Workflow

- Master prompt: `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`
- Execution sequence: `EXECUTION_SEQUENCE_00_TO_20.md`
- Codex skill: `.agents/skills/enterprise-ai-erp-builder/SKILL.md`
- Claude orchestrator skill: `.claude/skills/00-orchestrator/SKILL.md`
- Agent swarm runbook: `docs/ai/CODEX_CLAUDE_AGENT_SWARM_RUNBOOK.md`
- Gates: `docs/governance/STAGE_GATE_SCORECARDS.md`

## Specialist Agents

| Agent | File/Skill | Use when |
| --- | --- | --- |
| Orchestrator | `.claude/skills/00-orchestrator/SKILL.md` | Need staged plan, task routing, and gate control |
| Use Case Research | `.claude/skills/01-use-case-research/SKILL.md` | Need market, process, fit-to-standard, and value research |
| Domain Modeling | `.claude/skills/02-domain-modeling/SKILL.md` | Need capabilities, process, personas, data object classification |
| Native Integration | `.claude/skills/03-native-integration/SKILL.md` | Need SAP/Oracle/non-SAP connector mapping |
| Data Model | `.claude/skills/04-data-model/SKILL.md` | Need canonical/physical schema, outbox, audit, reconciliation |
| UI/UX | `.claude/skills/05-uiux-transactional-screens/SKILL.md` | Need screen contracts and workbench design |
| Backend | `.claude/skills/06-backend-services/SKILL.md` | Need APIs, domain services, workers, posting path |
| Workflow/Outbox | `.claude/skills/07-workflow-approval-outbox/SKILL.md` | Need approvals, outbox, read-back, reconciliation |
| Security/Readiness | `.claude/skills/08-security-production-readiness/SKILL.md` | Need IAM, tenant isolation, policy, operations |
| Testing/Evals | `.claude/skills/09-testing-evals/SKILL.md` | Need validation evidence and regression packs |

## Coordination Rules

- Use read-only subagents for research, audits, architecture challenge, security review, test review, and log analysis.
- Use only one write-heavy implementation agent per module or file boundary.
- Do not let any agent implement UI before Stage 12 approval.
- Do not let any agent implement ERP write-back before Stages 07, 08, 09, 10, and 11 are approved.
- Every stage returns artifacts, decisions, risks, open questions, evidence, and a proceed/revise/stop recommendation.

## Validation

After modifying the pack, run:

```powershell
rg --files -uu | Where-Object { $_ -notmatch '^[.]git[\\/]' }
Get-ChildItem schemas -Filter *.json | ForEach-Object { Get-Content -Raw $_.FullName | ConvertFrom-Json | Out-Null }
```

## Imported Claude Cowork project instructions

Build World Class Use to Enterprise Grade Web Application Development Engine
