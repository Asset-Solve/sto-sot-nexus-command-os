# Sandbox Integration Test Matrix

This matrix is the reusable baseline for every ERP use case tested against the
sandbox VM. Use-case teams can add rows, but they should not remove the baseline
controls because these rows map to the pack's stage gates and challenge register.

| ID | Flow | Systems | Required proof | Gates |
| --- | --- | --- | --- | --- |
| SBX-001 | Golden transaction posts through outbox and reconciles | SAP S/4, SAP Integration Suite, RabbitMQ, Postgres | Payload preview, approval if controlled, outbox, idempotency, target document, read-back, reconciliation, audit | 08, 09, 10, 11, 14, 16, 20 |
| SBX-002 | Dual ERP write routing blocks automatic failover | SAP S/4, Oracle Fusion, Postgres | One source of record, no dual-post, no automatic write failover, stale-read badge | 07, 08, 10, 16 |
| SBX-003 | Connector failure retries and parks in DLQ | SAP S/4, RabbitMQ, Postgres | Exponential retry, retry limit, DLQ record, replay permission, operator audit | 09, 10, 16, 19 |
| SBX-004 | Reconciliation mismatch opens owned case | SAP S/4, Postgres | Read-back comparison, mismatch class, assigned owner, correction or reversal path | 10, 16, 19, 20 |
| SBX-005 | Four-eyes policy blocks self approval | Keycloak, workflow service, SAP S/4 | Submitter cannot approve own controlled action, denial reason, audit trail | 11, 14, 16, 17 |
| SBX-006 | Tenant isolation blocks cross-tenant read | Keycloak, API, Postgres | Tenant context required, RLS or equivalent policy, denial audit | 14, 19, 20 |
| SBX-007 | AI recommendation cannot post controlled action | AI layer, workflow service, SAP S/4 | Citations, model profile, prompt version, human approval required, autonomous write blocked | 18, 20 |
| SBX-008 | Historian reading maps to asset indicator without OT write | PI Web API, OPC UA bridge, SAP S/4 | Read-only OT integration, tag-to-asset mapping, quality/unit validation, no OT write by default | 08, 09, 14, 20 |

## Scenario Data

Seeded scenario definitions live in
`infra/sandbox/seed/use-case-scenarios.yaml`. The database seed creates matching
rows in `erp_sandbox.integration_test_case`, `source_of_record_route`, and
connector endpoint tables.

## Required Test Suites

| Suite | Sandbox dependency | Evidence to capture |
| --- | --- | --- |
| Integration | Postgres, Keycloak, WireMock simulators | Requests, responses, correlation IDs, status transitions |
| Contract | OpenAPI, AsyncAPI, WireMock mappings | Schema compatibility and breaking-change report |
| Security | Keycloak, tenant routes, Postgres | RBAC, SoD, tenant isolation, secrets scan |
| Reconciliation | Postgres, SAP/Oracle simulators | Target reference, read-back snapshot, mismatch disposition |
| E2E | Generated web/API app plus sandbox services | User path from lookup to approval to target read-back |
| Performance | Postgres, RabbitMQ, simulator endpoints | P95 latency, queue throughput, retry behavior |
| AI evals | AI layer plus sandbox evidence | Grounding, citations, blocked controlled actions, injection resistance |

## Acceptance Rule

The sandbox proves integration readiness only when tests run in `SANDBOX` mode
through the same connector interfaces used by `LIVE` mode. Simulator-only tests
are useful for early design, but they do not satisfy the Stage 20 release
evidence requirement by themselves.
