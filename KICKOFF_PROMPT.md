# STO/SOT Kickoff Prompt - Enterprise Shutdown, Outage, and Turnaround Operating Platform

Use this prompt as the canonical kickoff brief for building the next-generation Shutdown, Outage, and Turnaround Management solution. It replaces any generic ERP or MRO prompt in this project. The target is not a dashboard and not a demo shell. The target is an enterprise command-and-control transactional platform that orchestrates SAP and non-SAP systems of record through governed workflows, connector-backed data, auditable write paths, AI-assisted review packages, and production-ready operations.

## 1. Role and Mission

Act as all of the following at once:

- enterprise STO/SOT product architect;
- SAP S/4HANA EAM, PM, MM, PS, FI/CO, CATS, WCM, DMS, BTP and BDC integration architect;
- non-SAP integration architect for Primavera P6, Microsoft Project, ePTW, historian, RTLS, DMS, contractor, payroll, PowerPlan, ServiceNow/Jira, and data platforms;
- principal backend architect;
- frontend UX lead for dense enterprise operational workbenches;
- AI governance and agent orchestration architect;
- QA, release, security, reliability, and compliance lead.

Primary mission:

Build a full STO/SOT enterprise operating platform that covers portfolio strategy through post-outage learning. It must feel like a market-leading industrial command-and-control product, while preserving clean-core SAP integration discipline and fail-closed controls for safety, finance, WCM, startup, and OT actions.

## 2. Project Context to Inherit

Use and improve the complete STO/SOT lineage in this workspace:

- the current `enterprise_ai_erp_prompt_pack_v2` documents, schemas, stage gates, config, and simulator app under `build/`;
- `STO_SOT_Kick_Off_Prompt.MD`;
- `docs/domain/*`, `docs/data/*`, `docs/integration/*`, `docs/connectors/*`, `docs/workflows/*`, `docs/screens/*`, `docs/ai/*`, `docs/security/*`, `docs/operations/*`, `docs/testing/*`, and `docs/release/*`;
- `docs/governance/gate-reports/STAGE_00_GATE_REPORT.md` through `STAGE_20_GATE_REPORT.md`;
- previous `sot-ai-platform` and `sot-turnaround-os-enterprise` work, especially:
  - `apps/web/COMMAND_CENTER.md`;
  - `docs/transactional/SCREEN_BY_SCREEN_TRANSACTIONAL_REDESIGN.md`;
  - `docs/transactional/SCREEN_DATA_OBJECT_ACTION_CONNECTOR_MAP.md`;
  - `docs/transactional/WORKFLOW_ACTION_CATALOG.md`;
  - `docs/transactional/INTEGRATION_REGISTRY.md`;
  - `docs/transactional/ENTERPRISE_DATA_OBJECT_CATALOG.md`;
  - `docs/transactional/END_TO_END_STO_DEMO_WORKFLOW.md`;
  - screen data object mapping files for command center, portfolio, scope, work packages, schedule, materials, permits, execution, labor-time, cost, quality-turnover, integration-hub, writeback, data-foundation, resilience, lessons, and AI agents.

Carry forward the following earlier capabilities and do not regress them:

- 12+ workspace STO/SOT command center structure;
- multi-event support with all events sourcing from API/read models, not seed-only UI state;
- canonical writeback model with server-side validation, mapping version, payload preview, approval, outbox, read-back, reconciliation, DLQ, replay, and immutable audit;
- Integration Hub with connector enable/disable, dry-run payload testing, SAP BTP/native API metadata, and non-SAP adapter paths;
- connector-backed dropdowns and lookup APIs;
- CATS 4.0 labor/time, payroll, finance accrual, PowerPlan, contractor, and cost-control integration concepts;
- data foundation for SAP BDC, Datasphere, CDS, SLT, HANA views, and governed data product certification;
- resilience operations for retry, DLQ, replay, rollback/correction, and reconciliation;
- AI agent roster, model routing, human-in-loop review, and autonomous-action blocking.

## 3. Fundamental Product Thesis

Industrial turnarounds still fail because planning, readiness, execution, safety, cost, schedule, material, contractor, quality, and startup controls are fragmented across SAP, P6, spreadsheets, field systems, contractor portals, safety systems, and informal meetings. The platform must solve that fragmentation.

The application must become the STO/SOT system of engagement and orchestration layer:

- SAP remains the system of record for SAP-owned master and transactional objects.
- Non-SAP systems remain systems of record for their owned objects.
- The STO/SOT platform owns event orchestration, scope decisions, readiness, work package assembly, control actions, exception workflows, AI review packages, audit, outbox, reconciliation, and cross-system operating picture.
- Dashboards summarize governed transactions; dashboards do not replace transactions.
- Every KPI must drill to the underlying object and action.
- Every action must route to a backend domain service and a governed data contract.

## 4. Non-Negotiable Build Rules

Do not violate these rules:

- Do not build a static frontend demo.
- Do not hard-code enterprise dropdown values in React or page components.
- Do not bypass backend APIs for lookups, forms, actions, or integration.
- Do not use a generic SAP connector for all objects.
- Do not invent SAP APIs; use published SAP APIs, SAP Business Accelerator Hub contracts, SAP Integration Suite, Event Mesh, BTP Destination, Cloud Connector, XSUAA, principal propagation, or approved middleware wrapper patterns.
- Do not write directly to SAP tables.
- Do not treat BDC, Datasphere, CDS, SLT, HANA views, or replicated tables as write targets.
- Do not let AI approve, release, restore, close, post, rebaseline, replay production DLQ, or perform controlled write actions.
- Do not let WCM, permit, isolation, startup, finance, payroll, or OT actions update silently.
- Do not let a UI action mutate local state and pretend the target system is updated.
- Do not allow posted records to be edited in place; use correction, cancellation, reversal, or supersession transactions.
- Do not ship a screen without source mapping, action mapping, role mapping, validation, audit, error handling, and tests.
- Do not mark live-ready unless connector certification, auth, payload mapping, read-back, and reconciliation are proven.

## 5. Target Product Outcome

Build a dark, modern, enterprise-grade STO/SOT workbench with these qualities:

- high-density but polished operational UI;
- command-center first screen, not marketing page;
- role-specific workbenches and action queues;
- every dropdown and lookup served by backend connector-backed APIs;
- every field annotated by source system, source mode, source object, freshness, write policy, and ownership;
- every controlled action wrapped in canonical transaction envelope;
- every outbound write placed in outbox with idempotency and correlation;
- every connector response captured;
- every write reconciled by read-back;
- every error user-visible and recoverable;
- every workflow auditable with before/after values, approver, reason, evidence, payload snapshot, and source/target references;
- simulator mode fully demo-ready, but architecturally identical to sandbox/live mode.

## 6. Full STO/SOT Lifecycle Scope

The solution must cover the full event lifecycle:

1. Portfolio strategy and opportunity identification.
2. Event premise, business case, production economics, and approval.
3. Outage master/event setup.
4. Scope discovery from notifications, inspections, APM/RBI, operator logs, manual requests, and past lessons.
5. Scope challenge, dedupe, benchmark, estimate, include, reject, defer, split, transfer, and approve.
6. Scope freeze with late/emergent work governance.
7. Maintenance order/work order association or creation.
8. Work package development with operations, job steps, labor, materials, services, tools, documents, permits, risks, QA, and schedule.
9. BOM, material, reservation, PR, PO, goods receipt, staging, goods issue, goods return, substitution, kit, tool, and logistics control.
10. Contractor mobilization, access, commercial leakage, SOW/SES, claims, burned-vs-earned, and vendor performance.
11. Cost estimate, budget, forecast, commitments, accruals, actuals, claims, and SAP reconciliation.
12. Schedule integration, critical path, constraints, impact review, recovery, lookahead, and rebaseline governance.
13. WCM, permit-to-work, isolation, LOTO, safety certificates, hot work, confined space, SIMOPS, muster, environmental, and safety readiness.
14. Area risk fabric using permits, gas/condition signals, work density, RTLS, fatigue, historical incidents, and critical path.
15. Systemization, boundary packs, system handover, restoration sequence, and return-to-service dependencies.
16. Daily execution, shift handover, progress, confirmations, emergent work, deferrals, cancellations, and field issue management.
17. Time/labor capture with CATS, PM confirmation, payroll export, finance accrual, cost object validation, and correction/reversal.
18. QA/QC, ITPs, inspections, test packs, punch list, turnover, evidence, and verification.
19. Startup readiness, PSSR, operations approval, restart package, and RTS gate.
20. Closeout, lessons learned, root cause, corrective actions, norm/template updates, benchmark history, and reusable learning.
21. Integration operations, data quality, security, AI governance, and continuous platform operations.

## 7. Personas and Role-Aware Actions

Build role-aware experiences for:

- executive viewer;
- event sponsor;
- STO manager;
- outage manager;
- operations/startup authority;
- production planner;
- scope board member;
- reliability engineer;
- maintenance planner;
- scheduler/project controls;
- work package owner;
- engineer;
- maintenance supervisor;
- field technician;
- timekeeper;
- crew supervisor;
- payroll user;
- finance/cost controller;
- procurement user;
- material planner;
- warehouse lead;
- tool crib attendant;
- contractor coordinator;
- contractor supervisor;
- HSE/safety reviewer;
- WCM authority/permit issuer;
- QA/QC inspector;
- turnover coordinator;
- data steward;
- integration operator;
- AI platform owner;
- tenant admin;
- auditor.

Every role must have:

- view permissions;
- edit permissions;
- approve permissions;
- connector/write permissions;
- replay/retry permissions;
- reversal/correction permissions;
- field-level masking or data minimization where needed;
- plant, unit, company code, project, work center, vendor, and customer scope filters.

## 8. Required Workbenches and Screen Contracts

Each screen must be implemented as a transactional workbench. For every screen, define:

- purpose;
- business process step;
- personas;
- data objects shown;
- object ownership and system of record;
- read-only fields;
- editable fields;
- actions;
- validations;
- workflow states;
- target connectors;
- payload preview;
- audit events;
- tests;
- loading, empty, error, permission, and source freshness states.

### 8.1 Event Command Center

Route: `/command-center`.

Purpose:

- Daily operating picture, command meeting view, exception-to-action cockpit, AI review package queue, integration health, and executive rollup.

Objects:

- TurnaroundEvent, KPI, ReadinessGate, Constraint, AreaRisk, ApprovalPackage, AIRecommendation, IntegrationHealth, OutboxSummary.

Actions:

- assign owner;
- escalate blocker;
- open underlying object queue;
- create command action;
- approve readiness gate;
- create AI-assisted review package;
- open integration incident;
- launch shift briefing.

Integrations:

- SAP EAM/MM/WCM/PS/FI/CO read models;
- SAP BDC/Datasphere analytics;
- P6/MS Project schedule;
- historian/PI/IP21/OPC UA read context;
- Event Mesh and Integration Suite telemetry.

### 8.2 Portfolio, Event Strategy, and Premise

Route: `/portfolio`.

Purpose:

- Manage event master, premise document, strategy, phase gates, event economics, WBS/project linkage, baseline budget, and shutdown window approval.

Objects:

- OutageEvent, EventStrategy, PremiseDocument, ProductionEconomicsScenario, GateCalendar, BudgetEnvelope, WBSProxy, ProjectProxy.

Actions:

- create outage event;
- submit event setup;
- approve premise;
- approve event strategy;
- select scenario;
- approve production/economics update;
- approve planning gate.

Validations:

- plant, unit, dates, owner, outage type, risk class, WBS/project link, company code, baseline calendar, source mode, and integration profile are mandatory.

Integrations:

- SAP PS/EPPM project/WBS;
- SAP IBP planning key figures where configured;
- SAP BDC/Datasphere for economics/cost/schedule read models;
- LP optimizer or production planning model adapters.

### 8.3 Scope Control Room

Route: `/scope`.

Purpose:

- Ingest, dedupe, cluster, challenge, estimate, approve, reject, defer, freeze, and govern late/emergent work.

Objects:

- ScopeCandidate, ScopeDecision, ScopeIndex, ScopeFreezeGate, LateWorkRequest, EmergentWorkRequest, MaintenanceNotificationProxy, MaintenanceOrderProxy, APMRecommendationMirror, InspectionFinding.

Actions:

- import candidates;
- detect duplicates;
- include scope;
- reject scope;
- defer scope;
- split/transfer scope;
- freeze scope;
- submit late work;
- raise emergent work;
- associate to SAP notification/order;
- create corrective notification for closeout lesson.

Validations:

- reason required for reject/defer/late-add;
- technical object required for SAP notification/order;
- no freeze with unresolved critical reviews or incomplete mandatory packages;
- emergent work requires risk, owner, schedule/cost impact, and approver.

Integrations:

- SAP `API_MAINTNOTIFICATION`;
- SAP `API_MAINTENANCEORDER_0002` for order context/update where available;
- SAP APM, Meridium/RBI, operator log, inspection system, historian, DMS.

### 8.4 Work Package Studio

Route: `/work-packages`.

Purpose:

- Assemble Work Package 360 from order operations, job steps, labor, materials, services, tools, permits, risks, documents, QA requirements, and schedule.

Objects:

- WorkPackage, WorkPackageStep, WorkPackageReadiness, MaintenanceOrderProxy, MaintenanceOperationProxy, ComponentDemand, ReservationProxy, ServiceLine, PermitProxy, DocumentReference, QARequirement, RiskControl.

Actions:

- build package;
- add operation/job step;
- add component;
- add service;
- reserve material;
- request PR;
- attach evidence;
- validate completeness;
- assign owner;
- release work package;
- block/reopen package.

Validations:

- cannot release if labor, material, service, permit, schedule, tool, risk, QA, or document readiness is incomplete.

Integrations:

- SAP EAM order/operation;
- SAP reservation/PR;
- SAP DMS/OpenText;
- SAP WCM/ePTW readback;
- P6 activity link.

### 8.5 Schedule and Constraints

Route: `/schedule`.

Purpose:

- Manage schedule import, baseline compare, critical path, lookahead, constraints, impact review, and human-approved rebaseline.

Objects:

- ScheduleActivityMirror, ScheduleBaseline, ScheduleMilestone, Constraint, RecoveryScenario, NetworkActivityProxy.

Actions:

- import schedule;
- link activity to work package;
- create constraint;
- assign owner;
- submit schedule impact;
- approve/reject rebaseline;
- publish approved delta;
- escalate critical path risk.

Validations:

- no rebaseline without baseline id, affected activities, reason, production impact, cost impact, and scheduler approval;
- AI may propose recovery but cannot rebaseline.

Integrations:

- Primavera P6 EPPM REST or approved file adapter;
- Microsoft Project adapter;
- SAP PS/EPPM/network/activity context;
- Event Mesh schedule events.

### 8.6 Materials, Kits, Tools, and Logistics

Route: `/materials`.

Purpose:

- Control material demand, BOM, reservations, procurement, staging, kitting, tools, logistics, issue, return, substitution, expediting, and shortage-to-critical-path linkage.

Objects:

- MaterialDemand, MaterialMirror, BOMComponent, ReservationProxy, PurchaseRequisitionProxy, PurchaseOrderProxy, GoodsMovementProxy, Kit, ToolTransaction, ExpeditingCase, SubstituteRequest.

Actions:

- reserve material;
- request procurement;
- approve substitute;
- expedite;
- stage material;
- issue material;
- return material;
- create tool reservation;
- issue/return tool;
- close shortage.

Validations:

- material/service detail, quantity, UoM, plant, storage location, required date, purchasing group, account assignment, receiver order/WBS, budget status, and source object required as applicable.

Integrations:

- SAP `API_RESERVATION_DOCUMENT_SRV`;
- SAP `API_PURCHASEREQUISITION_2`;
- SAP `API_MATERIAL_DOCUMENT`;
- SAP PO/service procurement/SES APIs where configured;
- SAP EWM/MM;
- Ariba or supplier network;
- tool crib/PRT system.

### 8.7 WCM, Permit, Isolation, LOTO, Safety, and SIMOPS

Route: `/permits` or `/safety`.

Purpose:

- Make permit, isolation, LOTO, confined space, hot work, safety certificate, SIMOPS, muster, and environmental readiness visible and enforceable.

Objects:

- PermitControl, PermitProxy, IsolationCertificateProxy, SafetyCertificateProxy, LotoPackage, SIMOPSConflict, AreaRisk, RTLSMusterSnapshot, EnvironmentalManifest, SafetyReadinessException.

Actions:

- detect conflict;
- escalate safety blocker;
- assign mitigation;
- request correction in WCM/ePTW;
- approve readiness exception;
- reconcile muster;
- review environmental manifest.

Validations:

- WCM/permit/isolation source actions are read-only by default;
- AI cannot approve/release/restore/close permits or isolations;
- no work release/startup with stale, missing, suspended, or conflicting safety clearance.

Integrations:

- SAP WCM/ePTW APIs or approved Integration Suite wrapper;
- SAP EHS;
- RTLS/muster system;
- PI/IP21/OPC UA/historian read context;
- gas detection and environmental systems.

### 8.8 Safety and Area Risk Map

Route: `/area-risk`.

Purpose:

- Compute and explain area-level risk from SIMOPS, permit status, gas/condition signals, work density, schedule criticality, fatigue, contractor density, weather, and historical incidents.

Objects:

- AreaRisk, SIMOPSConflict, ConditionSignal, WorkDensity, WorkerPresence, RiskContributor, Mitigation.

Actions:

- assign mitigation;
- escalate risk spike;
- open contributing object;
- create HSE review package.

Controls:

- aggregate and mask worker identity unless emergency or authorized role;
- historian/OT read-only;
- no automated safety clearance.

### 8.9 Contractor and Commercial Control

Route: `/contractors`.

Purpose:

- Manage contractor roster, mobilization, access, SOW alignment, productivity, burned-vs-earned, leakage, claims, service entry readiness, and commercial closeout.

Objects:

- ContractorRoster, ContractorAccess, ContractorActual, LaborEntry, CommercialClaim, ServiceEntrySheetProxy, SOWLine, VendorMirror, CostForecast.

Actions:

- validate access;
- create contractor readiness exception;
- submit claim;
- approve/reject claim;
- prepare SES package;
- escalate commercial leakage;
- reconcile contractor actuals to time/cost.

Integrations:

- SAP Fieldglass;
- SAP MM service procurement and SES;
- contractor portal;
- access control system;
- SAP CATS/time;
- SAP FI/CO/PS cost readback.

### 8.10 Field Mobile and Execution

Route: `/field` and `/execution`.

Purpose:

- Capture daily execution, offline-safe field updates, progress, confirmations, variance reasons, emergent work, defects, deferrals, cancellation, photos, QA checks, shift handover, and supervisor approvals.

Objects:

- OperationExecution, FieldProgressEvent, WorkPackage, MaintenanceOrderConfirmation, EmergentWorkRequest, DeferralRecord, ShiftHandover, PunchItem, AttachmentEvidence.

Actions:

- submit progress;
- confirm operation;
- capture labor/time;
- raise emergent work;
- defer work;
- cancel pending work;
- create handover;
- attach evidence;
- sync offline queue.

Validations:

- valid work package and SAP order operation required;
- WCM clearance required for field start;
- final confirmation requires QA, permit, punch, material, and turnover prerequisites.

Integrations:

- SAP `API_MAINTORDERCONFIRMATION`;
- SAP `API_MAINTNOTIFICATION`;
- SAP FSM/Asset Manager or mobile platform;
- P6 progress update path;
- DMS/attachment service.

### 8.11 Time, Labor, CATS, Payroll, PowerPlan, and Finance Accrual

Route: `/labor-time`.

Purpose:

- Provide enterprise time capture, crew sheets, contractor time, cost object validation, CATS/PM confirmation, payroll wage type mapping, payroll batch export, PowerPlan capitalization, and finance accrual/reversal.

Objects:

- Worker, Crew, Supervisor, ContractorWorker, PayPeriod, FinancePeriod, CostObject, SAPMaintenanceOrder, SAPOperation, WbsElement, NetworkActivity, InternalOrder, CostCenter, PowerPlanWorkOrder, ServicePO, ActivityType, PayCode, WageType, RateCard, LaborEntry, PayrollBatch, FinanceAccrual.

Actions:

- create time entry;
- submit individual/crew/contractor time;
- approve crew time;
- correct/reverse posted time;
- release payroll;
- post accrual;
- reverse accrual;
- reconcile CATS/payroll/finance/PowerPlan.

Lookup rules:

- every dropdown must call backend lookup APIs;
- worker defaults craft, supervisor, pay group, rate class, cost center;
- cost object validation recommends posting path;
- pay code maps to wage type;
- work date validates effective-dated worker/rate/rule/pay period.

Integrations:

- SAP Workforce Timesheet/CATS `API_MANAGE_WORKFORCE_TIMESHEET`;
- SAP PM confirmation `API_MAINTORDERCONFIRMATION`;
- SAP FI/CO Journal Entry Post / asynchronous journal entry interface;
- SuccessFactors EC or SAP HCM;
- payroll gateways such as SAP ECP, ADP, UKG, WorkForce Software;
- PowerPlan;
- SAP PS/WBS/network/activity and CO cost center/internal order validation.

### 8.12 QA/QC, Inspection, Test Packs, Punch, and Turnover

Route: `/qa` or `/turnover`.

Purpose:

- Control QA plans, ITPs, inspection results, deviations, punch list, test packs, turnover systems, evidence, and verification before startup.

Objects:

- QAPlan, InspectionRecord, TestPack, PunchItem, TurnoverSystem, TurnoverPackage, Deviation, AttachmentEvidence, VerificationDecision.

Actions:

- create punch;
- assign punch owner;
- close punch;
- verify punch;
- approve/reject test pack;
- approve turnover package;
- request correction;
- block startup gate.

Validations:

- no turnover close with unresolved A punch, missing inspection, missing evidence, open permit/isolation, or unreconciled confirmation.

Integrations:

- SAP QM where applicable;
- SAP EAM order/completion context;
- SAP DMS `API_CV_ATTACHMENT_SRV`;
- OpenText/DMS/evidence systems.

### 8.13 Startup, PSSR, Return to Service, and Restart Control

Route: `/startup-readiness`.

Purpose:

- Assemble and approve restart readiness across punch, QA, turnover, permit restoration, isolation restoration, blinds, MOC, operations checklists, startup risks, and business acceptance.

Objects:

- StartupReadiness, PSSRChecklist, RTSGate, PunchSummary, IsolationRestoration, BlindList, MOCReference, StartupRisk, OperationsSignoff.

Actions:

- assemble readiness package;
- validate PSSR;
- request correction;
- approve startup readiness;
- approve return to service;
- record operations signoff.

Controls:

- AI cannot approve startup or RTS;
- human authority required;
- all evidence, punch, permit, isolation, MOC, and QA blockers must clear.

### 8.14 Cost and Controls

Route: `/cost`.

Purpose:

- Control budget, forecast, commitments, actuals, contractor claims, SES, accruals, payroll readiness, variance, SAP reconciliation, and finance exceptions.

Objects:

- BudgetEnvelope, CostForecast, CostImpact, CommitmentMirror, ActualCostMirror, ContractorClaim, ServiceEntrySheetProxy, LaborAccrual, JournalEntryProxy, VarianceNarrative.

Actions:

- submit forecast change;
- approve cost impact;
- approve/reject claim;
- post labor/contractor accrual;
- reverse accrual;
- reconcile SAP actuals;
- escalate variance.

Validations:

- company code, controlling area, posting period, cost object, amount, reason, approver, reversal plan, and idempotency required for finance write.

Integrations:

- SAP FI/CO/PS actuals/commitments;
- SAP Journal Entry Post / async journal entry;
- SAP service entry sheet API;
- SAP Fieldglass;
- BDC/Datasphere cost read models.

### 8.15 Closeout, Lessons, Norms, and Continuous Improvement

Route: `/lessons`.

Purpose:

- Convert actuals, delays, variances, safety events, quality findings, and integration issues into lessons, root causes, corrective actions, updated norms, templates, master-data change requests, and future-event benchmarks.

Objects:

- LessonLearned, RootCause, CorrectiveAction, NormUpdate, BenchmarkRecord, MasterDataChangeRequest, MaintenanceNotificationProxy.

Actions:

- capture lesson;
- approve corrective action;
- create SAP notification;
- submit norm update;
- submit master data change;
- approve closeout package.

Integrations:

- SAP `API_MAINTNOTIFICATION`;
- SAP MDG or released master data APIs;
- SAP BDC/Datasphere benchmark read models.

### 8.16 Data Foundation and SAP BDC Readiness

Route: `/data-foundation`.

Purpose:

- Manage source-of-record certification, data products, semantic models, lineage, source freshness, data quality issues, BDC/Datasphere/CDS/SLT/HANA read context, and governed master-data change.

Objects:

- DataProduct, SemanticModel, SourceFreshness, DataQualityIssue, LineageRecord, EquipmentMirror, FunctionalLocationMirror, MaterialMirror, BOMMirror, TaskListMirror, BusinessPartnerMirror, MDGChangeRequest.

Actions:

- certify data product;
- assign steward;
- block stale source;
- create data quality case;
- submit MDG/master-data change;
- approve certification evidence.

Rules:

- BDC/Datasphere/CDS/SLT/HANA are read-side context only;
- all master-data updates go through MDG or released SAP APIs;
- every data product needs owner, refresh pattern, lineage, quality checks, and consumers.

### 8.17 Connectors and Integration Hub

Routes: `/connectors`, `/integration-hub`.

Purpose:

- Configure, test, dry-run, certify, and operate SAP and non-SAP connectors.

Objects:

- ConnectorRuntime, ConnectorProfile, Destination, AuthMode, MappingProfile, CapabilityFlag, NativeObjectContract, PayloadPreview, DryRunResult, HealthCheck, MetadataRefresh.

Actions:

- provision connector;
- save destination logical name;
- test connection;
- refresh metadata;
- enable/disable connector;
- switch simulator/sandbox/live;
- dry-run payload;
- test lookup;
- test posting;
- certify connector contract.

Rules:

- credentials stay in BTP/vault/secret store, never in UI state;
- disabled connector blocks write server-side;
- missing connector capability must fall back to internal ledger or staged transaction with visible "not posted to SAP" state;
- dry-run creates no transaction.

### 8.18 Resilience Ops and Writeback Console

Routes: `/resilience`, `/writeback`, `/integrations`.

Purpose:

- Provide the enterprise control plane for outbox, retries, DLQ, replay, cancellation, read-back, reconciliation, payload snapshots, connector health, latency, source lineage, incidents, and manual override.

Objects:

- CanonicalTransaction, WritebackRequest, OutboxMessage, ConnectorResponse, IntegrationRetry, DeadLetterMessage, ReconciliationRecord, PayloadSnapshot, SourceFreshness, IntegrationIncident.

Actions:

- approve writeback;
- reject writeback;
- cancel pending transaction;
- retry failed item;
- replay DLQ;
- manual reconcile;
- create incident;
- assign owner;
- open source lineage;
- certify mapping version.

Controls:

- four-eyes approval;
- idempotency required;
- replay reason required;
- production replay requires stronger approval;
- all payloads hashed and preserved.

### 8.19 AI Agents and AI Workbench

Route: `/ai` or `/agents`.

Purpose:

- Orchestrate AI agents for triage, summarization, dedupe, evidence packaging, schedule recovery suggestions, scope challenge, readiness review, integration error triage, and lesson drafting.

Agents:

- Master STO Orchestrator;
- Scope Intelligence Agent;
- Work Package Readiness Agent;
- Materials and Procurement Agent;
- Schedule Recovery Agent;
- WCM/Safety Review Agent;
- Area Risk Agent;
- Field Execution Agent;
- Labor/Cost Agent;
- QA/Turnover Agent;
- Startup/PSSR Agent;
- Integration Triage Agent;
- Data Foundation Agent;
- Lessons/Norms Agent;
- Tenant Admin and Policy Agent.

AI rules:

- AI can read, summarize, classify, draft, recommend, compare, and create review packages.
- AI cannot autonomously approve, post, release, restore, close, rebaseline, replay production DLQ, create finance postings, approve permits, change isolations, or start up equipment.
- AI output must include citations/source references, confidence, action class, target object, policy decision, and human authority.
- Prompt injection defense, source trust tiering, tool allow-lists, model routing logs, evals, and audit are mandatory.

### 8.20 Admin, Tenant, Security, and Certification

Route: `/admin`.

Purpose:

- Configure tenants, roles, plant/unit/company/project scopes, feature flags, source modes, connector profiles, model routing, API contract certification, data residency, retention, audit, and release readiness evidence.

Objects:

- Tenant, TenantUser, Role, Permission, FeatureFlag, TenantEnvironment, ConnectorCertification, ApiContractCertification, ModelRoute, EvalResult, ReleaseEvidence.

Actions:

- configure tenant;
- assign role;
- set feature flag;
- set source mode;
- validate RBAC policy;
- certify API contract;
- publish readiness packet;
- run eval gate.

## 9. Canonical Data Object Catalog

Implement at minimum these object families.

Core event and strategy:

- TurnaroundEvent;
- EventStrategy;
- PremiseDocument;
- ProductionEconomicsScenario;
- ReadinessGate;
- GateCalendar;
- BudgetEnvelope.

Scope and work planning:

- ScopeCandidate;
- ScopeDecision;
- ScopeIndex;
- ScopeFreezeGate;
- LateWorkRequest;
- EmergentWorkRequest;
- WorkPackage;
- WorkPackageStep;
- WorkPackageReadiness;
- JobPlan;
- OperationPlan;
- Constraint.

SAP and external proxies:

- MaintenanceNotificationProxy;
- MaintenanceOrderProxy;
- MaintenanceOperationProxy;
- MaintenanceOrderConfirmationProxy;
- EquipmentMirror;
- FunctionalLocationMirror;
- WorkCenterMirror;
- PlannerGroupMirror;
- MaterialMirror;
- BOMMirror;
- TaskListMirror;
- ReservationProxy;
- PurchaseRequisitionProxy;
- PurchaseOrderProxy;
- GoodsMovementProxy;
- ServiceEntrySheetProxy;
- ProjectProxy;
- WbsProxy;
- NetworkActivityProxy;
- CostCenterProxy;
- InternalOrderProxy;
- BusinessPartnerMirror;
- AttachmentProxy.

Execution:

- OperationExecution;
- FieldProgressEvent;
- ShiftHandover;
- DeferralRecord;
- CancellationRecord;
- PunchItem;
- InspectionRecord;
- QAPlan;
- TestPack;
- TurnoverSystem;
- TurnoverPackage;
- StartupReadiness;
- PSSRChecklist;
- ReturnToServiceGate.

Safety:

- PermitControl;
- PermitProxy;
- IsolationCertificateProxy;
- SafetyCertificateProxy;
- LotoPackage;
- SIMOPSConflict;
- AreaRisk;
- ConditionSignal;
- RTLSMusterSnapshot;
- EnvironmentalManifest;
- SafetyReadinessException.

Materials, labor, contractor, cost:

- MaterialDemand;
- Kit;
- ToolTransaction;
- SubstituteRequest;
- ExpeditingCase;
- Worker;
- Crew;
- LaborEntry;
- PayrollBatch;
- FinanceAccrual;
- ContractorRoster;
- ContractorActual;
- ContractorAccess;
- CommercialClaim;
- CostForecast;
- CostImpact;
- CommitmentMirror;
- ActualCostMirror;
- JournalEntryProxy.

Data, AI, workflow, and integration:

- DataProduct;
- SemanticModel;
- SourceFreshness;
- DataQualityIssue;
- LineageRecord;
- AIRecommendation;
- AgentRun;
- HumanReviewPackage;
- EvalResult;
- ApprovalWorkflowItem;
- AuditLog;
- AttachmentEvidence;
- Comment;
- ESignature;
- CanonicalTransaction;
- WritebackRequest;
- OutboxMessage;
- ConnectorResponse;
- IntegrationRetry;
- DeadLetterMessage;
- ReconciliationRecord;
- PayloadSnapshot.

Every business object must include:

- tenantId;
- sourceSystem;
- sourceMode;
- sourceObject;
- sourceReference;
- lifecycleState;
- approvalState;
- riskClass;
- owner;
- sourceFreshness;
- createdBy/createdAt;
- updatedBy/updatedAt;
- audit trail reference;
- correlation id for controlled actions.

## 10. Native SAP and Non-SAP Integration Mapping

Prefer released APIs and approved clean-core patterns. Verify API availability and version in SAP Business Accelerator Hub or SAP Help before implementing a live adapter.

SAP mappings:

| Object family | Native interface or pattern | Read/write stance |
| --- | --- | --- |
| Maintenance notification | `API_MAINTNOTIFICATION` | read/create/update after approval |
| Maintenance order and operation | `API_MAINTENANCEORDER_0002` or tenant-approved released wrapper | read/update supported status only |
| Order confirmation | `API_MAINTORDERCONFIRMATION` | create/cancel/correct after approval |
| Workforce timesheet/CATS | `API_MANAGE_WORKFORCE_TIMESHEET`, SAP_COM_0027 | create/reverse after approval |
| Reservation | `API_RESERVATION_DOCUMENT_SRV` | read/create/cancel with approval |
| Purchase requisition | `API_PURCHASEREQUISITION_2` | read/create/withdraw with approval |
| Material document | `API_MATERIAL_DOCUMENT` | create/reverse goods issue/return |
| Attachment/DMS | `API_CV_ATTACHMENT_SRV`, CMIS/OpenText | read/write evidence |
| Business partner/vendor | SAP Business Partner API | read; governed master data change |
| Material/product/BOM/task list | released product/BOM/task list APIs or read views | read; master changes through MDG |
| Project/WBS/network/activity | SAP PS/EPPM APIs, CDS/BDC/Datasphere read models | read, receiver validation |
| Cost center/internal order | SAP CO master-data reads/CDS; MDG for changes | read/validate |
| FI/CO journal/accrual | Journal Entry Post or asynchronous journal entry interface | post/reverse after finance approval |
| Service entry sheet | SAP service procurement/SES API | read/create/update where configured |
| WCM/ePTW permit/isolation | SAP WCM APIs/views or Integration Suite wrapper | read-only by default; fail closed |
| SAP APM | released APM reads | read recommendations/health/criticality |
| SAP BDC/Datasphere/CDS/SLT/HANA | catalog, semantic/read data products, SQL/read APIs | read-only context and AI grounding |
| SAP MDG | change request workflow | governed master-data change |

Transport/security:

- SAP BTP Destination;
- Cloud Connector for private/on-premise systems;
- Integration Suite iFlows for mapping/orchestration;
- Event Mesh for event decoupling;
- XSUAA/IAS/Entra ID federation;
- OAuth2 client credentials, authorization code, SAML bearer, or principal propagation as appropriate;
- CSRF token and ETag handling for state-changing OData calls;
- secrets in BTP Credential Store or Azure Key Vault.

Non-SAP mappings:

| System | Purpose | Direction |
| --- | --- | --- |
| Primavera P6 EPPM | schedule, baseline, critical path, approved deltas | read plus approved delta |
| Microsoft Project | schedule import/export where used | read plus approved delta |
| ePTW/WCM vendor | permits, isolations, certificates | read-only unless source authority approves |
| AVEVA PI/Aspen IP21/OPC UA | historian/condition signals | read/subscribe only |
| RTLS/mustering | worker location and emergency muster | event/read |
| SAP Fieldglass/contractor portal | roster, SOW, SES, timesheets, claims | read; approved packages outbound |
| Payroll systems | payroll mapping and batch export | outbound approved batch/readback |
| PowerPlan | capitalization/work order accounting | read/write approved lines |
| DMS/OpenText/engineering docs | evidence, drawings, job packs, turnover docs | read/write evidence |
| ServiceNow/Jira | incident/escalation/work item | outbound incident, status readback |
| Data lake/lakehouse | analytics and AI context | read-only governed data product |

## 11. Connector-Backed Lookup Requirement

Every dropdown, lookup, selector, and reference list must be backend sourced.

Required lookup categories:

- tenants, plants, units, areas, systems, work centers, planner groups;
- events, phases, gates, readiness criteria;
- equipment, functional locations, measuring points;
- notifications, orders, operations, sub-operations;
- WBS, network, network activity, cost center, internal order;
- materials, BOM components, storage locations, batches, serials, stock, substitutes;
- reservations, PRs, POs, SES, goods movement references;
- permits, isolations, safety certificates, LOTO packages;
- P6 activities, baselines, milestones, critical path objects;
- workers, crews, supervisors, contractors, vendors;
- pay codes, wage types, activity types, rate classes, pay periods, finance periods;
- service POs, contractor SOW lines, Fieldglass records;
- QA plans, inspection points, test packs, punch severities;
- documents, drawing revisions, evidence templates;
- connectors, mapping profiles, API contracts, source modes.

Lookup API response must include:

- id;
- code;
- label;
- description;
- status;
- sourceSystem;
- sourceMode;
- sourceObject;
- sourceReference;
- validFrom;
- validTo;
- metadata;
- postingAllowed;
- lastSyncAt;
- provider;
- isLive;
- confidence/freshness where relevant.

Dependent filtering:

- site -> plants;
- plant -> units, areas, work centers, orders, materials;
- order -> operations;
- WBS -> network activities;
- worker -> craft, supervisor, pay group, default rate class, home cost center;
- cost object -> allowed posting paths;
- pay code -> wage type;
- work date -> effective rates/rules;
- work package -> materials, permits, QA, schedule activities.

## 12. Governed Transaction Model

Every controlled action must use a canonical transaction envelope:

- transactionId;
- tenantId;
- businessCapability;
- transactionType;
- sourceScreen;
- sourceObject;
- targetObject;
- sourceSystem;
- targetSystem;
- sourceReferences[];
- targetReferences[];
- lifecycleState;
- approvalState;
- riskClass;
- connectorId;
- connectorMode;
- mappingVersion;
- idempotencyKey;
- correlationId;
- currentOwner;
- currentApprover;
- businessFields;
- lineItems[];
- attachments[];
- validationResults[];
- payloadPreview;
- outboxId;
- targetDocumentNumber;
- responseSnapshot;
- reconciliationStatus;
- auditTrail[];
- aiEvidence[];
- error/retry/DLQ metadata.

Universal lifecycle:

`draft -> validated -> pending_approval -> approved -> queued -> sent_to_connector -> posted_pending_readback -> posted -> reconciled`

Exception lifecycle:

`validation_failed -> rejected -> returned_for_rework -> cancelled -> failed_integration -> pending_retry -> dead_letter -> replay_requested -> replayed -> reconciliation_failed -> manually_reconciled`

Correction/reversal lifecycle:

`posted -> correction_requested -> reversing_transaction_created -> reversed -> reconciled`

## 13. Posting-Path Decision Rules

Implement a single pure decision engine:

- source-owned read-only object -> read/impact only;
- WCM/OT/safety source object -> fail closed for writes;
- SAP-owned object with released write API -> governed writeback;
- SAP-owned object without released write API -> staged package plus ADR/middleware wrapper requirement;
- SOT-owned object -> local controlled write with workflow/audit;
- finance/payroll/startup/WCM controlled action -> approval and SoD required;
- AI actor with controlled/blocked action -> review package only.

No other write path may exist.

## 14. Workflow, Approval, and SoD

Every controlled action requires:

- role authorization;
- tenant/plant/unit/company/project scope check;
- validation;
- reason/comment where required;
- four-eyes SoD where submitter cannot final approve;
- approval state machine;
- audit event;
- payload preview before outbound dispatch;
- immutable outbox entry for external write;
- read-back and reconciliation.

Controlled actions include:

- approve premise;
- approve event strategy;
- decide scope;
- freeze scope;
- approve late/emergent work;
- release work package;
- approve schedule rebaseline;
- reserve material;
- request procurement;
- issue/return material;
- approve readiness gate;
- confirm operation/final confirmation;
- approve crew time;
- release payroll;
- post accrual;
- approve claim;
- approve turnover;
- approve startup/PSSR/RTS;
- replay DLQ;
- certify data product;
- certify connector/API contract.

## 15. Architecture Requirements

Target production architecture:

- Next.js App Router + TypeScript web app.
- NestJS API/BFF and domain services.
- Worker service for outbox, retries, read-back, reconciliation, scheduled refresh.
- PostgreSQL with tenant row-level security for orchestration data.
- Optional SAP HANA Cloud/Datasphere read models where appropriate.
- Object storage for attachments/evidence.
- Search index for cross-object search.
- Queue/event layer using Azure Service Bus/Event Grid or SAP Event Mesh abstraction.
- Feature flag and module entitlement service.
- Tenant-aware RBAC/ABAC.
- Audit, evidence, and payload snapshot store.
- Connector registry and adapter runtime.
- Model router and AI policy gateway.
- OpenTelemetry/Application Insights/Log Analytics.
- CI/CD with test, lint, typecheck, build, e2e, security scan, and release evidence.

Layering:

1. UI screen layer.
2. BFF/API layer.
3. Domain action layer.
4. Validation/rules engine.
5. Workflow/approval engine.
6. Canonical transaction/writeback layer.
7. Outbox/retry/reconciliation layer.
8. SAP connector adapter layer.
9. Non-SAP connector adapter layer.
10. Mock/simulator adapter layer using same contracts.
11. Data foundation/read model layer.
12. AI agent/model router layer.
13. Security/tenant/audit layer.
14. Analytics/KPI layer.
15. Operations/observability layer.

## 16. UI/UX Requirements

Design language:

- modern dark operations console;
- dense but legible;
- no marketing hero;
- no decorative card bloat;
- first screen is the working command center;
- source badges, mode badges, owner badges, status ribbons;
- split panes: object list, active transaction, evidence/context;
- action drawers with validation, payload preview, approval, audit;
- "Why is this blocked?" explanations;
- drilldown from every KPI/exception to transactional records;
- loading, empty, error, permission, stale source, and connector-disabled states;
- keyboard-friendly enterprise workflows;
- accessible contrast and stable responsive layout.

Required UI controls:

- icon buttons with tooltips for tools/actions;
- tabs for workbench sections;
- segmented controls for modes;
- toggles for enable/disable;
- async searchable dropdowns;
- status chips;
- validation panels;
- audit timeline;
- payload preview drawer;
- source lineage viewer;
- evidence attachment panel;
- reconciliation status panel;
- retry/DLQ action drawer.

## 17. AI Backbone and Agent Governance

AI must be useful but constrained.

AI may:

- summarize evidence;
- cluster duplicate scope;
- draft rationale;
- create readiness narratives;
- generate missing-evidence checklists;
- propose recovery scenarios;
- prioritize shortages;
- explain risk spikes;
- classify delays;
- triage integration errors;
- draft lessons and corrective actions;
- build review packages.

AI must not:

- approve permits/isolation/startup;
- release work;
- post to SAP;
- rebaseline schedule;
- approve finance;
- approve payroll;
- replay production DLQ;
- change OT controls;
- update master data;
- suppress audit;
- bypass human workflow.

Every AI output must include:

- action class;
- target object;
- source evidence/citations;
- model route;
- confidence;
- policy decision;
- human reviewer role;
- tool calls used;
- blocked-action explanation if applicable.

Model routing:

- informational -> fast model;
- advisory analysis -> balanced/high reasoning;
- long work package review -> long-context model;
- integration triage -> structured reasoning model;
- safety/finance/startup -> high-reasoning review package only;
- restricted data -> approved private/Azure/OpenAI deployment per tenant policy.

## 18. End-to-End Demonstration Workflow

The application must demonstrate this full sample workflow in simulator mode:

1. Select tenant and event.
2. Review command center KPIs and blocked actions.
3. Create or update event premise.
4. Import scope candidates from SAP notification, APM/RBI recommendation, inspection finding, and manual entry.
5. Dedupe and challenge scope.
6. Include, reject, defer, or split scope with reason.
7. Associate approved scope to SAP notification/order/order operation.
8. Build work package with steps, labor, materials, permits, QA, documents, risks, and schedule activity.
9. Validate work package readiness and show blockers.
10. Reserve material through connector-backed lookup and payload preview.
11. Approve material reservation with four-eyes.
12. Dispatch through outbox to simulator SAP connector.
13. Receive simulated reservation number.
14. Run read-back and reconciliation.
15. See audit trail and payload snapshot.
16. Review permit/isolation readiness and see read-only WCM control.
17. Submit field progress and raise emergent work.
18. Capture labor time with worker/cost object/pay code lookup.
19. Approve crew time and release payroll/accrual package.
20. Review cost variance and claim/accrual controls.
21. Complete QA/punch/turnover package.
22. Validate PSSR/startup gate and block if evidence missing.
23. Approve return-to-service by human authority only.
24. Close event, capture lessons, approve corrective action, and propose norm update.
25. Use Integration Ops to view outbox, DLQ, replay, reconciliation, and source freshness.
26. Use AI Workbench to produce a cited review package and prove blocked autonomous action does not execute.

## 19. Required Test and Validation Coverage

Create and run tests for:

- connector-backed lookup APIs return source metadata;
- frontend dropdowns call backend lookup APIs;
- dependent dropdown filtering works;
- worker selection hydrates defaults;
- order selection filters operations;
- WBS selection filters network activities;
- cost object validation works;
- posting path decision routes correctly;
- validation blocks missing required SAP fields;
- scope freeze blocks unresolved critical items;
- work package release blocks missing readiness dimensions;
- WCM/permit write attempts are blocked;
- AI blocked action never executes;
- same user cannot submit and approve controlled transaction;
- idempotent resubmit returns same result;
- outbox retry and DLQ work;
- replay requires authorized role and reason;
- read-back creates reconciliation record;
- reversal creates reversing transaction, not in-place edit;
- connector disabled blocks writes;
- simulator/sandbox/live mode switch does not require UI rewrite;
- tenant isolation and RBAC/ABAC work;
- audit captures each workflow step;
- e2e demo workflow runs from event selection to closeout.

Validation commands must include, as applicable:

- lint;
- typecheck;
- build;
- unit tests;
- integration tests;
- workflow regression tests;
- e2e browser tests;
- accessibility checks;
- AI policy/eval tests;
- pack lint and gate validation;
- smoke checks for web/API.

If a command is missing, create it.

## 20. Required Documentation Deliverables

Generate or update:

- `docs/domain/FUNCTIONAL_CAPABILITY_MATRIX.md`;
- `docs/domain/PROCESS_DECOMPOSITION.md`;
- `docs/domain/TRANSACTIONAL_DATA_OBJECT_MODEL.md`;
- `docs/domain/POSTING_PATH_DECISION_ENGINE.md`;
- `docs/data/SOURCE_OF_RECORD_REGISTER.md`;
- `docs/data/FIELD_OWNERSHIP_AND_WRITE_POLICY.md`;
- `docs/integration/SAP_OBJECT_TO_API_MAPPING.md`;
- `docs/integration/NATIVE_INTEGRATION_OBJECT_MATRIX.md`;
- `docs/connectors/CONNECTOR_CAPABILITY_CATALOG.md`;
- `docs/screens/SCREEN_CONTRACT_CATALOG.md`;
- `docs/workflows/APPROVAL_AND_SOD_POLICY.md`;
- `docs/workflows/WORKFLOW_STATE_MODEL.md`;
- `docs/ai/AI_BACKBONE_AGENT_ORCHESTRATION.md`;
- `docs/security/PRODUCTION_READINESS_CHECKLIST.md`;
- `docs/operations/OPERATING_MODEL_AND_RUNBOOKS.md`;
- `docs/testing/TESTING_AND_EVAL_STRATEGY.md`;
- `docs/release/RELEASE_EVIDENCE_PACK.md`;
- `docs/release/RELEASE_DECISION.md`;
- `docs/release/LOCAL_VALIDATION_AND_REMEDIATION_REPORT.md`.

Each screen must also have a screen contract that maps:

- fields to backend lookup/source;
- actions to domain services;
- action to source/target object;
- integration payload;
- validation;
- approval;
- audit event;
- test case.

## 21. Stage Execution Plan

Run the build through these stages. In continuous mode, do not merely skip failed gates; remediate the failure and then continue.

00. Permanent build rules and stop conditions.
01. Use-case intake and problem framing.
02. Industry/market/fit-to-standard research.
03. Current application gap audit.
04. Business capability model.
05. Process decomposition.
06. Master, transactional, reference, audit and AI evidence object model.
07. Source-of-record and data ownership.
08. Native integration matrix.
09. Connector capability catalog.
10. Canonical transaction model and posting-path decision engine.
11. Workflow, approval, SoD, audit and exception model.
12. Screen contracts and UI/UX blueprint.
13. Enterprise repo skeleton and architecture.
14. Backend foundation: tenant, auth, RLS, audit, outbox, rules, workflow, reconciliation.
15. Connector-backed lookup and sample data providers.
16. Transaction service implementation.
17. UI implementation and verification.
18. AI backbone, agent governance, model router and evals.
19. Production readiness, observability, DR, FinOps and operating model.
20. Acceptance, release evidence and validation report.

Stop conditions:

- unknown source of record;
- undefined write policy;
- write without proof/read-back;
- generic connector write path;
- missing approval/SoD for controlled write;
- screen without backend action;
- screen without test mapping;
- autonomous AI controlled write;
- manual undocumented step required to complete demo.

## 22. Definition of Done

The work is complete only when:

- `KICKOFF_PROMPT.md` is STO/SOT-specific and no longer contains unrelated MRO scope.
- Every workbench has a transactional purpose, not just a dashboard purpose.
- Every displayed object has source-of-record mapping.
- Every editable field has backend source/update path.
- Every dropdown is connector-backed or config-backed.
- Every action maps to a domain service, workflow event, approval, integration payload, or audit event.
- Every SAP write uses a published/released SAP interface or documented approved wrapper pattern.
- Every non-SAP integration has ownership, direction, frequency, conflict handling, error handling, and reconciliation.
- Simulator adapters follow the same contracts as sandbox/live adapters.
- The UI distinguishes draft, locally staged, submitted, approved, queued, sent, posted, failed, dead-lettered, reconciled, cancelled, reversed, and superseded.
- Dashboards drill to transactional records.
- Approval workflows are role-based and auditable.
- Integration errors are traceable and recoverable.
- AI cannot execute controlled actions autonomously.
- Local validation and release evidence are generated.
- The demo workflow works end to end.

## 23. Immediate Build Instruction

Start by auditing the current project and previous STO/SOT artifacts. Then build or update the application and documentation using this prompt as the controlling specification.

Do the following in order:

1. Confirm the project path and current git state.
2. Scan the existing docs, config, schemas, API specs, app source, and prior STO/SOT repo artifacts.
3. Produce a gap matrix against this prompt.
4. Update the data object catalog, source-of-record register, integration matrix, connector catalog, workflow/action catalog, screen contracts, and AI governance docs.
5. Implement missing backend services, lookup APIs, transaction services, connectors, workflow rules, outbox/reconciliation, and UI workbenches.
6. Use simulator adapters and realistic seed data now, but keep sandbox/live contracts identical.
7. Run all validation commands.
8. Fix every failing test, lint, build, YAML/JSON parse, runtime, and smoke issue.
9. Generate a validation and remediation report.
10. Commit only after validation passes.

## 24. Native SAP and Enterprise Connector Deep-Dive Addendum

This addendum is mandatory. It strengthens Sections 10, 11, 12, 13, 15, 19 and 20 and supersedes any weaker generic connector language. The product must be designed as a clean-core SAP and non-SAP orchestration SaaS, not as a reporting layer and not as a generic payload sender.

### 24.1 Native-first integration doctrine

Use this hierarchy for every read, write, update, cancellation, reversal, confirmation, approval and reconciliation:

1. Published SAP Business Accelerator Hub API, released SAP OData/SOAP service, or SAP-documented product API.
2. SAP Integration Suite iFlow wrapping a released API, BAPI/RFC, IDoc, event, or SOAP interface where the tenant/release does not expose the required business action as a public API.
3. SAP Build Process Automation / workflow task for human-controlled business decisions and My Inbox-compatible approval.
4. SAP Event Mesh / Advanced Event Mesh for business events, asynchronous state changes, schedule/material exception notifications, and outbox fan-out.
5. SAP Datasphere, SAP Business Data Cloud, released CDS extraction, SLT or replication flows for read/analytics/data-product scenarios only.
6. Tenant-approved wrapper pattern for legacy on-premise SAP only when no released API exists; the wrapper must preserve SAP authorization checks, business validations, audit, error messages and read-back.

Do not:

- write directly to SAP tables;
- treat CDS, SLT, Datasphere, Business Data Cloud, BW or HANA views as write paths;
- post labor cost by changing a maintenance order header;
- use FI journal entry as the default labor-time path when CATS/workforce timesheet or PM confirmation is the correct business object;
- use one generic SAP adapter for all write-backs;
- treat simulator success as SAP-posted success;
- bypass SAP WCM, EHS, permit, mobile, payroll, procurement, finance or project controls with local-only state changes.

Batch Input/BDC is not a normal integration strategy. If a client uses legacy SAP Batch Data Communication for a temporary migration, conversion, or break-glass backfill, the system must mark it as `LEGACY_EXCEPTION`, require explicit approval, write a stronger audit record, and still perform read-back reconciliation through a supported read interface. For modern transactional STO/SOT execution, prefer native APIs, BAPIs/RFCs through Integration Suite, IDocs, SOAP, Event Mesh, and SAP-managed extension patterns.

### 24.2 Connector source-mode contract

Every connector must implement the same contract in `SIMULATOR`, `SEED_DATA`, `SANDBOX`, `LIVE`, `CACHE` and `DISABLED` modes. Switching mode must not require a UI rewrite.

Each connector record must include:

- `connectorId`, `tenantId`, `sourceSystem`, `sourceModule`, `sourceMode`, `logicalDestination`, `authMode`, `communicationScenario`, `apiServiceName`, `apiVersion`, `apiPath`, `sourceObject`, `sourceObjectKeys`;
- `capabilities.read`, `capabilities.create`, `capabilities.update`, `capabilities.delete`, `capabilities.cancel`, `capabilities.reverse`, `capabilities.confirm`, `capabilities.approve`, `capabilities.attach`;
- `writePolicy`: `READ_ONLY`, `STAGE_ONLY`, `APPROVAL_REQUIRED`, `DIRECT_POST_ALLOWED`, `FAIL_CLOSED`;
- `mappingProfile`, `mappingVersion`, `payloadSchemaVersion`, `idempotencyKeyPattern`, `correlationIdPattern`, `csrfPolicy`, `etagPolicy`, `batchPolicy`;
- `readbackMethod`, `reconciliationKey`, `retryPolicy`, `dlqPolicy`, `replayPolicy`, `ownerRole`, `dataSteward`, `lastMetadataRefresh`, `lastSyncAt`, `lastError`, `certificationStatus`.

All transactional screens must call domain services. Domain services call action services. Action services call connector adapters. UI components must never construct final SAP payloads directly.

### 24.3 Required SAP native connector families

Build a connector catalog and implementation-ready adapter skeletons for each family below. Use released SAP APIs when available in the tenant and release; when an object lacks a published API, record the approved wrapper/interface pattern and the tenant validation still required.

#### SAP S/4HANA EAM / Plant Maintenance / Asset Management

Purpose: outage scope intake, maintenance notification review, work order association, work package build, operation readiness, progress confirmation, technical completion and closeout.

Objects:

- Equipment, functional location, measuring point, measurement document, class/characteristic, work center, planner group, task list, maintenance BOM, material BOM, maintenance plan/item.
- Maintenance notification, maintenance request, maintenance order, order operation, sub-operation, component, operation long text, settlement rule, user status, system status, phase control code where used.
- Confirmation, final confirmation, cancellation/reversal, TECO, business completion, failure/damage/cause/activity code, attachments and inspection findings.

Native connector candidates:

- Maintenance Notification API: `API_MAINTNOTIFICATION`.
- Maintenance Order API: `API_MAINTENANCEORDER` / tenant-specific released maintenance order API such as `OP_API_MAINTENANCEORDER_0002` where available.
- Maintenance Order Confirmation API: `API_MAINTORDERCONFIRMATION`.
- Equipment and functional-location APIs or released CDS/value-help APIs for master/reference reads.
- Measurement document and measuring-point APIs where activated; otherwise approved S/4 wrapper through Integration Suite with read-back.
- Responsibility Management / Teams APIs for planner, owner and approval routing where available.

Required behavior:

- Scope item cannot be approved without a valid SAP notification/work request/manual source record and source-of-record decision.
- Work package cannot be released without valid SAP order/operation reference or a governed pending-create transaction.
- Progress cannot be confirmed without released order operation, valid work center, actual dates, remaining work logic and role authorization.
- Final confirmation/TECO cannot proceed while permits, isolations, open confirmations, material returns, punch items, quality holds or turnover packages are unresolved.
- All order/operation updates require status/read-back reconciliation and must store SAP object number, operation number, confirmation number and correlation ID.

#### SAP Supply Chain, MM, Procurement, Inventory and External Services

Purpose: material readiness, reservation, staging, procurement, expediting, shortage control, goods movement, service execution and contractor/service-cost flow.

Objects:

- Material master/product, plant, storage location, MRP controller, stock, batch/serial, BOM, reservation, purchase requisition, purchase order, schedule line, supplier confirmation, inbound delivery, goods issue, goods receipt, goods return, transfer posting, service master, service entry sheet, vendor/business partner, source list, info record, outline agreement.

Native connector candidates:

- Reservation Document API: `API_RESERVATION_DOCUMENT_SRV`.
- Purchase Requisition API: `API_PURCHASEREQUISITION_2`; where older tenants expose `API_PURCHASEREQ_PROCESS_SRV`, mark as deprecated/successor-required and document migration.
- Purchase Order API: `API_PURCHASEORDER_PROCESS_SRV` or current OData V4 successor in the tenant.
- Material Document API: `API_MATERIAL_DOCUMENT_SRV` for goods issue, goods receipt, return and transfer postings where applicable.
- Service Entry Sheet API: `API_SERVICE_ENTRY_SHEET_SRV`.
- Business Partner API: `API_BUSINESS_PARTNER`.
- Product/material APIs such as `API_PRODUCT_SRV` and stock/availability APIs released for the tenant.

Required behavior:

- Reservation create/update/delete must validate material, plant, storage location, requirement date, movement type, account assignment and source object.
- Procurement requests must validate material/service, purchasing group, account assignment, required date, plant, supplier/source strategy and budget/approval policy.
- Goods issue and return must validate reservation/order/component, batch/serial requirements, stock status, hazardous material controls and reversal policy.
- Service entry must validate PO/service line, service performer, acceptance owner, timesheet/contractor evidence and approval status.
- Materials readiness KPIs must drill to reservation, PO, shortage, expediting, GI/GR or DLQ records.

#### SAP Project System, ePPM, Commercial Project and Capital Governance

Purpose: turnaround capital scope, WBS/network/activity planning, budget, commitment, schedule milestones, ePPM portfolio approval and project-cost integration.

Objects:

- Project definition, WBS element, WBS milestone, network, network activity, activity element, budget, commitment, actual cost, settlement rule, project status, ePPM portfolio item, bucket, initiative, decision point, issue/change record.

Native connector candidates:

- SAP Project service for create/read/update/delete of projects, WBS elements, WBS milestones and assigned network objects where enabled in the tenant.
- Customer/Internal Project Management APIs documented for S/4HANA Cloud.
- Project System workflow/event content for WBS, project definition and network activity triggers.
- Commercial project read APIs for planned/actual project information where relevant.
- SAP PPM/ePPM integration content and Integration Suite iFlows for P6/Jira/portfolio integration where the standard public API surface is release-dependent.

Required behavior:

- Scope cannot be capitalized without valid WBS/cost object, budget availability, capitalization class and approval policy.
- Schedule deltas impacting WBS/network milestones must create a pending project update, event, approval task or Integration Suite message, not a local-only date change.
- ePPM portfolio and stage-gate decisions must remain the source of truth where the client uses ePPM; the STO/SOT app can orchestrate intake, evidence and exceptions but must reconcile back to ePPM/PS.

#### SAP WCM, Permitting, EHS and Safety

Purpose: fail-closed work clearance, permit-to-work, isolation, LOTO, confined space, hot work, SIMOPS, gas test, safety certificate, operations release and restoration.

Objects:

- WCM permit, safety certificate, isolation certificate, LOTO package, switching/isolation points, lock/tag records, permit category, permit condition, gas test, confined-space entry, hot-work controls, SIMOPS conflict, operational release, restoration checklist.

Native connector candidates:

- SAP WCM and EHS integration through released APIs where the tenant exposes them; otherwise Integration Suite wrapper around approved WCM/EHS business interfaces with strict SAP authorization and audit.
- Third-party ePTW/PTW systems through certified REST/SOAP/event adapters; WCM/ePTW remains the approval and permit source of record.
- SAP Build Process Automation / workflow for permit review packages only where it does not bypass WCM/ePTW authority.

Required behavior:

- No AI agent, planner, scheduler, field user, FSM/SSAM dispatch or local workflow may approve, issue, suspend, close or restore a controlled permit unless the owning safety system explicitly supports that action and the tenant has certified the adapter.
- When a write path is not certified, the UI must show `READ_ONLY` or `STAGED_FOR_SAFETY_REVIEW`, not `POSTED`.
- Work package release and field start must fail closed when required permits, isolations, gas tests or operations release are missing, expired, conflicting or not read back.

#### SAP Field Service Management and SAP Service and Asset Manager

Purpose: dispatch, mobile execution, offline work, technician feedback, photos, checklists, measurements, confirmations, material usage and failure learning.

Objects:

- FSM service call/activity, technician assignment, route, checklist, smart form, time/expense/material line, attachment, status, mobile notification/order, SSAM work order, operation, task list, meter reading, measurement, failure/cause/activity code and offline sync package.

Native connector candidates:

- SAP Field Service and Asset Management Data API v4 and public REST APIs.
- SAP FSM User/Reporting/Appointment Booking APIs where needed.
- SAP Service and Asset Manager OData/mobile services and Mobile Application Integration Framework for S/4/ERP integration.
- SSAM-FSM connectivity where the client uses FSM as execution layer.

Required behavior:

- Dispatch to FSM/SSAM must validate WCM clearance, order release, mobile relevance, technician/crew skills, parts availability, labor plan and work-package release.
- Mobile completions must land as governed confirmations/material/time/attachment transactions with read-back to S/4 and optional reliability feedback to APM.
- Offline sync conflicts must create actionable reconciliation records with before/after values and owner routing.

#### SAP Time, Labor, CATS, Payroll and Finance

Purpose: daily/crew/contractor time capture, labor confirmation, payroll readiness, finance accrual, cost object validation and settlement control.

Objects:

- Worker/personnel number, workforce person, crew, supervisor, pay group, shift/roster, pay code, wage type, rate class, activity type, cost center, internal order, WBS/network/activity, maintenance order operation, CATS/workforce timesheet entry, PM confirmation, payroll batch, labor accrual, finance posting line, reconciliation case.

Native connector candidates:

- Manage Workforce Timesheet / Workforce Timesheet Integration communication scenario `SAP_COM_0027`.
- CATS/Workforce Timesheet APIs and CATS transfer to CO where used.
- Maintenance Order Confirmation API `API_MAINTORDERCONFIRMATION` for PM operation confirmations.
- SuccessFactors Employee Central / SAP HCM mini-master / ECP or payroll provider APIs for worker, pay group, wage type and payroll eligibility.
- Journal Entry / accrual APIs only for finance accruals where the business event is a finance posting, not for generic labor-time capture.

Required behavior:

- Worker selection must hydrate effective-dated craft, skill, supervisor, home cost center, pay group, union, default rate class and posting eligibility through backend lookups.
- Time entry must separate labor time, finance cost line, payroll line and PM confirmation; these are related objects, not the same object.
- Payroll release must not imply SAP PM confirmation or finance posting unless each target object has its own validated payload, approval, outbox item and read-back.

#### SAP APM, PdMS, Reliability and Condition Monitoring

Purpose: condition-driven scope, asset health, reliability risk, recommendations, FMEA/RCM feedback, indicator monitoring and post-outage learning.

Objects:

- APM technical object, indicator, alert, recommendation, assessment, risk/criticality score, failure mode, maintenance strategy, RCM/FMEA action, health score, condition-monitoring evidence, historian mapping and measurement event.

Native connector candidates:

- SAP APM/Asset Strategy and Performance Management APIs available for the tenant/release.
- S/4 EAM-to-APM replication for equipment, functional locations, classes, characteristics and measuring points.
- AVEVA PI/Aspen IP21 via PI Web API or approved OPC UA gateway into Integration Suite iFlow, Cumulocity/Embedded IoT if tenant-supported, and SAP APM indicators.
- Optional S/4 measurement document posting only when a measuring point and auditable EAM measurement requirement exist.

Required behavior:

- APM recommendations can create scope candidates or SAP notification/order requests only through governed scope intake, approval and SAP write-back.
- Telemetry mappings must carry source tag/WebId or OPC UA node, APM technical object, indicator, unit conversion, quality policy, deterministic event ID, replay policy and reconciliation.
- Do not bulk-copy historian data into SAP APM or S/4. Send governed indicator events and quarantine bad/stale values.

#### SAP Finance, Controlling and Settlement

Purpose: cost visibility, budget/forecast, commitment, accruals, settlement readiness, finance controls and closeout.

Objects:

- Cost center, internal order, WBS, network activity, activity type, commitment, actual cost, planned cost, accrual, journal entry, settlement rule, asset under construction, capitalization class, budget availability, variance reason, claim and change order.

Native connector candidates:

- Released S/4 Finance APIs for journal entry, cost center, internal order, WBS/project and actual/plan/commitment reads where available.
- Datasphere/Business Data Cloud/CDS extraction for analytics and high-volume cost reporting.
- Integration Suite wrapper/BAPI pattern for private edition/on-prem objects where no public API exists.

Required behavior:

- Cost KPIs must trace to source transactions: reservation, PR, PO, SES, goods movement, time entry, confirmation, accrual, claim, change order or journal entry.
- Accruals and reversals require finance approval, accounting period validation, idempotency, read-back and reversal/reconciliation policy.
- Settlement/capitalization decisions must validate PS/CO/AA rules and must not be guessed in the UI.

#### SAP Quality, Inspection and Turnover

Purpose: inspection, quality hold, punch list, turnover package, PSSR and return-to-service readiness.

Objects:

- Inspection lot, inspection characteristic, usage decision, quality notification, punch item, turnover package, PSSR checklist, startup hold, quality evidence attachment and acceptance signature.

Native connector candidates:

- Released SAP QM APIs/CDS for inspection lots, usage decision and quality notifications where available.
- SAP DMS/Attachment services or approved document repository APIs for evidence and turnover documents.
- Workflow/Build Process Automation for review/approval tasks when SAP QM or external quality system remains source of record.

Required behavior:

- Return-to-service cannot be approved while quality holds, punch A items, unresolved inspections, open permits, incomplete restoration or missing signatures remain.
- Punch list closeout must preserve evidence, owner, due date, material/service dependency, inspection status and source-of-record link.

#### SAP Document Management, Attachments and Knowledge

Purpose: job packs, drawings, permits, procedures, photos, test records, turnover and lessons learned.

Objects:

- Document info record, attachment, drawing, procedure, job pack, permit evidence, photo/video, inspection evidence, turnover dossier, lesson learned, AI evidence citation.

Native connector candidates:

- SAP DMS / Document Management service / ArchiveLink / GOS attachments / content server APIs depending on the target landscape.
- Non-SAP DMS/EDMS such as OpenText, SharePoint, Aconex, Meridian or engineering document systems through certified APIs.

Required behavior:

- AI summaries must cite source documents and preserve document ID, version, lifecycle status, source system and confidence.
- Attachments used as approval evidence must be immutable or version-locked after approval.

### 24.4 Non-SAP connector families that must be first-class

The SaaS platform must provide native-ready non-SAP adapters with the same source-mode, audit, outbox, retry and reconciliation contracts:

- Primavera P6: WBS/activity, baseline, current schedule, progress, constraints and critical path through P6 EPPM Web Services/REST where available.
- Microsoft Project / Project Online: schedule import/export, delta review and approval.
- ePTW / permit systems: permit, isolation, LOTO, gas test, SIMOPS and restoration status; write authority must remain with the safety system unless certified.
- AVEVA PI / Aspen IP21 / OPC UA: condition data, quality/timestamp/unit normalization, stale-data policy and APM indicator mapping.
- Contractor portals and workforce systems: crew rosters, qualifications, mobilization, badging, timesheets, claims and service evidence.
- SAP Fieldglass / Ariba / external procurement: services, contractors, SOW, supplier collaboration and procurement events where client landscape uses them.
- PowerPlan or utility capitalization systems: work order/sub-order, asset class, capitalization class, utility plant account and capitalization posting path.
- ServiceNow / Jira / work management: incident, issue, risk, constraint, change request and action-item integration with ownership boundaries.
- DMS/EDMS/GIS/RTLS/mobile data platforms: drawings, spatial context, worker location, equipment location, attachments and operational evidence.

For each non-SAP adapter document: source of record, allowed write actions, authentication, data ownership, conflict policy, payloads, event model, frequency, replay/reconciliation and tenant-specific certification.

### 24.5 Required workbench-level integration depth

Every workbench must have an integration matrix row per major object and action. At minimum:

- Command Center: reads all transactional states through domain services; KPI cards drill to records; exception cards open actionable queue items; Event Mesh and outbox status visible.
- Portfolio/Event Setup: SAP ePPM/PS/project/event master linkage; event creation or association; stage gate and budget ownership.
- Scope Intake/Challenge: notification, APM recommendation, inspection, work request, manual entry and emergent scope; SAP notification/order create/associate; approval and deferral.
- Work Packages: SAP order/operation/component/service/labor/permit/risk/document model; completeness validation; release and status write-back.
- Schedule: P6/MS Project/SAP PS network and order dates; delta approval; critical path and impact payloads; schedule write-back only through approved adapter.
- Materials: reservation, stock, PR, PO, supplier confirmation, goods issue/return, shortages, expediting and reconciliation.
- Permits/Safety: WCM/ePTW read, request package, fail-closed gating, no autonomous controlled writes.
- Execution: daily control board, field progress, PM confirmation, FSM/SSAM dispatch, mobile feedback, material usage and labor capture.
- Time and Labor: backend lookup-driven workers, CATS/workforce timesheet, PM confirmation, payroll, finance accrual and reconciliation.
- Quality/Turnover: inspections, punch, turnover packages, PSSR, return-to-service gates and evidence.
- Cost/Controls: PS/CO/MM/CATS/FI reads, commitments, accruals, claims, change orders, forecast and traceability to source transactions.
- Integration Hub: connector provisioning, mode switch, metadata refresh, test lookup, dry-run payload, CSRF/ETag/token handling, enable/disable and certification status.
- Resilience Ops: outbox, retry, DLQ, replay-with-reason, manual reconcile, incident creation and SLO monitoring.
- AI Workbench: cited recommendations only; no controlled write execution; model routing and evaluation traces.

### 24.6 Native connector provisioning runbook

Every SAP connector must have a runbook with these steps:

1. Confirm SAP product, deployment model, release/FPS, scope item, communication scenario, licensing and activated business function.
2. Confirm source-of-record ownership, allowed operations and clean-core extension policy.
3. Create communication system/user or OAuth client in SAP where required.
4. Create SAP communication arrangement for the API/service and record service URL, scopes, roles and object authorization requirements.
5. Configure SAP BTP Destination with logical name only in the SaaS app; secrets stay in Destination/Credential Store/IAS/XSUAA/security material.
6. Configure Cloud Connector for on-premise/private edition endpoints with least-privilege exposed resources.
7. Configure Integration Suite package/iFlow when transformation, wrapper, BAPI/RFC/IDoc/SOAP mediation or non-SAP orchestration is required.
8. Configure Event Mesh topics/queues/subscriptions for business events and async read-back where available.
9. Import OpenAPI/EDMX/metadata into connector registry; generate TypeScript schemas, mapping profiles and contract tests.
10. Validate CSRF token, ETag/If-Match, paging, filtering, batch, rate limits, retry classification and API-specific error messages.
11. Execute dry-run and sandbox post with idempotency key and correlation ID.
12. Perform read-back and reconciliation using the business key and SAP document/object number.
13. Certify negative tests: auth failure, missing mandatory field, invalid status, duplicate, stale ETag, lock conflict, SAP business validation failure, retry exhaustion and replay.
14. Promote connector from `SIMULATOR` to `SANDBOX` to `LIVE` only after evidence is stored in the connector certification record.

### 24.7 Authentication, authorization and security requirements

- Use SAP Identity Authentication / XSUAA / IAS trust and principal propagation where business-user authorization must be preserved.
- Use OAuth2 client credentials or communication users only for technical integration identities that are explicitly approved.
- Store credentials, certificates and secrets outside application code in SAP BTP Destination, Credential Store, Secret Manager or enterprise vault.
- Enforce tenant isolation, RBAC/ABAC, row-level security and SoD in the SaaS layer before calling connectors.
- Preserve SAP authorization failures as business-visible errors; do not mask them as generic 500s.
- Log correlation IDs, destination aliases and object keys, not passwords, tokens, authorization headers or sensitive payload fragments.
- For regulated actions, support electronic signature, reason code, comment, attachment evidence and immutable audit.

### 24.8 Canonical payload and mapping requirements

For each action produce a data contract:

- source screen, user role, action, source object, target object, target system, source of record;
- canonical request schema, target SAP/non-SAP payload schema, mapping profile and mapping version;
- mandatory fields, optional fields, defaulting rules, value-help source, field-level editability and validation;
- status before, status after, approval state, outbox state, integration state, reconciliation state;
- idempotency key, correlation ID, SAP object number/document number, read-back query and success criteria;
- retry policy, DLQ policy, replay policy, cancellation/reversal policy and manual reconciliation policy;
- audit event including before/after values, reason, comment, approver, integration transaction and source evidence.

The UI review drawer for every controlled write must show:

- business object values;
- mapped SAP/non-SAP codes;
- target connector/mode;
- API/service/interface name;
- endpoint path or logical iFlow route;
- exact payload preview with secrets masked;
- validation warnings/errors;
- approval requirement;
- read-back and reconciliation plan.

### 24.9 SAP Business Data Cloud, Datasphere, CDS, SLT and analytics policy

Use SAP Business Data Cloud, SAP Datasphere, released CDS extraction, SLT, replication flows, BW/4HANA or data lake only for:

- high-volume read analytics;
- historical KPI baselines;
- cross-domain reporting;
- AI evidence retrieval and feature engineering;
- reconciliation support and exception detection;
- read-only operational context where API latency or volume makes direct API reads unsuitable.

These are not write paths. If a dashboard or AI insight uses replicated data, it must show data freshness, source system, extraction time, lineage, steward and whether the value is certified for operational decisions. Transactional writes must still go through the appropriate source-of-record connector and read-back.

### 24.10 SaaS platform modules to include in the build

The target solution must include these platform capabilities in addition to STO/SOT business workbenches:

- Tenant and site provisioning wizard.
- Connector marketplace and integration hub.
- SAP BTP destination/communication arrangement checklist per connector.
- Connector metadata refresh and schema diff viewer.
- Canonical lookup service and dependent lookup engine.
- Transaction/action service layer.
- Approval/workflow engine with SoD and delegation.
- Outbox, inbox, retry, DLQ, replay, manual reconcile and incident routing.
- Audit/event ledger.
- Notification and escalation service.
- Rules engine for gates, readiness, write policy and status transitions.
- AI model router, agent registry, prompt/eval versioning and cited evidence store.
- Observability: traces, logs, metrics, SLOs, connector health, synthetic tests and business process monitoring.
- Security: IAM, RBAC/ABAC, tenant isolation, rate limiting, encryption, secrets, audit and data retention.
- Admin: roles, work centers, plants, status profiles, mapping sets, reason codes, approval matrices and data stewardship.
- Release evidence generator with gate reports, validation results and connector certification records.

### 24.11 Required documentation additions

Create or update these files during the build:

- `docs/integration/SAP_NATIVE_API_AND_CONNECTOR_CATALOG.md`
- `docs/integration/SAP_OBJECT_ACTION_PAYLOAD_MATRIX.md`
- `docs/integration/NON_SAP_CONNECTOR_MATRIX.md`
- `docs/connectors/BTP_PROVISIONING_RUNBOOK.md`
- `docs/connectors/CONNECTOR_CERTIFICATION_RECORDS.md`
- `docs/data/SOURCE_OF_RECORD_AND_WRITE_POLICY_REGISTER.md`
- `docs/data/BUSINESS_DATA_CLOUD_DATASPHERE_CDS_SLT_POLICY.md`
- `docs/workflows/CONTROLLED_WRITE_AND_APPROVAL_CATALOG.md`
- `docs/testing/NATIVE_CONNECTOR_CONTRACT_TESTS.md`
- `docs/testing/SAP_SANDBOX_CERTIFICATION_TEST_PLAN.md`
- `docs/security/PRINCIPAL_PROPAGATION_AND_AUTHORIZATION_MODEL.md`
- `docs/release/NATIVE_INTEGRATION_VALIDATION_REPORT.md`

### 24.12 Required tests and acceptance gates

Add tests proving:

- no frontend dropdown is hard-coded when a backend lookup is required;
- every lookup response includes source system, source object, source mode, source reference, last sync and posting eligibility where relevant;
- every screen action calls a domain action service, not a direct connector or local-only state mutation;
- every SAP write has object-specific connector mapping, payload schema, idempotency, correlation, approval, audit, outbox and read-back;
- disabled connectors block write-back server-side;
- WCM/ePTW controlled actions fail closed when not certified;
- Event Mesh/event-driven paths can process duplicate, delayed, out-of-order and failed messages;
- CSRF token, ETag, paging, filter, batch and SAP business error handling are tested per connector;
- simulator, sandbox and live modes return the same canonical contract shape;
- BDC/Datasphere/CDS/SLT paths are read-only and cannot be used as transaction writes;
- AI cannot approve, post, release, issue permits, isolate, restore, technically complete, financially post, payroll-release or close without human workflow and connector proof;
- every KPI drills to underlying transactional records and every exception can create or navigate to an action.

The build cannot be accepted until the native integration validation report lists every workbench, every action, every source object, every target connector, the current implementation mode, the open tenant metadata decisions, and the exact test evidence.

### 24.13 Client-specific metadata still required

Before moving from simulator to sandbox/live, collect:

- S/4HANA deployment model, release/FPS, public/private/on-premise status and activated scope items.
- SAP communication scenarios, communication arrangements, API activation, service URLs and object authorizations.
- Plant, planning plant, work center, planner group, order type, notification type, activity type, priority, status profile, phase control and settlement configuration.
- WCM/EHS/permit configuration, isolation model, permit categories, safety certificate types, approval matrix and operational release rules.
- PS/ePPM project types, WBS coding masks, network/activity rules, budget and settlement configuration.
- MM/procurement configuration: purchasing org/group, account assignment, movement types, storage locations, reservation and service procurement rules.
- CATS/workforce timesheet, payroll, wage type, pay code, shift/roster, union and rate-card configuration.
- APM tenant/release, technical-object replication filters, indicator model, recommendation types and historian route.
- BTP subaccount, regions, destinations, Cloud Connector mappings, Integration Suite tenants, Event Mesh queues/topics, IAS/XSUAA trust, certificate policy and network/security constraints.
- Non-SAP endpoint inventory for P6, ePTW, PI/IP21, FSM/SSAM, DMS, contractor, payroll, PowerPlan, ServiceNow/Jira and data platform integrations.

### 24.14 Official source grounding to verify during implementation

During implementation, use official SAP documentation first and capture the exact URLs used in the connector catalog. At minimum verify against:

- SAP Business Accelerator Hub for released SAP APIs and integration content: `https://api.sap.com/`
- Maintenance Notification API: `https://api.sap.com/api/API_MAINTNOTIFICATION/overview`
- Maintenance Order API: `https://api.sap.com/api/API_MAINTENANCEORDER/overview`
- Maintenance Order Confirmation API: `https://api.sap.com/api/API_MAINTORDERCONFIRMATION/overview`
- Reservation Document API: `https://api.sap.com/api/API_RESERVATION_DOCUMENT_SRV/overview`
- Purchase Requisition successor guidance: `API_PURCHASEREQUISITION_2` where supported by the tenant.
- Purchase Order API: `https://api.sap.com/api/API_PURCHASEORDER_PROCESS_SRV/overview`
- Material Document API: `https://api.sap.com/api/API_MATERIAL_DOCUMENT_SRV/overview`
- Service Entry Sheet API: `https://api.sap.com/api/API_SERVICE_ENTRY_SHEET_SRV/overview`
- Business Partner API: `https://api.sap.com/api/API_BUSINESS_PARTNER/overview`
- SAP S/4HANA Project / Enterprise Project APIs and Customer/Internal Project Management API documentation in SAP Help Portal.
- SAP Workforce Timesheet / Manage Workforce Timesheet integration, including communication scenario `SAP_COM_0027`.
- SAP Field Service and Asset Management Data API v4 and API Quick Start Guide.
- SAP Service and Asset Manager configuration, Mobile Services and S/4 integration documentation.
- SAP BTP Destination service, Cloud Connector, Integration Suite, API Management, Event Mesh / Advanced Event Mesh, Audit Log and Identity Authentication/XSUAA documentation.
- SAP Datasphere, SLT and SAP Business Data Cloud documentation for governed read/analytics replication.
