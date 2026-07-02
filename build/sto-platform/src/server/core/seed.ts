/**
 * Simulator seed — realistic multi-event STO dataset. All events source from
 * read models / API shape, never UI state. Every object carries the full
 * source-of-record envelope (section 9).
 */

import type { BusinessObject, RiskClass, SourceMode, SourceSystem, User } from './types';
import { getDb, putObject, type Db } from './store';
import { buildConnectorRecords } from '../connectors/registry';
import { nowIso } from './ids';

const T1 = 't1';
const T2 = 't2';

let seq = 0;
function bo(
  db: Db,
  tenantId: string,
  objectType: string,
  id: string,
  sourceSystem: SourceSystem,
  sourceObject: string,
  sourceReference: string,
  lifecycleState: string,
  owner: string,
  data: Record<string, unknown>,
  opts?: { riskClass?: RiskClass; approvalState?: string; sourceMode?: SourceMode }
): BusinessObject {
  seq += 1;
  const now = nowIso();
  return putObject(db, {
    id,
    tenantId,
    objectType,
    sourceSystem,
    sourceMode: opts?.sourceMode ?? 'SIMULATOR',
    sourceObject,
    sourceReference,
    lifecycleState,
    approvalState: opts?.approvalState ?? 'NOT_REQUIRED',
    riskClass: opts?.riskClass ?? 'MEDIUM',
    owner,
    sourceFreshness: now,
    createdBy: 'seed',
    createdAt: now,
    updatedBy: 'seed',
    updatedAt: now,
    data
  });
}

export function ensureSeeded(): Db {
  const db = getDb();
  if (db.seeded) return db;
  db.seeded = true;

  // ---------------- connectors ----------------
  for (const c of buildConnectorRecords(T1)) db.connectors.set(c.connectorId, c);

  // ---------------- users (personas, ABAC scopes) ----------------
  const users: User[] = [
    { id: 'u-exec', tenantId: T1, name: 'Elena Vargas', role: 'executive_viewer', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u-sto', tenantId: T1, name: 'Marcus Cole', role: 'sto_manager', scopes: { plants: ['P100'], units: [], companyCodes: ['1000'] } },
    { id: 'u-outage', tenantId: T1, name: 'Priya Nair', role: 'outage_manager', scopes: { plants: ['P100'], units: [], companyCodes: ['1000'] } },
    { id: 'u-ops', tenantId: T1, name: 'Sam Okafor', role: 'operations_startup_authority', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-scope', tenantId: T1, name: 'Dana Reeve', role: 'scope_board_member', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-planner', tenantId: T1, name: 'Leo Tran', role: 'maintenance_planner', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-sched', tenantId: T1, name: 'Ana Kovac', role: 'scheduler_project_controls', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-wpo', tenantId: T1, name: 'Ravi Patel', role: 'work_package_owner', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-super', tenantId: T1, name: 'Kate Brody', role: 'maintenance_supervisor', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-tech', tenantId: T1, name: 'Jon Silva', role: 'field_technician', scopes: { plants: ['P100'], units: ['U-CDU'], companyCodes: [] } },
    { id: 'u-crew', tenantId: T1, name: 'Maria Diaz', role: 'crew_supervisor', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-time', tenantId: T1, name: 'Ted Moss', role: 'timekeeper', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-payroll', tenantId: T1, name: 'Ida Lund', role: 'payroll_user', scopes: { plants: [], units: [], companyCodes: ['1000'] } },
    { id: 'u-fin', tenantId: T1, name: 'Omar Haddad', role: 'finance_cost_controller', scopes: { plants: [], units: [], companyCodes: ['1000'] } },
    { id: 'u-proc', tenantId: T1, name: 'Nina Petrova', role: 'procurement_user', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-matl', tenantId: T1, name: 'Gus Weber', role: 'material_planner', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-wh', tenantId: T1, name: 'Rosa Kim', role: 'warehouse_lead', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-contr', tenantId: T1, name: 'Bill Hayes', role: 'contractor_coordinator', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-hse', tenantId: T1, name: 'Freya Olsen', role: 'hse_safety_reviewer', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-wcm', tenantId: T1, name: 'Karl Jensen', role: 'wcm_authority', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-qa', tenantId: T1, name: 'Mei Chen', role: 'qa_qc_inspector', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-turn', tenantId: T1, name: 'Paul Ionescu', role: 'turnover_coordinator', scopes: { plants: ['P100'], units: [], companyCodes: [] } },
    { id: 'u-steward', tenantId: T1, name: 'Aya Sato', role: 'data_steward', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u-intops', tenantId: T1, name: 'Igor Volkov', role: 'integration_operator', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u-aiops', tenantId: T1, name: 'Zoe Adams', role: 'ai_platform_owner', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u-admin', tenantId: T1, name: 'Tenant Admin', role: 'tenant_admin', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u-audit', tenantId: T1, name: 'Grace Aud', role: 'auditor', scopes: { plants: [], units: [], companyCodes: [] } },
    { id: 'u2-admin', tenantId: T2, name: 'Other Tenant Admin', role: 'tenant_admin', scopes: { plants: [], units: [], companyCodes: [] } }
  ];
  for (const u of users) db.users.set(u.id, u);

  // ---------------- master data (SAP-owned mirrors) ----------------
  const plants = [
    { id: 'P100', name: 'Refinery Alpha', companyCode: '1000' },
    { id: 'P200', name: 'Gas Plant Beta', companyCode: '1000' }
  ];
  for (const p of plants) bo(db, T1, 'Plant', p.id, 'SAP_S4', 'Plant', p.id, 'active', 'u-admin', { name: p.name, companyCode: p.companyCode });

  const units = [
    { id: 'U-CDU', plantId: 'P100', name: 'Crude Distillation Unit' },
    { id: 'U-FCC', plantId: 'P100', name: 'Fluid Catalytic Cracker' },
    { id: 'U-HDS', plantId: 'P100', name: 'Hydrodesulfurization Unit' },
    { id: 'U-GBA', plantId: 'P200', name: 'Gas Train A' }
  ];
  for (const u of units) bo(db, T1, 'Unit', u.id, 'SAP_S4', 'FunctionalLocation', `FL-${u.id}`, 'active', 'u-admin', { name: u.name, plantId: u.plantId });

  const workCenters = [
    { id: 'WC-MECH', plantId: 'P100', name: 'Mechanical Crew' },
    { id: 'WC-WELD', plantId: 'P100', name: 'Welding Crew' },
    { id: 'WC-ELEC', plantId: 'P100', name: 'Electrical Crew' },
    { id: 'WC-SCAF', plantId: 'P100', name: 'Scaffolding' }
  ];
  for (const w of workCenters) bo(db, T1, 'WorkCenter', w.id, 'SAP_S4', 'WorkCenter', w.id, 'active', 'u-admin', { name: w.name, plantId: w.plantId });

  const equipment = [
    { id: 'EQ-10001', name: 'Crude Column C-101', unitId: 'U-CDU', plantId: 'P100', floc: 'P100-CDU-C101' },
    { id: 'EQ-10002', name: 'Heat Exchanger E-104A', unitId: 'U-CDU', plantId: 'P100', floc: 'P100-CDU-E104A' },
    { id: 'EQ-10003', name: 'Furnace F-101', unitId: 'U-CDU', plantId: 'P100', floc: 'P100-CDU-F101' },
    { id: 'EQ-20001', name: 'FCC Regenerator R-201', unitId: 'U-FCC', plantId: 'P100', floc: 'P100-FCC-R201' },
    { id: 'EQ-20002', name: 'Slide Valve SV-202', unitId: 'U-FCC', plantId: 'P100', floc: 'P100-FCC-SV202' }
  ];
  for (const e of equipment) bo(db, T1, 'EquipmentMirror', e.id, 'SAP_S4', 'Equipment', e.id, 'active', 'u-planner', { ...e });

  const materials = [
    { id: 'MAT-4711', desc: 'Gasket, spiral wound, 24in CL300', uom: 'EA', plantId: 'P100', sloc: 'SL01', stock: 42, price: 118.5 },
    { id: 'MAT-4712', desc: 'Tube bundle E-104A spare', uom: 'EA', plantId: 'P100', sloc: 'SL02', stock: 1, price: 84500 },
    { id: 'MAT-4713', desc: 'Refractory castable 25kg', uom: 'BAG', plantId: 'P100', sloc: 'SL01', stock: 320, price: 62 },
    { id: 'MAT-4714', desc: 'Stud bolt set B7 1-1/8in', uom: 'SET', plantId: 'P100', sloc: 'SL01', stock: 0, price: 210 },
    { id: 'MAT-4715', desc: 'Slide valve actuator seal kit', uom: 'KIT', plantId: 'P100', sloc: 'SL02', stock: 2, price: 5400 }
  ];
  for (const m of materials) bo(db, T1, 'MaterialMirror', m.id, 'SAP_S4', 'Product', m.id, 'active', 'u-matl', { ...m });

  for (const s of [{ id: 'SL01', name: 'Central Warehouse' }, { id: 'SL02', name: 'TA Laydown Yard' }]) {
    bo(db, T1, 'StorageLocation', s.id, 'SAP_S4', 'StorageLocation', s.id, 'active', 'u-wh', { name: s.name, plantId: 'P100' });
  }

  const wbs = [
    { id: 'WBS-TA26-01', desc: 'CDU TA 2026 - Mechanical', companyCode: '1000' },
    { id: 'WBS-TA26-02', desc: 'CDU TA 2026 - Exchangers', companyCode: '1000' },
    { id: 'WBS-TA26-03', desc: 'CDU TA 2026 - Capital Tie-ins', companyCode: '1000' }
  ];
  for (const w of wbs) bo(db, T1, 'WbsProxy', w.id, 'SAP_S4', 'WBSElement', w.id, 'released', 'u-fin', { ...w });
  for (const n of [
    { id: 'NWA-5001', wbsId: 'WBS-TA26-01', desc: 'Column internals replacement' },
    { id: 'NWA-5002', wbsId: 'WBS-TA26-02', desc: 'Bundle pull and retube' },
    { id: 'NWA-5003', wbsId: 'WBS-TA26-03', desc: 'New tie-in welds' }
  ]) bo(db, T1, 'NetworkActivityProxy', n.id, 'SAP_S4', 'NetworkActivity', n.id, 'released', 'u-fin', { ...n });

  for (const c of [
    { id: 'CC-3100', desc: 'Maintenance Ops P100' },
    { id: 'CC-3200', desc: 'Turnaround Org' }
  ]) bo(db, T1, 'CostCenterProxy', c.id, 'SAP_S4', 'CostCenter', c.id, 'active', 'u-fin', { ...c, companyCode: '1000' });

  // workers with effective-dated defaults (hydration source)
  const workers = [
    { id: 'W-1001', name: 'Jon Silva', craft: 'Boilermaker', supervisorId: 'W-1003', payGroup: 'PG-UNION-A', rateClass: 'RC-BM-J', homeCostCenter: 'CC-3100', crewId: 'CREW-M1' },
    { id: 'W-1002', name: 'Ava Brooks', craft: 'Pipefitter', supervisorId: 'W-1003', payGroup: 'PG-UNION-A', rateClass: 'RC-PF-J', homeCostCenter: 'CC-3100', crewId: 'CREW-M1' },
    { id: 'W-1003', name: 'Maria Diaz', craft: 'Supervisor', supervisorId: 'W-1004', payGroup: 'PG-STAFF', rateClass: 'RC-SUP', homeCostCenter: 'CC-3200', crewId: 'CREW-M1' },
    { id: 'W-1004', name: 'Kate Brody', craft: 'GF', supervisorId: '', payGroup: 'PG-STAFF', rateClass: 'RC-GF', homeCostCenter: 'CC-3200', crewId: '' },
    { id: 'W-2001', name: 'Cntr: Dev Kumar (MechCo)', craft: 'Welder', supervisorId: 'W-1003', payGroup: 'PG-CONTR', rateClass: 'RC-WELD-C', homeCostCenter: 'CC-3100', crewId: 'CREW-C1', contractor: 'MechCo' }
  ];
  for (const w of workers) bo(db, T1, 'Worker', w.id, 'SAP_S4', 'WorkforcePerson', w.id, 'active', 'u-time', { ...w, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' });
  for (const c of [{ id: 'CREW-M1', name: 'Mech Crew 1' }, { id: 'CREW-C1', name: 'MechCo Weld Crew' }]) {
    bo(db, T1, 'Crew', c.id, 'STO_PLATFORM', 'Crew', c.id, 'active', 'u-crew', { ...c });
  }
  const payCodes = [
    { id: 'PC-REG', name: 'Regular', wageType: 'WT-1000' },
    { id: 'PC-OT15', name: 'Overtime 1.5x', wageType: 'WT-1300' },
    { id: 'PC-OT20', name: 'Overtime 2.0x', wageType: 'WT-1400' },
    { id: 'PC-NSH', name: 'Night shift premium', wageType: 'WT-1500' }
  ];
  for (const p of payCodes) bo(db, T1, 'PayCode', p.id, 'PAYROLL', 'PayCode', p.id, 'active', 'u-payroll', { ...p });
  for (const a of [{ id: 'AT-MECH', name: 'Mechanical hour' }, { id: 'AT-WELD', name: 'Welding hour' }]) {
    bo(db, T1, 'ActivityType', a.id, 'SAP_S4', 'ActivityType', a.id, 'active', 'u-fin', { ...a });
  }
  bo(db, T1, 'PayPeriod', 'PP-2026-14', 'PAYROLL', 'PayPeriod', 'PP-2026-14', 'open', 'u-payroll', { start: '2026-06-29', end: '2026-07-12', status: 'OPEN' });

  for (const v of [
    { id: 'V-9001', name: 'MechCo Industrial Services' },
    { id: 'V-9002', name: 'ScaffPro Ltd' },
    { id: 'V-9003', name: 'CatalystCare Inc' }
  ]) bo(db, T1, 'BusinessPartnerMirror', v.id, 'SAP_S4', 'BusinessPartner', v.id, 'active', 'u-proc', { ...v });

  // ---------------- events ----------------
  bo(db, T1, 'TurnaroundEvent', 'EV-1001', 'STO_PLATFORM', 'TurnaroundEvent', 'EV-1001', 'execution', 'u-sto', {
    name: 'CDU Turnaround 2026', plantId: 'P100', unitId: 'U-CDU', outageType: 'Major Turnaround',
    start: '2026-06-15', end: '2026-07-20', phase: 'EXECUTION', dayOf: 17, totalDays: 36,
    wbsId: 'WBS-TA26-01', companyCode: '1000', budgetMUSD: 48.5, forecastMUSD: 50.1,
    progressPct: 46.3, planPct: 51.0, scheduleVarianceDays: 1.8, safetyTRIR: 0.42,
    integrationProfile: 'SAP_S4+P6+WCM+PI', riskClass: 'HIGH', sourceModeProfile: 'SIMULATOR'
  }, { riskClass: 'HIGH' });
  bo(db, T1, 'TurnaroundEvent', 'EV-1002', 'STO_PLATFORM', 'TurnaroundEvent', 'EV-1002', 'planning', 'u-outage', {
    name: 'FCC Outage 2027', plantId: 'P100', unitId: 'U-FCC', outageType: 'Planned Outage',
    start: '2027-03-10', end: '2027-04-05', phase: 'SCOPE_DEVELOPMENT', dayOf: 0, totalDays: 26,
    wbsId: 'WBS-TA26-03', companyCode: '1000', budgetMUSD: 22.0, forecastMUSD: 21.4,
    progressPct: 0, planPct: 0, scheduleVarianceDays: 0, safetyTRIR: 0,
    integrationProfile: 'SAP_S4+P6+WCM', riskClass: 'MEDIUM', sourceModeProfile: 'SIMULATOR'
  });

  for (const gname of [
    { id: 'GATE-EV1-FREEZE', name: 'Scope Freeze', status: 'PASSED', due: '2026-02-01' },
    { id: 'GATE-EV1-READY', name: 'Execution Readiness', status: 'PASSED', due: '2026-06-01' },
    { id: 'GATE-EV1-STARTUP', name: 'Startup / RTS Gate', status: 'PENDING', due: '2026-07-15' }
  ]) bo(db, T1, 'ReadinessGate', gname.id, 'STO_PLATFORM', 'ReadinessGate', gname.id, gname.status.toLowerCase(), 'u-sto', { ...gname, eventId: 'EV-1001' }, { riskClass: 'HIGH' });

  // ---------------- SAP proxies: notifications / orders / operations ----------------
  const notifs = [
    { id: 'NOTIF-10000201', desc: 'C-101 tray 12-18 corrosion found in IRIS scan', equipmentId: 'EQ-10001', priority: '1-High' },
    { id: 'NOTIF-10000202', desc: 'E-104A tube leak confirmed, retube required', equipmentId: 'EQ-10002', priority: '1-High' },
    { id: 'NOTIF-10000203', desc: 'F-101 refractory hot spot east wall', equipmentId: 'EQ-10003', priority: '2-Medium' }
  ];
  for (const n of notifs) bo(db, T1, 'MaintenanceNotificationProxy', n.id, 'SAP_S4', 'MaintenanceNotification', n.id.replace('NOTIF-', ''), 'released', 'u-planner', { ...n, plantId: 'P100', unitId: 'U-CDU' });

  const orders = [
    { id: 'ORD-4000101', desc: 'C-101 internals replacement', notifId: 'NOTIF-10000201', wbsId: 'WBS-TA26-01', status: 'REL' },
    { id: 'ORD-4000102', desc: 'E-104A bundle pull & retube', notifId: 'NOTIF-10000202', wbsId: 'WBS-TA26-02', status: 'REL' },
    { id: 'ORD-4000103', desc: 'F-101 refractory repair', notifId: 'NOTIF-10000203', wbsId: 'WBS-TA26-01', status: 'CRTD' }
  ];
  for (const o of orders) bo(db, T1, 'MaintenanceOrderProxy', o.id, 'SAP_S4', 'MaintenanceOrder', o.id.replace('ORD-', ''), o.status === 'REL' ? 'released' : 'created', 'u-planner', { ...o, plantId: 'P100', unitId: 'U-CDU' });

  const operations = [
    { id: 'OP-4000101-0010', orderId: 'ORD-4000101', desc: 'Erect scaffold & open manways', workCenterId: 'WC-SCAF', hours: 120, status: 'CNF' },
    { id: 'OP-4000101-0020', orderId: 'ORD-4000101', desc: 'Remove trays 12-18', workCenterId: 'WC-MECH', hours: 260, status: 'PCNF' },
    { id: 'OP-4000101-0030', orderId: 'ORD-4000101', desc: 'Install new trays & torque', workCenterId: 'WC-MECH', hours: 300, status: 'REL' },
    { id: 'OP-4000102-0010', orderId: 'ORD-4000102', desc: 'Pull E-104A bundle', workCenterId: 'WC-MECH', hours: 90, status: 'CNF' },
    { id: 'OP-4000102-0020', orderId: 'ORD-4000102', desc: 'Retube & hydrotest', workCenterId: 'WC-WELD', hours: 400, status: 'REL' },
    { id: 'OP-4000103-0010', orderId: 'ORD-4000103', desc: 'Demolish damaged refractory', workCenterId: 'WC-MECH', hours: 150, status: 'REL' }
  ];
  for (const op of operations) bo(db, T1, 'MaintenanceOperationProxy', op.id, 'SAP_S4', 'MaintenanceOrderOperation', op.id, 'released', 'u-planner', { ...op, plantId: 'P100' });

  // ---------------- scope ----------------
  const scope = [
    { id: 'SC-001', title: 'Replace C-101 trays 12-18', source: 'SAP_NOTIFICATION', ref: 'NOTIF-10000201', state: 'approved', est: 1.8, risk: 'HIGH' },
    { id: 'SC-002', title: 'E-104A full retube', source: 'INSPECTION', ref: 'INSP-2214', state: 'approved', est: 2.4, risk: 'HIGH' },
    { id: 'SC-003', title: 'F-101 refractory partial reline', source: 'APM_RECOMMENDATION', ref: 'APM-REC-88', state: 'challenged', est: 0.9, risk: 'MEDIUM' },
    { id: 'SC-004', title: 'SV-202 actuator overhaul', source: 'OPERATOR_LOG', ref: 'OPLOG-3311', state: 'submitted', est: 0.3, risk: 'HIGH' },
    { id: 'SC-005', title: 'Paint north pipe rack', source: 'MANUAL', ref: 'REQ-101', state: 'rejected', est: 0.2, risk: 'LOW', reason: 'Not outage-dependent; defer to routine maintenance.' },
    { id: 'SC-006', title: 'C-101 overhead line UT survey (duplicate of SC-001 scope?)', source: 'MANUAL', ref: 'REQ-102', state: 'submitted', est: 0.15, risk: 'LOW' }
  ];
  for (const s of scope) bo(db, T1, 'ScopeCandidate', s.id, 'STO_PLATFORM', 'ScopeCandidate', s.id, s.state, 'u-scope', {
    title: s.title, sourceType: s.source, sourceRef: s.ref, estimateMUSD: s.est, eventId: 'EV-1001',
    plantId: 'P100', unitId: 'U-CDU', rejectReason: s.reason, notificationId: s.source === 'SAP_NOTIFICATION' ? s.ref : undefined
  }, { riskClass: s.risk as RiskClass });
  bo(db, T1, 'EmergentWorkRequest', 'EWR-001', 'STO_PLATFORM', 'EmergentWorkRequest', 'EWR-001', 'pending_approval', 'u-super', {
    title: 'Crack found at C-101 nozzle N7 weld during tray removal', eventId: 'EV-1001', plantId: 'P100', unitId: 'U-CDU',
    scheduleImpactDays: 2.5, costImpactMUSD: 0.45, riskNote: 'Critical path impact via OP-4000101-0030'
  }, { riskClass: 'HIGH', approvalState: 'PENDING' });
  bo(db, T1, 'APMRecommendationMirror', 'APM-REC-88', 'SAP_APM', 'Recommendation', 'APM-REC-88', 'open', 'u-planner', {
    title: 'F-101 refractory degradation trend', equipmentId: 'EQ-10003', healthScore: 62, confidence: 0.84
  });
  bo(db, T1, 'InspectionFinding', 'INSP-2214', 'STO_PLATFORM', 'InspectionFinding', 'INSP-2214', 'closed', 'u-qa', {
    title: 'E-104A IRIS: 23% wall loss on 118 tubes', equipmentId: 'EQ-10002', method: 'IRIS'
  });

  // ---------------- work packages ----------------
  const wps = [
    {
      id: 'WP-1001', title: 'C-101 Tray Replacement Package', orderId: 'ORD-4000101', state: 'released',
      readiness: { labor: true, materials: true, services: true, permits: true, schedule: true, tools: true, risk: true, qa: true, documents: true }
    },
    {
      id: 'WP-1002', title: 'E-104A Retube Package', orderId: 'ORD-4000102', state: 'in_development',
      readiness: { labor: true, materials: false, services: true, permits: false, schedule: true, tools: true, risk: true, qa: false, documents: true }
    },
    {
      id: 'WP-1003', title: 'F-101 Refractory Package', orderId: 'ORD-4000103', state: 'in_development',
      readiness: { labor: false, materials: false, services: false, permits: false, schedule: false, tools: false, risk: false, qa: false, documents: false }
    }
  ];
  for (const w of wps) bo(db, T1, 'WorkPackage', w.id, 'STO_PLATFORM', 'WorkPackage', w.id, w.state, 'u-wpo', {
    title: w.title, orderId: w.orderId, eventId: 'EV-1001', plantId: 'P100', unitId: 'U-CDU', readiness: w.readiness,
    p6ActivityId: w.id === 'WP-1001' ? 'P6-A1010' : w.id === 'WP-1002' ? 'P6-A1020' : 'P6-A1030'
  }, { riskClass: 'HIGH' });

  // ---------------- schedule ----------------
  const acts = [
    { id: 'P6-A1010', name: 'C-101 tray replacement', start: '2026-06-18', finish: '2026-07-08', pct: 55, critical: true, float: 0 },
    { id: 'P6-A1020', name: 'E-104A retube', start: '2026-06-20', finish: '2026-07-12', pct: 38, critical: true, float: 0.5 },
    { id: 'P6-A1030', name: 'F-101 refractory', start: '2026-06-25', finish: '2026-07-10', pct: 12, critical: false, float: 3 },
    { id: 'P6-A1040', name: 'SV-202 overhaul', start: '2026-07-01', finish: '2026-07-09', pct: 0, critical: false, float: 4 }
  ];
  for (const a of acts) bo(db, T1, 'ScheduleActivityMirror', a.id, 'P6', 'Activity', a.id, 'in_progress', 'u-sched', { ...a, eventId: 'EV-1001', baselineId: 'BL-2026-02' });
  bo(db, T1, 'Constraint', 'CON-001', 'STO_PLATFORM', 'Constraint', 'CON-001', 'open', 'u-sched', {
    title: 'Stud bolts MAT-4714 zero stock — blocks tray torque-up', type: 'MATERIAL', eventId: 'EV-1001',
    activityId: 'P6-A1010', criticalPath: true, needBy: '2026-07-03'
  }, { riskClass: 'HIGH' });
  bo(db, T1, 'Constraint', 'CON-002', 'STO_PLATFORM', 'Constraint', 'CON-002', 'open', 'u-sched', {
    title: 'Crane availability conflict 7/4-7/5 between WP-1001 and WP-1002', type: 'EQUIPMENT', eventId: 'EV-1001',
    activityId: 'P6-A1020', criticalPath: true, needBy: '2026-07-04'
  }, { riskClass: 'MEDIUM' });

  // ---------------- materials ----------------
  const demands = [
    { id: 'MD-001', materialId: 'MAT-4711', wpId: 'WP-1001', orderId: 'ORD-4000101', qty: 24, state: 'issued', needBy: '2026-06-25' },
    { id: 'MD-002', materialId: 'MAT-4714', wpId: 'WP-1001', orderId: 'ORD-4000101', qty: 6, state: 'shortage', needBy: '2026-07-03' },
    { id: 'MD-003', materialId: 'MAT-4712', wpId: 'WP-1002', orderId: 'ORD-4000102', qty: 1, state: 'reserved', needBy: '2026-07-01', reservation: '0002100244' },
    { id: 'MD-004', materialId: 'MAT-4713', wpId: 'WP-1003', orderId: 'ORD-4000103', qty: 80, state: 'requested', needBy: '2026-06-28' },
    { id: 'MD-005', materialId: 'MAT-4715', wpId: 'WP-1003', orderId: 'ORD-4000103', qty: 1, state: 'draft', needBy: '2026-07-05' }
  ];
  for (const d of demands) bo(db, T1, 'MaterialDemand', d.id, 'STO_PLATFORM', 'MaterialDemand', d.id, d.state, 'u-matl', {
    ...d, plantId: 'P100', eventId: 'EV-1001', storageLocation: 'SL01'
  }, { riskClass: d.state === 'shortage' ? 'HIGH' : 'MEDIUM' });
  bo(db, T1, 'ExpeditingCase', 'EXP-001', 'STO_PLATFORM', 'ExpeditingCase', 'EXP-001', 'open', 'u-proc', {
    demandId: 'MD-002', vendorId: 'V-9001', promiseDate: '2026-07-02', note: 'Air freight from Houston DC', eventId: 'EV-1001'
  }, { riskClass: 'HIGH' });

  // ---------------- permits / safety (WCM-owned, read-only) ----------------
  const permits = [
    { id: 'PTW-88101', type: 'Hot Work', wpId: 'WP-1001', state: 'active', expires: '2026-07-02T18:00:00Z' },
    { id: 'PTW-88102', type: 'Confined Space', wpId: 'WP-1001', state: 'active', expires: '2026-07-02T18:00:00Z' },
    { id: 'PTW-88103', type: 'Hot Work', wpId: 'WP-1002', state: 'suspended', expires: '2026-07-01T18:00:00Z', note: 'Gas test expired' },
    { id: 'PTW-88104', type: 'General Work', wpId: 'WP-1003', state: 'requested', expires: '' }
  ];
  for (const p of permits) bo(db, T1, 'PermitProxy', p.id, 'SAP_WCM', 'WorkClearanceDocument', p.id, p.state, 'u-wcm', {
    ...p, eventId: 'EV-1001', plantId: 'P100', unitId: 'U-CDU'
  }, { riskClass: 'SAFETY_CRITICAL' });
  bo(db, T1, 'IsolationCertificateProxy', 'ISO-7701', 'SAP_WCM', 'IsolationCertificate', 'ISO-7701', 'established', 'u-wcm', {
    description: 'C-101 full isolation: blinds 14/14 set, LOTO 22 points', wpId: 'WP-1001', eventId: 'EV-1001', plantId: 'P100'
  }, { riskClass: 'SAFETY_CRITICAL' });
  bo(db, T1, 'SIMOPSConflict', 'SIM-001', 'STO_PLATFORM', 'SIMOPSConflict', 'SIM-001', 'open', 'u-hse', {
    title: 'Hot work PTW-88101 within 15m of catalyst unloading (CatalystCare)', area: 'CDU-North', eventId: 'EV-1001',
    plantId: 'P100', unitId: 'U-CDU', severity: 'HIGH'
  }, { riskClass: 'SAFETY_CRITICAL' });
  const areas = [
    { id: 'AR-CDU-N', area: 'CDU North', score: 82, workers: 46, permits: 8, drivers: ['SIMOPS conflict', 'Hot work density', 'Critical path work'] },
    { id: 'AR-CDU-S', area: 'CDU South', score: 44, workers: 21, permits: 4, drivers: ['Confined space entries'] },
    { id: 'AR-FCC', area: 'FCC', score: 18, workers: 6, permits: 1, drivers: ['Routine only'] }
  ];
  for (const a of areas) bo(db, T1, 'AreaRisk', a.id, 'STO_PLATFORM', 'AreaRisk', a.id, 'computed', 'u-hse', { ...a, eventId: 'EV-1001', plantId: 'P100' }, { riskClass: a.score > 70 ? 'SAFETY_CRITICAL' : 'MEDIUM' });

  // ---------------- contractors ----------------
  bo(db, T1, 'ContractorRoster', 'CR-MECHCO', 'SAP_FIELDGLASS', 'WorkOrderSOW', 'FG-SOW-441', 'mobilized', 'u-contr', {
    vendorId: 'V-9001', vendor: 'MechCo Industrial Services', headcount: 85, badged: 82, sowValueMUSD: 12.4,
    burnedMUSD: 6.1, earnedMUSD: 5.6, leakagePct: 8.2, eventId: 'EV-1001', plantId: 'P100'
  }, { riskClass: 'FINANCE_CRITICAL' });
  bo(db, T1, 'ContractorRoster', 'CR-SCAFF', 'SAP_FIELDGLASS', 'WorkOrderSOW', 'FG-SOW-442', 'mobilized', 'u-contr', {
    vendorId: 'V-9002', vendor: 'ScaffPro Ltd', headcount: 30, badged: 30, sowValueMUSD: 2.1,
    burnedMUSD: 1.2, earnedMUSD: 1.25, leakagePct: -2.0, eventId: 'EV-1001', plantId: 'P100'
  });
  bo(db, T1, 'CommercialClaim', 'CLM-001', 'STO_PLATFORM', 'CommercialClaim', 'CLM-001', 'pending_approval', 'u-contr', {
    vendorId: 'V-9001', title: 'Standby claim: permit delay 6/28 (4 crews x 6h)', amountUSD: 38400, eventId: 'EV-1001', plantId: 'P100'
  }, { riskClass: 'FINANCE_CRITICAL', approvalState: 'PENDING' });

  // ---------------- execution / labor ----------------
  bo(db, T1, 'OperationExecution', 'EX-001', 'STO_PLATFORM', 'OperationExecution', 'EX-001', 'in_progress', 'u-super', {
    operationId: 'OP-4000101-0020', wpId: 'WP-1001', progressPct: 78, varianceReason: '', eventId: 'EV-1001', plantId: 'P100', unitId: 'U-CDU'
  });
  bo(db, T1, 'ShiftHandover', 'SH-0630-N', 'STO_PLATFORM', 'ShiftHandover', 'SH-0630-N', 'published', 'u-super', {
    shift: 'Night 06-30', highlights: 'Tray 14 landed; N7 crack found (EWR-001); PTW-88103 suspended pending gas test.', eventId: 'EV-1001', plantId: 'P100'
  });
  const labor = [
    { id: 'LE-001', workerId: 'W-1001', date: '2026-07-01', hours: 10, payCode: 'PC-REG', costObject: 'OP-4000101-0020', state: 'submitted' },
    { id: 'LE-002', workerId: 'W-1002', date: '2026-07-01', hours: 10, payCode: 'PC-REG', costObject: 'OP-4000101-0020', state: 'submitted' },
    { id: 'LE-003', workerId: 'W-1001', date: '2026-07-01', hours: 2, payCode: 'PC-OT15', costObject: 'OP-4000101-0020', state: 'submitted' },
    { id: 'LE-004', workerId: 'W-2001', date: '2026-07-01', hours: 12, payCode: 'PC-REG', costObject: 'OP-4000102-0010', state: 'approved', catsRef: 'TS100311' }
  ];
  for (const l of labor) bo(db, T1, 'LaborEntry', l.id, 'STO_PLATFORM', 'LaborEntry', l.id, l.state, 'u-time', {
    ...l, plantId: 'P100', eventId: 'EV-1001', payPeriod: 'PP-2026-14'
  }, { approvalState: l.state === 'submitted' ? 'PENDING' : 'NOT_REQUIRED' });

  // ---------------- cost ----------------
  bo(db, T1, 'BudgetEnvelope', 'BUD-EV1', 'STO_PLATFORM', 'BudgetEnvelope', 'BUD-EV1', 'approved', 'u-fin', {
    eventId: 'EV-1001', budgetMUSD: 48.5, contingencyMUSD: 4.8, releasedMUSD: 46.0, companyCode: '1000'
  }, { riskClass: 'FINANCE_CRITICAL' });
  bo(db, T1, 'CostForecast', 'CF-EV1-07', 'STO_PLATFORM', 'CostForecast', 'CF-EV1-07', 'current', 'u-fin', {
    eventId: 'EV-1001', period: '2026-07', forecastMUSD: 50.1, varianceMUSD: 1.6,
    drivers: ['EWR-001 emergent work +0.45', 'MAT-4714 expediting +0.08', 'MechCo standby claim +0.04'], companyCode: '1000'
  }, { riskClass: 'FINANCE_CRITICAL' });
  bo(db, T1, 'CommitmentMirror', 'CM-EV1', 'SAP_S4', 'Commitment', 'CM-EV1', 'current', 'u-fin', {
    eventId: 'EV-1001', openCommitmentsMUSD: 8.9, poCount: 141, companyCode: '1000', sourceNote: 'BDC/Datasphere cost read model — read only'
  }, { sourceMode: 'CACHE' });
  bo(db, T1, 'ActualCostMirror', 'AC-EV1', 'SAP_S4', 'ActualCost', 'AC-EV1', 'current', 'u-fin', {
    eventId: 'EV-1001', actualsMUSD: 27.3, lastExtraction: nowIso(), companyCode: '1000', sourceNote: 'ACDOCA read model via Datasphere — read only'
  }, { sourceMode: 'CACHE' });

  // ---------------- QA / turnover / startup ----------------
  const punches = [
    { id: 'PUNCH-101', title: 'Tray 15 manway gasket re-torque after 24h', sevClass: 'B', wpId: 'WP-1001', state: 'open' },
    { id: 'PUNCH-102', title: 'Missing PMI cert for N7 weld repair', sevClass: 'A', wpId: 'WP-1001', state: 'open' },
    { id: 'PUNCH-103', title: 'Paint touch-up E-104A saddle', sevClass: 'C', wpId: 'WP-1002', state: 'closed' }
  ];
  for (const p of punches) bo(db, T1, 'PunchItem', p.id, 'STO_PLATFORM', 'PunchItem', p.id, p.state, 'u-qa', { ...p, eventId: 'EV-1001', plantId: 'P100' }, { riskClass: p.sevClass === 'A' ? 'HIGH' : 'MEDIUM' });
  bo(db, T1, 'TestPack', 'TP-201', 'STO_PLATFORM', 'TestPack', 'TP-201', 'in_review', 'u-qa', {
    title: 'C-101 hydrotest pack', wpId: 'WP-1001', eventId: 'EV-1001', evidenceCount: 14, plantId: 'P100'
  });
  bo(db, T1, 'TurnoverPackage', 'TOP-301', 'STO_PLATFORM', 'TurnoverPackage', 'TOP-301', 'assembling', 'u-turn', {
    system: 'CDU Column System S-01', wpIds: ['WP-1001'], eventId: 'EV-1001', openPunchA: 1, openPunchB: 1, plantId: 'P100'
  }, { riskClass: 'HIGH' });
  bo(db, T1, 'StartupReadiness', 'SUR-EV1', 'STO_PLATFORM', 'StartupReadiness', 'SUR-EV1', 'blocked', 'u-ops', {
    eventId: 'EV-1001', blockers: ['PUNCH-102 (class A) open', 'PSSR checklist 82% complete', 'ISO-7701 restoration not started'],
    pssrPct: 82, plantId: 'P100', unitId: 'U-CDU'
  }, { riskClass: 'SAFETY_CRITICAL' });
  bo(db, T1, 'PSSRChecklist', 'PSSR-EV1', 'STO_PLATFORM', 'PSSRChecklist', 'PSSR-EV1', 'in_progress', 'u-ops', {
    eventId: 'EV-1001', items: 66, complete: 54, plantId: 'P100'
  }, { riskClass: 'SAFETY_CRITICAL' });

  // ---------------- lessons ----------------
  bo(db, T1, 'LessonLearned', 'LL-001', 'STO_PLATFORM', 'LessonLearned', 'LL-001', 'draft', 'u-sto', {
    title: 'Stud bolt min-max levels wrong for TA demand profile', category: 'MATERIALS', eventId: 'EV-1001',
    rootCause: 'MRP min-max based on routine demand, not TA surge', proposedAction: 'Create TA material planning norm; update MAT-4714 min-max before next event'
  });

  // ---------------- data foundation ----------------
  const dps = [
    { id: 'DP-COST', name: 'TA Cost Read Model (ACDOCA)', state: 'certified', steward: 'u-steward', refresh: 'hourly SLT' },
    { id: 'DP-SCHED', name: 'P6 Schedule Mirror', state: 'certified', steward: 'u-steward', refresh: '15min REST pull' },
    { id: 'DP-PERMIT', name: 'WCM Permit Read Model', state: 'stale', steward: 'u-steward', refresh: '5min iFlow', note: 'Last sync 42min ago — investigate iFlow backlog' }
  ];
  for (const d of dps) bo(db, T1, 'DataProduct', d.id, 'SAP_BDC', 'DataProduct', d.id, d.state, d.steward, { ...d, lineage: 'S/4 -> SLT -> Datasphere -> platform read API' }, { sourceMode: 'CACHE' });
  bo(db, T1, 'DataQualityIssue', 'DQ-001', 'STO_PLATFORM', 'DataQualityIssue', 'DQ-001', 'open', 'u-steward', {
    title: '118 order operations missing work center assignment', dataProduct: 'DP-COST', severity: 'MEDIUM'
  });

  // ---------------- integration incidents ----------------
  bo(db, T1, 'IntegrationIncident', 'II-001', 'STO_PLATFORM', 'IntegrationIncident', 'II-001', 'open', 'u-intops', {
    title: 'WCM read model sync latency > SLO (42min vs 5min)', connectorId: 'sap-wcm', severity: 'HIGH', servicenowRef: 'INC0048821'
  }, { riskClass: 'HIGH' });

  // ---------------- tenant 2 (isolation proof) ----------------
  bo(db, T2, 'TurnaroundEvent', 'EV-T2-1', 'STO_PLATFORM', 'TurnaroundEvent', 'EV-T2-1', 'planning', 'u2-admin', {
    name: 'Other Tenant Event', plantId: 'P900', unitId: 'U-X', outageType: 'Outage', start: '2027-01-01', end: '2027-02-01',
    budgetMUSD: 1, forecastMUSD: 1, progressPct: 0, planPct: 0, phase: 'PLANNING', dayOf: 0, totalDays: 31, scheduleVarianceDays: 0, safetyTRIR: 0
  });

  return db;
}
