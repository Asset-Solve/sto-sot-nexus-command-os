# SAP Native Actionability Map

This pass closes the dashboard-only gap by making SAP-owned rows actionable from the STO/SOT workbenches. The UI still runs in SIMULATOR mode locally, but each controlled trigger now uses the same domain action, payload preview, approval, outbox/read-back or staged-package contract that a SANDBOX/LIVE connector will use.

## Integration Rules

- Do not update SAP tables directly. Use released SAP APIs first; use BAPI/RFC/IDoc or Integration Suite wrappers only when a released API does not cover the object or tenant release.
- The UI never calls a connector directly. Screen row -> domain action -> validation -> posting-path decision -> approval/SoD -> outbox or staged package -> connector adapter -> read-back/reconciliation -> audit.
- WCM/ePTW safety authority remains fail-closed. The platform can request correction or preplanning packages, but it does not directly approve, close, or clear permits.
- SSAM/FSM/mobile dispatch is staged until tenant mobile connector certification is complete. The local state says "not posted" rather than pretending a live mobile sync occurred.

## Screen-To-Action Matrix

| Screen | User trigger | Source row | SAP/non-SAP target | Native-ready connector/API | What the payload does | Validation and governance |
|---|---|---|---|---|---|---|
| Scope Control Room | Create SAP Notification from Scope | ScopeCandidate | SAP S/4 Maintenance Notification | `sap-eam-notification` / `API_MAINTNOTIFICATION` | Creates notification text, technical object and priority | Scope must be selected; planner/scope/STO role; four-eyes approval |
| Scope Control Room | Create SAP Maintenance Order | ScopeCandidate | SAP S/4 Maintenance Order | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Creates/associates order type, plant, work center, dates, notification and WBS | Approved/associated scope; plant/work center/WBS/dates required; four-eyes approval |
| Work Package Studio | Add SAP Order Operation | MaintenanceOrderProxy | SAP S/4 Maintenance Order Operation | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Adds operation description, work center, control key and planned work | Planned work must be positive; planner/WPO/STO role; supervisor/STO approval |
| Work Package Studio | Add SAP Order Component | MaintenanceOperationProxy | SAP S/4 Maintenance Order Component | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Adds component material, quantity, plant, storage location and requirement date | Quantity positive; order/operation/material/plant/sloc required; four-eyes approval |
| Work Package Studio / Materials | Change SAP Order Component Qty | MaintenanceOrderComponentProxy | SAP S/4 Maintenance Order Component | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Changes component requirement quantity/date with reason | New quantity positive; reason required; supervisor/STO approval |
| Schedule & Constraints | Reschedule SAP Order | MaintenanceOrderProxy | SAP S/4 Maintenance Order | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Updates basic start/end dates after schedule-impact review | Start must be before finish; reason required; outage/STO approval |
| Work Package Studio | Change SAP Order Status | MaintenanceOrderProxy | SAP S/4 Maintenance Order | `sap-eam-order` / `API_MAINTENANCEORDER_0002` | Requests release, technical completion or business close | TECO/close blocked by open punch or active/suspended/expired permits; four-eyes approval |
| Work Package Studio | Attach Evidence to SAP Order | MaintenanceOrderProxy | SAP Attachment/DMS | `sap-dms` / `API_CV_ATTACHMENT_SRV` | Adds evidence reference/file metadata linked to maintenance order | File/evidence required; WPO/STO approval |
| Materials | Reserve Material (SAP) | MaterialDemand | SAP S/4 Reservation Document | `sap-mm-reservation` / `API_RESERVATION_DOCUMENT_SRV` | Creates reservation with material, plant, sloc, required date and receiver order | Receiver order mandatory; quantity positive; four-eyes approval |
| Materials | Change SAP Reservation Qty | ReservationProxy | SAP S/4 Reservation Document Item | `sap-mm-reservation` / `API_RESERVATION_DOCUMENT_SRV` | Updates reservation item quantity and requirement date | Reservation/item/material/new quantity/date/reason required; four-eyes approval |
| Materials | Issue Material | ReservationProxy | SAP S/4 Material Document | `sap-mm-matdoc` / `API_MATERIAL_DOCUMENT_SRV` | Posts goods issue movement 261 against reservation/order context | Reservation/material/quantity/plant required; warehouse submit, material/STO approval |
| Materials | Return Material | ReservationProxy | SAP S/4 Material Document | `sap-mm-matdoc` / `API_MATERIAL_DOCUMENT_SRV` | Posts goods return movement 262 for unused outage stock | Order/material/quantity/plant/sloc/reason required; four-eyes approval |
| Control of Work | Request Isolation / Permit Preplan | PermitRequirement or IsolationPlan | SAP WCM/ePTW preplan queue | `sap-wcm`/`eptw` via Integration Suite wrapper | Routes a work-package/order-linked preplan package to WCM authority | Work package or order anchor required; no direct permit status write; WCM approval |
| Execution Map | Dispatch Package to Mobile | WorkPackage | SAP Service and Asset Manager / FSM | `sap-ssam-mobile` or `sap-fsm-dispatch` | Stages released work package, crew, shift and note to mobile execution | Work package must be released; staged package until mobile connector is certified |

## SAP Interface Grounding

- Maintenance orders and operations/components use `API_MAINTENANCEORDER_0002` as the native-ready S/4 EAM order API. Tenant validation must confirm exact supported create/update entity sets and extension fields.
- Reservations use the Reservation Document API service, including create and update operations on reservation header/item resources.
- Goods issue/return uses the Material Document API, with movement 261 for issue and 262 for return in the STO maintenance-order context.
- Attachments use `API_CV_ATTACHMENT_SRV` so evidence is linked to the business object rather than stored only in the STO platform.
- WCM/ePTW remains source-controlled. The app creates a preplan/correction package for the WCM authority and blocks direct controlled permit status writes.

## Remaining Tenant Certification Items

- Confirm exact S/4 release/API entity names for operation/component updates, order status transitions and extension fields.
- Activate BTP destinations, XSUAA/principal propagation, CSRF and ETag policies per connector.
- Certify WCM/ePTW iFlow wrapper behavior for preplan package routing and read-back status.
- Certify SSAM/FSM dispatch payload shape, mobile-relevance filters and conflict handling.
- Replace simulator adapters with HTTP adapters without changing the UI contract.
