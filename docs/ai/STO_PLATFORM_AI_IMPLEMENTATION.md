# STO Platform AI Implementation (Agents, Routing, Voice)

Concrete implementation of `AI_BACKBONE_AGENT_ORCHESTRATION.md` in the built platform. Code: `build/sto-platform/src/server/ai/` + policy gateway in `src/server/core/engine.ts`.

## Policy gateway (structural, not prompt-based)

The engine refuses controlled/blocked actions for `actorType: AI_AGENT` before RBAC runs, writes an `ai.blocked_action_attempt` audit event, and creates no transaction. The posting-path engine independently routes AI + controlled to `REVIEW_PACKAGE_ONLY`. Both are regression-tested; the AI Workbench has a live "prove blocked action" control.

## Model routing (deterministic, logged per run)

| Task kind | Route | Binding |
| --- | --- | --- |
| informational | FAST | claude-haiku-4-5 |
| advisory analysis | BALANCED | claude-sonnet-5 |
| long package review | LONG_CONTEXT | claude-sonnet-5 (200k) |
| integration triage | STRUCTURED_REASONING | sonnet + JSON schema |
| safety / finance / startup | HIGH_REASONING_REVIEW | claude-opus-4-8 — review package only |
| restricted data | PRIVATE_DEPLOYMENT | tenant private endpoint |

## Agent roster (12 implemented)

Orchestrator, Scope Intelligence, WP Readiness, Materials & Procurement, Schedule Recovery, WCM/Safety Review, Area Risk, Integration Triage, Labor/Cost, QA/Turnover, Startup/PSSR, Lessons/Norms. Every output carries: action class, target object, **citations** (objectType:objectId), confidence, model route, policy decision, human reviewer role, tool calls, blocked-action explanation where applicable. In SIMULATOR mode analysis is deterministic rules over governed read models; `AgentDef.run` is the seam for hosted model calls — governance is unchanged when models plug in.

## Voice command layer

Browser Web Speech API → transcript → `POST /api/voice` → intent (`navigate | query | draft_action | blocked | unknown`) with entity resolution against read models.

Guarantees:

- Voice **never executes** controlled actions — it pre-fills a draft that still passes validation, payload preview, submission and four-eyes approval.
- Safety/finance/startup/replay approvals are refused outright (HARD_BLOCKED grammar) with a spoken explanation.
- Transcripts pass prompt-injection heuristics; flagged content is quarantined and audited.
- Every voice command lands in the audit log; the same grammar serves typed commands (testable, keyboard-accessible).

## Evidence

`tests/governance.test.ts`: AI blocked-action attempt (no transaction, audited), citation/model-route/human-authority completeness, voice refusal + draft-only behavior.
