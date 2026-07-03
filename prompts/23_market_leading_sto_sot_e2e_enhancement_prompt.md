# Prompt 23 — Market-Leading STO/SOT End-to-End Functionality & Integration Enhancement

Use this prompt as an addendum on top of `KICKOFF_PROMPT.md`, `docs/domain/STO_PROCESS_ACTIVITY_MAP.md`, and the current `build/sto-platform` application. The purpose is to absorb the best capabilities from the STO/SOT tool landscape shown in the supplied "STO End 2 End Functionality & Integration" process image and convert them into native, governed, cross-application capabilities in the STO/SOT platform.

Do not build a reporting overlay. Build an enterprise STO/SOT system of engagement that orchestrates SAP and non-SAP systems of record through strong domain objects, role-owned work queues, row-level action triggers, connector-backed lookups, governed write paths, and closed-loop reconciliation.

## 1. Research-Grounded Market Scan To Emulate And Improve

The image organizes STO/SOT into six value lanes: Mobility Apps, Scope Selection, FEL Readiness Dashboards, Integrated Solutions, Execution Excellence, and Analytics. Treat these lanes as the missing product layer on top of the existing lifecycle model.

Use the following market patterns as capability benchmarks, not as products to copy:

| Tool family | Where it excels | Native capability to add to our STO/SOT platform |
| --- | --- | --- |
| Prometheus / Roser-style STO suites | Centralized STO lifecycle management, scope, work packages, budgeting, materials, isolation planning, real-time execution, P6-linked shift handover, and ERP-as-source-of-truth operating model. | Make our platform the native lifecycle cockpit: event setup defaults, historical template recommendations, scope challenge, work package templates, material 36/48/72-hour lookahead, isolation readiness, shift handover generation, and closed-loop P6/SAP updates. |
| Oracle Primavera P6 / project scheduling tools | Large project schedules, WBS, dependencies, milestones, critical path, resource-loaded planning, schedule status updates, and contractor/scheduler collaboration. | Treat P6/MS Project as schedule source of record while our platform owns schedule-impact governance, lookahead readiness, constraint-to-activity linkage, rebaseline approvals, and schedule-to-workface execution triggers. |
| SAP EAM / S/4HANA / PM / MM / PS / FI-CO / CATS | System of record for assets, notifications, orders, operations, confirmations, reservations, PR/PO, goods movement, WBS/network/cost objects, timesheets, actuals, commitments, and financial postings. | Use object-specific clean-core connectors only. Every UI action must map to canonical transaction envelope, SAP payload preview, approval, outbox, post, read-back, and reconciliation. |
| SAP WCM / ePTW / Sphera Control of Work | Permit-to-work, isolation, LOTO, hazards, SIMOPS, shift/work conflict visualization, safety certificates, and controlled operational risk. | Keep WCM/ePTW as safety source of record. Add fail-closed permit/isolation readiness, SIMOPS conflict graph, correction-request package, work-release interlocks, and no direct permit approval from STO UI unless certified source-system API exists. |
| SAP Service and Asset Manager / SAP Field Service Management | Mobile/offline execution, guided technician work, dispatch, skills/capacity/location-aware assignment, mobile updates, photos/forms/signatures. | Add mobile-ready execution contracts: offline field packets, progress/confirmation capture, photos/evidence, e-signatures, supervisor review, dispatch constraints, and SSAM/FSM handoff/readback. |
| Advanced work packaging tools such as WorkPacks, MODS, Cleopatra, PACE XT | Structured workpack creation, constraint visibility, repetitive template reuse, lessons-learned reuse, field package completeness, and AWP-style execution readiness. | Upgrade Work Package Studio into a digital workpack factory: EWP/CWP/IWP-style hierarchy, job-step cards, constraints by category, package maturity, hold points, electronic signoff, and release gates. |
| OpenText Documentum / enterprise DMS | Controlled engineering documents, revision control, records governance, secure repository, workflow, large-scale search, audit, and approved document access. | Add governed document bundles per scope/order/workpack/permit/test pack: approved-for-work flag, revision/freshness, DMS reference, document gap triggers, and evidence pack generation. |
| RTLS / worker-equipment location systems such as Extronics, Abeeway, Bluetooth/Cisco/Azure IoT location stacks | Real-time worker/asset/equipment location, muster, emergency response, zone occupancy, equipment location, and location-based safety/productivity. | Add Execution Excellence Map: worker/equipment/permit zone presence, geofence/SIMOPS alerts, muster status, fatigue/density risk, workface utilization, and location-to-progress correlation. |
| InEight / EcoSys / Cleopatra / ARES PRISM-style project controls | Cost/schedule/scope/change integration, earned value, forecasting, change order control, contract alignment, budget/current/forecast visibility. | Add Cost Reconciliation and Contract Performance workbenches: earned-vs-burned, invoice-vs-schedule, SES/progress alignment, claim leakage, commitment/actuals reconciliation, and change impact workflow. |
| SAP APM / historians / PI / IP21 / condition monitoring | Asset health, risk/criticality, recommendations, condition trends, and maintenance strategy feedback. | Feed scope discovery and prioritization from APM/RBI/condition signals with explainable scope-score, risk reduction estimate, deferral risk, and SAP notification/order creation paths. |
| SAP Datasphere / SAP Business Data Cloud / Azure analytics / Microsoft 365 | Trusted semantic data products, federated/replicated data, collaboration artifacts, Excel/Office workflow intake, and executive analytics. | Preserve transactional source of truth in the STO platform while using Datasphere/BDC/Azure/Fabric for read models, analytics, external data blending, and governed KPI lineage. |

## 2. Product Principle For This Enhancement

For every capability shown in the process image, implement the capability natively in our STO/SOT platform as a first-class object/workflow, even when a market tool remains a source/target system.

The rule is:

```text
Point solution strength -> STO/SOT native orchestration object -> governed user trigger -> connector-specific payload -> approval/outbox/readback/reconciliation -> KPI drillback
```

Do not create point-solution tabs that merely iframe or mimic vendor screens. The STO/SOT UI must make cross-application daily work executable from one role-owned operating model.

## 3. Image-Derived End-To-End Process Capabilities To Add

### 3.1 Mobility Apps, Resource Onboarding, Digital Training & Compliance

Add a `MobilityAndWorkforceReadiness` capability with:

- worker/contractor onboarding packets;
- badge/access status;
- training/competency/certification matrix;
- device/app readiness;
- mobile/offline sync eligibility;
- crew roster and shift assignment;
- workface location authorization;
- daily fitness/fatigue declaration where required;
- resource readiness score per work package and zone.

Native data objects:

- `WorkerReadinessProfile`
- `ContractorOnboardingPacket`
- `TrainingCredential`
- `AccessBadge`
- `MobileDeviceAssignment`
- `CrewRoster`
- `ShiftAssignment`
- `FatigueDeclaration`
- `WorkfaceAccessAuthorization`

User triggers:

- onboard contractor worker;
- validate training and role competency;
- assign crew/shift/work zone;
- block work package release if required training/access/mobile readiness is missing;
- request exception with reason and approver;
- sync mobile packet to SSAM/FSM/mobile field app;
- revoke access on safety/compliance failure.

Integration sources:

- SAP HCM / SuccessFactors Employee Central / HR mini-master;
- SAP Fieldglass or contractor portal for contingent labor;
- LMS/training system;
- IAM/physical access system such as Lenel/OnGuard;
- SAP Service and Asset Manager / SAP Field Service Management;
- Entra ID / IAS / XSUAA for identity.

### 3.2 Scope Selection, Scope Identification, Risk/Priority/Duration/Cost

Upgrade `/scope` into a scope-decision cockpit that handles opportunity discovery, ranking, challenge, approval, and controlled freeze.

Add:

- multi-source scope intake from SAP notifications, APM recommendations, inspection findings, operator logs, manual requests, historian excursions, prior lessons, RBI/thickness findings, and contractor suggestions;
- duplicate detection across equipment/FLOC/order/notification;
- risk reduction score, production impact score, deferral risk, cost estimate band, duration estimate, material criticality, permit complexity, and contractor complexity;
- scenario compare: include, defer, reject, split, combine, transfer to routine maintenance;
- scope freeze and late-scope governance;
- scope-to-SAP notification/order creation or association.

Native data objects:

- `ScopeOpportunity`
- `ScopeCandidate`
- `ScopeChallenge`
- `ScopeDecision`
- `ScopeFreezeSnapshot`
- `LateScopeRequest`
- `DeferralRiskPackage`
- `ScopeBenchmark`

User triggers:

- accept APM/inspection item into scope;
- challenge scope;
- request more engineering evidence;
- create SAP maintenance notification;
- associate to existing SAP maintenance order;
- request order creation;
- freeze scope;
- request late scope;
- approve/reject/defer with reason.

SAP/native connectors:

- Maintenance Notification API (`API_MAINTNOTIFICATION`) for abnormal/maintenance requirement intake and notification creation/update.
- Maintenance Order API where released and supported; otherwise approved SAP BAPI/RFC wrapper through Integration Suite for order creation/update.
- Equipment, Functional Location, Material, Work Center, Task List, BOM, and Classification read APIs/read models.
- SAP APM recommendation integration for health/risk-driven scope.

### 3.3 FEL Readiness Dashboards And Readiness Insights

Create an FEL/readiness layer that is not only a dashboard. Every red/yellow metric must create a work item and block the correct gate.

Stages:

- FEL-0 opportunity identified;
- FEL-1 scope premise;
- FEL-2 estimate/schedule basis;
- FEL-3 work package readiness;
- pre-execution gate;
- execution daily readiness;
- startup/readiness gate.

Readiness dimensions:

- scope frozen;
- SAP order associated/released;
- operations planned;
- labor assigned;
- materials reserved/procured/staged;
- services/contractor mobilized;
- permits/isolation planned;
- QA/ITP/test pack ready;
- documents approved-for-work;
- schedule activity linked;
- risk/constraint owners assigned;
- cost baseline approved;
- mobile/offline packet ready;
- RTLS/geofence rules configured;
- startup/turnover dependencies defined.

Native data objects:

- `FELGate`
- `ReadinessScore`
- `ReadinessException`
- `GateApproval`
- `ReadinessEvidence`
- `GateBlocker`

User triggers:

- run readiness validation;
- create blocker from failed dimension;
- assign owner/date;
- request waiver;
- approve gate;
- reject gate;
- promote event phase;
- publish readiness baseline snapshot.

### 3.4 Digital Workpacks And Electronic Workpacks

Upgrade `/work-packages` from a package list to an electronic workpack factory.

Workpack hierarchy:

- Event Work Package;
- Engineering Work Package;
- Construction/Execution Work Package;
- Installation/Inspection Work Package;
- Permit/Isolation Pack;
- QA/Test Pack;
- Turnover Pack.

Each electronic workpack must contain:

- scope line(s);
- SAP order and operations;
- job steps/task list;
- labor/craft/crew;
- materials/BOM/reservations;
- services/contractor SOW;
- tools/equipment;
- schedule activity;
- permits/isolation/LOTO requirements;
- hazards/JHA/SIMOPS;
- drawings/documents/revisions;
- inspection/hold points;
- QA evidence requirements;
- progress method;
- handover/startup dependencies;
- cost object and earned value rules.

Native data objects:

- `ElectronicWorkpack`
- `WorkpackSection`
- `JobStep`
- `ReadinessDimension`
- `ConstraintLink`
- `DocumentBundle`
- `PermitRequirement`
- `InspectionHoldPoint`
- `ElectronicSignoff`

User triggers:

- generate workpack from template;
- pull SAP task list/operations/BOM;
- add job step;
- add component/service/tool;
- request permit pre-plan;
- attach approved document revision;
- run package completeness;
- route for planner/safety/QA/operations review;
- release workpack;
- publish mobile package;
- supersede package revision.

### 3.5 Materials Identification, Spares, Tools, Equipment, Staging, Logistics

Upgrade `/materials` into a material/tool/logistics command center.

Add:

- BOM explosion and planner-added components;
- stock/availability/ATP;
- reservations;
- PR/PO/expediting;
- goods receipt/staging/kitting;
- critical spares readiness;
- tool and equipment readiness;
- substitutions and alternates;
- returns/surplus;
- 36/48/72-hour lookahead;
- shortage-to-critical-path linkage.

Native data objects:

- `MaterialDemand`
- `ReservationProxy`
- `PurchaseRequisitionProxy`
- `PurchaseOrderMirror`
- `GoodsReceiptMirror`
- `StagingKit`
- `ToolDemand`
- `EquipmentRental`
- `MaterialSubstitutionRequest`
- `ShortageCase`
- `ExpeditingCase`

User triggers:

- identify material from BOM/task list;
- reserve material;
- request PR;
- expedite;
- stage/kit;
- confirm pick;
- issue material;
- return surplus;
- request substitution;
- close shortage;
- escalate critical path impact.

SAP/native connectors:

- Reservation Document API (`API_RESERVATION_DOCUMENT_SRV`) for reservations.
- Purchase Requisition API (`API_PURCHASEREQUISITION_2`) for PRs.
- Material Document / Goods Movement API for issue/return/receipt where available.
- Product/Material, BOM, inventory, storage location, supplier and purchasing read models.
- Tool/PRT integration through EAM/PM or approved plant tool system adapter.

### 3.6 Resource Allocation, Mobile Schedules, Progress Updates

Upgrade `/field`, `/execution`, `/labor-time`, and `/schedule` into a unified execution operating loop.

Add:

- resource-loaded lookahead;
- crew and contractor assignment;
- skill/certification matching;
- mobile schedule dispatch;
- daily plan vs actual;
- operation progress;
- PM confirmation;
- CATS/time confirmation;
- delay reason coding;
- shift handover;
- emergent work intake;
- deferral/cancellation;
- supervisor approval.

Native data objects:

- `DailyExecutionPlan`
- `CrewAssignment`
- `DispatchPacket`
- `MobileScheduleUpdate`
- `ProgressUpdate`
- `OperationConfirmation`
- `DelayCode`
- `ShiftHandover`
- `EmergentWorkRequest`
- `DeferralRequest`

User triggers:

- publish daily plan;
- dispatch work to crew/mobile;
- clock on/off;
- submit progress;
- record blocker/delay;
- confirm operation;
- raise emergent work;
- defer/cancel work;
- generate shift handover;
- sync to P6/SAP/FSM/SSAM.

Integration sources:

- P6/MS Project schedule mirror for activities and dates.
- SAP PM order operations and confirmations.
- SAP CATS / Workforce Timesheet.
- SAP FSM/SSAM for mobile assignments and offline execution.
- Contractor portal for contractor progress.

### 3.7 Control Of Work, Electronic Permit Systems, Risk Management, QA/QC

Upgrade `/permits`, `/area-risk`, and `/qa` into a shared safety/quality control loop.

Add:

- WCM/ePTW permit read model;
- permit pre-plan by workpack;
- isolation/LOTO plan;
- blind list;
- gas test/evidence;
- JHA/JSA;
- SIMOPS conflict detection;
- area risk map;
- QA/inspection hold points;
- punch list;
- test pack;
- turnover evidence.

Native data objects:

- `PermitProxy`
- `PermitRequirement`
- `IsolationPlan`
- `LOTOPackage`
- `BlindListItem`
- `GasTestEvidence`
- `SIMOPSConflict`
- `AreaRiskScore`
- `InspectionRecord`
- `PunchItem`
- `TestPack`
- `TurnoverPackage`

User triggers:

- request permit correction;
- link permit to workpack;
- validate permit active before release/execution;
- assign SIMOPS mitigation;
- suspend work package;
- create punch item;
- close punch with evidence;
- approve test pack;
- approve turnover;
- block RTS if safety/QA conditions remain open.

Integration behavior:

- WCM/ePTW remains source of record.
- STO/SOT platform stages correction or readiness requests unless a certified WCM/ePTW write API exists.
- Work release must fail closed if permit/isolation status is stale, suspended, expired, conflicting, or unverified.

### 3.8 RTLS Location Systems, Execution Excellence, Worker/Equipment/Permit SIMOPS

Create an `ExecutionExcellenceMap` capability.

Add:

- worker location;
- contractor presence;
- equipment/tool location;
- permit zone occupancy;
- no-go geofence;
- live SIMOPS density;
- muster/emergency status;
- evacuation drill/muster evidence;
- critical path crew at workface;
- location-based delay reason;
- privacy-preserving worker presence aggregation.

Native data objects:

- `RTLSDevice`
- `WorkerLocationSnapshot`
- `EquipmentLocationSnapshot`
- `GeoFenceZone`
- `MusterEvent`
- `ZoneOccupancy`
- `LocationRiskAlert`
- `WorkfaceUtilizationSignal`

User triggers:

- configure zone/geofence;
- link permit/workpack to zone;
- alert on unauthorized entry;
- alert on missing critical-path crew;
- trigger muster;
- record evacuation/muster status;
- create safety incident/work stop;
- correlate progress and presence.

Integration sources:

- RTLS vendors such as Extronics/MobileView, Abeeway/Bluetooth/UWB/LoRaWAN stacks.
- Cisco/Azure IoT location ingestion.
- Access control/IAM.
- Permit/SIMOPS systems.

Privacy/security:

- role-based access to individual location;
- aggregate by default;
- emergency override audited;
- retention policy by regulation/site.

### 3.9 Change Control, Contract Performance, Cost Reconciliation, Analytics

Upgrade `/cost`, `/contractors`, and analytics into a closed financial controls loop.

Add:

- scope change and trend register;
- pending vs approved changes;
- schedule impact and cost impact;
- contract/SOW baseline;
- invoice-vs-progress reconciliation;
- earned-vs-burned;
- contractor productivity;
- service entry sheet package;
- claim governance;
- accrual proposal;
- commitments/actuals reconciliation;
- forecast-at-completion.

Native data objects:

- `ChangeRequest`
- `TrendItem`
- `ContractPerformanceSnapshot`
- `EarnedValueRecord`
- `InvoiceScheduleVariance`
- `ServiceEntrySheetProxy`
- `CommercialClaim`
- `AccrualEstimate`
- `CostReconciliationCase`
- `ForecastChange`

User triggers:

- submit change request;
- estimate cost/schedule impact;
- approve/reject change;
- update forecast;
- generate SES package;
- approve claim;
- reconcile invoice to approved progress;
- post accrual;
- create recovery action for variance;
- drill KPI to source object.

SAP/native connectors:

- SAP PS/WBS/network read models for planned/actual/commitment context.
- SAP FI/CO actuals via approved APIs/read models, Datasphere/BDC/CDS/SLT where read-only.
- SAP MM PO/SES APIs or approved wrappers.
- SAP Journal Entry API for accruals where certified.
- Never post labor/material/contractor cost through a generic FI journal by default; use the correct operational object and only use FI fallback with explicit finance approval.

## 4. Required New/Enhanced Screens

Create or enhance these workspaces. Each must render the lifecycle ribbon, source badges, row-level action triggers, "what happens next", audit timeline, and role-scoped My Work entries.

| Route | Enhancement |
| --- | --- |
| `/mobility-readiness` | Resource onboarding, training, compliance, mobile device readiness, crew/shift/zone assignment. |
| `/scope` | Multi-source scope intake, scoring, scenario comparison, challenge board, freeze/late-scope governance. |
| `/fel-readiness` | FEL/readiness gates with blocker-to-action workflows and evidence packages. |
| `/work-packages` | Digital workpack factory with EWP/CWP/IWP sections, constraints, permit/QA/doc bundles, signoff. |
| `/materials` | Material/tool/logistics readiness, 36/48/72-hour lookahead, PR/PO/kit/issue/return/substitution. |
| `/control-of-work` or enhanced `/permits` | Permit/isolation/LOTO/JHA/SIMOPS readiness with fail-closed gate controls. |
| `/execution-map` | RTLS/zone/SIMOPS/workface utilization map with privacy and emergency workflows. |
| `/contract-performance` | Contractor earned/burned, claims, SES, invoice/progress alignment. |
| `/cost-reconciliation` | Budget/forecast/commitment/actual/accrual reconciliation and variance work items. |
| `/analytics` | KPI layer that drills to objects/actions, not static charts. |

Do not add these as dead dashboard pages. Every page must own at least one governed action and one drill-to-action exception workflow.

## 5. Strong Domain Backbone To Add

Extend the canonical object catalog with these families:

```text
WorkforceReadiness:
  WorkerReadinessProfile, ContractorOnboardingPacket, TrainingCredential,
  AccessBadge, MobileDeviceAssignment, CrewRoster, ShiftAssignment,
  WorkfaceAccessAuthorization, FatigueDeclaration

ScopeAndFEL:
  ScopeOpportunity, ScopeChallenge, ScopeDecision, ScopeFreezeSnapshot,
  LateScopeRequest, DeferralRiskPackage, FELGate, ReadinessScore,
  ReadinessException, ReadinessEvidence, GateBlocker

DigitalWorkpack:
  ElectronicWorkpack, WorkpackSection, JobStep, ConstraintLink,
  DocumentBundle, PermitRequirement, InspectionHoldPoint, ElectronicSignoff

MaterialsAndLogistics:
  MaterialDemand, ReservationProxy, PurchaseRequisitionProxy, PurchaseOrderMirror,
  GoodsReceiptMirror, GoodsMovementProxy, StagingKit, ToolDemand,
  EquipmentRental, MaterialSubstitutionRequest, ShortageCase, ExpeditingCase

ControlOfWorkAndRisk:
  PermitProxy, IsolationPlan, LOTOPackage, BlindListItem, GasTestEvidence,
  SIMOPSConflict, AreaRiskScore, SafetyReadinessException

ExecutionAndLocation:
  DailyExecutionPlan, CrewAssignment, DispatchPacket, MobileScheduleUpdate,
  ProgressUpdate, OperationConfirmation, DelayCode, ShiftHandover,
  RTLSDevice, WorkerLocationSnapshot, EquipmentLocationSnapshot,
  GeoFenceZone, MusterEvent, ZoneOccupancy, LocationRiskAlert

CommercialAndCost:
  ChangeRequest, TrendItem, ContractPerformanceSnapshot, EarnedValueRecord,
  InvoiceScheduleVariance, ServiceEntrySheetProxy, CommercialClaim,
  AccrualEstimate, CostReconciliationCase, ForecastChange

QualityAndCloseout:
  InspectionRecord, PunchItem, TestPack, TurnoverPackage, StartupReadiness,
  PSSRChecklist, LessonLearned, CorrectiveAction
```

Every object must carry:

```text
tenantId, eventId, plantId, unitId, objectType, lifecycleState, sourceSystem,
sourceMode, sourceObject, sourceReference, sourceFreshness, ownerRole, ownerUser,
riskClass, approvalState, writePolicy, correlationId, auditRef, parentRefs,
childRefs, readinessRefs, scheduleRefs, costRefs, safetyRefs, documentRefs
```

## 6. Object-State Action Matrix Enhancements

Add or extend the machine-readable action matrix:

```text
TrainingCredential: expired -> training.assign_refresher | onboarding.block_release
ContractorOnboardingPacket: incomplete -> onboarding.request_missing_evidence
ScopeOpportunity: scored -> scope.promote_candidate
ScopeCandidate: submitted/challenged -> scope.decide
ScopeFreezeSnapshot: open -> scope.freeze
LateScopeRequest: submitted -> late_scope.approve_reject_defer
FELGate: blocked -> gate.assign_blocker | gate.request_waiver
ReadinessException: open -> readiness.resolve | readiness.escalate
ElectronicWorkpack: draft -> workpack.validate
ElectronicWorkpack: validated -> workpack.route_reviews
ElectronicWorkpack: reviewed -> workpack.release
DocumentBundle: stale -> document.request_revision
PermitRequirement: missing -> permit.request_preplan
MaterialDemand: shortage -> material.reserve | material.request_pr | material.substitute
StagingKit: ready -> material.confirm_stage
ToolDemand: unavailable -> tool.reserve | tool.rent
SIMOPSConflict: open -> simops.assign_mitigation | work.suspend
GeoFenceZone: unauthorized_entry -> safety.create_alert | work.stop
DailyExecutionPlan: draft -> plan.publish
ProgressUpdate: submitted -> progress.supervisor_accept
OperationConfirmation: ready -> sap.pm_confirm
CommercialClaim: submitted -> claim.decide
InvoiceScheduleVariance: open -> contract.reconcile_invoice
AccrualEstimate: proposed -> accrual.approve_post
PunchItem: open -> punch.close
TurnoverPackage: assembling -> turnover.approve
StartupReadiness: blocked -> startup.assign_blocker
StartupReadiness: ready -> startup.approve_rts
LessonLearned: draft -> lesson.submit | capa.approve
```

Each action must define:

- allowed roles;
- approver roles;
- SoD requirement;
- required fields;
- source object;
- target object;
- target system;
- connector ID;
- payload builder;
- idempotency key;
- validation function;
- read-back method;
- reconciliation key;
- audit entry;
- failure/retry behavior.

## 7. Connector Registry Enhancements

Add connector families, even where simulator mode is the first implementation:

| Connector | Read | Write | Notes |
| --- | --- | --- | --- |
| SAP EAM Notifications | yes | create/update where published | `API_MAINTNOTIFICATION`; use ETags/concurrency where required. |
| SAP EAM Orders/Operations | yes | certified only | Use published Maintenance Order/Operation APIs where available; otherwise approved wrapper, not direct table writes. |
| SAP PM Confirmation | yes | create confirmation | Use Maintenance Order Confirmation API/interface. |
| SAP MM Reservations | yes | create/update/delete where released | `API_RESERVATION_DOCUMENT_SRV` / reservation document APIs. |
| SAP MM PR/PO | yes | create PR, SES/PO as certified | `API_PURCHASEREQUISITION_2`; PO/SES via published API or approved wrapper. |
| SAP Material Documents | yes | goods issue/return/receipt | Use material document/goods movement API where certified. |
| SAP PS/WBS/Network | yes | limited/certified | Read WBS/network/activity/cost collector; write only through published APIs/wrappers. |
| SAP FI/CO Actuals/Commitments | read mostly | accrual only with approval | Datasphere/BDC/CDS/SLT for read models; Journal Entry API only for approved accrual use cases. |
| SAP CATS / Workforce Timesheet | yes | create timesheet | Separate payroll/finance objects from operational confirmations. |
| SAP WCM/ePTW | yes | fail-closed by default | Correction packages only unless certified permit API exists. |
| SAP SSAM/FSM | yes | dispatch/mobile sync as certified | Mobile packet, execution updates, photos/forms/signatures. |
| SAP APM | yes | recommendations/status where supported | Asset health/recommendation input to scope. |
| SAP BTP/Datasphere/BDC | read data products | no transactional writes | Trusted semantic read models, lineage and freshness. |
| Oracle Primavera P6 | yes | schedule status/delta as approved | Activities, critical path, lookahead, rebaseline package. |
| OpenText Documentum/DMS | yes | document workflow/ref package | Approved revision and evidence bundle only. |
| Sphera/ePTW/CoW | yes | correction request if certified | Permits, isolations, SIMOPS, hazard/JHA. |
| RTLS/Azure IoT/Cisco/Abeeway/Extronics | streaming/read | no controlled writes | Worker/equipment/zone events, muster and alert events. |
| Contractor/Fieldglass/vendor portal | yes | roster/claim/SES package | Contractor readiness, claims, SES evidence. |
| ServiceNow/Jira | yes | incident/action item | Integration incident and operational issue handoff. |

## 8. AI Agent Enhancements

Add agents that create cited review packages only. They may draft actions but cannot execute controlled actions.

Agents:

- `scope_challenge_agent`: duplicate detection, risk/cost/duration ranking, deferral risk.
- `fel_gate_agent`: readiness blockers, missing evidence, waiver risk.
- `workpack_completeness_agent`: missing labor/material/permit/doc/QA/schedule/cost links.
- `materials_expediting_agent`: shortage-to-critical-path impact and alternate/substitution recommendation.
- `cow_simops_agent`: permit/isolation/SIMOPS conflict review; no permit approval.
- `rtls_execution_agent`: workface utilization, missing crew/equipment, zone density and muster anomalies.
- `contract_leakage_agent`: burned-vs-earned, invoice-vs-progress, unapproved change leakage.
- `cost_reconciliation_agent`: commitments/actuals/accrual variance review.
- `startup_readiness_agent`: PSSR/turnover/punch/isolation restoration blocker summary.
- `lessons_norms_agent`: convert lessons into reusable templates, min/max levels, and MDG change packages.

Each agent output must include:

```text
evidenceRefs, sourceSystems, confidence, recommendedActionId, humanAuthorityRole,
blockedAutonomyReason, affectedObjects, suggestedPayload, validationWarnings
```

## 9. End-To-End Demonstration Scenario To Support

Build a complete demo scenario:

1. APM/historian and SAP notifications feed scope opportunities.
2. Scope board ranks, challenges, approves, rejects, and defers scope.
3. Approved scope creates/associates SAP notifications/orders.
4. Digital workpack is generated from SAP order/task list/BOM/history.
5. FEL readiness gate identifies missing material, permit, document, contractor credential and QA hold point.
6. Material planner reserves available material and creates PR for shortage.
7. Contractor coordinator validates roster/training/access.
8. WCM/ePTW read model verifies permits/isolation; correction package is routed for suspended permit.
9. P6 activity shows critical-path exposure; schedule impact review is raised.
10. RTLS map verifies crew/equipment in the correct zone and flags a SIMOPS density alert.
11. Technician/supervisor submits progress and PM confirmation.
12. Crew time posts through CATS; payroll/export remains separate.
13. Contractor progress produces SES evidence; invoice-vs-schedule reconciliation flags variance.
14. QA closes punch with evidence; turnover package routes to operations.
15. Startup readiness remains blocked until punch/PSSR/isolation restoration clear.
16. RTS approval is human-only.
17. Lessons learned update workpack templates, material min/max and risk rules through approved change packages.
18. Executive dashboard KPIs drill back to exact objects, actions, transactions, connector payloads, and audit.

## 10. Acceptance Criteria

This enhancement is complete only when:

- every image-derived capability exists as a native object/workflow, not a decorative card;
- every row with a problematic state exposes a role-correct action trigger;
- every dashboard exception drills to a work item or object action;
- every dropdown and lookup is connector-backed;
- every SAP update uses object-specific published SAP APIs or approved wrapper pattern;
- every non-SAP integration has source ownership, direction, read/write policy, conflict handling, retry and reconciliation;
- WCM/ePTW, safety, startup, finance, payroll and OT actions fail closed;
- RTLS data is privacy-scoped and audit-protected;
- mobile/offline execution is modeled with sync status and conflict handling;
- workpack completeness blocks release until labor, material, permit, document, schedule, QA, risk and cost dimensions pass or waiver is approved;
- contract performance and cost reconciliation cannot be just charts; they must produce claims, SES packages, accruals, change requests or variance actions;
- analytics KPIs have object lineage and transaction drillback;
- simulator, sandbox and live modes share the same contracts;
- tests cover process stage coverage, action matrix integrity, prefill, role filtering, SoD, connector payloads, readback/reconciliation, link smoke and browser workflow smoke.

## 11. Documentation To Produce

Create/update:

- `docs/domain/STO_MARKET_LEADING_CAPABILITY_MAP.md`
- `docs/domain/IMAGE_TO_PLATFORM_PROCESS_MAPPING.md`
- `docs/data/STO_EXTENDED_OBJECT_CATALOG.md`
- `docs/integration/STO_CONNECTOR_REGISTRY_EXTENDED.md`
- `docs/workflows/STO_CROSS_APPLICATION_ACTION_CATALOG.md`
- `docs/screens/STO_SCREEN_ENHANCEMENT_SPEC.md`
- `docs/testing/STO_MARKET_CAPABILITY_REGRESSION_MATRIX.md`
- `docs/release/STO_MARKET_ENHANCEMENT_VALIDATION_REPORT.md`

## 12. Source Grounding Used For This Prompt

- Prometheus STO-AI Manager: https://www.prometheusgroup.com/solutions/shutdown-turnaround-and-outage
- Oracle Primavera P6 EPPM: https://www.oracle.com/construction-engineering/primavera-p6/
- Sphera Control of Work / Permit to Work: https://sphera.com/solutions/process-safety-management/control-of-work/permit-to-work/
- SAP Service and Asset Manager: https://www.sap.com/products/scm/asset-manager.html
- SAP Field Service and Asset Management: https://www.sap.com/products/scm/field-service-and-asset-management.html
- SAP Asset Performance Management features: https://www.sap.com/products/scm/apm/features.html
- OpenText Documentum Content Management: https://www.opentext.com/products/documentum-content-management
- InEight Project Controls: https://ineight.com/products/ineight-project-controls/
- SAP Reservation Document API operations: https://help.sap.com/docs/SAP_S4HANA_CLOUD/3f57e7df4a114edabffe8b2d581a59ed/025cdccd12e4438f95788d5e3acfdb12.html
- SAP Business Accelerator Hub: https://api.sap.com/
- Extronics RTLS / MobileView reference: https://www.extronics.com/blog/what-is-mobileview-enterprise-rtls-visibility-software/
- WorkPacks advanced work packaging reference: https://workpacks.com/
- Cleopatra Enterprise / STO work package management reference: https://www.stocontrol.com/work-package-management/
