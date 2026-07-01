# Production Readiness Checklist

| Gate | Required evidence |
| --- | --- |
| Identity | JWT/enterprise identity validated; no trusted user headers in production |
| Tenant isolation | RLS or equivalent enforced; tenant context set per request and tested |
| RBAC/ABAC | Role matrix and policy tests pass |
| SoD | Four-eyes rules tested for controlled actions |
| Data classification | Restricted, regulated, confidential, internal, and public data handling defined |
| Secrets | No secrets in frontend/repo/logs/prompts; vault/env only |
| API security | Authn/authz, validation, rate limits, CORS, injection tests, abuse cases |
| Connector security | Credentials isolated, destination policy, mode gating, no live writes in tests |
| Rate limiting | API-level, tenant-level, user-level, connector-level throttles configured |
| Audit | Immutable audit records for user, AI, workflow, and integration actions |
| Outbox | All writes use idempotency, retry, DLQ, replay controls |
| Read-back | Target document/status captured or exception raised |
| Reconciliation | Source/target mismatch workbench and cases exist |
| Observability | Logs, metrics, traces, correlation IDs, alerts, DLQ dashboards |
| SLOs | Availability, latency, connector queue, posting, reconciliation, and AI quality SLOs |
| Security testing | Dependency scan, secret scan, authz tests, injection tests, prompt-injection tests |
| AI governance | Model routing, prompt version, citations, evals, approval gates, audit |
| Backup/DR | Backup, restore, retention, RTO/RPO defined and tested |
| Rollback | App, migration, config, connector, and feature-flag rollback documented |
| Cost controls | Tenant usage metrics, budgets, alerts, AI/token limits, connector queue limits |
| Support | Incident runbook, escalation path, reconciliation owner, release owner |
| Release | CI/CD passes; release evidence pack exists |

## No-Go Conditions

- A controlled write can bypass approval, outbox, or reconciliation.
- Live connector mode is available to automated tests without explicit release approval.
- Any tenant isolation or authorization test fails.
- AI can autonomously approve, post, replay, reverse, or override controlled transactions.
- Production secrets appear in repo, prompt history, browser, logs, screenshots, traces, or fixtures.
- No rollback or restore path exists.

