# Sequenced Execution Stages 00 To 20 - From Idea To SAP/Oracle-Grade ERP Product

Run these stages in order unless you are in `repair` mode. Each stage produces
artifacts and a gate report. In guided mode, stop after every gate and wait for
approval.

## How the engine runs this sequence

`orchestrator/run.py` reads `orchestrator/pipeline.yaml` (the machine-readable
form of this document) and, for each stage: builds an agent handoff, invokes the
routed driver (Codex / Claude / dry-run) and swarm, collects the declared
artifacts, runs the programmatic gate (`orchestrator/gates/validate.py`), writes
`docs/governance/gate-reports/STAGE_NN_GATE_REPORT.md`, and — in guided mode —
stops for your approval. Each stage below carries an `> Engine:` note showing its
driver route, the checks the engine runs automatically, and the challenge IDs
(`CH-xx`) it guards (see `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md`).

```bash
python orchestrator/run.py --use-case "<your use case>"       # start (guided)
python orchestrator/run.py --approve 07 && python orchestrator/run.py --resume
python orchestrator/run.py --stage 16 --mode repair            # redo one stage
```

## Stage 00 - Permanent Build Rules

Prompt: `prompts/00_permanent_rules.md`

Actions:

- Load `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`.
- Load `CODEX.md`, `CLAUDE.md`, and `AGENTS.md` as applicable.
- Confirm no generic CRUD, no dashboard-only build, no frontend-only actions, no direct frontend ERP calls.
- Confirm the project will use stage gates, source-of-record rules, native integration proof, outbox, read-back, reconciliation, audit, and AI governance.

Exit artifacts: agent acknowledgement; initial assumptions register.

Gate: proceed only if the agent acknowledges the transactional lifecycle and build gates.

> Engine: driver `main`. Checks: `BUILD_CONTRACT_ACK.md` + `ASSUMPTIONS_REGISTER.md` present; scans `generic_crud`, `dashboard_only`, `frontend_direct_erp`.

## Stage 01 - Use-Case Intake And Problem Framing

Prompt: `prompts/01_use_case_ideation_research.md`

Actions:

- Define business outcome, persona, buyer, process scope, systems touched, risk class, expected write-backs, and operational owner.
- Separate MVP demo value from production transaction value.
- Identify blocking questions and non-blocking assumptions.

Exit artifacts: `docs/domain/USE_CASE_INTAKE.md`; `docs/domain/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`.

Gate: proceed only if the problem, audience, process boundary, data impact, and write-back class are clear enough for research.

> Engine: driver Claude (long-form reasoning). Checks: intake validates against `schemas/use-case-intake.schema.json`.

## Stage 02 - Market, Industry, And Fit-To-Standard Research

Prompt: `prompts/01_use_case_ideation_research.md`

Actions:

- Research market-leading application capabilities for the domain.
- Identify standard workflows, subprocesses, tasks, exception flows, and controls.
- Benchmark SAP, Oracle, Maximo, ServiceNow, and industry tools where relevant.
- Identify where standard ERP already supports the use case and where an extension is justified (SAP Activate *Explore* / fit-to-standard).

Exit artifacts: `docs/domain/MARKET_CAPABILITY_RESEARCH.md`; `docs/domain/FIT_TO_STANDARD_AND_EXTENSION_GAP.md`; `docs/domain/PAIN_POINT_AND_GAP_ANALYSIS.md`; `docs/domain/VALUE_CASE_AND_KPI_MODEL.md`.

Gate: proceed only if the extension opportunity is justified and not merely duplicating standard ERP capability.

> Engine: drivers Claude research agents in parallel. Guards CH-01 (duplication), CH-02 (clean core), CH-11 (value case).

## Stage 03 - Current Application Gap Audit

Actions:

- Review existing screens, code, schemas, configs, mocks, and integrations.
- Identify fake buttons, mock dropdowns, hard-coded values, missing backend actions, generic connector misuse, missing audit, and missing tests.
- Use `templates/SCREEN_GAP_AUDIT_TEMPLATE.md`.

Exit artifacts: `docs/audit/CURRENT_STATE_AUDIT.md`; `docs/audit/SCREEN_GAP_AUDIT.md`; `docs/audit/TECHNICAL_DEBT_REGISTER.md`.

Gate: proceed only if existing app gaps are visible and routed to future stages.

> Engine: driver Codex (repo inspection). Scans `hardcoded_dropdown`, `fake_button`, `frontend_direct_erp`, `mock_default` (soft gate — records debt).

## Stage 04 - Business Capability Model

Prompt: `prompts/02_domain_process_model.md`

Actions:

- Define capabilities, sub-capabilities, jobs-to-be-done, personas, KPIs, operating model, process owners, data owners, and support owners.

Exit artifacts: `docs/domain/BUSINESS_CAPABILITY_MODEL.md`; `docs/domain/FUNCTIONAL_CAPABILITY_MATRIX.md`; `docs/domain/PERSONA_AND_JOBS_TO_BE_DONE.md`.

Gate: proceed only if every future feature maps to a business capability and measurable outcome.

> Engine: driver Claude. Checks: capability model + matrix present.

## Stage 05 - Process Decomposition

Prompt: `prompts/02_domain_process_model.md`

Actions:

- Decompose capability -> process -> subprocess -> task -> activity -> workflow event -> action -> system update.
- Include normal, exception, correction, cancellation, reversal, closeout, audit, support, and escalation paths.

Exit artifacts: `docs/domain/PROCESS_DECOMPOSITION.md`; `docs/domain/PROCESS_EVENT_CATALOG.md`.

Gate: proceed only if every transaction path has actors, states, actions, controls, and audit events.

> Engine: driver Claude. Guards CH-05 (missing exception/reversal/closeout paths).

## Stage 06 - Master, Transaction, Reference, Audit, And Evidence Data Model

Prompt: `prompts/03_data_object_model.md`

Actions:

- Separate master data, transactional data, configuration/reference data, derived data, audit data, reconciliation data, AI evidence data, attachment data, and event data.
- Define lifecycle states, ownership, privacy, retention, lineage, and delete/reversal policy.

Exit artifacts: `docs/domain/MASTER_DATA_OBJECT_MODEL.md`; `docs/domain/TRANSACTIONAL_DATA_OBJECT_MODEL.md`; `docs/domain/REFERENCE_CONFIGURATION_OBJECT_MODEL.md`; `docs/domain/AI_EVIDENCE_OBJECT_MODEL.md`.

Gate: proceed only if data classes are separated and ERP-controlled objects are not treated as local mutable tables.

> Engine: driver Codex (data model). Guards CH-03 (ERP objects as local tables), CH-06 (data quality/migration).

## Stage 07 - Source-Of-Record And Data Ownership

Prompt: `prompts/03_data_object_model.md`

Actions:

- Assign source of truth per object and field.
- Define ownership, update policy, delete policy, retention, privacy, lineage, replication policy, and reconciliation behavior.

Exit artifacts: `docs/data/SOURCE_OF_RECORD_REGISTER.md`; `docs/data/FIELD_OWNERSHIP_AND_WRITE_POLICY.md`.

Gate: stop if any controlled object or field lacks a source of record and write policy.

> Engine: stop-conditions `no_source_of_record`, `controlled_field_without_write_policy` (attested in the registers).

## Stage 08 - Native Integration Matrix

Prompt: `prompts/04_native_integration_matrix.md`

Actions:

- Map every object/action to SAP, Oracle, non-SAP, OT, historian, file, event, or fallback integration.
- Prefer object-specific native APIs and approved integration platforms (Integration Suite / OIC). Prefer event-driven decoupling over point-to-point.
- Document simulator, sandbox, and live modes.

Exit artifacts: `docs/integration/NATIVE_INTEGRATION_OBJECT_MATRIX.md`; `docs/integration/SAP_OBJECT_TO_API_MAPPING.md`; `docs/integration/ORACLE_OBJECT_TO_API_MAPPING.md`; `docs/integration/NON_SAP_OBJECT_TO_API_MAPPING.md`; `docs/integration/FALLBACK_INTEGRATION_POLICY.md`.

Gate: stop if write capability is not proven by native documentation, an approved wrapper, or an explicit fallback ADR.

> Engine: drivers SAP/Oracle/non-SAP integration agents in parallel. Stop-conditions `write_capability_unproven`, `generic_connector_without_adr`. Guards CH-04, CH-07, CH-12.

## Stage 09 - Connector Capability Catalog

Prompt: `prompts/06_connector_registry.md`

Actions:

- Define connector templates, supported actions, modes, auth, destinations, rate limits, retries, idempotency, payload preview, status read-back, health, and owner.

Exit artifacts: `docs/connectors/CONNECTOR_CAPABILITY_CATALOG.md`; `config/connector-registry.yaml`; `schemas/connector-definition.schema.json`.

Gate: proceed only if connector claims are testable and mode-specific.

> Engine: driver Codex. Schema check: every entry in `config/connector-registry.yaml` validates against `schemas/connector-definition.schema.json`.

## Stage 10 - Canonical Transaction Model

Prompt: `prompts/08_canonical_transaction_model.md`

Actions:

- Define canonical aggregate, header, lines, status, approval, payload preview, outbox, target references, reconciliation, audit, and AI evidence.
- Build posting-path decision rules.

Exit artifacts: `schemas/canonical-transaction.schema.json`; `docs/domain/CANONICAL_TRANSACTION_MODEL.md`; `docs/domain/POSTING_PATH_DECISION_ENGINE.md`.

Gate: proceed only if transaction lifecycle, idempotency, target references, and reconciliation are first-class.

> Engine: schema check: `canonical-transaction.schema.json` is itself a valid JSON Schema. Guards CH-08.

## Stage 11 - Workflow And Approval Model

Prompt: `prompts/09_workflow_approval_audit.md`

Actions:

- Define states, transitions, owners, approvers, SoD, e-signature, threshold controls, escalations, delegations, and overrides.

Exit artifacts: `docs/workflows/WORKFLOW_STATE_MODEL.md`; `docs/workflows/APPROVAL_AND_SOD_POLICY.md`; `config/rbac-matrix.yaml`.

Gate: stop if controlled actions can be submitted, approved, posted, replayed, reversed, or overridden without policy and audit.

> Engine: stop-condition `controlled_action_without_approval_or_audit`. Guards CH-09.

## Stage 12 - UI/UX Transactional Screen Contracts

Prompt: `prompts/11_uiux_transactional_workbenches.md`

Actions:

- Define screen purpose, persona, fields, lookups, actions, backend endpoints, validation, audit, next step, loading/empty/error/permission states, and accessibility requirements.

Exit artifacts: `docs/screens/SCREEN_CONTRACT_CATALOG.md`; `docs/screens/UI_UX_SCREEN_BLUEPRINTS.md`.

Gate: do not build UI until every screen has field, action, source, integration, workflow, audit, and test mapping.

> Engine: stop-conditions `screen_without_backend_action`, `screen_without_test_mapping`.

## Stage 13 - Enterprise Repo Skeleton

Prompt: `prompts/05_repo_architecture_skeleton.md`

Actions:

- Create or validate `apps/web`, `apps/api`, `apps/worker`, `packages/domain`, `packages/connectors`, `packages/workflows`, `packages/rules`, `packages/schemas`, `packages/ai`, `packages/security`, `packages/observability`, `database/migrations`, `tests`, `infra`, and `docs`.
- Add health checks and empty contracts. (Default stack: TypeScript full-stack — Next.js web, NestJS API/worker, Postgres.)

Exit artifacts: repo builds with app shell and health checks; `docs/architecture/ENTERPRISE_LAYERED_ARCHITECTURE.md`.

Gate: proceed only if the skeleton reflects the approved architecture and can run basic checks.

> Engine: driver Codex + SRE. Build checks `install`, `typecheck`, `health_check` (run with `--run-tests`).

## Stage 14 - Backend Foundation

Prompt: `prompts/16_transaction_service_implementation.md`

Actions:

- Implement tenant context, auth middleware, RLS, audit, idempotency, outbox, connector registry, lookup service, workflow engine, posting-path engine, and API contracts.

Exit artifacts: backend foundation code and tests; `api/openapi.yaml`; `api/asyncapi.yaml`.

Gate: API, integration, security, tenant, and contract tests must pass before UI build.

> Engine: tests `unit`, `integration`, `contract`, `security`. Guards CH-10 (tenant isolation), CH-13 (secrets/auth/RLS).

## Stage 15 - Connector-Backed Lookups

Prompt: `prompts/07_lookup_services.md`

Actions:

- Replace all hard-coded dropdowns with lookup APIs.
- Include data freshness, source system, connector mode, posting eligibility, authorization, dependent filters, caching, and failure states.

Exit artifacts: lookup APIs and tests; no hard-coded UI lookup arrays.

Gate: stop if any production screen uses mock values for governed fields.

> Engine: scans `hardcoded_dropdown`, `mock_default`; stop-condition `production_screen_uses_mock_governed_field`; tests `unit`, `integration`, `contract`.

## Stage 16 - Transaction Service Implementation

Prompt: `prompts/16_transaction_service_implementation.md`

Actions:

- Implement draft, validate, submit, approve, reject, request correction, payload preview, release, queue outbox, post, acknowledge, read-back, reconcile, cancel, reverse, and close.

Exit artifacts: domain service implementation; unit and integration tests.

Gate: domain service tests, outbox tests, approval tests, and reconciliation tests must pass.

> Engine: slice-driven (see `schemas/implementation-slice.schema.json`). Tests `unit`, `integration`, `contract`, `reconciliation`. Guards CH-08, CH-14 (posted-record immutability).

## Stage 17 - UI Implementation And Verification

Prompt: `prompts/17_ui_implementation_and_verification.md`

Actions:

- Build role-based guided workbenches, not generic CRUD.
- Every button calls backend; every field has lookup/validation; every controlled action exposes payload preview, status, blockers, audit, and next step.

Exit artifacts: UI implementation; E2E screen tests; accessibility checks.

Gate: E2E and accessibility evidence must prove real backend behavior, not visual-only completion.

> Engine: scans `fake_button`, `hardcoded_dropdown`, `frontend_direct_erp`; stop-condition `visual_only_completion`; tests `e2e`, `accessibility`.

## Stage 18 - AI Backbone

Prompt: `prompts/18_ai_backbone_governance.md`

Actions:

- Implement model router, agent orchestrator, prompt registry, tool registry, RAG, evidence, evals, AI audit, and human approval queue. Use Anthropic agent patterns (orchestrator-workers, evaluator-optimizer, routing).

Exit artifacts: AI backbone implementation; `docs/ai/AI_BACKBONE_AGENT_ORCHESTRATION.md`; `config/model-router.yaml`.

Gate: AI outputs must be grounded, cited, policy-controlled, evaluated, and blocked from autonomous controlled writes.

> Engine: stop-conditions `ai_autonomous_controlled_write`, `ungrounded_ai_output`; tests `ai_evals`, `security`. Guards CH-15 (prompt injection), CH-16 (excessive agency).

## Stage 19 - Production Readiness

Prompt: `prompts/19_production_readiness_operating_model.md`

Actions:

- Implement security, rate limits, caching, monitoring, secrets, logs, traces, alerts, deployment, rollback, backup, DR, SLOs, cost controls, compliance, support, and incident runbooks. Map to NIST SSDF, OWASP, DORA; SLIs/SLOs with error budgets; OpenTelemetry; FinOps.

Exit artifacts: `docs/security/PRODUCTION_READINESS_CHECKLIST.md`; `docs/operations/OPERATING_MODEL_AND_RUNBOOKS.md`; `docs/testing/VALIDATION_EVIDENCE_PACK.md`.

Gate: production readiness checklist and operational ownership must pass before release.

> Engine: tests `performance`, `security`; stop-condition `manual_undocumented_release_step`. Guards CH-17 (SLOs/error budgets), CH-18 (FinOps), CH-19 (DR/backup).

## Stage 20 - Acceptance And Release

Prompt: `prompts/20_acceptance_release_evidence.md`

Actions:

- Run regression, integration, reconciliation, security, AI evals, performance tests, release checklist, and evidence packaging.
- Produce Go, Go with exceptions, or No-go decision.

Exit artifacts: `docs/release/RELEASE_DECISION.md`; `docs/release/RELEASE_EVIDENCE_PACK.md`; `docs/release/POST_LAUNCH_MONITORING_PLAN.md`.

Gate: release only if the evidence pack proves domain, data, integration, workflow, security, AI, UX, test, and operations readiness.

> Engine: driver `main` + QA/SRE/security reviewers. Full test suite (`lint`→`ai_evals`); release-decision + evidence artifacts required; decision in {go, go_with_exceptions, no_go}.
