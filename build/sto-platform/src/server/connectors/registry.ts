/**
 * Connector registry — object-specific native connectors (never one generic
 * SAP adapter). Families per KICKOFF_PROMPT sections 10, 24.3, 24.4.
 * API names are published SAP Business Accelerator Hub contracts; verify
 * activation per tenant before SANDBOX/LIVE promotion (see
 * docs/connectors/BTP_PROVISIONING_RUNBOOK.md).
 */

import type { ConnectorCapabilities, ConnectorRecord, SourceMode, SourceSystem, WritePolicy } from '../core/types';
import { nowIso } from '../core/ids';

const R = (v: Partial<ConnectorCapabilities>): ConnectorCapabilities => ({
  read: true, create: false, update: false, delete: false, cancel: false,
  reverse: false, confirm: false, approve: false, attach: false, ...v
});

interface Def {
  connectorId: string;
  label: string;
  sourceSystem: SourceSystem;
  sourceModule: string;
  apiServiceName: string;
  apiPath: string;
  sourceObject: string;
  keys: string[];
  capabilities: ConnectorCapabilities;
  writePolicy: WritePolicy;
  docPrefix: string;
  communicationScenario?: string;
  docsUrl?: string;
  readbackMethod?: string;
}

export const CONNECTOR_DEFS: Def[] = [
  {
    connectorId: 'sap-eam-notification', label: 'SAP EAM Maintenance Notification', sourceSystem: 'SAP_S4', sourceModule: 'EAM/PM',
    apiServiceName: 'API_MAINTNOTIFICATION', apiPath: '/sap/opu/odata4/sap/api_maintnotification/srvd_a2x/sap/maintenancenotification/0001',
    sourceObject: 'MaintenanceNotification', keys: ['MaintenanceNotification'],
    capabilities: R({ create: true, update: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '1000',
    docsUrl: 'https://api.sap.com/api/API_MAINTNOTIFICATION/overview'
  },
  {
    connectorId: 'sap-eam-order', label: 'SAP EAM Maintenance Order', sourceSystem: 'SAP_S4', sourceModule: 'EAM/PM',
    apiServiceName: 'API_MAINTENANCEORDER_0002', apiPath: '/sap/opu/odata4/sap/api_maintenanceorder/srvd_a2x/sap/maintenanceorder/0002',
    sourceObject: 'MaintenanceOrder', keys: ['MaintenanceOrder', 'MaintenanceOrderOperation'],
    capabilities: R({ create: true, update: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '4000',
    docsUrl: 'https://api.sap.com/api/API_MAINTENANCEORDER/overview'
  },
  {
    connectorId: 'sap-eam-confirmation', label: 'SAP PM Order Confirmation', sourceSystem: 'SAP_S4', sourceModule: 'EAM/PM',
    apiServiceName: 'API_MAINTORDERCONFIRMATION', apiPath: '/sap/opu/odata4/sap/api_maintorderconfirmation/srvd_a2x/sap/maintenanceorderconfirmation/0001',
    sourceObject: 'MaintOrderConfirmation', keys: ['MaintOrderConf', 'MaintOrderConfCntrValue'],
    capabilities: R({ create: true, cancel: true, reverse: true, confirm: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '9000',
    docsUrl: 'https://api.sap.com/api/API_MAINTORDERCONFIRMATION/overview'
  },
  {
    connectorId: 'sap-mm-reservation', label: 'SAP MM Reservation Document', sourceSystem: 'SAP_S4', sourceModule: 'MM/IM',
    apiServiceName: 'API_RESERVATION_DOCUMENT_SRV', apiPath: '/sap/opu/odata/sap/API_RESERVATION_DOCUMENT_SRV',
    sourceObject: 'ReservationDocument', keys: ['Reservation', 'ReservationItem'],
    capabilities: R({ create: true, update: true, cancel: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '0002',
    docsUrl: 'https://api.sap.com/api/API_RESERVATION_DOCUMENT_SRV/overview'
  },
  {
    connectorId: 'sap-mm-pr', label: 'SAP MM Purchase Requisition', sourceSystem: 'SAP_S4', sourceModule: 'MM/Procurement',
    apiServiceName: 'API_PURCHASEREQUISITION_2', apiPath: '/sap/opu/odata4/sap/api_purchaserequisition_2/srvd_a2x/sap/purchaserequisition/0001',
    sourceObject: 'PurchaseRequisition', keys: ['PurchaseRequisition', 'PurchaseRequisitionItem'],
    capabilities: R({ create: true, update: true, cancel: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '10',
    docsUrl: 'https://api.sap.com/api/API_PURCHASEREQUISITION_2/overview'
  },
  {
    connectorId: 'sap-mm-po', label: 'SAP MM Purchase Order', sourceSystem: 'SAP_S4', sourceModule: 'MM/Procurement',
    apiServiceName: 'API_PURCHASEORDER_PROCESS_SRV', apiPath: '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
    sourceObject: 'PurchaseOrder', keys: ['PurchaseOrder', 'PurchaseOrderItem'],
    capabilities: R({}), writePolicy: 'READ_ONLY', docPrefix: '45',
    docsUrl: 'https://api.sap.com/api/API_PURCHASEORDER_PROCESS_SRV/overview'
  },
  {
    connectorId: 'sap-mm-matdoc', label: 'SAP MM Material Document (GI/GR)', sourceSystem: 'SAP_S4', sourceModule: 'MM/IM',
    apiServiceName: 'API_MATERIAL_DOCUMENT_SRV', apiPath: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV',
    sourceObject: 'MaterialDocument', keys: ['MaterialDocument', 'MaterialDocumentYear'],
    capabilities: R({ create: true, reverse: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '49',
    docsUrl: 'https://api.sap.com/api/API_MATERIAL_DOCUMENT_SRV/overview'
  },
  {
    connectorId: 'sap-ses', label: 'SAP Service Entry Sheet', sourceSystem: 'SAP_S4', sourceModule: 'MM/Services',
    apiServiceName: 'API_SERVICE_ENTRY_SHEET_SRV', apiPath: '/sap/opu/odata4/sap/api_service_entry_sheet/srvd_a2x/sap/serviceentrysheet/0001',
    sourceObject: 'ServiceEntrySheet', keys: ['ServiceEntrySheet'],
    capabilities: R({ create: true, update: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '105',
    docsUrl: 'https://api.sap.com/api/API_SERVICE_ENTRY_SHEET_SRV/overview'
  },
  {
    connectorId: 'sap-cats', label: 'SAP Workforce Timesheet (CATS)', sourceSystem: 'SAP_S4', sourceModule: 'HCM/CATS',
    apiServiceName: 'API_MANAGE_WORKFORCE_TIMESHEET', apiPath: '/sap/opu/odata/sap/API_MANAGE_WORKFORCE_TIMESHEET',
    sourceObject: 'WorkforceTimesheet', keys: ['TimeSheetRecord'], communicationScenario: 'SAP_COM_0027',
    capabilities: R({ create: true, update: true, reverse: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'TS',
    docsUrl: 'https://api.sap.com/api/API_MANAGE_WORKFORCE_TIMESHEET/overview'
  },
  {
    connectorId: 'sap-fico-journal', label: 'SAP FI/CO Journal Entry (Accruals)', sourceSystem: 'SAP_S4', sourceModule: 'FI/CO',
    apiServiceName: 'JOURNALENTRYCREATEREQUEST', apiPath: '/sap/bc/srt/scs_ext/sap/journalentrycreaterequest_in',
    sourceObject: 'JournalEntry', keys: ['AccountingDocument', 'FiscalYear'],
    capabilities: R({ create: true, reverse: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: '19',
    docsUrl: 'https://api.sap.com/api/JOURNALENTRYCREATEREQUEST/overview'
  },
  {
    connectorId: 'sap-wcm', label: 'SAP WCM / Permit / Isolation', sourceSystem: 'SAP_WCM', sourceModule: 'WCM/EHS',
    apiServiceName: 'WCM_INTEGRATION_SUITE_WRAPPER', apiPath: '/iflow/wcm/permit-readmodel/v1',
    sourceObject: 'WorkClearanceDocument', keys: ['PermitId'],
    capabilities: R({}), writePolicy: 'FAIL_CLOSED', docPrefix: 'WCM',
    docsUrl: 'https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE (WCM)'
  },
  {
    connectorId: 'sap-dms', label: 'SAP DMS Attachments', sourceSystem: 'SAP_DMS', sourceModule: 'DMS',
    apiServiceName: 'API_CV_ATTACHMENT_SRV', apiPath: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV',
    sourceObject: 'DocumentInfoRecord', keys: ['DocumentInfoRecordDocNumber'],
    capabilities: R({ create: true, attach: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'DOC',
    docsUrl: 'https://api.sap.com/api/API_CV_ATTACHMENT_SRV/overview'
  },
  {
    connectorId: 'sap-apm', label: 'SAP APM Recommendations', sourceSystem: 'SAP_APM', sourceModule: 'APM',
    apiServiceName: 'APM_RECOMMENDATION_READ', apiPath: '/apm/api/v1/recommendations',
    sourceObject: 'APMRecommendation', keys: ['RecommendationId'],
    capabilities: R({}), writePolicy: 'READ_ONLY', docPrefix: 'APM'
  },
  {
    connectorId: 'sap-bdc-datasphere', label: 'SAP BDC / Datasphere Read Models', sourceSystem: 'SAP_BDC', sourceModule: 'Datasphere',
    apiServiceName: 'DATASPHERE_DATA_PRODUCT', apiPath: '/datasphere/consumption/relational',
    sourceObject: 'DataProduct', keys: ['DataProductId'],
    capabilities: R({}), writePolicy: 'READ_ONLY', docPrefix: 'DP'
  },
  {
    connectorId: 'sap-mdg', label: 'SAP MDG Change Request', sourceSystem: 'SAP_MDG', sourceModule: 'MDG',
    apiServiceName: 'MDG_CHANGE_REQUEST', apiPath: '/sap/opu/odata/sap/MDG_CR_SRV',
    sourceObject: 'MDGChangeRequest', keys: ['ChangeRequestId'],
    capabilities: R({ create: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'CR'
  },
  {
    connectorId: 'sap-fieldglass', label: 'SAP Fieldglass Contractors', sourceSystem: 'SAP_FIELDGLASS', sourceModule: 'Fieldglass',
    apiServiceName: 'FIELDGLASS_CONNECTOR_API', apiPath: '/fieldglass/api/v1',
    sourceObject: 'WorkOrderSOW', keys: ['SOWId'],
    capabilities: R({ create: true }), writePolicy: 'STAGE_ONLY', docPrefix: 'FG'
  },
  {
    connectorId: 'p6-schedule', label: 'Primavera P6 EPPM', sourceSystem: 'P6', sourceModule: 'Schedule',
    apiServiceName: 'P6_EPPM_REST', apiPath: '/p6ws/restapi/activity',
    sourceObject: 'Activity', keys: ['ObjectId'],
    capabilities: R({ update: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'P6'
  },
  {
    connectorId: 'eptw', label: 'ePTW Permit System', sourceSystem: 'EPTW', sourceModule: 'Permits',
    apiServiceName: 'EPTW_REST', apiPath: '/eptw/api/v2/permits',
    sourceObject: 'Permit', keys: ['PermitNo'],
    capabilities: R({}), writePolicy: 'FAIL_CLOSED', docPrefix: 'PTW'
  },
  {
    connectorId: 'historian-pi', label: 'AVEVA PI / Historian', sourceSystem: 'HISTORIAN_PI', sourceModule: 'OT/Condition',
    apiServiceName: 'PI_WEB_API', apiPath: '/piwebapi/streams',
    sourceObject: 'PIPoint', keys: ['WebId'],
    capabilities: R({}), writePolicy: 'READ_ONLY', docPrefix: 'PI'
  },
  {
    connectorId: 'rtls-muster', label: 'RTLS / Muster', sourceSystem: 'RTLS', sourceModule: 'Location',
    apiServiceName: 'RTLS_EVENTS', apiPath: '/rtls/api/v1/presence',
    sourceObject: 'WorkerPresence', keys: ['ZoneId'],
    capabilities: R({}), writePolicy: 'READ_ONLY', docPrefix: 'RT'
  },
  {
    connectorId: 'payroll-gateway', label: 'Payroll Gateway (ECP/ADP/UKG)', sourceSystem: 'PAYROLL', sourceModule: 'Payroll',
    apiServiceName: 'PAYROLL_BATCH_EXPORT', apiPath: '/payroll/api/v1/batches',
    sourceObject: 'PayrollBatch', keys: ['BatchId'],
    capabilities: R({ create: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'PRB'
  },
  {
    connectorId: 'powerplan', label: 'PowerPlan Capitalization', sourceSystem: 'POWERPLAN', sourceModule: 'Capital Accounting',
    apiServiceName: 'POWERPLAN_API', apiPath: '/powerplan/api/workorders',
    sourceObject: 'PowerPlanWorkOrder', keys: ['WorkOrderId'],
    capabilities: R({ create: true, update: true }), writePolicy: 'APPROVAL_REQUIRED', docPrefix: 'PP'
  },
  {
    connectorId: 'servicenow', label: 'ServiceNow Incidents', sourceSystem: 'SERVICENOW', sourceModule: 'ITSM',
    apiServiceName: 'SN_TABLE_API', apiPath: '/api/now/table/incident',
    sourceObject: 'Incident', keys: ['sys_id'],
    capabilities: R({ create: true, update: true }), writePolicy: 'DIRECT_POST_ALLOWED', docPrefix: 'INC'
  }
];

export function buildConnectorRecords(tenantId: string): ConnectorRecord[] {
  const mode: SourceMode = 'SIMULATOR';
  return CONNECTOR_DEFS.map((d) => ({
    connectorId: d.connectorId,
    tenantId,
    label: d.label,
    sourceSystem: d.sourceSystem,
    sourceModule: d.sourceModule,
    sourceMode: mode,
    enabled: true,
    logicalDestination: `DEST_${d.connectorId.toUpperCase().replace(/-/g, '_')}`,
    authMode: d.sourceSystem.startsWith('SAP') ? 'OAuth2 / XSUAA principal propagation via BTP Destination' : 'OAuth2 client credentials',
    communicationScenario: d.communicationScenario,
    apiServiceName: d.apiServiceName,
    apiVersion: '1.0',
    apiPath: d.apiPath,
    sourceObject: d.sourceObject,
    sourceObjectKeys: d.keys,
    capabilities: d.capabilities,
    writePolicy: d.writePolicy,
    mappingProfile: `${d.connectorId}-map`,
    mappingVersion: 'v2.1.0',
    payloadSchemaVersion: '2024.2',
    idempotencyKeyPattern: '{tenantId}:{actionId}:{businessKeyHash}',
    correlationIdPattern: 'corr-{uuid}',
    csrfPolicy: d.sourceSystem === 'SAP_S4' ? 'fetch X-CSRF-Token before state-changing call' : 'n/a',
    etagPolicy: d.sourceSystem === 'SAP_S4' ? 'If-Match required on update' : 'n/a',
    readbackMethod: d.readbackMethod ?? `GET by ${d.keys[0]}`,
    reconciliationKey: d.keys[0],
    retryPolicy: { maxAttempts: 3, backoffMs: 500 },
    dlqPolicy: 'route to DLQ after maxAttempts; replay requires integration_operator role + reason',
    replayPolicy: 'production replay requires tenant_admin approval',
    ownerRole: 'integration_operator',
    dataSteward: 'data_steward',
    lastMetadataRefresh: nowIso(),
    lastSyncAt: nowIso(),
    certificationStatus: 'SIMULATOR_CERTIFIED',
    docsUrl: d.docsUrl
  }));
}

export const DOC_PREFIX: Record<string, string> = Object.fromEntries(
  CONNECTOR_DEFS.map((d) => [d.connectorId, d.docPrefix])
);
