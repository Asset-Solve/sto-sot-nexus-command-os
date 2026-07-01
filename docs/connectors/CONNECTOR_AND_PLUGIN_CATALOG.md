# Connector and Plugin Catalog

## Connector definition fields

- connectorId
- displayName
- systemType
- productFamily
- nativeIntegrationMethod
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
