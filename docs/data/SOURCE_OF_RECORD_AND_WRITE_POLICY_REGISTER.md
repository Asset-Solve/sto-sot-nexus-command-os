# Source-of-Record and Write Policy Register

Machine-readable source of truth: `build/sto-platform/src/server/connectors/registry.ts` (connector records) and `src/server/core/postingPath.ts` (decision engine). This register summarizes ownership and the only permitted write paths.

| Object family | System of record | Platform stance | Write path | Policy |
| --- | --- | --- | --- | --- |
| Maintenance notification | SAP S/4 EAM | proxy/mirror | `API_MAINTNOTIFICATION` create/update after approval | APPROVAL_REQUIRED |
| Maintenance order / operation | SAP S/4 EAM | proxy | `API_MAINTENANCEORDER_0002` governed update | APPROVAL_REQUIRED |
| Order confirmation | SAP S/4 EAM | proxy | `API_MAINTORDERCONFIRMATION` create/cancel/correct | APPROVAL_REQUIRED |
| Reservation | SAP S/4 MM | proxy | `API_RESERVATION_DOCUMENT_SRV` | APPROVAL_REQUIRED |
| Purchase requisition | SAP S/4 MM | proxy | `API_PURCHASEREQUISITION_2` | APPROVAL_REQUIRED |
| Purchase order | SAP S/4 MM | mirror | read-only from platform | READ_ONLY |
| Goods movement | SAP S/4 IM | proxy | `API_MATERIAL_DOCUMENT_SRV` (261/262 etc.) | APPROVAL_REQUIRED |
| Service entry sheet | SAP S/4 MM-SRV | proxy | `API_SERVICE_ENTRY_SHEET_SRV` | APPROVAL_REQUIRED |
| Timesheet (CATS) | SAP S/4 / CATS | proxy | `API_MANAGE_WORKFORCE_TIMESHEET` (SAP_COM_0027) | APPROVAL_REQUIRED |
| Journal entry / accrual | SAP S/4 FI/CO | proxy | Journal Entry Create (async) after finance approval | APPROVAL_REQUIRED |
| WCM permit / isolation / LOTO | SAP WCM / ePTW | read model | **none — fail closed**; correction requests routed to WCM authority | FAIL_CLOSED |
| Historian / condition signals | PI / IP21 / OPC UA | read model | none | READ_ONLY |
| RTLS / muster | RTLS vendor | read model (identity masked) | none | READ_ONLY |
| APM recommendations | SAP APM | mirror | scope intake only (governed) | READ_ONLY |
| BDC / Datasphere / CDS / SLT / HANA views | SAP BDC | read models, AI grounding | **never a write target** | READ_ONLY |
| Master data (material, BP, BOM…) | SAP S/4 + MDG | mirror | MDG change request only | APPROVAL_REQUIRED (via MDG) |
| Schedule activities / baseline | Primavera P6 | mirror | approved delta via P6 EPPM REST after human rebaseline approval | APPROVAL_REQUIRED |
| Contractor SOW / roster | Fieldglass / portal | mirror | staged packages | STAGE_ONLY |
| Payroll batch | Payroll gateway | platform-assembled | approved batch export + readback | APPROVAL_REQUIRED |
| Capitalization | PowerPlan | proxy | approved lines | APPROVAL_REQUIRED |
| Incidents | ServiceNow | proxy | direct post allowed (non-regulated) | DIRECT_POST_ALLOWED |
| Scope, work packages, gates, punch, lessons, readiness, claims, forecasts | **STO platform** | owner | local controlled write with workflow + audit | APPROVAL_REQUIRED (controlled) |

Rules enforced in code (`decidePostingPath`): AI actor + controlled action → review package only; FAIL_CLOSED targets refuse writes; disabled connectors stage writes server-side with a visible "not posted" state; objects without a released write API stage with an ADR requirement. Every field on every object carries `sourceSystem`, `sourceMode`, `sourceObject`, `sourceReference`, `sourceFreshness` (section 9 envelope).
