# STO/SOT Kickoff Prompt - Enterprise AI ERP Build

Use this when you want an AI assistant (Claude, Codex, ChatGPT, Claude Code, or
this Cowork session) to run the Enterprise AI ERP build pack conversationally
for the Shutdown, Turnaround, and Outage (STO/SOT) use case instead of with the
Python engine.

Copy everything in the block below into a new project chat and send it.

---

````text
ROLE
You are the Enterprise AI ERP Build Orchestrator. Operate as the full enterprise
delivery team: product, SAP/ERP solution architecture, data, integration,
workflow, security, AI governance, QA, SRE, release, and industry SMEs for
shutdowns, outages, turnarounds, maintenance execution, work clearance, safety,
contractor controls, project controls, and industrial operations.

Follow the governing files in this pack exactly:
- MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md  (role, non-negotiable rules, lifecycle, gate format)
- EXECUTION_SEQUENCE_00_TO_20.md            (the 21 stages, what each produces, its gate)
- docs/governance/STAGE_GATE_SCORECARDS.md  (how to score each gate)
- docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md (CH-01..CH-19 pitfalls to avoid)
- prompts/NN_*.md and the docs/*/*_TEMPLATE.md files (read the one for the current stage)

HOW YOU CAN SEE THE PACK
The pack is in this folder:
C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Architecture\Finalized Build\Enterprise Ready Apps\enterprise_ai_erp_prompt_pack_v2

Read files from there as you go.

MODE
Guided gates. Proceed ONE stage at a time, beginning with Stage 00. Do not skip
ahead. Do not start a later stage until I explicitly approve the current gate.

FOR EACH STAGE
1. State the stage number, name, and objective.
2. Read the stage prompt (prompts/NN_*.md) and any listed template.
3. Reuse approved artifacts from earlier stages.
4. Produce the stage's declared artifacts from EXECUTION_SEQUENCE_00_TO_20.md as
   clearly titled documents. If you have file access, write them to the paths the
   sequence names, for example docs/domain/USE_CASE_INTAKE.md. If you do not have
   file access, output each artifact in full so I can save it.
5. Honor every Non-Negotiable Rule and every ERP No-Go stop condition. If a stop
   condition is hit, such as no source of record, unproven write-back, controlled
   action without approval/audit, AI asked to post autonomously, direct ERP write
   from the frontend, hard-coded source-backed values, or missing tenant isolation,
   STOP and tell me.
6. End the stage with a GATE REPORT in exactly this format:

   # Stage NN Gate Report: <name>
   Decision: proceed | revise | stop
   Confidence: low | medium | high
   ## Artifacts (what you produced + where)
   ## Key Decisions
   ## Evidence (files, research, assumptions)
   ## Risks (risk, impact, mitigation, owner)
   ## Open Questions (question, owner, blocking?)
   ## Recommendation

7. Then STOP and wait. Do not continue until I reply "approve", "revise <notes>",
   or "stop".

WHAT I WILL DO AT EACH GATE
- "approve" -> you proceed to the next stage.
- "revise <notes>" -> you redo THIS stage addressing my notes, then re-issue the gate.
- "stop" -> you halt and summarize where we are.

MY INPUT - THE USE CASE

Treat the following STO/SOT master use-case specification as authoritative. Do
not summarize away or drop module, integration, data, UX, security, tenancy,
AI governance, delivery, acceptance, source-system, write-back, or open-question
details. Use it as the source for Stage 00 intake and for every later stage
unless I explicitly revise the scope.

Primary source files to use and preserve:
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\STO_DEEP_DISCOVERY_AND_DESIGN.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\enterprise-production-readiness.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\solution-architecture.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\data-model.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\agent-swarm.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\USE_CASE_CATALOG.md
- C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\sot-turnaround-os-enterprise\docs\integration\NATIVE_INTEGRATION_OBJECT_MATRIX.md

Existing local application/repo context to preserve if this build continues or
refactors existing apps rather than generating a fresh build:
- SOT base repo: C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\sot-ai-platform
  - GitHub: https://github.com/Asset-Solve/sot-turnaround-os
  - Local launch: Web http://127.0.0.1:3000/ ; API http://127.0.0.1:8080/health
- SOT enterprise repo: C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\sot-turnaround-os-enterprise
  - GitHub: https://github.com/Asset-Solve/sot-turnaround-os-enterprise
  - Local launch: Web http://127.0.0.1:3001/ ; API http://127.0.0.1:8081/health
- Time/Labor cost-control platform: C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Shutdown-Outage-Turnaround Management\time-labor-cost-control-platform
  - Local launch: Web http://127.0.0.1:3100/time-labor/command-center ; API http://127.0.0.1:8091/health
- Safe Work / WCM platform: C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\WCM\safe-work-execution-platform
  - Local launch: Web http://127.0.0.1:5175/ ; API http://127.0.0.1:4312/api/health
- AssetSolve APM context: C:\Users\asset\Claude\Projects\SAP Integrated Web Based Asset Performance Management Solution
  - Local launch: Web http://127.0.0.1:8088/index.html ; reliability API http://127.0.0.1:8181/health/ready
- Working Capital Command Center is a separate finance suite, but finance/cost
  control patterns, approval/outbox/reconciliation, and SAP-native controlled
  write-back guardrails should be reused where applicable.

# STO/SOT Use Case Master Specification

## 1. Executive Summary

Build a production-grade, dark-themed, multitenant, enterprise Shutdown,
Turnaround, and Outage operating system. The product is not a prettier shutdown
schedule and not a passive dashboard. It is a governed, AI-assisted operating
workbench that connects business objectives, asset health, scope, work packages,
permits, safety barriers, materials, contractor reality, schedule constraints,
cost, field progress, execution evidence, startup readiness, closeout, and
lessons learned into one decision fabric.

SAP S/4HANA remains the execution and financial backbone for SAP-owned objects
such as equipment, functional locations, maintenance notifications, maintenance
orders, maintenance order operations, confirmations, materials, reservations,
purchase requisitions, purchase orders, goods movements, WBS/network/activity
context, cost objects, CATS/time entries, journal entries/accruals, and document
references. SAP APM remains the source for asset health, criticality, indicators,
recommendations, FMEA/RCM context, and reliability evidence where deployed. SAP
WCM or an approved ePTW system remains the controlled source for permits,
isolation certificates, safety certificates, work clearance, and release
controls. Primavera P6 or MS Project remains the schedule backbone where used.
SAP Business Data Cloud, Datasphere, or certified data products supply governed
analytics and semantic context. Non-SAP systems such as Meridium, PI/IP21, OPC
UA, contractor portals, Fieldglass, access control, RTLS, gas systems, DMS,
OpenText, and mobile/FSM systems are integrated through canonical contracts.

The SOT application owns event-specific orchestration: event strategy, premise,
scope challenge, scope freeze, late work, emergent work, work package readiness,
constraints, decision packages, cross-system simulations, shift operating
picture, AI traces, approval workflow, outbox, retries, dead letters, read-back,
reconciliation, evidence packets, audit trail, closeout learning, and the modern
role-aware user experience.

Every screen must have backend-bound fields, role-aware actions, source metadata,
validation, approval rules, audit logging, integration health, retry, dead-letter,
and reconciliation behavior for outbound writes. Simulator mode must prove the
full demo flow with realistic data before any sandbox/live connector is enabled.

## 2. Source Documents Consolidated

Use and preserve the intent of these source documents:

- STO_DEEP_DISCOVERY_AND_DESIGN.md: executive thesis, industry gaps, market
  patterns, future-state principles, functional backlog, AI agents, NFRs,
  workstreams, MVP build order, open decisions, and definition of world-class.
- enterprise-production-readiness.md: mandatory enterprise build gate before
  feature development, stack layers, IAM/RBAC, tenancy, audit, recovery,
  observability, CI/CD, rate limiting, BTP readiness, and build rules.
- solution-architecture.md: north-star architecture, reference layers, core
  principles, product workstreams, deployment options, and open decisions.
- data-model.md: core aggregates, canonical status concepts, and data ownership.
- agent-swarm.md: master SOT orchestrator, specialist agents, shared agent
  contract, approval classes, and AI risk controls.
- USE_CASE_CATALOG.md: SOT package catalog entry and adjacent solution package
  context.
- NATIVE_INTEGRATION_OBJECT_MATRIX.md: source systems, native objects,
  preferred interfaces, connector IDs, read/write boundaries, and guardrails.

## 3. Product Vision

Build a modern, role-specific SOT workbench that hides SAP and cross-system
transaction complexity while preserving system-of-record integrity and clean-core
alignment. The first screen must be the operating workspace, not a landing page.

The product should:

- connect strategy, asset risk, scope, schedule, permits, materials, contractors,
  cost, field progress, startup readiness, and learning;
- make every scope and execution decision traceable to evidence, source authority,
  assumptions, and approval owner;
- support event strategy and premise setup before scope is accepted;
- provide scope intake, dedupe, challenge, benchmark, freeze, late-work, and
  emergent-work controls;
- compute work package completeness from materials, permits, isolation, QA/QC,
  documents, tools, resources, dependencies, evidence, and schedule;
- keep P6/MS Project as the schedule system while adding industrial constraint
  intelligence and approval workflows for proposed changes;
- integrate SAP WCM/ePTW permit status and safety blockers without allowing AI
  to approve, release, restore, or close permits;
- expose contractor commercial reality during the event, not only at closeout;
- support mobile/offline field progress, delay capture, photos, QA evidence,
  punch, PSSR, and emergent work;
- govern AI as a drafting, summarizing, ranking, validating, and routing layer,
  never as an autonomous controller for safety, permit, startup, cost baseline,
  work clearance, scope freeze, or regulated decisions;
- remain ready for SAP BTP, Integration Suite, Event Mesh, API Management,
  Destination Service, Cloud Connector, XSUAA/IAS, BDC/Datasphere, enterprise
  SSO, and production-grade observability.

## 4. Core Product Principles

1. SAP-first, not SAP-only.
2. Scope-centered digital thread.
3. Event-driven by default.
4. Human-approved AI.
5. Evidence over opinion.
6. Live risk and readiness.
7. Offline-capable execution.
8. Privacy-respecting worker intelligence.
9. Tenant-portable integration.
10. Model choice by policy.
11. Operational simplicity over SAP transaction complexity.
12. Object-specific connector discipline.
13. Auditability, reversibility, idempotency, and reconciliation.
14. Simulator, sandbox, live, and disabled connector modes kept separate.
15. Composable workbenches, not disconnected pages.

## 5. Non-Negotiable Build Rules

- No hard-coded enterprise dropdowns for SAP-backed or source-backed business data.
- No fake SAP write APIs.
- No direct SAP writes from the frontend.
- No generic sap.post abstraction for all business objects.
- No production screen without backend contracts, source metadata, validations,
  role rules, and audit events.
- No outbound write without approval where required, outbox, idempotency, retry,
  response capture, dead-letter path, post-write readback, reconciliation, and
  immutable audit.
- No hidden cross-tenant leakage.
- No UI field without a backend source, source system, refresh strategy, and
  write-back policy.
- No app-owned object should silently masquerade as a SAP system-of-record object.
- No SOT feature may skip tenant data ownership, system-of-record declaration,
  writeback risk class, audit events, approval requirements, retry/idempotency/
  recovery behavior, AI model route, tool permissions, citations, and human
  approval point.
- No AI approval or autonomous execution for safety, permits, WCM, work
  clearance, startup, regulated quality, scope freeze, cost baseline, finance
  postings, procurement commitments, schedule baseline changes, or production
  release decisions.
- No uncontrolled OT writes or control commands.
- No official KPI, report, or AI grounding source may use uncertified replicated
  or analytical data without lineage and data product approval.
- No replay from DLQ into production without owner approval and data-risk check.
- All code must pass repo-native checks and builds, such as pnpm check and pnpm
  build, before release.

## 6. Canonical End-to-End STO/SOT Lifecycle

The app must support the following lifecycle as a connected operating model:

1. Portfolio and event strategy: planned and forced event options, unit run-length
   risk, production-loss model, inspection/regulatory drivers, outage window
   scenarios, economics, executive approval package, and premise creation.
2. Digital premise: event purpose, units, boundaries, inclusion/exclusion
   criteria, mandated scope, reliability targets, business KPIs, phase calendar,
   freeze gates, and decision authority.
3. Scope discovery: ingest candidate work from SAP notifications/orders, APM
   recommendations, Meridium RBI/thickness exceptions, PI/IP21 alerts, inspection
   findings, operator logs, MOC, projects, capital lists, prior lessons, and
   manual requests.
4. Scope dedupe and challenge: cluster duplicates, identify source authority,
   score safety/regulatory/reliability/run-length/economic/material/workface
   complexity, and prepare accept/defer/reject packages.
5. Scope benchmark and index: compare event/unit/discipline scope against asset
   counts, work types, direct field labor, history, and peer baselines when
   available.
6. Scope freeze: enforce controlled late-work workflow with cost, schedule, risk,
   material, permit, contract, and startup impact.
7. Work package engineering: build job steps, resources, tools, scaffolding,
   crane needs, materials, permits, isolations, QA hold points, drawings,
   acceptance evidence, dependencies, and readiness gates.
8. Integrated scheduling: import P6/MS Project WBS/activity/baseline/critical
   path, connect work package dependencies, permit windows, resources, material
   status, area congestion, SIMOPS constraints, and startup sequence.
9. Multi-constraint optimization: propose schedule/resequence options balancing
   safety, critical path, crews, materials, equipment, permits, logistics, and
   area risk. Human planners approve any accepted changes.
10. Permit, isolation, and WCM readiness: read SAP WCM/ePTW permit requirements,
    isolation certificates, safety certificates, blind lists, validity windows,
    release blockers, and conflicts; do not autonomously write or release.
11. Material, kit, tool, and logistics readiness: track reservations, PR/PO,
    goods receipt, vendor confirmations, QA certs, substitutions, kitting,
    staging, rentals, tools/PRT, calibration, warehouse/EWM state, and shortage
    schedule impact.
12. Contractor mobilization: roster, craft/skill, certifications, training,
    badging, site access, contracts, PO lines, planned crews, assigned work
    zones, actual access, fatigue, and readiness by lookahead window.
13. Shift execution control: TAOC/command center with live KPIs, critical path,
    permits, area risk, staffing, materials, cost, blockers, decisions, and
    next-best actions by role.
14. Digital field execution: mobile/offline work packs, progress, delays,
    constraints, photos, markups, QA evidence, timesheets, near-miss/HSE
    observations, and work package closeout.
15. Emergent work triage: mobile request or discovery with photo, asset, zone,
    permit need, QA requirement, risk score, estimate, material need, schedule
    insertion options, and approval workflow.
16. SIMOPS and area risk control: detect incompatible concurrent work, permit
    conflicts, crane/scaffold conflicts, hot work, confined space, lifting,
    pressure testing, startup work, gas alarms, RTLS, fatigue, barriers, and
    congestion.
17. QA/QC and inspection evidence: inspection test plans, hold/witness points,
    weld/NDE, test packs, pressure/leak tests, deviations, punch, acceptance
    evidence, and link to startup readiness.
18. Contractor commercial control: actual burned hours by contractor, PO, work
    order, operation, zone, and shift; access-log validation, contract rules,
    earned value, disputes, invoice leakage alerts, and commercial reconciliation.
19. Startup, turnover, and PSSR readiness: punch, leak tests, blinds, LOTO
    restoration, isolation restoration, MOC, operating procedures, training,
    QA evidence, startup sequence, signoff package, and release blockers.
20. Closeout and learning: actuals, variances, claims, defects, incidents,
    productivity facts, delay root causes, lessons learned, reusable templates,
    benchmark refresh, and future planning intelligence.
21. Integration operations: monitor connector health, outbox, retry, dead-letter,
    replay, reconciliation, source freshness, payload snapshots, and data product
    quality.

## 7. Personas

- Executive sponsor / event sponsor: approves event premise, economics, and scope
  envelope.
- Turnaround manager / outage manager / TA manager: owns event delivery and gate
  decisions.
- Operations representative / startup authority: validates operating constraints,
  SIMOPS, startup readiness, procedures, and PSSR.
- Reliability engineer: contributes asset risk, APM recommendations, FMEA/RCM,
  run-length risk, and scope challenge evidence.
- Inspection / integrity engineer: contributes RBI, CML/thickness, NDE, code,
  inspection, and regulatory drivers.
- Scope owner / scope review board member: accepts, rejects, defers, or challenges
  scope items.
- Planner / discipline planner: builds and validates work packages, resources,
  materials, tools, documents, and readiness.
- Scheduler / project controls: owns P6/MS Project baseline, critical path,
  lookahead, recovery scenarios, and approved schedule deltas.
- WCM authority / permit issuer / isolation authority: governs permits,
  certificates, isolations, tags, blinds, and work clearance.
- HSE / process safety: reviews hazards, barriers, area risk, gas, SIMOPS, and
  safety evidence.
- Contractor manager / contract owner: validates contractor readiness, access,
  PO consumption, claims, disputes, and commercial performance.
- Foreman / supervisor / shift commander: manages shift execution, blockers,
  progress, handover, evidence, and next actions.
- Technician / field worker / inspector / QA: executes work packs, captures
  progress, delays, photos, QA evidence, punch, and emergent work.
- Material planner / buyer / expediter / warehouse lead: clears shortages,
  reservations, PR/PO, GR/GI, staging, kitting, rentals, and tools.
- Cost engineer / finance analyst / project controls: monitors commitments,
  actuals, accruals, cost variance, contractor leakage, and production economics.
- Commissioning / startup / turnover lead: drives systemization, PSSR, punch,
  blind restoration, isolation restoration, and release evidence.
- Integration operator / admin / SaaS support: configures tenants, connectors,
  modes, health, retries, DLQ, replay, source freshness, and certification.
- AI platform owner / model governance owner: owns model routing, evals, tool
  permissions, privacy, cost, latency, and quality.

## 8. Application Modules and Use Cases

### 8.1 Event Command Center

Purpose: live operating picture for the event with critical path, top risks,
area risk, permits, materials, contractor actuals, cost, PSSR readiness, blockers,
decisions, source freshness, and next actions.

Primary users: turnaround manager, operations, leadership, shift commander,
project controls, scheduler, HSE.

Displayed objects: TurnaroundEvent, premise, KPIs, critical path activities,
readiness gates, constraints, area risk, permits, materials, contractor actuals,
cost, startup readiness, audit events, AI recommendations.

Key actions: drill into blocker, assign owner, open work package, open permit
impact, open shortage, open schedule risk, open contractor exception, review AI
decision package, approve/reject advisory recommendation where role allows.

Validations: every KPI and risk links to source system, source object, freshness,
owner, action, and audit trail.

### 8.2 Portfolio, Event Strategy, and Premise

Purpose: define why the event exists, which units/assets are in scope, business
objectives, economics, production-loss sensitivity, run-length risk, regulatory
drivers, outage window scenarios, and approval package.

Primary users: executive sponsor, TA manager, reliability, operations, finance,
inspection, project controls.

Displayed objects: EventStrategy, PremiseDocument, business KPIs, outage window,
asset risk, production-loss model, regulatory drivers, historical event lessons.

Key actions: create event strategy, compare scenarios, set event boundaries,
define inclusion/exclusion criteria, approve premise, update assumptions, log
decision.

SAP/non-SAP mappings: S/4 equipment/FLOC/order history, SAP APM, finance/cost
data products, production planning/IBP or LP optimizer, historical SOT events.

### 8.3 Scope Control Room

Purpose: ingest, dedupe, challenge, benchmark, select, freeze, and govern scope.

Primary users: reliability, inspection, operations, engineering, finance, scope
review board, TA manager.

Displayed objects: ScopeCandidate, AssetScopeItem, ScopeDecision, ScopeIndex,
source map, duplicate clusters, evidence, approval history, late work, emergent
work.

Key actions: ingest candidates, cluster duplicates, accept/reject/defer scope,
request evidence, create challenge package, approve scope freeze, submit late
work, triage emergent work.

Mappings: SAP notifications/orders, APM recommendations, Meridium, inspection,
MOC, project lists, PI/IP21 condition triggers, manual requests.

Validation: each scope decision must cite source evidence, decision authority,
risk/economic rationale, approval state, and impact on cost/schedule/materials/
permits/startup.

### 8.4 Work Pack Studio

Purpose: create execution-ready work packages with job steps, sub-steps,
materials, tools, documents, permits, isolations, QA hold points, resources,
dependencies, and evidence requirements.

Primary users: planners, discipline leads, WCM/HSE, QA/QC, field supervisors.

Displayed objects: WorkPackage, operations, materials, documents, permits,
isolations, tools/PRT, QA plan, readiness blockers, owner actions.

Key actions: build work package, validate completeness, attach drawings, request
permit, reserve material, assign resources, release for execution, generate
mobile/offline package.

Validation: cannot mark ready if mandatory permits, isolation, materials, tools,
QA, drawings, acceptance evidence, resources, or dependencies are incomplete.

### 8.5 Schedule and Constraints

Purpose: overlay critical path, lookahead, dependencies, readiness, permits,
SIMOPS, resources, material risk, recovery scenarios, and approved schedule
deltas.

Primary users: scheduler, project controls, TAOC, TA manager, operations.

Displayed objects: ScheduleMilestone, ScheduleActivityMirror, baseline, critical
path, constraints, readiness, schedule risk, recovery scenario, approved delta.

Key actions: import schedule, review lookahead, open constraint, propose recovery,
approve/reject scenario, separate baseline from proposed changes.

Mappings: Primavera P6, MS Project, SOT work packages, WBS/network/activity,
permit windows, resource calendars.

Validation: AI cannot rebaseline. Any accepted delta requires scheduler approval,
audit, and schedule-system reconciliation.

### 8.6 Materials, Kits, Tools, and Logistics

Purpose: clear material, kit, tool, rental, and logistics blockers before they
impact execution or startup.

Primary users: material planner, buyer, expediter, warehouse, tool crib, planner,
supervisor.

Displayed objects: MaterialDemand, MaterialMirror, reservations, PR/PO, GR/GI,
substitutions, kits, staging location, QA certificates, rentals, tools, PRT,
calibration, shortages.

Key actions: identify shortage, reserve, create PR proposal, expedite, approve
substitute, stage material, issue/return material, link kit to work package,
resolve blocker.

Mappings: SAP MM/EWM/Ariba, reservations, purchase requisitions, purchase orders,
goods receipts, goods issues, transfer postings, material master, storage
locations, tool systems.

Validation: procurement, substitute, issue/return, and cancellation actions need
role checks, source-backed values, payload preview, outbox, idempotency,
readback, and reconciliation.

### 8.7 WCM, Permits, Isolation, Safety Certificates, and SIMOPS

Purpose: make work clearance and safety control visible in SOT without taking
ownership away from SAP WCM/ePTW.

Primary users: WCM authority, permit issuer, isolation authority, HSE,
operations, planners, supervisors.

Displayed objects: PermitControl, permits, isolation certificates, safety
certificates, blind list, tag list, hazards, gas test validity, work package
links, SIMOPS conflicts, release blockers.

Key actions: review readiness, detect conflict, request correction, open WCM
source, prepare impact summary, route approval package.

Mappings: SAP WCM, ePTW, S/4 orders, HSE systems, gas systems, schedule, RTLS.

Validation: AI cannot approve, release, restore, close, or bypass permits or
isolations. All controlled write-backs require human approval and tenant-validated
connector contracts.

### 8.8 Safety and Area Risk Map

Purpose: live view of unit/area/zone risk combining work density, permits,
isolations, barrier impairment, gas readings, RTLS, fatigue, congestion, vehicle
movement, critical path work, and emergency response context.

Primary users: operations, HSE, WCM, shift commander, TA manager, supervisors.

Displayed objects: AreaRisk, SIMOPSConflict, PermitControl, ConditionSignal,
RTLS/gas event, barrier state, emergency/mustering overlay.

Key actions: inspect risk spike, view contributors, assign mitigation, generate
shift risk briefing, open impacted work packages and permits.

Validation: worker data uses privacy controls, aggregation by default, purpose
limitation, retention rules, and individual detail only for mustering, rescue, or
approved investigation.

### 8.9 Contractor and Commercial Control

Purpose: manage contractor readiness, actuals, productivity, PO usage, contract
rules, disputes, claims, earned/burned, invoice leakage, and reconciliation inside
the event window.

Primary users: contractor manager, contract owner, cost engineer, finance,
project controls, supervisor.

Displayed objects: ContractorRoster, access logs, skill/certification, training,
badging, PO lines, timesheets, service entry evidence, progress, claims,
CommercialClaim, LaborEntry, cost forecast.

Key actions: flag roster gap, validate time against access, identify disputed
time, prepare review packet, forecast PO leakage, reconcile contractor actuals.

Mappings: Fieldglass, contractor portal, SAP CATS, SAP MM/service PO/SES, access
control, payroll gateway, finance/cost data products.

Validation: final SES/invoice approval remains procurement/finance. AI may draft
exceptions and review packets only.

### 8.10 Field Mobile and Execution

Purpose: offline-capable field work execution, progress, delay, evidence, QA,
punch, PSSR, emergent work, HSE observations, and sync.

Primary users: foremen, technicians, inspectors, QA/QC, supervisors.

Displayed objects: mobile work package, job steps, materials, permits, evidence,
photos, delays, progress, punch, QA forms, emergent work request, sync conflicts.

Key actions: update progress, capture delay, attach photo, complete checklist,
raise defect, request emergent work, submit QA evidence, sync offline changes.

Mappings: SOT, SAP order/operation confirmations where approved, SAP FSM/mobile
where deployed, document/evidence store.

Validation: conflict-safe sync, audit, source metadata, and approval for any
controlled posting.

### 8.11 QA/QC, Inspection, Test Packs, and Turnover

Purpose: connect inspection and completion evidence to work package closeout and
startup readiness.

Primary users: QA/QC, inspection, supervisors, startup team, operations.

Displayed objects: QA plan, inspection test plan, hold/witness points, weld/NDE,
test pack, pressure/leak test, deviation, punch, turnover system, evidence
packet, acceptance record.

Key actions: record result, verify evidence, open missing evidence, create punch,
approve/reject test pack, send turnover package, block/release readiness.

Validation: startup readiness cannot pass with missing QA evidence, unresolved
punch, failed test, open deviation, or unreconciled permit/isolation state.

### 8.12 Startup Readiness and PSSR

Purpose: enforce restart gate across punch, QA, blind lists, LOTO restoration,
isolation restoration, MOC, procedures, operator training, leak tests, lineups,
and signoff.

Primary users: startup authority, operations, commissioning, PSSR team, HSE, QA,
TA manager.

Displayed objects: StartupReadiness, PSSRChecklist, turnover systems, PunchItem,
blind/isolation restoration, MOC, procedure/training evidence, signoffs.

Key actions: validate checklist, open blockers, request correction, assemble
startup package, approve signoff where authorized.

Validation: AI cannot approve startup or release. It may draft readiness package,
missing evidence list, and risk narrative.

### 8.13 Closeout and Lessons Learned

Purpose: convert actuals, variances, delays, claims, incidents, defects, and
productivity data into reusable planning intelligence.

Primary users: TA excellence, reliability, operations, project controls, finance,
contract owner.

Displayed objects: lessons, delay root causes, planned vs actual, cost/schedule
variance, claims, defects, safety events, productivity, reusable templates,
benchmark updates.

Key actions: approve lesson, link to factual record, update template, create
future recommendation, publish closeout packet.

Validation: lessons must trace to factual event records and human curation.

### 8.14 Integration Operations Console

Purpose: manage connector health, provisioning, lookup registry, outbox, retry,
dead-letter, replay, reconciliation, source freshness, payload snapshots, and
environment modes.

Primary users: integration operator, admin, SaaS support, SAP/BTP lead.

Displayed objects: connector registry, connector options, health checks, mapping,
outbox messages, retries, DLQ, payload snapshots, reconciliation records, source
freshness, mode configuration.

Key actions: test connector, refresh metadata, inspect payload, retry failed
message, dead-letter message, replay after approval, switch simulator/sandbox/
live/disabled mode, reconcile source object.

Validation: only authorized operators can retry/replay/dead-letter. Replay
preserves correlation ID and idempotency key and requires approval in production.

### 8.15 Admin, Tenant, Security, and AI Workbench

Purpose: configure tenants, roles, permissions, feature flags, source mappings,
connector modes, model routing, AI tools, evals, costs, citations, and
certification evidence.

Primary users: admin, integration operator, AI platform owner, SaaS support,
security.

Displayed objects: Tenant, TenantUser, Role, Permission, FeatureFlag,
TenantBranding, TenantEnvironment, model route, tool permission, agent run, eval
result, certification packet.

Key actions: configure tenant, assign role, enable module, manage source mode,
approve connector contract, review AI traces, run evals, publish readiness packet.

Validation: tenant isolation is mandatory across tables, APIs, events,
attachments, search, logs, telemetry, and support operations.

## 9. Backend Data Object Catalog

### 9.1 Core Event and Scope Objects

- TurnaroundEvent: planned or forced shutdown/outage/turnaround event.
- EventStrategy: scenario, economics, production loss, risk, and approval package.
- PremiseDocument: event purpose, boundary, objectives, KPIs, criteria, and freeze calendar.
- AssetScopeItem: equipment/FLOC scope item linked to work packages and evidence.
- ScopeCandidate: candidate work from SAP, APM, Meridium, PI/IP21, inspection, MOC, project, manual, or lesson source.
- ScopeDecision: accept/reject/defer/transfer/split/challenge decision with evidence and approval.
- ScopeIndex: benchmark or scope intensity measure by event, unit, discipline, or work type.
- ScopeFreezeGate: controlled gate defining allowed and blocked changes.
- LateWorkRequest: governed exception after freeze with impact analysis.
- EmergentWorkRequest: field-driven discovery intake and triage package.

### 9.2 Work Execution Objects

- WorkPackage: execution package with tasks, labor, materials, documents, permits, dependencies, and evidence.
- WorkPackageStep: job step/sub-step with prerequisites and completion evidence.
- WorkPackageReadiness: readiness score and blocker summary.
- ReadinessGate: phase, T-minus, release, execution, turnover, or startup gate.
- Constraint: blocker with owner, due date, source, cause, severity, impact, and recovery action.
- ScheduleMilestone: planning/preparation/execution/restart/closeout milestone.
- ScheduleActivityMirror: P6/MS Project/WBS/activity read model.
- OperationExecution: progress, delay, completion, evidence, labor, and sync state.
- FieldProgressEvent: progress, delay, photo, QA, punch, or emergent work signal.
- PunchItem: punch/open item affecting turnover or startup.

### 9.3 Safety, WCM, QA, and Startup Objects

- PermitControl: work clearance and permit context from SAP WCM/ePTW.
- PermitProxy: source-system permit reference and status.
- IsolationCertificateProxy: isolation/tagging/blind/LOTO state.
- SafetyCertificateProxy: safety certificate and approval state.
- SIMOPSConflict: detected or reviewed conflict between concurrent activities.
- AreaRisk: zone/unit risk based on permits, density, gas, RTLS, barriers, fatigue, and critical path.
- QAPlan: QA/QC requirements, hold/witness points, inspection/test needs.
- TestPack: pressure/leak/NDE/weld/test package with evidence and signoff.
- TurnoverSystem: systemization object linking work, punch, QA, and startup.
- StartupReadiness: readiness state for restart/PSSR.
- PSSRChecklist: pre-startup safety review checklist and signoff evidence.

### 9.4 Material, Contractor, Cost, and Commercial Objects

- MaterialDemand: work package material/service/tool demand.
- MaterialMirror: SAP-owned material master/read mirror.
- ReservationProxy: SAP reservation reference.
- PurchaseRequisitionProxy: SAP PR reference.
- PurchaseOrderProxy: SAP PO reference.
- GoodsMovementProxy: SAP material document reference.
- Kit: staging/kitting state for work package execution.
- ToolTransaction: tool/PRT/rental/calibration issue and return orchestration.
- ContractorRoster: contractor crew, craft, skills, certifications, badging, and zone assignment.
- ContractorActual: access, timesheet, progress, and actual crew/hours evidence.
- LaborEntry: labor/time entry before CATS/payroll/confirmation posting.
- CommercialClaim: dispute, delay, claim, exception, or invoice leakage record.
- CostForecast: budget, commitment, actual, accrual, forecast, and variance context.
- ProductionEconomicsScenario: outage economics and production loss sensitivity.

### 9.5 SAP/External Proxy and Mirror Objects

- EquipmentMirror, FunctionalLocationMirror, MeasuringPointMirror, WorkCenterMirror, PlannerGroupMirror.
- MaintenanceNotificationProxy, MaintenanceOrderProxy, MaintenanceOperationProxy.
- ProjectProxy, WbsProxy, NetworkActivityProxy.
- APMRecommendationMirror, CriticalityMirror, IndicatorMirror.
- InspectionFindingMirror, MeridiumRbiMirror, CmlThicknessMirror.
- HistorianTagMirror, ConditionSignal.
- SAPObjectLink: cross-reference between SOT object and SAP/native object.

### 9.6 Collaboration, Evidence, AI, Audit, and Integration

- Attachment: metadata and content link with DMS/OpenText/object storage reference.
- Comment: collaboration thread.
- EvidencePacket: grouped documents, photos, signatures, payload snapshots, and source refs.
- ESignature: controlled signature with identity and timestamp.
- AIRecommendation: AI draft, summary, risk, ranking, or decision package.
- AgentRun: model, tool, prompt, citations, cost, latency, approval, and eval trace.
- AuditEvent: immutable action, approval, tool call, integration, or AI trace.
- OutboxMessage: outbound write record.
- ConnectorResponse: response capture.
- IntegrationRetry: retry policy and attempts.
- DeadLetterMessage: failed-message quarantine.
- ReconciliationRecord: post-write readback and source reconciliation.
- SourceFreshness: mirror freshness and sync state.
- PayloadSnapshot: request/response payload evidence and hash.

## 10. Canonical Status Concepts

- Event phase: initiation, strategy, planning, preparation, execution, restart,
  closeout, learning.
- Readiness: not_started, in_progress, at_risk, blocked, ready, accepted.
- Constraint severity: info, watch, minor, major, critical.
- Approval state: draft, pending_review, approved, rejected, superseded.
- AI action class: informational, advisory, controlled_side_effect,
  blocked_autonomous_action.
- Connector mode: SIMULATOR, SEED_DATA, SANDBOX, LIVE, CACHE, DISABLED.
- Integration status: queued, pending_approval, posted, failed, retrying,
  dead_lettered, readback_pending, reconciled, reconciliation_failed.

## 11. Source of Record Rules

- SAP S/4 owns equipment, functional locations, measuring points, notifications,
  maintenance orders, operations, statuses, confirmations, materials, stock,
  purchasing, goods movements, project/WBS/network/activity, FI/CO postings, and
  SAP document references.
- SAP APM owns technical-object health context, criticality, indicators,
  thresholds, FMEA/RCM, recommendations, and reliability strategy where deployed.
- SAP WCM/ePTW owns permits, safety certificates, isolation certificates, tags,
  blinds, work clearance, and release controls.
- SAP FSM/mobile execution owns mobile completion context where deployed.
- Primavera P6/MS Project owns schedule baseline and official rebaseline state.
- SAP BDC/Datasphere owns certified analytics and semantic data products for
  official reporting and AI grounding where available.
- Historians and OT systems own raw condition signals. SOT consumes governed,
  mapped, filtered indicators and events only.
- Contractor/access/payroll systems own their source facts. SOT reconciles and
  prepares review packages.
- SOT owns event-specific readiness, constraints, scope decisions, decision
  packages, AI traces, evidence packets, workflow state, outbox, retries,
  dead letters, and reconciliation records.

## 12. Native Integration and Connector Families

Use object-aware connector interfaces. Do not use one generic SAP connector.

Required connector families and preferred interfaces:

- SAP S/4HANA EAM:
  - Maintenance Notification: API_MAINTNOTIFICATION.
  - Maintenance Order / Operation: API_MAINTENANCEORDER_0002.
  - Maintenance Order Confirmation: API_MAINTORDERCONFIRMATION.
  - Equipment, functional location, measuring point, task list, BOM, work center, planner group reads.
  - Guardrail: do not post labor by updating order header.
- SAP CATS / Workforce Timesheet:
  - Workforce Timesheet Entry: API_MANAGE_WORKFORCE_TIMESHEET / SAP_COM_0027.
  - Guardrail: four-eyes and payroll/finance segregation.
- Payroll gateway:
  - SAP ECP, ADP, UKG, WorkForce, or equivalent payroll export via Integration Suite/API/SFTP.
  - Guardrail: payroll and finance lines are separate objects.
- SAP FI/CO:
  - Journal Entry - Post / asynchronous post for accrual/reversal.
  - Guardrail: finance approval and reversal linkage required.
- SAP MM / Ariba / EWM:
  - Reservation: API_RESERVATION_DOCUMENT_SRV.
  - Purchase Requisition: API_PURCHASEREQUISITION_2.
  - Material Document: API_MATERIAL_DOCUMENT.
  - Guardrail: PR needs material/service, required date, plant, purchasing group, and account assignment.
- SAP PS / EPPM:
  - Project, WBS, network, activity linkage using Enterprise Project APIs, PS read models, Datasphere.
  - Guardrail: receiver validation before CATS/CO posting.
- SAP IBP / production planning / LP optimizer:
  - Planning key figures and production outage economics.
  - Guardrail: LP output is advisory until planner approval.
- SAP WCM / ePTW:
  - Permit, isolation certificate, safety certificate through WCM APIs or tenant-approved wrapper.
  - Guardrail: no autonomous write, approve, release, restore, or close.
- SAP APM / Meridium:
  - Recommendations, RBI inspection, CML/thickness, criticality, indicators.
  - Guardrail: no direct SOT write to APM strategy; accepted scope writes through SAP notification/order workflows.
- Historian / OT:
  - AVEVA PI, Aspen IP21, OPC UA, Cumulocity, approved edge gateway.
  - Guardrail: OT control commands are blocked.
- Workforce identity:
  - SuccessFactors, SAP HCM, Fieldglass.
  - Guardrail: HR master data writes are outside SOT.
- Contractor systems:
  - Fieldglass, contractor portal, access control, timesheets, claim evidence.
  - Guardrail: final SES/invoice approval remains procurement/finance.
- SAP BDC / Datasphere / HANA:
  - BDC catalog, Datasphere, Delta Sharing, SQL, certified semantic models.
  - Guardrail: never write to replicated analytical tables.
- SAP MDG / master data:
  - MDG change request, Product/BP/BOM APIs, approved EAM wrappers.
  - Guardrail: steward approval and audit required.
- DMS / OpenText / evidence:
  - API_CV_ATTACHMENT_SRV, CMIS, DMS REST, object storage.
  - Guardrail: preserve revision ID, evidence hash, source object, and access policy.

## 13. Governed Integration Pattern

All outbound writes follow this governed path:

```text
UI action
-> backend domain action
-> tenant, role, policy, validation and SoD checks
-> payload preview and approval where required
-> outbox message
-> integration worker
-> object-specific connector call
-> response capture
-> post-write readback
-> reconciliation record
-> user-visible status update
-> immutable audit log
```

Outbound messages must store object type, action type, tenant id, user id,
correlation id, idempotency key, source transaction id, target connector, payload
JSON, status, retry count, next retry time, last error, response snapshot, source
authority, data classification, and approval reference.

Every controlled SAP or external write must store request payload, response
payload, target document reference, post-write readback result, reconciliation
state, last checked timestamp, replay eligibility, and audit reference.

## 14. API and Event Contract Families

Frontend clients must call backend APIs only. Backend APIs expose object-specific
service contracts and may use REST, GraphQL, events, or command endpoints.

Core endpoint families:

- /events
- /portfolio
- /premises
- /scope-candidates
- /scope-decisions
- /scope-freeze
- /late-work
- /emergent-work
- /work-packages
- /readiness-gates
- /schedule
- /constraints
- /materials
- /kits
- /tools
- /permits
- /isolations
- /simops
- /area-risk
- /contractors
- /labor
- /cost
- /execution
- /field-progress
- /qa
- /inspection
- /test-packs
- /turnover
- /startup-readiness
- /punch
- /lessons
- /attachments
- /comments
- /integrations
- /connector-registry
- /lookups
- /writeback
- /outbox
- /reconciliation
- /agent-runs
- /ai-governance
- /audit
- /admin
- /data-products

Event examples:

- event.strategy.created
- event.premise.approved
- scope.candidate.ingested
- scope.candidate.clustered
- scope.decision.approved
- scope.freeze.accepted
- late_work.requested
- emergent_work.triaged
- work_package.created
- work_package.readiness_changed
- schedule.baseline_imported
- schedule.recovery_proposed
- constraint.created
- material.shortage_identified
- material.reservation_proposed
- permit.blocker_detected
- isolation.state_changed
- simops.conflict_detected
- area_risk.spike_detected
- contractor.roster_gap_detected
- contractor.time_dispute_detected
- field.progress_submitted
- qa.evidence_missing
- punch.item_created
- startup.readiness_blocked
- startup.package_ready
- lesson.proposed
- integration.outbox_queued
- integration.dead_lettered
- reconciliation.failed
- ai.recommendation_created
- ai.approval_required

## 15. AI and Agent Governance

The platform uses one master SOT orchestrator and specialist agents. The master
orchestrator owns task decomposition, model selection, context assembly, tool
routing, guardrail checks, and human approval gates. Specialists own bounded
domains and return structured outputs.

Required agents:

- Master SOT Orchestrator.
- Event Strategy Agent.
- Premise Quality Agent.
- Scope Discovery Agent.
- Scope Challenge Agent.
- Scope Index / Benchmark Agent.
- Scope Readiness Agent.
- Work Pack Completeness Agent.
- SAP S/4 EAM Agent.
- SAP BDC Data Agent.
- Historian Condition Agent.
- Materials Risk Agent.
- Procurement Logistics Agent.
- Schedule Risk Agent.
- SIMOPS Conflict Agent.
- WCM Safety Impact Agent.
- WCM Safety Agent.
- Area Risk Agent.
- Emergent Work Triage Agent.
- FSM Execution Agent.
- Contractor Readiness Agent.
- Contractor Reconciliation Agent.
- Commercial Reconciliation Agent.
- PSSR Readiness Agent.
- Lessons Learned Agent.
- Integration Error Triage Agent.
- Model Governance Agent.

Every agent contract must declare identity, purpose, phase ownership, allowed
tools, forbidden tools, source authority, data sensitivity, input schema, output
schema, approval gates, escalation path, fallback process, error handling, eval
cases, and quality checks.

Approval classes:

- Informational: summaries, search results, dashboard narratives. Requires audit
  trace and source references.
- Advisory: recommendations, risk rankings, mapping suggestions. Requires human
  review before adoption.
- Controlled Side Effect: SAP notification draft, material reservation proposal,
  labor time entry proposal, replay request, scope change draft. Requires explicit
  approver, change ticket or workflow reference, idempotency key, and audit.
- Blocked Autonomous Action: permit approval, work clearance, order release,
  maintenance strategy approval, startup approval, cost baseline approval,
  schedule rebaseline, procurement commitment, finance posting, or regulated
  release. AI may only prepare a review package.

Model routing must be controlled by task class, data sensitivity, latency, cost,
region, retention, and enterprise policy. Safety/regulatory summaries need high
reasoning and citations. Long work-pack review needs long-context extraction.
Real-time field copilot needs low latency and offline fallback. SQL/analytics
generation must run read-only in a sandbox. Integration triage may use tools but
cannot replay production blindly. Bulk dedupe/classification needs human sample
QA and drift checks.

## 16. Security, Tenancy, Privacy, and Certification Readiness

Security and tenancy requirements:

- Entra ID, IAS/XSUAA, or enterprise SSO.
- Tenant-aware routing.
- RBAC plus ABAC where needed.
- Company, plant, unit, program, project, contractor, customer, and role scope
  filters.
- Field-level masking and data classification.
- Row-level security for tenant-owned data.
- Immutable audit logs and approval records.
- Correlation IDs from API to integration to audit.
- Secrets in Key Vault, BTP Credential Store, or approved vault.
- Signed API contracts and connector certifications.
- Environment segregation: simulator, sandbox, live, disabled.
- Production support dashboards and tenant-aware telemetry.
- Backup, restore, retention, disaster recovery, and incident runbooks.
- Purpose limitation, aggregation, retention, and investigation approvals for
  worker location/fatigue/access data.

Certification-ready principles:

- Use released and supported SAP APIs first.
- Avoid direct SAP database writes.
- Avoid custom SAP core dependency in application scope.
- Document system-of-record boundaries.
- Route fallback legacy calls through controlled middleware/wrappers.
- Provide explicit error handling, data lineage, payload snapshots, evidence
  hash, replay controls, and reconciliation.

## 17. UX and Interaction System

Theme:

- Dark theme first.
- Near-black layered surfaces.
- Cool white primary text and muted slate secondary text.
- Electric cyan for active system actions.
- Amber for warnings and due-soon items.
- Red for critical blockers.
- Green for posted, cleared, ready, accepted, and completed states.
- Violet for engineering, AI, and advanced analysis.

Layout and views:

- App shell with left navigation, top command bar, global search, quick action
  launcher, role switcher, environment badge, tenant badge, and integration state
  footer.
- Event Command Center as the first screen.
- Scope Control Room.
- Work Pack Studio.
- Schedule and Constraints.
- Safety and Area Risk Map.
- Contractor and Commercial.
- Field Mobile / Offline Execution.
- Materials, Kits, Tools, and Logistics.
- WCM / Permit / Isolation Console.
- QA/QC and Turnover.
- Startup Readiness / PSSR.
- Closeout and Learning.
- Integration Operations.
- Admin / Tenant.
- AI Workbench.

Core components:

- Command center KPI cards.
- Dense enterprise grids.
- Exception pill tags.
- Timeline rails.
- Relationship graph and decision graph cards.
- Side-sheet editors.
- Split panel object link viewer.
- Expandable command drawer.
- Audit, comments, and attachments drawer.
- Source system badge.
- Integration health badge.
- Object status ribbon.
- Draft, pending approval, queued, pending SAP, posted, failed, dead-lettered,
  readback pending, and reconciled indicators.
- "Why is this blocked?" drilldown.
- Bulk actions with preview.
- Side-by-side baseline versus current scope compare.
- Mobile/offline sync and conflict state.

Demo readiness:

- Every module must use realistic seed data.
- No lorem ipsum.
- Status mix must include draft, submitted, approved, blocked, at risk, queued,
  posted, failed, dead-lettered, readback pending, and reconciled examples.
- Every visible SAP-backed field must show source metadata, source object,
  refresh strategy, and connector readiness.
- Every risk links to owner, action, evidence, and source.
- Every action that changes state must be backend-bound and audited.

## 18. Non-Functional Requirements

- Availability: command center and mobile sync services are high-availability
  ready during execution windows.
- Latency: live risk and progress events visible within operationally useful
  thresholds defined by signal type.
- Volume: high-frequency RTLS, gas, progress, event bursts handled with
  backpressure, filtering, and aggregation.
- Offline: mobile supports offline work packs, QA/PSSR, photos, notes, and
  conflict-safe sync.
- Security: tenant isolation, SSO, RBAC/ABAC, row-level security, data masking,
  secret vaulting, and complete audit.
- Privacy: worker tracking uses purpose limitation, aggregation, retention rules,
  and investigation approvals.
- Audit: all scope, permit-impact, cost, schedule, startup, and AI decisions have
  immutable audit trails.
- Safety: AI cannot autonomously approve or release controlled safety,
  regulatory, permit, work clearance, or startup actions.
- Integration reliability: idempotency, schema validation, retry, DLQ, replay,
  reconciliation, and payload hash lineage are mandatory.
- Observability: OpenTelemetry, business event KPIs, DLQ aging, API latency, sync
  conflicts, model cost, and agent quality dashboards.
- Extensibility: connector SDK, canonical event schema registry, configurable
  model router, plugin-like solution packages.
- Data governance: BDC/Datasphere data products for certified reporting and
  knowledge graph for AI grounding and relationships.

## 19. Delivery and MVP Build Order

Use the 21-stage Enterprise AI ERP build sequence for formal delivery. For the
SOT application itself, prioritize the following MVP build order:

1. Event shell, premise, user roles, tenant model, and source-system registry.
2. Enterprise foundation: IAM/RBAC, RLS, rate limits, audit, recovery,
   observability, CI/CD, and readiness checks before feature depth.
3. S/4 equipment, functional location, order, notification, material, cost, and
   WBS/network read connectors.
4. APM evidence import and scope candidate ingestion.
5. Scope Control Room with dedupe, challenge, freeze, late work, emergent work,
   approval audit, and source citations.
6. Work Pack Studio with readiness calculation and evidence requirements.
7. P6/MS Project import and critical-path/readiness overlay.
8. SAP WCM/ePTW permit status and impact visibility.
9. Materials, kits, tools, and logistics readiness.
10. Field mobile/offline progress, delay, photo, QA evidence, and emergent work.
11. Event Command Center with live readiness, risks, materials, permits, schedule,
    contractor, and cost cards.
12. Agent orchestrator with initial agents: Scope Discovery, Scope Challenge,
    Work Pack Completeness, Schedule Risk, Materials Risk, WCM Safety Impact,
    Shift Commander, Integration Error Triage, and Model Governance.
13. Contractor commercial reconciliation and access-log integration.
14. Area risk map with RTLS/gas/fatigue/congestion once site data and privacy
    rules are confirmed.
15. PSSR/restart readiness and closeout learning.
16. BDC data products, knowledge graph enrichment, executive analytics, and
    release evidence pack.

## 20. Recommended Implementation Stack

If building from the existing repositories, follow the repo-native stack and
patterns already in place. If generating a fresh app from the pack, target:

- Next.js App Router and TypeScript for the web application.
- Node backend using NestJS or Fastify, selected by repo pattern.
- PostgreSQL with Prisma or equivalent migrations for orchestration data.
- Object storage for documents, images, evidence, and payload snapshots.
- Service Bus/Event Mesh/queue abstraction for async integration.
- SAP BTP Destination, Connectivity, Integration Suite, API Management, Event
  Mesh or advanced event mesh.
- Key Vault or approved enterprise secret store.
- OpenTelemetry, Application Insights/Log Analytics or equivalent observability.
- Feature flags and module entitlements.
- Tenant-aware RBAC/ABAC and row-level security.
- Audit logging.
- Outbox, retry, dead-letter, replay approval, and reconciliation services.
- Mock/simulator connectors first with live-equivalent contracts, then sandbox
  and live connectors after certification.
- Model router with provider-neutral policies for OpenAI, Anthropic Claude,
  SAP-native/Joule options, local models, and other approved providers.

## 21. Acceptance Criteria

### Product

- Dark theme is consistently applied.
- App shell feels like a premium enterprise operations workbench.
- Tenant-aware branding, module flags, and role-specific navigation are supported.
- All core SOT modules are present or explicitly staged.
- User journeys demonstrate end-to-end STO execution, not static dashboards.
- Every risk, KPI, blocker, and recommendation drills into source, owner,
  evidence, action, and audit.

### Backend

- Orchestration schema is complete and tenant-scoped.
- Every business table carries tenant context.
- Audit trail is present and immutable for controlled decisions.
- Outbox, retry, DLQ, replay, and reconciliation are implemented.
- Simulator mode is seeded with realistic data and source metadata.
- Health, readiness, and support endpoints exist.

### Integration

- Object-specific SAP and non-SAP connector interfaces exist.
- No direct frontend-to-SAP writes exist.
- Response capture and reconciliation are implemented.
- Failure states are visible to users.
- Connector modes include SIMULATOR, SEED_DATA, SANDBOX, LIVE, CACHE, and DISABLED
  where appropriate.
- Write-back scope is separated by risk class and approval requirement.

### UX Completeness

- Every dropdown has source-backed or configuration-backed data.
- Every status uses business language.
- Every action has validation, role checks, and audit.
- Every posted object shows target reference and sync state.
- Every workbench includes evidence, comments, audit, and integration status
  where relevant.
- No visible action is fake; disabled actions explain why.

### AI Governance

- Agents cite source evidence.
- Agents declare model route, tool calls, approval class, confidence, and audit.
- Controlled actions require human approval.
- Blocked autonomous actions are blocked by policy.
- Evals/red-team tests prove no autonomous safety/permit/startup/cost/work
  release behavior.

### SaaS Readiness

- Role model is enforced.
- Multitenant data isolation is validated.
- Secrets are externalized.
- Telemetry and health endpoints are available.
- Deployment scripts and runbooks are documented.
- Privacy controls exist for worker/access/RTLS/fatigue data.

### Release Readiness

- README setup works.
- Unit, integration, workflow, and regression tests pass.
- Demo scenario covers full event lifecycle.
- Architecture docs, API docs, connector docs, and release evidence are generated.
- Stage 20 produces Go, Go-with-exceptions, or No-go with evidence.

## 22. Additional Explicit Assumptions for Stage 00 Intake

- Risk class is controlled_side_effect for SAP or non-SAP write-backs.
- AI may draft, recommend, validate, preview payloads, summarize, classify,
  simulate, route, and explain blockers, but it must never post controlled ERP,
  safety, permit, schedule baseline, startup, procurement, finance, or regulated
  transactions autonomously.
- Use simulator mode first. Sandbox/live modes require connector contract
  certification, authorization, audit, payload preview, idempotency, outbox,
  retry, dead-letter, response capture, readback, and reconciliation.
- Treat the initial product as English-only unless localization is later added.
- Treat tenant isolation as mandatory on every database table, API route, event,
  attachment, search index, integration log, telemetry dimension, and support
  operation.
- Treat all dropdowns and selectable enterprise business values as source-backed
  or configuration-backed.
- Treat SAP BDC in this scope as SAP Business Data Cloud unless a legacy Batch
  Data Communication requirement is explicitly approved as an exception.
- Treat SOT and STO as the same product family for naming, but record any naming
  convention decision as an ADR.
- Treat P6 as the first schedule connector assumption, MS Project as second, and
  adapter interfaces for other scheduling tools.
- Treat SAP WCM/ePTW as controlled safety source, not an AI-controlled workflow.
- Treat BDC/Datasphere/knowledge graph as preferred for certified analytics and
  AI grounding where entitled.

## 23. Open Questions to Carry Forward

- Which pilot industry and event type is first: refinery turnaround, chemical
  shutdown, power outage, LNG train shutdown, utility outage, mining shutdown,
  facility outage, or mixed enterprise STO?
- Which SAP landscape is target for the first pilot: S/4HANA public cloud,
  S/4HANA private cloud, on-premise SAP ERP/ECC, or hybrid?
- Which SAP modules are active: PM/EAM, PS, MM/EWM, FI/CO, CATS, WCM, FSM, APM,
  BDC/Datasphere, MDG, DMS?
- Which plants, company codes, maintenance plants, planner groups, work centers,
  controlling areas, WBS/network structures, and user roles are included?
- Which SAP write-backs are allowed in phase one: notifications, order status,
  confirmations, CATS, material reservations, PRs, goods movements, accruals,
  attachments, or simulator-only?
- Which schedule system is authoritative: P6, MS Project, SAP project planning,
  or another tool?
- Which PTW/WCM source is authoritative: SAP WCM, external ePTW, or hybrid read
  model?
- Which APM/integrity sources are in scope: SAP APM, Meridium/Amplify, RBI,
  thickness monitoring, inspection systems, PI/IP21, OPC UA?
- Which contractor actuals source is reliable: access control, Fieldglass,
  contractor portal, myTrack-like system, SAP CATS, payroll gateway, or files?
- Which document repository is authoritative: SAP DMS, OpenText, SharePoint,
  Azure Blob/object storage, or hybrid with DMS linkage?
- Which mobile strategy is required: PWA first, native wrapper, SAP FSM, SAP
  Service and Asset Manager, or another mobile app?
- Which RTLS, gas, fatigue, camera, and access-control vendors are in scope, and
  what privacy rules apply?
- Which identity provider, role model, SoD policy, and tenant provisioning model
  should be used?
- Which data retention, backup, disaster recovery, high availability, and support
  dashboard requirements are mandatory for go-live?
- Which model providers, regions, retention policies, and data sensitivity rules
  are approved?
- Which official KPIs must reconcile to SAP/BDC/source systems at release?

Begin with Stage 00. Infer non-blocking defaults, record assumptions, and ask me
only genuinely blocking questions.
````

---

## Re-entry prompt

Use this to continue later or in a fresh chat:

```text
Continue the Enterprise AI ERP build. Approved through Stage <NN>. Here are the
approved artifacts so far: <paste or re-attach the key ones, or point to the
folder>. Resume at Stage <NN+1> using EXECUTION_SEQUENCE_00_TO_20.md, same
guided-gate rules and gate-report format. Use case: production-grade,
dark-themed, multitenant STO/SOT operating workbench with SAP S/4HANA as the
execution/financial backbone, SAP APM/WCM/BDC where available, source-backed
lookups, governed controlled-side-effect write-backs, AI assistance with human
approval, and full outbox/retry/dead-letter/readback/reconciliation controls.
```
