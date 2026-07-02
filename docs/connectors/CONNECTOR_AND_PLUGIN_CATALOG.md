# Connector and Plugin Catalog

## Connector definition fields

- connectorId
- displayName
- systemType
- productFamily
- erpRole (primary | backup | none — SAP S/4HANA primary, Oracle Fusion backup; see `docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md`)
- nativeIntegrationMethod
- cleanCoreLevel (SAP: released API level A/B; C/D requires ADR)
- apiCatalogRefs (SAP Business Accelerator Hub / Oracle REST docs entry proving the claimed capability)
- eventTopics (CloudEvents topics, e.g. `sap.s4.beh.<object>.<operation>.v<n>`)
- quarterlyUpdateRegression (Oracle: mappings/auth re-validated per 26A–26D update)
- supportedBusinessObjects[]
- supportedActions: read/create/update/cancel/reverse/delete/statusReadBack/attachments/batch/events
- supportedModes: simulator/sandbox/live
- currentMode
- authType
- destinationName / endpointName
- cloudConnectorRequired
- mappingProfile
- valueMappingProfile
- retryPolicy
- deadLetterPolicy
- rateLimitPolicy
- owner
- healthStatus
- lastTestAt
- lastSyncAt

## Plugin/MCP candidates

| Plugin/MCP/tool | Purpose | Risk controls |
|---|---|---|
| SAP API catalog MCP | Search SAP API metadata and docs | Read-only, no credentials in agent prompt |
| Oracle REST catalog MCP | Search Oracle REST resources | Read-only |
| Jira/Azure DevOps MCP | Convert gaps into epics/tasks | No production secrets |
| GitHub MCP | Read issues, create branches/PRs | Protected branch rules |
| Postgres MCP | Inspect schema/read data | RLS and read-only for agents by default |
| OpenAPI validator | Validate API contracts | CI gate |
| AsyncAPI validator | Validate event contracts | CI gate |
| Security scanner | Dependency and secret checks | CI blocking |
| Playwright runner | UI e2e validation | No live write-back in e2e |
| SAP sandbox connector | Test SAP object reads/writes | Sandbox only unless release approved |
| ERP simulator connector | Production-shaped demo data | Same interface as live |

## API discovery workflow (run before claiming any write capability)

1. Search the object on the SAP Business Accelerator Hub (`hub.sap.com`);
   confirm the API is **released** for the target edition/release and note the
   clean-core level, communication scenario, and OData version (prefer V4
   successors for new builds). SAP's 2026 API policy restricts access to
   published, documented APIs — undocumented access is a stop condition.
2. For Private Edition/on-prem gaps, check the Cloudification Repository for
   the released successor before considering BAPI/RFC wrappers (ADR required).
3. For Oracle, locate the REST resource in the Fusion REST API docs; confirm
   create/update support, record limits (e.g. ~500 records/POST), and the
   FBDI template for volume loads; log the quarterly-update regression owner.
4. Record the evidence link in `apiCatalogRefs` — the Stage 08 gate
   (`write_capability_unproven`) fails without it.
