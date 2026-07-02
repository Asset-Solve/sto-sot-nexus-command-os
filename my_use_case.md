<!--
  USE-CASE STARTER - ready to run either way:

  Track A (Python engine):
     .\.venv\Scripts\python.exe orchestrator\run.py --use-case-file my_use_case.md
  Track B (project chat):
     paste the "## Use case" section into the MY INPUT blank of KICKOFF_PROMPT.md

  Generated from:
     C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\MRO\MRO Platform of Solutions\mro_codex_pack\MRO_Use_Case.MD
-->

# Use case

A production-grade, dark-themed, multitenant MRO SaaS workbench for maintenance, repair, overhaul, customer service, induction, inspection, workscope planning, electronic work instructions, material shortage resolution, conformity, release-to-service, billing, customer approvals, and integration operations. The application is the system of engagement and orchestration layer for MRO events, work requirements, workscope decisions, disposition decisions, shortages, approvals, evidence packets, audit trails, outbox messages, retries, dead letters, and reconciliation records. SAP remains the system of record for equipment, functional locations, materials, serials, business partners, maintenance notifications, maintenance orders, service orders, sales quotations/orders, inventory movements, purchasing, QM inspection lots, billing references, and document links. The app reads SAP-backed master and transaction data through object-specific connectors and writes back controlled SAP transactions only through backend validation, approval, payload preview, outbox, idempotency, retry, response capture, post-write readback, reconciliation, and immutable audit logging.

## Details (optional - elaborates the paragraph above)

**Capability (one line):**
Enterprise MRO orchestration workbench spanning customer request intake through induction, workscope, execution, inspection, shortage clearing, conformity, release, billing, customer portal, and integration operations.

**Business outcome / value:**
Reduce MRO cycle time, execution blockers, rework, manual SAP transaction effort, material shortage delays, release defects, and billing reconciliation gaps while improving role-specific visibility, auditability, customer approval flow, and clean-core SAP integration readiness.

**Personas (who uses it):**
Customer service agent, induction clerk, event manager, planner, workscope engineer, engineering reviewer, inspector, technician, supervisor, material planner, buyer, expeditor, tool crib attendant, certifying staff, billing specialist, customer portal user, admin, integration operator, SaaS support.

**Process scope (the boundary):**
From customer request and pre-induction planning through receiving, MRO event creation, candidate workscope generation, customer quote/approval, order and operation preparation, execution, inspection, defect/disposition handling, material and tooling readiness, capacity/WIP management, conformity, release-to-service, billing readiness, customer document visibility, and integration retry/reconciliation operations.

**Systems of record touched:**
SAP S/4HANA or SAP ERP EAM/PM for equipment, functional locations, maintenance notifications, maintenance orders, operations, confirmations, task lists, BOMs, measurements, work centers, and planner groups; SAP CS/Service for service requests, service orders, entitlements, service confirmations, and customer equipment where applicable; SAP SD/OTC for inquiries, quotations, sales orders, returns, deliveries, billing readbacks, and customer commercial flow; SAP MM/Procurement/Inventory for material masters, stock/requirements, reservations, purchase requisitions, purchase orders, goods receipts, goods issues, and transfer postings; SAP QM for inspection lots, result recording, usage decisions, and quality notifications; SAP PS for projects, WBS elements, networks, and activity linkage where used; SAP DMS or attachment service for document links and evidence references; SAP BTP, Integration Suite, Event Mesh, API Management, Destination Service, Cloud Connector, Entra ID or enterprise SSO, Key Vault, telemetry, and object storage for platform services.

**Expected write-backs (what it changes in those systems):**
Create/update maintenance notifications, quality notifications, service requests/orders, maintenance orders, service orders, order operations, order releases, operation confirmations, labor/time confirmations, measurement documents, goods receipts, goods issues, return deliveries, transfer postings, reservations, purchase requisitions, quote packages/quotations, sales orders or billing readiness references, inspection results, usage decisions, document/attachment links, customer approval references, and post-write reconciliation records. All SAP write-backs must be backend-mediated and object-specific.

**Risk class (how controlled the writes are):**
controlled_side_effect

**Non-functional notes (optional):**
Dark-theme-first enterprise SaaS; multitenant from day one; tenant-aware routing, RBAC, company/plant/program/customer scope filters, feature flags, module entitlements, environment segregation, simulator/sandbox/live/disabled connector modes, immutable audit trails, source metadata on SAP-backed fields, source freshness tracking, payload snapshots, retry/dead-letter/reconciliation operations, Key Vault secrets, tenant-aware telemetry, backup and disaster recovery posture, and certification-ready clean-core SAP integration. Recommended implementation stack: Next.js App Router with TypeScript, NestJS backend, PostgreSQL with Prisma, Azure Blob Storage, Service Bus or equivalent queue abstraction, Application Insights and Log Analytics.

## Assumptions (things I'm asserting so the engine doesn't ask)

- Assume SAP is the system of record for master data, transactional orders, inventory, purchasing, finance/billing references, quality records, and document references unless a tenant explicitly configures a non-SAP source for a bounded object family.
- Assume the application owns MRO orchestration records, evidence packets, comments, audit logs, approval state, outbox records, retry records, dead letters, reconciliation records, source freshness, and payload snapshots.
- Assume no frontend performs direct SAP writes; all source-system write-backs flow through backend domain actions and object-specific connector interfaces.
- Assume critical writes require human review, validation, authorization, payload preview, idempotency, outbox processing, response capture, post-write readback, reconciliation, and audit logging.
- Assume simulator mode must support the full end-to-end demo flow with realistic seed data, SAP-like references, mixed statuses, integration failures, retry examples, and reconciliation examples.
- Assume the initial product is English-only, dark-theme-first, and optimized for desktop workbench usage while retaining responsive behavior for customer portal and field service extensions.
- Assume tenant isolation is mandatory on every orchestration table, API route, event, attachment, search index, integration log, and telemetry dimension.
- Assume released and supported SAP APIs are preferred, with any legacy or fallback integration routed through governed middleware/wrappers and documented clean-core exceptions.
- Assume all dropdowns and selectable business values are source-backed or configuration-backed, not hard-coded enterprise lists.
- Assume every production screen includes role-aware actions, validation rules, backend-bound fields, source-system metadata, comments/evidence/audit where relevant, and visible integration status.

## Open questions (things I know are unresolved)

- Which SAP landscape is the target for the first pilot: S/4HANA public cloud, S/4HANA private cloud, on-premise SAP ERP, or a hybrid landscape? - blocking: yes
- Which MRO segment is first in scope: aviation, industrial equipment, depot repair, field service repair, rotating equipment, or mixed enterprise MRO? - blocking: yes
- Which plants, company codes, service organizations, planner groups, work centers, and customer programs are included in the initial tenant rollout? - blocking: yes
- Which customer approval and portal capabilities are required for v1: quote approval only, document upload/download, event status visibility, release packet access, or full collaboration? - blocking: no
- Which SAP write-backs are approved for sandbox/live phase one versus simulator-only phase one? - blocking: yes
- Which regulatory/compliance regime applies: FAA/EASA release-to-service, ISO quality, SOX, GxP, defense/export controls, or internal enterprise audit only? - blocking: yes
- Which document repository is authoritative for evidence and attachments: SAP DMS, Azure Blob Storage, SharePoint, or a hybrid model with SAP DMS linkage? - blocking: no
- Which identity provider, role model, and tenant provisioning process should be used for the pilot? - blocking: no
- Which billing flow is required first: SD quotation/order/billing readback, CS service order billing, project/WBS billing, fixed-price quote package, or internal cost tracking only? - blocking: no
- What SLA, data retention, telemetry, backup, disaster recovery, and support dashboard requirements are mandatory for go-live? - blocking: no
