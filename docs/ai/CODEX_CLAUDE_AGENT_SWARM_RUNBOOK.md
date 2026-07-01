# Codex And Claude Agent Swarm Runbook

Use this runbook to coordinate Codex, Claude Code, and specialist agents without
losing ERP control. In v2 the coordination below is executed by the automation
engine (`orchestrator/`), which resolves the driver per stage, enforces per-agent
write scopes, and runs the gate — but the principles apply whether you drive by
hand or with `run.py`.

## Default Split

| Work type | Preferred agent surface | Engine routing key |
| --- | --- | --- |
| Stage orchestration and gate reports | Main thread | `orchestration` |
| Long-form product and process reasoning | Claude Code | `long_form_reasoning` |
| Repo inspection, code edits, tests, browser verification | Codex | `repo_inspection` |
| Parallel read-only research | Codex or Claude subagents | `research` |
| Security, integration, and architecture challenge | Independent review agents | `review` |
| Implementation | One bounded implementation agent per slice | `implementation` |
| Release evidence | Main thread plus QA/SRE/security reviewers | `release_evidence` |

The engine's `pipeline.yaml → routing` table encodes this. `--driver auto` uses
it; `--driver codex|claude|dryrun` overrides globally.

## Subagent Rules

- Read-heavy tasks can run in parallel (stages 02 and 08 fan out).
- Write-heavy tasks are sequential unless file ownership is separated. The engine
  gives each agent a **write scope** (path globs in `pipeline.yaml → agents`) and
  never lets two write-heavy agents own overlapping files.
- Each subagent must receive scope, inputs, forbidden actions, and output format.
- Subagents return summaries, not raw logs.
- The orchestrator owns final synthesis and gate decisions.

## Headless invocation (how the engine drives each surface)

**Codex** — non-interactive `codex exec`: progress on stderr, final message on
stdout, `--json` for a JSONL event stream, `CODEX_API_KEY` for CI. The pack's
`orchestrator/adapters/codex.py` wraps this and only adds a write-enabling
sandbox flag when you pass `--allow-writes`.

```bash
codex exec --json --skip-git-repo-check --cd . "<handoff packet>"
```

**Claude Code** — headless `-p/--print`. Unattended safety rests on three
deterministic controls: restricted tools (`--allowedTools`/`--disallowedTools`),
a non-interactive permission mode, and `PreToolUse`/`PostToolUse` hooks that can
veto a call. Research/review agents default to a read-only toolset;
implementation is where writes are allowed.

```bash
claude -p --output-format json --permission-mode plan \
  --allowedTools "Read,Grep,Glob,WebSearch,WebFetch" "<handoff packet>"
```

Never grant an agent more tools, permission, or autonomy than its task needs
(OWASP LLM06, Excessive Agency).

## Handoff Packet

The engine renders this automatically (`adapters/base.py::render_handoff`); use
the same shape by hand.

```md
# Agent Handoff

Use case:
<one paragraph>

Current stage:
<stage number and name>

Approved decisions:
- <decision>

Constraints:
- <constraint>

Inputs:
- <file or artifact>

Task:
<bounded task>

Output format:
- Findings
- Evidence
- Risks
- Recommendations
- Open questions
- Files touched, if any

Do not:
- Proceed outside scope
- Hide assumptions
- Make write-heavy edits outside your owned write globs
- Trigger live ERP writes
- Let AI autonomously approve or post controlled transactions
- Dump raw logs unless asked
```

## Specialist Prompts (evaluator / reviewer agents)

These are the evaluator-optimizer loop from Anthropic's agent patterns: an
independent agent critiques the builder's output at the gate.

### Fit-To-Standard Agent

```text
Research whether SAP, Oracle, Maximo, ServiceNow, or another relevant enterprise system already supports this capability. Return standard capability, gaps, extension justification, clean-core risks (released-API level A-D), and recommended build/no-build decision. Do not propose code.
```

### Native Integration Agent

```text
For each object/action, identify preferred native API, OData, event, adapter, Integration Suite/OIC route, BTP destination, Cloud Connector need, auth model, limits, write support, read-back method, and fallback risk. Stop if write capability is unproven.
```

### Transaction Safety Reviewer

```text
Review the proposed transaction lifecycle for source-of-record safety, approval, SoD, payload preview, outbox, idempotency, retry, DLQ, target document capture, read-back, reconciliation, correction, reversal, closeout, and audit.
```

### UI Reality Reviewer

```text
Inspect screen contracts or implementation. Find fake buttons, hard-coded lookups, missing backend actions, missing loading/error/permission states, missing source badges, missing audit timeline, and missing e2e tests.
```

### AI Governance Reviewer

```text
Review AI features for source grounding, citations, model routing, prompt versioning, policy checks, prompt-injection defense (direct and indirect), evals, audit, and blocked autonomous controlled actions.
```

## Guardrails summary

- Least-privilege tools per agent; writes gated behind `--allow-writes`.
- Per-agent write scopes prevent concurrent write collisions.
- Every gate is deterministic and machine-checked before human approval.
- No live ERP writes from any agent without approval + outbox + read-back.
- AI never autonomously approves or posts controlled transactions.
