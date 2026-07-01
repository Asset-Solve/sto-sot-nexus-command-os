# Testing and Evaluation Strategy

## Required Tests

| Test type | What it proves |
| --- | --- |
| Unit | Domain rules, validation, posting-path decisions |
| Integration | API + DB + workflow + connector simulator |
| Contract | OpenAPI, AsyncAPI, JSON schema compatibility |
| E2E | User workflow from lookup to approval to outbox to reconciliation |
| Security | Auth, tenant isolation, RBAC, ABAC, SoD, injection, secrets |
| Connector | Simulator/sandbox/live mode parity, mapping, retries, DLQ |
| Reconciliation | Target read-back and mismatch handling |
| Accessibility | Keyboard, screen reader semantics, focus, contrast, error recovery |
| Performance | P95 reads, queue throughput, backpressure, connector latency |
| Resilience | Timeouts, duplicate submits, retries, poison messages, partial failures |
| Data quality | Required fields, source ownership, stale lookup handling, lineage |
| AI eval | Grounding, citations, refusal for controlled actions, prompt-injection defense |
| Regression | No screen loses backend plumbing, workflow state, audit, or connector behavior |

## Golden Scenarios

1. Valid transaction draft -> submit -> approve -> payload preview -> outbox -> posted -> read-back -> reconciled.
2. Missing master data blocks submit.
3. User attempts to self-approve four-eyes action and is blocked.
4. Connector failure creates retry and DLQ after policy limit.
5. Target document number mismatch opens reconciliation case.
6. AI recommends action but cannot post without human approval.
7. UI dropdown loads from backend lookup and shows source/mode/freshness.
8. Posted transaction correction uses reversal/correction path, not direct edit.
9. Tenant A cannot read, infer, post, or reconcile Tenant B data.
10. Live connector mode is blocked in automated e2e unless release-approved.
11. Prompt injection in retrieved content cannot trigger a tool call or controlled action.
12. API schema change breaks contract tests before release.

## Evidence Pack Contents

Create `docs/testing/VALIDATION_EVIDENCE_PACK.md` with:

- Commands run.
- Test result summary.
- Failed tests and disposition.
- Coverage by stage gate.
- Connector modes tested.
- Security and AI eval evidence.
- Known residual risks.
- Release recommendation.

