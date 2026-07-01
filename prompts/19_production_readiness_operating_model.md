# Prompt 19 - Production Readiness And Operating Model

Prepare the application for production operation.

Create or update:

- `docs/security/PRODUCTION_READINESS_CHECKLIST.md`
- `docs/operations/OPERATING_MODEL_AND_RUNBOOKS.md`
- `docs/testing/VALIDATION_EVIDENCE_PACK.md`

Required coverage:

- identity
- tenant isolation
- RBAC/ABAC/SoD
- secrets
- API security
- connector security
- rate limits
- audit
- outbox and DLQ
- read-back and reconciliation
- OpenTelemetry logs, metrics, traces
- SLOs and alerts
- backup/restore
- DR
- rollback
- cost controls
- support and incident runbooks
- AI governance

No production deployment if identity, tenant context, rate limits, logging, audit, rollback, recovery, reconciliation ownership, or AI policy controls are not working.

