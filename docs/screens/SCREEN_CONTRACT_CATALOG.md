# Screen Contract Catalog — STO/SOT Platform

Machine-readable source: `build/sto-platform/src/lib/screens.ts` (object queues + columns) and `src/server/domain/registry.ts` (actions, validations, payload mappings, approver routing, tests via `tests/governance.test.ts`). Custom screens: command center, integration hub, resilience ops, AI workbench.

**v1.1 process-first additions** (see `docs/domain/STO_PROCESS_ACTIVITY_MAP.md`): every workbench now renders the 15-stage lifecycle ribbon with live open-item counts; every row exposes the governed actions valid for that object's current lifecycle state and the user's role (object-state → action matrix with prefill); the detail pane shows "what happens next" including actions gated to other roles; and `/my-work` is the persona work queue (approvals waiting on me + process actions in my court + AI reviews for my role).

Common contract on every workbench (enforced by the Workbench framework — impossible to ship a screen without it):

- data objects listed via `/api/objects/*` with tenant + ABAC scope filtering; loading / empty / error / permission states rendered;
- every field annotated with source system, source mode, source object/reference and freshness (SourceBadge + detail pane);
- every dropdown served by `/api/lookups/*` with dependent filtering and posting eligibility — hard-coded lists do not exist;
- every action maps to one ActionDefinition executed by the engine: validation panel, posting-path explanation, exact payload preview, approval requirement, read-back plan shown *before* submit;
- audit timeline per selected object; canonical transaction states distinguish draft / staged ("STAGED_NOT_POSTED") / pending_approval / approved / queued / sent / posted / failed / dead_letter / reconciled / rejected / reversed.

| Route | Purpose (1-line) | Queues | Governed actions |
| --- | --- | --- | --- |
| /my-work | Persona day-in-the-life queue: approvals (SoD-filtered), state-driven process actions, AI reviews for my role | live queue from process map | inline approve/reject; deep-link prefilled drafts |
| /command-center | Operating picture, lifecycle ribbon, drillable KPIs, four-eyes approval queue, integration health, voice guide | KPI rollup + approvals | approve/reject via engine |
| /portfolio | Event master, premise, gates, budget envelopes | events, gates, budgets | event.create, premise.approve |
| /scope | Intake → dedupe → decide → freeze; SAP notification create/associate | candidates, emergent, SAP notifs, APM recs | scope.submit/decide/freeze, scope.create_notification |
| /work-packages | WP360 assembly + readiness-gated release | WPs, SAP orders, operations | wp.validate, wp.release |
| /schedule | P6 mirror, constraints, human rebaseline | activities, constraints | constraint.create, schedule.rebaseline |
| /materials | Demand→reservation→PR→GI with shortage linkage | demands, reservations, master, expediting | material.reserve/request_pr/issue |
| /permits | Fail-closed WCM visibility + correction requests | permits, isolations, exceptions | permit.request_correction, permit.update_status (fail-closed proof) |
| /area-risk | Area risk drivers, SIMOPS, masked worker presence | area risk, SIMOPS | simops.assign_mitigation |
| /contractors | Roster, burned-vs-earned, claims, SES | roster, claims | claim.decide, ses.prepare |
| /field, /execution | Progress, confirmations, emergent work, handover | operations, emergent, handovers | progress.submit, operation.confirm, emergent.raise |
| /labor-time | Time → CATS → payroll → accrual (separate objects) | entries, workers, periods | labor.submit, labor.post_cats, payroll.release |
| /qa | Punch, test packs, turnover with evidence gates | punch, packs, turnover | punch.create/close, turnover.approve |
| /startup-readiness | PSSR/RTS human-only gate | RTS gates, PSSR | startup.approve_rts |
| /cost | Forecast, read-model commitments/actuals, claims, accruals | forecast, mirrors, claims | forecast.submit_change, accrual.post |
| /lessons | Lessons → CAPA → MDG norm updates | lessons | lesson.capture, capa.approve, mdg.submit_change |
| /data-foundation | Data product certification, freshness, quality | products, issues | dataproduct.certify, mdg.submit_change |
| /connectors | Provision/test/dry-run/toggle/certify connectors | connector runtime | connector.toggle + test/dry-run ops |
| /resilience, /writeback | Transactions, outbox, DLQ, replay, reconciliation, reversal | txns, outbox, DLQ, recons | tick, replay (reason), reverse |
| /ai | Agent roster, cited review packages, blocked-action proof | recommendations, runs | run agents; attempt-blocked proof |
| /admin | Tenancy, master data scopes, connector toggle | plants, units, work centers | connector.toggle |
