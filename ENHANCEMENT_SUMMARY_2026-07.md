# Enhancement Summary — July 2026 (SAP-primary / Oracle-backup upgrade)

Scope: docs + prompts + configs, edited in place. Posture set to SAP S/4HANA
primary (Public Edition rules first, Private Edition deltas via ADR) with
Oracle Fusion Cloud as backup ERP. No orchestrator code changed.

## Changed files

| File | Change |
|---|---|
| `docs/integration/SAP_ORACLE_NATIVE_INTEGRATION_MATRIX.md` | Rewritten: concrete released API names per object (`API_MAINTENANCEORDER`, `API_PURCHASEORDER` V4, `API_BUSINESS_PARTNER`, `API_MATERIAL_DOCUMENT_SRV`, Journal Entry SOAP post, etc.), `sap.s4.beh.*` event topics, clean-core levels, Oracle REST/FBDI backup methods, integration-layer rules, Public vs Private deltas |
| `docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md` | **New.** One-SoR-per-object routing, no dual-post, outage handling via outbox/DLQ (no automatic write failover), governed switchover procedure |
| `config/connector-registry.yaml` | `erpRole` primary/backup, clean-core + API-catalog proof fields, event topics; SAP Event Mesh entry replaced by advanced event mesh (AEM); added Edge Integration Cell; Oracle quarterly-update regression flag; `erp_routing_policy` block |
| `schemas/connector-definition.schema.json` | New optional fields: `erpRole`, `cleanCoreLevel`, `apiCatalogRefs`, `eventTopics`, `quarterlyUpdateRegression`, `notes` |
| `docs/connectors/CONNECTOR_AND_PLUGIN_CATALOG.md` | New definition fields + a 4-step API discovery workflow (Business Accelerator Hub proof required before any write claim; SAP 2026 API policy noted) |
| `docs/architecture/ENTERPRISE_LAYERED_ARCHITECTURE.md` | ERP router in the diagram; new "Cloud-ready SaaS posture" table (tenancy/RLS, regions, elasticity, upgrade safety vs ERP release calendars, metering/FinOps) |
| `prompts/04_native_integration_matrix.md` | SAP released-API + eventing rules, Oracle backup rules, stop conditions tied to catalog evidence |
| `prompts/06_connector_registry.md` | New required fields, AEM + Edge Integration Cell, dual-ERP routing enforcement |
| `prompts/12_ai_backbone.md` | SAP Business AI alignment: check Joule agents/skills first (fit-to-standard for AI), route SAP-scope agents via generative AI hub / AI Agent Hub governance |
| `.claude/skills/03-native-integration/SKILL.md` | Expanded into a 5-step procedure matching the above |
| `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md` | New "ERP Posture" section (SAP primary, Oracle backup, fit-to-standard ladder: reuse > configure > extend side-by-side > custom-with-ADR) |
| `config/model-router.yaml` | Current model defaults (Claude Opus 4.8 / Sonnet 5 / Haiku 4.5 examples), `sap_genai_hub` as approved provider, registry-pinning note |
| `docs/domain/USE_CASE_RESEARCH_WORKFLOW.md` | Added fit-to-standard/Joule-overlap and cross-use-case reuse questions |
| `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md` | CH-12 mitigation updated to advanced event mesh |

## Key research inputs (verify before each build — platforms move quarterly)

- SAP clean core levels A–D; extensions via released APIs only; SAP API
  policy tightened April 2026 (published/documented APIs only).
- SAP Business Accelerator Hub is the discovery source; prefer OData V4
  successors (e.g. `API_PURCHASEORDER` V4 over `API_PURCHASEORDER_PROCESS_SRV`).
- Event Mesh default plan → advanced event mesh migration; events are
  CloudEvents notifications (`sap.s4.beh.<object>.<operation>.v<n>`) — read
  back full state via OData.
- Edge Integration Cell = optional hybrid runtime for in-landscape APIs/iFlows.
- SAP Business AI 2026: Joule Studio agent builder GA, AI Agent Hub governance
  layer, generative AI hub model access — custom AI on SAP data should align.
- Oracle 26A–26D quarterly cadence: re-validate REST mappings/auth per update;
  FBDI for volume; Data Extraction (26A+) for outbound bulk; OIC is the
  standard iPaaS.

Sources: hub.sap.com; help.sap.com (Edge Integration Cell); SAP Community
(OData V4 quick reference; Q1/2026 Integration Suite highlights; clean-core
extensibility levels); news.sap.com (Business AI Q1 2026); cap.cloud.sap
(S/4 events); docs.oracle.com (Fusion REST/FBDI); Oracle A-Team integration
architecture guide; Oracle Fusion release calendar 26A–26D.

## Close-out (2026-07-02)

Validation completed:

- `tools/lint_pack.py` passed on the workstation (17 YAML + 29 JSON parsed,
  no authoring markers) — recorded in
  `docs/testing/SANDBOX_VALIDATION_EVIDENCE.md`. This closes the deferred
  lint check from the original summary.
- `config/connector-registry.yaml` entries verified against
  `schemas/connector-definition.schema.json` (all required fields present;
  new optional fields covered). The Stage 09 gate
  (`yaml_each:connectors` in `orchestrator/pipeline.yaml`) re-checks this at
  run time.
- Stale-reference sweep clean: no `gpt-5.5` or `sap_event_mesh` references
  remain outside historical notes.

Additional changes in this pass:

- `api/asyncapi.yaml` v0.2.0: added `outbox.deadlettered`,
  `reconciliation.mismatch.detected`, `erp.sap.businessevent.received`
  (CloudEvents/`sap.s4.beh.*` envelope), and
  `erp.oracle.businessevent.received` channels.
- `docs/testing/TESTING_AND_EVAL_STRATEGY.md`: new "Local Sandbox Stack"
  section wiring in `infra/sandbox/`, the runbook, the SBX-001..008 test
  matrix, and the evidence file.

Sandbox alignment confirmed: `infra/sandbox/config/connector-overrides.sandbox.yaml`
uses the registry's connector IDs (`sap_advanced_event_mesh`) and
primary/backup roles; SBX-002 exercises the dual-ERP no-failover policy.

Remaining operator items (not blocking):

- Reboot Windows to settle WSL/Containers feature enablement, then re-run
  `validate-prereqs.ps1` / `validate-sandbox.ps1`.
- Optional: validate the Vagrant VM wrapper (`vagrant up --provider=hyperv`)
  and the WSL shell-script path.
