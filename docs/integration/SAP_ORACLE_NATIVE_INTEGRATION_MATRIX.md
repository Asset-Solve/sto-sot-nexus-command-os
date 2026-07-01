# SAP / Oracle Native Integration Matrix Starter

| Domain object | SAP preferred method | Oracle preferred method | Non-SAP fallback | Notes |
|---|---|---|---|---|
| Equipment / Asset | SAP S/4 EAM released API/OData via BTP Destination and Cloud Connector | Oracle Maintenance Asset REST if Oracle SCM/Maintenance is target | Maximo/ServiceNow/CMMS API | Read-first; master changes need governance |
| Functional location / Asset hierarchy | S/4 EAM hierarchy APIs/CDS for read | Oracle asset hierarchy REST | ESRI/Maximo hierarchy API | Preserve hierarchy version and validity |
| Maintenance notification | S/4 Maintenance Notification API | Oracle Maintenance REST/service request where applicable | ServiceNow/Maximo work request | Create/update/cancel through native object |
| Maintenance order | S/4 Maintenance Order API/OData | Oracle Maintenance Work Order REST | Maximo work order API | Do not fake by updating custom tables |
| Operation confirmation | S/4 Operation Confirmation / confirmation API | Oracle Maintenance completion REST | CMMS completion API | Posted corrections must be reversal/correction flow |
| Time entry | SAP CATS/Workforce Timesheet API | Oracle HCM time REST | ADP/UKG/WFS API | Payroll/finance controls mandatory |
| Purchase requisition | S/4 Purchase Requisition API | Oracle Procurement requisition REST | Ariba/Procurement API | Approval and budget checks mandatory |
| Purchase order | S/4 PO API | Oracle Procurement PO REST | Ariba/supplier network | Avoid direct line update if workflow-controlled |
| Goods movement | S/4 Goods Movement API/BAPI wrapper if required | Oracle Inventory transaction REST | WMS API | Inventory postings need idempotency |
| Service entry | S/4 Service Entry Sheet API | Oracle receiving/service procurement REST | Supplier portal API | Match PO/service contract |
| GL journal | S/4 Journal Entry API | Oracle Financials journal REST | Finance middleware | Fallback only when operational posting not available |
| Cost center / WBS | S/4 Finance/Project APIs, CDS reads | Oracle Project/Financials REST | PPM API | Master data updates require finance governance |
| Business partner / Supplier | SAP Business Partner API | Oracle Supplier REST | Supplier MDM API | Master data lifecycle controls |
| Warehouse task | SAP EWM APIs | Oracle WMS/Inventory REST | WMS API | Execution status read-back needed |
| Permit / WCM | SAP WCM/S/4 approved APIs/views | Oracle EHS/Permit if applicable | HSE/PTW system API | AI cannot approve permits |
| Attachment | SAP DMS/attachment service | Oracle document attachment REST | OpenText/SharePoint API | Preserve revision and access control |
