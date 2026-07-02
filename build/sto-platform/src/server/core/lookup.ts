/**
 * Connector-backed lookup service (section 11).
 * Every dropdown in the UI calls /api/lookups/[category] — never a hard-coded
 * list. Responses always carry full source metadata + posting eligibility and
 * support dependent filtering (plant -> units, order -> operations, worker ->
 * defaults, pay code -> wage type, ...).
 */

import type { BusinessObject, LookupItem } from './types';
import { listObjects, type Db } from './store';

function toItem(o: BusinessObject, labelField = 'name', extra?: (o: BusinessObject) => Partial<LookupItem>): LookupItem {
  const connectorAllows = o.sourceSystem === 'STO_PLATFORM' || !['SAP_WCM', 'EPTW', 'HISTORIAN_PI', 'RTLS', 'SAP_BDC', 'SAP_APM'].includes(o.sourceSystem);
  return {
    id: o.id,
    code: o.sourceReference,
    label: (o.data[labelField] as string) ?? (o.data['desc'] as string) ?? (o.data['title'] as string) ?? o.id,
    description: (o.data['desc'] as string) ?? (o.data['description'] as string),
    status: o.lifecycleState,
    sourceSystem: o.sourceSystem,
    sourceMode: o.sourceMode,
    sourceObject: o.sourceObject,
    sourceReference: o.sourceReference,
    validFrom: o.data['effectiveFrom'] as string | undefined,
    validTo: o.data['effectiveTo'] as string | undefined,
    metadata: o.data,
    postingAllowed: connectorAllows && o.lifecycleState !== 'closed',
    lastSyncAt: o.sourceFreshness,
    provider: `lookup:${o.objectType}`,
    isLive: o.sourceMode === 'LIVE',
    freshness: Date.now() - Date.parse(o.sourceFreshness) < 30 * 60 * 1000 ? 'FRESH' : 'STALE'
  };
}

type Provider = (db: Db, tenantId: string, params: Record<string, string>) => LookupItem[];

const byPlant = (params: Record<string, string>) => (o: BusinessObject) =>
  !params['plantId'] || o.data['plantId'] === params['plantId'];

export const LOOKUP_PROVIDERS: Record<string, Provider> = {
  tenants: (db, tenantId) => [{
    id: tenantId, code: tenantId, label: tenantId === 't1' ? 'NorthStar Energy' : tenantId, status: 'active',
    sourceSystem: 'STO_PLATFORM', sourceMode: 'SIMULATOR', sourceObject: 'Tenant', sourceReference: tenantId,
    postingAllowed: true, lastSyncAt: new Date().toISOString(), provider: 'lookup:Tenant', isLive: false
  }],
  plants: (db, t, p) => listObjects(db, t, 'Plant').map((o) => toItem(o)),
  units: (db, t, p) => listObjects(db, t, 'Unit', byPlant(p)).map((o) => toItem(o)),
  workCenters: (db, t, p) => listObjects(db, t, 'WorkCenter', byPlant(p)).map((o) => toItem(o)),
  events: (db, t) => listObjects(db, t, 'TurnaroundEvent').map((o) => toItem(o)),
  equipment: (db, t, p) => listObjects(db, t, 'EquipmentMirror', (o) => byPlant(p)(o) && (!p['unitId'] || o.data['unitId'] === p['unitId'])).map((o) => toItem(o)),
  notifications: (db, t, p) => listObjects(db, t, 'MaintenanceNotificationProxy', byPlant(p)).map((o) => toItem(o, 'desc')),
  orders: (db, t, p) => listObjects(db, t, 'MaintenanceOrderProxy', byPlant(p)).map((o) => toItem(o, 'desc')),
  operations: (db, t, p) =>
    listObjects(db, t, 'MaintenanceOperationProxy', (o) => !p['orderId'] || o.data['orderId'] === p['orderId']).map((o) => toItem(o, 'desc')),
  materials: (db, t, p) => listObjects(db, t, 'MaterialMirror', byPlant(p)).map((o) => toItem(o, 'desc')),
  storageLocations: (db, t, p) => listObjects(db, t, 'StorageLocation', byPlant(p)).map((o) => toItem(o)),
  wbsElements: (db, t) => listObjects(db, t, 'WbsProxy').map((o) => toItem(o, 'desc')),
  networkActivities: (db, t, p) =>
    listObjects(db, t, 'NetworkActivityProxy', (o) => !p['wbsId'] || o.data['wbsId'] === p['wbsId']).map((o) => toItem(o, 'desc')),
  costCenters: (db, t) => listObjects(db, t, 'CostCenterProxy').map((o) => toItem(o, 'desc')),
  costObjects: (db, t, p) => [
    ...listObjects(db, t, 'MaintenanceOperationProxy', (o) => !p['orderId'] || o.data['orderId'] === p['orderId']).map((o) => toItem(o, 'desc')),
    ...listObjects(db, t, 'WbsProxy').map((o) => toItem(o, 'desc')),
    ...listObjects(db, t, 'CostCenterProxy').map((o) => toItem(o, 'desc'))
  ],
  workers: (db, t, p) =>
    listObjects(db, t, 'Worker', (o) => {
      if (p['crewId'] && o.data['crewId'] !== p['crewId']) return false;
      if (p['workDate']) {
        const d = p['workDate'];
        if ((o.data['effectiveFrom'] as string) > d || (o.data['effectiveTo'] as string) < d) return false;
      }
      return true;
    }).map((o) => toItem(o)),
  crews: (db, t) => listObjects(db, t, 'Crew').map((o) => toItem(o)),
  payCodes: (db, t) => listObjects(db, t, 'PayCode').map((o) => toItem(o)),
  activityTypes: (db, t) => listObjects(db, t, 'ActivityType').map((o) => toItem(o)),
  payPeriods: (db, t) => listObjects(db, t, 'PayPeriod').map((o) => toItem(o, 'id')),
  vendors: (db, t) => listObjects(db, t, 'BusinessPartnerMirror').map((o) => toItem(o)),
  workPackages: (db, t, p) =>
    listObjects(db, t, 'WorkPackage', (o) => !p['eventId'] || o.data['eventId'] === p['eventId']).map((o) => toItem(o, 'title')),
  scheduleActivities: (db, t, p) =>
    listObjects(db, t, 'ScheduleActivityMirror', (o) => !p['eventId'] || o.data['eventId'] === p['eventId']).map((o) => toItem(o)),
  permits: (db, t, p) =>
    listObjects(db, t, 'PermitProxy', (o) => !p['workPackageId'] || o.data['wpId'] === p['workPackageId']).map((o) => toItem(o, 'type')),
  scopeCandidates: (db, t, p) =>
    listObjects(db, t, 'ScopeCandidate', (o) => !p['eventId'] || o.data['eventId'] === p['eventId']).map((o) => toItem(o, 'title')),
  connectors: (db, t) =>
    [...db.connectors.values()].filter((c) => c.tenantId === t).map((c) => ({
      id: c.connectorId, code: c.apiServiceName, label: c.label, description: c.sourceModule,
      status: c.enabled ? 'enabled' : 'disabled', sourceSystem: c.sourceSystem, sourceMode: c.sourceMode,
      sourceObject: c.sourceObject, sourceReference: c.apiServiceName,
      postingAllowed: c.enabled && (c.writePolicy === 'APPROVAL_REQUIRED' || c.writePolicy === 'DIRECT_POST_ALLOWED'),
      lastSyncAt: c.lastSyncAt, provider: 'lookup:Connector', isLive: c.sourceMode === 'LIVE',
      metadata: { writePolicy: c.writePolicy, certification: c.certificationStatus }
    })),
  dataProducts: (db, t) => listObjects(db, t, 'DataProduct').map((o) => toItem(o))
};

export function runLookup(db: Db, tenantId: string, category: string, params: Record<string, string>): { items: LookupItem[]; category: string } | null {
  const provider = LOOKUP_PROVIDERS[category];
  if (!provider) return null;
  let items = provider(db, tenantId, params);
  const q = params['q']?.toLowerCase();
  if (q) items = items.filter((i) => i.label.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  return { items: items.slice(0, 50), category };
}
