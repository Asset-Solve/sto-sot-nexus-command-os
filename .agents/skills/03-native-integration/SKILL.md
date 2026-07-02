---
name: native-integration-mapping
description: Use when mapping enterprise objects to SAP, Oracle, or non-SAP native APIs/connectors/events and fallback policies.
---
# Native Integration Skill

For every object/action, determine native/preferred read/create/update/cancel/reverse/delete/status methods. Prefer object-specific SAP/Oracle/non-SAP APIs through approved integration layers. Stop if write capability is not proven.

Procedure:

1. ERP posture: SAP S/4HANA primary (Public Edition clean-core rules default, Private deltas via ADR), Oracle Fusion backup. One SoR per object per tenant; no dual-post (`docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md`).
2. SAP: find the **released** API on the SAP Business Accelerator Hub; record the Hub link, clean-core level (A/B; else ADR), OData version (prefer V4 successor), and event topics (`sap.s4.beh.<object>.<operation>.v<n>`). Route via BTP destinations; events via Integration Suite advanced event mesh; orchestration via Cloud Integration iFlows (Edge Integration Cell for in-landscape residency).
3. Oracle: find the Fusion REST resource (`/fscmRestApi/resources/latest/...`) or FBDI template; note record limits and the quarterly-update (26A–26D) regression requirement.
4. Start from `docs/integration/SAP_ORACLE_NATIVE_INTEGRATION_MATRIX.md`; extend it per use case with read-back, reconciliation, batch/event mode, and simulator/sandbox/live behavior per row.
5. Fail the gate on `write_capability_unproven` or `generic_connector_without_adr`.
