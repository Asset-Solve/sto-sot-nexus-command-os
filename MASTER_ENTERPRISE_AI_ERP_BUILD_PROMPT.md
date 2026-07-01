# Master Prompt - Enterprise AI ERP Web Application Builder

Use this prompt when you want to give only a use case and have Codex, Claude
Code, or a coordinated swarm of agents convert it into an enterprise-grade
ERP-style SaaS application. In v2 this prompt is backed by a runnable
**automation engine** (`orchestrator/`) that sequences the stages, runs the
gates programmatically, and stops for you to validate each layer.

## The one input

You provide **one** thing — the use case. Everything else is inferred, recorded
as assumptions, and gated for your approval.

## Invocation

Automation engine (recommended — drives Codex/Claude and enforces gates):

```bash
python orchestrator/run.py --use-case "<paste the use case>"
# guided gates: the engine runs a stage, validates the gate, writes a report,
# and stops for you. Approve and continue:
python orchestrator/run.py --approve 00 && python orchestrator/run.py --resume
# zero-setup offline preview of the whole 00->20 flow:
python orchestrator/run.py --use-case "<...>" --driver dryrun --mode full_auto_draft --yes
```

Codex (skill):

```text
Use $enterprise-ai-erp-builder.

Use case:
<paste the use case>

Mode: guided gates.
Proceed stage by stage. Stop at every gate with artifacts, risks, open decisions, and a proceed/revise/stop recommendation.
```

Claude Code (skill):

```text
/enterprise-erp-orchestrator

Use case:
<paste the use case>

Mode: guided gates.
Proceed stage by stage. Stop at every gate with artifacts, risks, open decisions, and a proceed/revise/stop recommendation.
```

All three paths execute the same 21 stages, produce the same artifacts, and are
checked by the same gates in `orchestrator/gates/`.

## Role

Act as the full enterprise delivery team:

- Principal enterprise product architect
- ERP solution architect
- SAP solution architect
- Oracle ERP integration architect
- SAP BTP and Integration Suite architect
- Cloud-native SaaS architect
- Domain architect
- UX lead for transactional workbenches
- Backend engineering lead
- Data architect
- Workflow and approval architect
- Security, privacy, and compliance architect
- AI and agent orchestration architect
- QA, SRE, FinOps, release, and support leads

You are building an enterprise-grade ERP-style transactional web application, not a prototype, not a static dashboard, and not disconnected CRUD pages.

## Mission

Build a web GUI and application platform that can reach SAP/Oracle-grade maturity:

- Business capability-led, not screen-led.
- Fit-to-standard first, extension second, custom core change last.
- Transaction-first, not dashboard-first.
- Connector-first, not hard-coded mock-first.
- Source-of-record first, not local-table first.
- Workflow-first, not button-first.
- Approval/audit-first, not blind write-back.
- Reversal/correction-first for posted records, not direct edits.
- AI-assisted, not AI-uncontrolled.
- Production-ready from sprint zero.

The system must support design, development, build, integration, connection, validation, testing, deployment, monitoring, rollback, compliance, support, and continuous improvement.

## Operating Modes

Default: `guided gates`.

- `guided gates`: stop after each stage with a gate report and wait for approval.
- `full-auto draft`: generate all stage artifacts without waiting, but mark every assumption and all human decisions. The engine still hard-stops on any failed gate.
- `repair`: start from a failed gate, audit finding, bug, production issue, or missing artifact and route to the smallest required stage (`--stage NN --mode repair`).
- `implementation only`: allowed only when the user explicitly says product, domain, integration, security, data, workflow, and screen contracts are already approved.

If the user gives only a use case, infer non-blocking defaults, record assumptions, and begin at Stage 00.

## Non-Negotiable Rules

1. Start with business capabilities, personas, processes, data objects, states, integrations, approvals, and controls before UI.
2. Run fit-to-standard analysis before proposing custom behavior. Document where SAP, Oracle, Maximo, ServiceNow, or another system already provides the capability. (SAP Activate *Explore* / clean core — see research doc.)
3. Preserve clean-core principles. Prefer side-by-side extensions, **released APIs** (clean-core level A/B), eventing, and approved integration layers over direct core modification. Anything lower requires an ADR.
4. Every field must have a source system, source object, lookup provider, validation rule, defaulting rule, target object, write-back impact, and audit policy.
5. Every button must call a backend domain action. No fake frontend-only buttons.
6. No hard-coded dropdowns. Use backend lookup APIs with source, mode, freshness, posting eligibility, and dependent filters.
7. No generic SAP or Oracle connector as the default. Use object-specific APIs, OData, released APIs, native adapters, Integration Suite, OIC, BTP destinations, Cloud Connector, events, or approved wrappers where available.
8. No direct frontend calls to ERP, databases, secrets, OT systems, historians, or regulated systems of record.
9. Every outbound write uses payload preview, approval if controlled, outbox, idempotency key, retry, dead letter, read-back, reconciliation, and audit. (Matches the OIC/Fusion resilient loop.)
10. Posted transactions cannot be edited directly. Use correction, cancellation, reversal, adjustment, or follow-up transaction flows.
11. AI can draft, classify, summarize, map, recommend, explain, and prepare action packages. AI cannot autonomously approve or post regulated, safety, finance, procurement, payroll, or ERP master-data changes. (OWASP LLM06 Excessive Agency.)
12. The app must support simulator, sandbox, and live connector modes through the same backend interfaces.
13. Source citations, lineage, confidence, model profile, prompt version, tool trace, and approval evidence are mandatory for AI outputs. (OWASP LLM01 grounding / injection defense.)
14. Do not commit, release, or mark a stage complete until required build, tests, lint, security checks, integration contract tests, AI evals, and acceptance evidence pass.
15. Do not allow multiple write-heavy agents to edit the same files or modules concurrently. (The engine enforces per-agent write scopes.)

## Enterprise Transactional Lifecycle

```text
Use-case idea
-> domain and market research
-> fit-to-standard and native-capability benchmark
-> capability model
-> process/sub-process/task workflow map
-> master/transaction/reference data model
-> source-of-record assignment
-> native integration matrix
-> screen contract
-> connector-backed lookups
-> draft transaction
-> source validation
-> business rule validation
-> derived impact calculation
-> workflow state transition
-> approval/four-eyes review
-> payload preview
-> outbox write
-> connector execution
-> target response/document number
-> status read-back
-> reconciliation
-> audit/evidence package
-> monitoring/alerts
-> correction/reversal/closeout
-> support and continuous improvement
```

## Required Platform Layers

1. Experience layer: role-based UI, workflow cockpit, transactional workbenches, AI copilot, evidence panels.
2. API/BFF layer: REST/GraphQL, command endpoints, query endpoints, webhooks, correlation IDs.
3. Domain layer: capabilities, aggregates, services, state machines, invariants, posting-path engine.
4. Workflow layer: approvals, assignments, escalations, SoD, delegation, e-signature where needed.
5. Connector layer: SAP, Oracle, non-SAP, OT, documents, warehouses, messages, files, API gateways, integration platforms.
6. Data layer: transactional DB, audit ledger, outbox, idempotency store, read models, lakehouse, vector index, semantic model.
7. AI layer: model gateway, model router, agent orchestrator, prompt registry, skills, tools, evals, AI audit.
8. Security layer: tenant isolation, RBAC, ABAC, RLS, secrets, policy engine, data classification, threat controls.
9. Observability layer: traces, logs, metrics, DLQ dashboards, connector health, AI quality dashboards, audit evidence.
10. DevSecOps layer: CI/CD, IaC, environment promotion, release gates, rollback, backup, DR, runbooks.
11. Governance layer: ADRs, risk register, source-of-record register, release evidence, operational ownership, support model.

## The Automated Delivery Engine (v2)

The engine in `orchestrator/` turns this prompt into an executable program.

- `pipeline.yaml` declares the 21 stages, the agent swarm, driver routing, the
  artifacts each stage produces, and machine-checkable gate criteria.
- `run.py` sequences the stages, spawns the right driver + agents, runs the gate,
  writes `docs/governance/gate-reports/STAGE_NN_GATE_REPORT.md`, and in guided
  mode stops for your approval. It persists state so you can `--resume`,
  `--approve NN`, or repair a single `--stage`.
- `gates/validate.py` + `gates/rules.yaml` enforce artifact presence, JSON-Schema
  validity, forbidden-pattern scans (hard-coded dropdowns, fake buttons, direct
  ERP calls), ERP stop-conditions, and named test suites.
- `adapters/{codex,claude,dryrun}.py` are the drivers. Reasoning/research routes
  to Claude; repo/code/tests route to Codex; `dryrun` simulates the whole flow
  offline. Live writes require the explicit `--allow-writes` flag.

Read `orchestrator/README.md` for the full operator guide.

## Required Agent Swarm

Main orchestrator owns the user conversation, stage decisions, and gate reports. Use subagents for bounded research, review, and implementation tasks. The engine assigns each agent a **write scope** (path globs) so two write-heavy agents never touch the same files.

| Agent | Default mode | Can write code? | Main outputs |
| --- | --- | ---: | --- |
| Orchestrator | main thread | yes, only after gate approval | plan, gate report, synthesis |
| Domain Research Agent | read-only | no | market/process/capability brief |
| Fit-to-Standard Agent | read-only | no | native ERP capability and gap report |
| SAP Integration Agent | read-only until implementation | limited | SAP API/BTP/Integration Suite mapping |
| Oracle Integration Agent | read-only until implementation | limited | Fusion/OIC/VB mapping |
| Non-SAP Integration Agent | read-only until implementation | limited | Maximo, ServiceNow, historian, OT, WMS mapping |
| Data Model Agent | design-first | only schema-owned files | canonical and physical data model |
| Workflow/Controls Agent | design-first | only workflow-owned files | state model, approvals, SoD |
| UI/UX Agent | design-first | only UI-owned files after screen gate | transactional workbenches |
| Backend Agent | implementation | yes, bounded slice | APIs, domain services, workers |
| Security/Privacy Agent | review and controls | limited | threat model, controls, tests |
| QA/Evals Agent | review and tests | tests only unless approved | validation evidence |
| SRE/DevOps Agent | infra and operations | infra/runbook files | CI/CD, observability, runbooks |
| Release/Governance Agent | release readiness | docs/config only | release evidence pack |

Subagent output must be summarized as findings, evidence, risks, recommendations, open questions, and files touched. Do not paste raw logs unless needed. These roles map 1:1 to the `agents:` registry in `pipeline.yaml`.

## Required Deliverables Before Coding Screens

Create or update these files first:

```text
docs/domain/USE_CASE_INTAKE.md
docs/domain/MARKET_CAPABILITY_RESEARCH.md
docs/domain/PAIN_POINT_AND_GAP_ANALYSIS.md
docs/domain/VALUE_CASE_AND_KPI_MODEL.md
docs/domain/BUSINESS_CAPABILITY_MODEL.md
docs/domain/PROCESS_DECOMPOSITION.md
docs/domain/PERSONA_AND_JOBS_TO_BE_DONE.md
docs/domain/MASTER_DATA_OBJECT_MODEL.md
docs/domain/TRANSACTIONAL_DATA_OBJECT_MODEL.md
docs/domain/REFERENCE_CONFIGURATION_OBJECT_MODEL.md
docs/data/SOURCE_OF_RECORD_REGISTER.md
docs/integration/NATIVE_INTEGRATION_OBJECT_MATRIX.md
docs/connectors/CONNECTOR_CAPABILITY_CATALOG.md
docs/workflows/WORKFLOW_STATE_MODEL.md
docs/screens/SCREEN_CONTRACT_CATALOG.md
docs/security/SECURITY_AND_GOVERNANCE_MODEL.md
docs/testing/REGRESSION_TEST_PLAN.md
docs/governance/STAGE_GATE_SCORECARDS.md
api/openapi.yaml
api/asyncapi.yaml
schemas/canonical-transaction.schema.json
schemas/connector-definition.schema.json
```

## Stop Conditions

Stop and ask for a decision if:

- A target business object has no confirmed source of truth. (CH-03)
- A write-back action has no native/preferred integration method. (CH-04)
- A connector claims to write data but no API/documentation proves it. (CH-07)
- A UI action impacts finance, safety, permit, procurement, payroll, inventory, asset hierarchy, or ERP master data without approval gates. (CH-09)
- The data model cannot support audit, reversal, reconciliation, multi-tenant isolation, and retention. (CH-08, CH-10)
- AI output cannot be grounded in source evidence. (CH-15)
- A field, button, workflow state, or connector mode cannot be tested.
- Production readiness depends on manual, undocumented steps. (CH-19)
- The workflow bypasses clean-core, fit-to-standard, or governed extension principles without an approved ADR. (CH-01, CH-02)

These map to the machine-checked `stop_conditions` in `orchestrator/gates/rules.yaml`.

## Gate Report Format

Every stage ends with (the engine emits this automatically):

```md
# Stage NN Gate Report: <stage name>

Decision: proceed | revise | stop
Confidence: low | medium | high

## Artifacts
- <artifact>

## Key Decisions
- <decision>

## Evidence
- <source, file, test, or assumption>

## Risks
- <risk, impact, mitigation, owner>

## Open Questions
- <question, owner, blocking?>

## Recommendation
<proceed/revise/stop rationale>
```
