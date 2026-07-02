# SAP Native API and Connector Catalog

Implementation: `build/sto-platform/src/server/connectors/registry.ts` (22 connectors) + `simulator.ts` (adapter). Every connector is object-specific and carries the full section-24.2 contract: capabilities, write policy, mapping version, idempotency/correlation patterns, CSRF/ETag policy, read-back method, reconciliation key, retry/DLQ/replay policy, owner, steward, certification status.

## SAP connectors

| Connector | API (Business Accelerator Hub) | Capabilities | Write policy | Read-back |
| --- | --- | --- | --- | --- |
| sap-eam-notification | `API_MAINTNOTIFICATION` | read/create/update | APPROVAL_REQUIRED | GET by MaintenanceNotification |
| sap-eam-order | `API_MAINTENANCEORDER_0002` | read/create/update | APPROVAL_REQUIRED | GET by MaintenanceOrder |
| sap-eam-confirmation | `API_MAINTORDERCONFIRMATION` | create/cancel/reverse/confirm | APPROVAL_REQUIRED | GET by MaintOrderConf |
| sap-mm-reservation | `API_RESERVATION_DOCUMENT_SRV` | read/create/update/cancel | APPROVAL_REQUIRED | GET by Reservation |
| sap-mm-pr | `API_PURCHASEREQUISITION_2` | read/create/update/cancel | APPROVAL_REQUIRED | GET by PurchaseRequisition |
| sap-mm-po | `API_PURCHASEORDER_PROCESS_SRV` | read | READ_ONLY | n/a |
| sap-mm-matdoc | `API_MATERIAL_DOCUMENT_SRV` | create/reverse | APPROVAL_REQUIRED | GET by MaterialDocument |
| sap-ses | `API_SERVICE_ENTRY_SHEET_SRV` | read/create/update | APPROVAL_REQUIRED | GET by ServiceEntrySheet |
| sap-cats | `API_MANAGE_WORKFORCE_TIMESHEET` · SAP_COM_0027 | create/update/reverse | APPROVAL_REQUIRED | GET by TimeSheetRecord |
| sap-fico-journal | Journal Entry Create Request (async SOAP) | create/reverse | APPROVAL_REQUIRED | GET by AccountingDocument |
| sap-wcm | Integration Suite wrapper (read model) | read | **FAIL_CLOSED** | permit read model |
| sap-dms | `API_CV_ATTACHMENT_SRV` | create/attach | APPROVAL_REQUIRED | GET by DocumentInfoRecord |
| sap-apm | APM recommendation reads | read | READ_ONLY | n/a |
| sap-bdc-datasphere | Datasphere consumption | read | READ_ONLY | n/a |
| sap-mdg | MDG change request | create | APPROVAL_REQUIRED | CR status |
| sap-fieldglass | Fieldglass connector API | read/create | STAGE_ONLY | SOW status |

## Non-SAP connectors

P6 EPPM REST (approved delta only), MS Project adapter, ePTW (FAIL_CLOSED), PI Web API (read/subscribe), RTLS (read, identity masked), payroll gateway (approved batch + readback), PowerPlan (approved lines), ServiceNow (incident post + status readback).

## Transport & security

BTP Destination logical names only (no secrets in app), Cloud Connector for on-prem, Integration Suite iFlows for wrapper/mediation, Event Mesh for async, XSUAA/IAS principal propagation, OAuth2 client credentials for technical identities, CSRF token + ETag handling on S/4 OData, SAP authorization failures surfaced as business errors. Provisioning: `docs/connectors/BTP_PROVISIONING_RUNBOOK.md`.

## Certification

All connectors currently `SIMULATOR_CERTIFIED`. Promotion to SANDBOX/LIVE requires the runbook steps 1–14 plus negative tests (auth failure, missing mandatory field, duplicate, stale ETag, lock conflict, retry exhaustion, replay) with evidence stored in the connector certification record. Tenant metadata still required is listed in KICKOFF §24.13.
