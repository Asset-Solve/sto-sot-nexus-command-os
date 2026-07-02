# Prompt 04 — Native SAP / Oracle / Non-SAP Integration Matrix

For every data object and action, identify the native/preferred integration
method. Prefer object-specific APIs and approved integration layers. Do not
invent unsupported writes.

ERP posture: **SAP S/4HANA primary, Oracle Fusion backup.** Public Edition
clean-core rules are the default; document Private Edition deltas per object.
One system of record per object per tenant; dual-posting is prohibited
(see `docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md`).

Create:
- docs/integration/NATIVE_INTEGRATION_OBJECT_MATRIX.md
- docs/integration/SAP_OBJECT_TO_API_MAPPING.md
- docs/integration/ORACLE_OBJECT_TO_API_MAPPING.md
- docs/integration/NON_SAP_OBJECT_TO_API_MAPPING.md
- docs/integration/FALLBACK_INTEGRATION_POLICY.md

SAP rules:
- Only **released** APIs from the SAP Business Accelerator Hub (`hub.sap.com`);
  record the Hub link as proof (`apiCatalogRefs`) and the clean-core level
  (A/B; anything lower needs an ADR). Prefer OData V4 successors.
- Route via BTP Destination service; Cloud Connector only for Private/on-prem.
- Prefer event-driven decoupling: S/4 business events
  (`sap.s4.beh.<object>.<operation>.v<n>`, CloudEvents notification pattern —
  event carries keys, consumer reads back state) via Integration Suite
  advanced event mesh. Orchestration/mapping in Cloud Integration iFlows;
  Edge Integration Cell where residency requires in-landscape runtime.
- Start from the pack's starter matrix:
  `docs/integration/SAP_ORACLE_NATIVE_INTEGRATION_MATRIX.md`.

Oracle rules (backup ERP):
- Fusion REST resources under `/fscmRestApi/resources/latest/...`; FBDI (UCM
  upload + import job + status read-back) for volume; Fusion business events
  via OIC for event-driven flows.
- Record the quarterly-update (26A–26D) regression owner — mappings and auth
  must be re-validated per update.

For each object/action include: read, create, update, cancel, reverse, delete,
status read-back, attachment handling, batch/event mode,
simulator/sandbox/live mode, auth, rate limit, retry, DLQ, and reconciliation.

Stop conditions: `write_capability_unproven` (no catalog/doc evidence),
`generic_connector_without_adr`, and any clean-core violation without ADR.
