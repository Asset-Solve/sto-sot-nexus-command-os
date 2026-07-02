# SAP / Oracle Native Integration Matrix

ERP posture: **SAP S/4HANA is the primary system of record** (Cloud Public
Edition rules first; Private Edition deltas documented per row). **Oracle
Fusion Cloud Applications is the backup/secondary ERP** — used only when the
tenant's system of record for an object is Oracle, never as a dual-post
target. See `docs/integration/DUAL_ERP_ROUTING_AND_FAILOVER_POLICY.md`.

## How to read this matrix

- **SAP preferred method** names the released API on the
  [SAP Business Accelerator Hub](https://api.sap.com) (`hub.sap.com`).
  Verify release state and clean-core level (A/B) for the target
  edition/release before build — SAP's 2026 API policy restricts access to
  published, documented APIs only.
- **Clean-core level**: A = released API/extension point with stability
  contract (default); B = released with restrictions; C/D require an ADR.
- **Events** follow `sap.s4.beh.<object>.<operation>.v<n>` (CloudEvents,
  notification pattern: event carries keys, consumer reads back full state via
  the OData API). Delivered via SAP Integration Suite, advanced event mesh
  (AEM) — Event Mesh default plan is in migration to AEM.
- **Oracle preferred method** names the Fusion REST resource under
  `/fscmRestApi/resources/latest/...`, with FBDI for high-volume batch and
  Fusion business events (via OIC) for event-driven flows. Re-validate REST
  mappings and auth after every Oracle quarterly update (26A–26D cadence).
- All writes in every row inherit the pack's non-negotiables: payload preview,
  approval where controlled, outbox, idempotency key, retry, DLQ, read-back,
  reconciliation, audit.

## Object matrix

| Domain object | SAP preferred method (released API) | SAP events | Oracle backup method | Non-SAP fallback | Notes |
|---|---|---|---|---|---|
| Equipment / Technical object | `API_EQUIPMENT` (OData; Equipment CRUD) via BTP destination; Cloud Connector for Private/on-prem | `sap.s4.beh.equipment.*` where released | Maintenance: `installedBaseAssets` / asset REST resources | Maximo `mxapiasset` (REST/OSLC), ServiceNow CMDB | Read-first; master changes via change workflow only |
| Functional location / Asset hierarchy | `API_FUNCTIONALLOCATION` (OData); CDS released views for hierarchy reads | object-changed events where released | Fusion asset hierarchy REST | Maximo locations API, ESRI for geo | Preserve hierarchy version and validity dates |
| Maintenance notification | `API_MAINTNOTIFICATION` (OData V2/V4 per release) | `sap.s4.beh.maintenancenotification.*` | Maintenance work requests / service request REST | ServiceNow request, Maximo SR | Create/update/cancel through the native object only |
| Maintenance order + operations | `API_MAINTENANCEORDER` (OData; header, operations, components) | `sap.s4.beh.maintenanceorder.*` | `maintenanceWorkOrders` REST | Maximo `mxapiwodetail` | Never fake by writing custom tables |
| Operation confirmation | Maintenance Order Confirmation API (`API_MAINTORDERCONFIRMATION`) | confirmation events where released | Fusion Maintenance completion/transaction REST | CMMS completion API | Posted corrections only via cancel-confirmation flow |
| Time entry | Workforce Timesheet `API_MANAGE_WORKFORCE_TIMESHEET` (public cloud); CATS via released APIs/IDoc wrappers (private, ADR) | n/a | HCM `timeRecordEventRequests` / time REST | ADP/UKG/WFM API | Payroll/finance controls mandatory |
| Purchase requisition | `API_PURCHASEREQ_PROCESS_SRV` (V2) / PurchaseRequisition OData V4 successor where available | `sap.s4.beh.purchaserequisition.*` | `purchaseRequisitions` REST; FBDI Requisition Import for volume | Ariba/Coupa API | Approval and budget checks mandatory |
| Purchase order | `API_PURCHASEORDER_PROCESS_SRV` (V2) / `API_PURCHASEORDER` (OData V4 — prefer V4 for new builds) | `sap.s4.beh.purchaseorder.released.v1` etc. | `purchaseOrders` REST (max ~500 records/POST); FBDI for open-PO conversion | Supplier network API | No direct line update where workflow-controlled |
| Goods movement | Material Documents `API_MATERIAL_DOCUMENT_SRV`; BAPI_GOODSMVT_CREATE only Private Edition behind approved wrapper (ADR) | material document events | Inventory `inventoryStagedTransactions` REST | WMS API | Inventory postings require idempotency keys |
| Service entry | Service Entry Sheet APIs (`API_SERVICE_ENTRY_SHEET_SRV` lean services) | SES events where released | Receiving/service procurement REST | Supplier portal API | Match to PO/service contract |
| GL journal | Journal Entry Post (SOAP `JournalEntryCreateRequestConfirmation_In`); reads via `API_JOURNALENTRYITEMBASIC_SRV` / released CDS | journal entry events where released | ERP Integration Service + `journals` REST/FBDI JournalImport | Finance middleware | Fallback only when operational posting unavailable |
| Cost center / WBS / Project | Cost Center `API_COSTCENTER_SRV`; Project/WBS via Enterprise Project APIs (`API_ENTERPRISE_PROJECT_SRV`); CDS reads | project events where released | PPM `projects` / Financials REST | PPM API | Master updates need finance governance |
| Business partner / Supplier | `API_BUSINESS_PARTNER` (OData); MDI (Master Data Integration) for landscape-wide sync | `sap.s4.beh.businesspartner.{created,changed}.v1` | `suppliers` REST; FBDI Supplier Import | MDM API | Master data lifecycle controls; prefer MDI for replication |
| Material / Product | `API_PRODUCT_SRV` (OData) | `sap.s4.beh.product.created.v1` etc. | `itemsV2` REST / FBDI Item Import | PIM/MDM | Classification and plant views governed |
| Warehouse task | EWM Warehouse Order/Task APIs (`API_WAREHOUSE_ORDER`, `API_WHSE_*`) | EWM events where released | WMS `pickWaves`/inventory REST | Blue Yonder/Manhattan API | Execution status read-back required |
| Permit / WCM | WCM released APIs/views only; else keep permit master in EHS/PTW system | n/a | EHS/permit REST if applicable | HSE/PTW system API | AI cannot approve permits — blocked action class |
| Attachment / Document | Attachments API (`API_CV_ATTACHMENT_SRV`) / DMS | n/a | Fusion attachments REST (per resource) | OpenText/SharePoint Graph API | Preserve revision and access control |

## Integration-layer rules (both ERPs)

| Concern | SAP primary | Oracle backup |
|---|---|---|
| Integration platform | SAP Integration Suite (Cloud Integration iFlows, API Management, Open Connectors); Edge Integration Cell for in-landscape/hybrid runtime | Oracle Integration Cloud (OIC Gen3) — adapters, orchestration, error handling, monitoring |
| Eventing | Integration Suite advanced event mesh (AEM); S/4 Business Event Handling → CloudEvents | Fusion business events consumed through OIC |
| Connectivity | BTP Destination service; SAP Cloud Connector for Private/on-prem | OIC connectivity agent for on-prem endpoints |
| High-volume batch | CPI batch iFlows; released SOAP/OData with paging | FBDI via UCM upload + import job + status read-back; Data Extraction (26A+) for outbound bulk |
| API discovery | SAP Business Accelerator Hub (`hub.sap.com`); Cloudification Repository for Private Edition gap checks | Oracle REST API docs (`docs.oracle.com/en/cloud/saas`); release readiness per quarterly update |
| Version risk | Follow released-API stability contract; check deprecations per release | Regression-test all mappings each quarterly update (26A/B/C/D); auth patches can break flows |
| Extension rule | Clean core: side-by-side on BTP, key-user/developer extensibility, released APIs only (public); ADR for anything below level B | PaaS extensions (OIC/VBCS) over customization; no direct DB writes |

## Public vs Private Edition deltas (SAP)

- **Public Edition (default rules)**: released OData/SOAP APIs and events
  only; communication scenarios/arrangements govern access; no custom RFC/BAPI
  calls; extensibility via key-user tools + BTP side-by-side.
- **Private Edition / on-prem (documented delta per row)**: larger surface
  (custom CDS, BAPIs/RFC via Cloud Connector) is *available* but every use
  below clean-core level B requires an ADR naming the upgrade risk, owner, and
  retirement plan. Target the released successor API when one exists.

## Row completion requirement

Every row added for a use case must also record: read/create/update/cancel/
reverse/delete support, status read-back method, attachment handling,
batch/event mode, simulator/sandbox/live behavior, auth (OAuth2 client
credentials / SAML bearer per scenario), rate limits, retry, DLQ, and
reconciliation query — per `prompts/04_native_integration_matrix.md`.
