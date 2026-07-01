# Operating Model And Runbooks

Create this artifact during Stage 19 and update it before every release.

## Required Owners

| Area | Owner |
| --- | --- |
| Product capability | <owner> |
| Business process | <owner> |
| Source-of-record data | <owner> |
| Integration connector | <owner> |
| Workflow approval policy | <owner> |
| Security and privacy | <owner> |
| AI governance | <owner> |
| Production operations | <owner> |
| Reconciliation cases | <owner> |
| Release decision | <owner> |

## Required Runbooks

- Deployment and rollback.
- Database migration and rollback.
- Connector credential rotation.
- Connector outage.
- Outbox retry and DLQ triage.
- Reconciliation mismatch handling.
- Stuck approval and delegation handling.
- Tenant isolation incident.
- Security incident.
- AI hallucination or policy violation.
- Backup and restore.
- Performance degradation.
- Cost spike.

## SLO Candidates

| SLI | Example SLO |
| --- | --- |
| API availability | 99.9 percent monthly |
| Transaction submit latency | P95 under target agreed by use case |
| Lookup latency | P95 under target agreed by use case |
| Outbox processing delay | 95 percent within agreed target |
| Reconciliation completion | 99 percent of posted transactions reconciled within target |
| Connector error rate | Below agreed threshold by connector |
| AI grounded-answer rate | Above agreed eval threshold |
| Controlled-action refusal accuracy | 100 percent for blocked autonomous actions |
