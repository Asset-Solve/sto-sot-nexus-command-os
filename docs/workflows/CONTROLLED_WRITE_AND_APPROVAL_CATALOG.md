# Controlled Write and Approval Catalog

Source of truth: `build/sto-platform/src/server/domain/registry.ts` (the action catalog drives UI, validation, payload mapping, approval routing and this document). Engine: `src/server/core/engine.ts` — single execution pipeline, no other write path exists.

Universal controls on every controlled action: role authorization (RBAC) → plant/unit scope (ABAC) → mandatory reason where flagged → server-side validation → posting-path decision → canonical transaction envelope → four-eyes approval (submitter ≠ approver, enforced server-side) → payload preview + hash → outbox with idempotency + correlation → read-back → reconciliation → immutable audit with before/after, approver, reason.

| Action | Class | Risk | Submit roles | Approver roles | Target | Special gates |
| --- | --- | --- | --- | --- | --- | --- |
| event.create | CONTROLLED | MED | sto/outage mgr, sponsor | sponsor, sto_manager | platform | mandatory plant/unit/dates/WBS |
| premise.approve | CONTROLLED | MED | sto/outage mgr | event_sponsor | platform | reason required |
| scope.decide | CONTROLLED | MED | scope board, sto mgr | sto/outage mgr | platform | reason required for reject/defer |
| scope.freeze | CONTROLLED | HIGH | sto_manager | sponsor, outage mgr | platform | blocked while critical candidates unresolved |
| scope.create_notification | CONTROLLED | MED | planner, scope board | sto/outage mgr | SAP `API_MAINTNOTIFICATION` | technical object mandatory |
| emergent.raise | CONTROLLED | HIGH | field/supervisor/WPO | sto/outage mgr | platform | risk + schedule + cost impact mandatory |
| wp.release | CONTROLLED | HIGH | WPO, planner | maint supervisor, sto mgr | platform | fails closed on 9 readiness dims + suspended permits |
| schedule.rebaseline | CONTROLLED | HIGH | scheduler | sto/outage mgr | P6 approved delta | baseline id, impacts, reason; AI may never rebaseline |
| material.reserve | CONTROLLED | MED | material/maint planner, WPO | maint supervisor, sto mgr | SAP reservation | qty>0, plant/sloc/date/receiver order |
| material.request_pr | CONTROLLED | MED | procurement, material planner | sto mgr, finance | SAP PR | purchasing group + account assignment |
| material.issue | CONTROLLED | MED | warehouse_lead | material planner, sto mgr | SAP material document | reservation reference |
| permit.update_status | CONTROLLED | SAFETY | wcm_authority | — | SAP WCM | **always fails closed** (proof action) |
| permit.request_correction | CONTROLLED | SAFETY | HSE, supervisor, WCM | wcm_authority | platform → WCM authority | compliant path for permit changes |
| claim.decide | CONTROLLED | FINANCE | contractor coord, finance | finance, sto mgr | platform | reason required |
| ses.prepare | CONTROLLED | FINANCE | contractor coord, procurement | finance | SAP SES | PO + evidence |
| forecast.submit_change | CONTROLLED | FINANCE | finance, sto mgr | sponsor, finance | platform | drivers mandatory |
| accrual.post | CONTROLLED | FINANCE | finance | finance, sponsor | SAP journal entry | period format validated; reversible only |
| operation.confirm | CONTROLLED | MED | supervisors | maint supervisor, sto mgr | SAP confirmation | final conf blocked by open class-A punch |
| labor.post_cats | CONTROLLED | FINANCE | crew supervisor, timekeeper | maint supervisor, sto mgr | SAP CATS | pay code → wage type mapping |
| payroll.release | CONTROLLED | FINANCE | payroll_user | finance | payroll gateway | separate object from CATS/confirmation |
| punch.close | CONTROLLED | HIGH | QA, supervisor | QA, turnover coord | platform | evidence required |
| turnover.approve | CONTROLLED | HIGH | turnover coord | ops/startup authority | platform | blocked by open class-A punch |
| startup.approve_rts | **BLOCKED_FOR_AI** | SAFETY | ops/startup authority | ops/startup authority | platform | blocked while any blocker open; human only |
| capa.approve | CONTROLLED | MED | sto mgr, reliability | sto mgr, sponsor | platform | |
| dataproduct.certify | CONTROLLED | MED | data_steward | tenant_admin, sto mgr | platform | evidence required |
| mdg.submit_change | CONTROLLED | MED | steward, material planner | steward, tenant_admin | SAP MDG | never direct master-data writes |
| connector.toggle | CONTROLLED | HIGH | integration op, admin | tenant_admin, integration op | platform | disable blocks writes server-side |
| dlq replay (ops API) | CONTROLLED | HIGH | integration_operator verb | — | outbox | mandatory reason; production replay stronger approval |
| transaction reversal (ops API) | CONTROLLED | varies | submitter roles | original approvers | linked reversing txn | posted records never edited in place |

Advisory (no approval, still audited): scope.submit, wp.validate, constraint.create, simops.assign_mitigation, progress.submit (fails closed without released WP + active permits), labor.submit (effective-dated worker + fatigue rule), punch.create, lesson.capture, incident.create.

Lifecycle state machines (universal, exception, correction) are implemented verbatim from KICKOFF §12 in `src/server/core/types.ts`.
