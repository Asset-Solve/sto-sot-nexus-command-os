# Dual-ERP Routing and Failover Policy — SAP Primary, Oracle Backup

Governs how the platform behaves when both SAP S/4HANA (primary) and Oracle
Fusion Cloud Applications (backup/secondary) connectors are configured.

## Principles

1. **One system of record per object per tenant.** The Source-of-Record
   Register decides ERP routing per object — never per request. "Backup"
   means Oracle is the SoR for tenants/objects that live on Oracle, or the
   documented continuity path; it never means dual-posting.
2. **No dual-post, ever.** A transaction posts to exactly one ERP. Posting the
   same business document to both systems is prohibited (reconciliation and
   audit cannot survive it).
3. **Routing is a posting-path decision.** The posting-path engine resolves
   `tenant + object + company/ledger → connector` from
   `config/connector-registry.yaml` (`erpRole: primary|backup`) and the SoR
   register. The UI and domain layer are ERP-agnostic; only the connector
   layer knows the target.
4. **Canonical model isolates the ERPs.** All screens and services speak the
   canonical transaction schema; SAP and Oracle mapping profiles translate at
   the connector boundary. Adding/switching an ERP is a mapping + registry
   change, not a rebuild — this is what makes the pack scale across use cases.

## ERP outage handling (primary unavailable)

- Writes continue to accrue in the **transactional outbox** with retry +
  exponential backoff; nothing is lost and nothing re-routes automatically.
- After the retry budget, entries land in the **DLQ** with alerting; replay
  requires human approval from the Posting Monitor.
- **Automatic failover of writes to the backup ERP is prohibited.** A
  temporary SoR change is a governed decision: ADR + finance/process-owner
  approval + cutover reconciliation plan, executed via the registry
  (`erpRole` + SoR register update), never by code.
- Reads may fail over to the latest replicated read model with an explicit
  staleness badge (source system, last sync) on every screen.

## Switchover / migration (planned SoR change)

1. Freeze writes for the object (workflow hold state).
2. Drain outbox; reconcile source vs target to zero for open documents.
3. Update SoR register + connector registry (`erpRole`, mapping profile).
4. Contract tests + reconciliation tests against the new target in SANDBOX.
5. Stage-gate approval (Stage 08/09 repair mode) before LIVE.

## Evidence

Every routing decision, failover ADR, and switchover produces audit entries
and lands in the release evidence pack. Stop conditions
`write_capability_unproven` and `no_source_of_record` apply to the backup
path exactly as to the primary.
