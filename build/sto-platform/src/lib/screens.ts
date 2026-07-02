/**
 * Screen contract configs (machine-readable slice of
 * docs/screens/SCREEN_CONTRACT_CATALOG.md). Each workbench declares its
 * object queues + governed actions; the Workbench framework renders them.
 */

import type { WorkbenchDef } from '@/components/Workbench';

export const SCREENS: Record<string, WorkbenchDef> = {
  portfolio: {
    title: 'Portfolio, Event Strategy & Premise',
    purpose: 'Event master, premise, economics, gates, WBS linkage and shutdown window approval. SAP PS/ePPM remains project source of record.',
    tabs: [
      { objectType: 'TurnaroundEvent', label: 'Outage Events', columns: [{ key: 'name', label: 'Name' }, { key: 'plantId', label: 'Plant' }, { key: 'unitId', label: 'Unit' }, { key: 'start', label: 'Start' }, { key: 'end', label: 'End' }, { key: 'budgetMUSD', label: 'Budget $M' }, { key: 'wbsId', label: 'WBS' }] },
      { objectType: 'ReadinessGate', label: 'Gates', columns: [{ key: 'name', label: 'Gate' }, { key: 'due', label: 'Due' }, { key: 'status', label: 'Status' }] },
      { objectType: 'BudgetEnvelope', label: 'Budget Envelopes', columns: [{ key: 'eventId', label: 'Event' }, { key: 'budgetMUSD', label: 'Budget $M' }, { key: 'contingencyMUSD', label: 'Contingency $M' }] }
    ],
    actionIds: ['event.create', 'premise.approve']
  },
  scope: {
    title: 'Scope Control Room',
    purpose: 'Ingest, dedupe, challenge, decide, freeze and govern late/emergent work. SAP notifications/orders via API_MAINTNOTIFICATION / API_MAINTENANCEORDER.',
    tabs: [
      { objectType: 'ScopeCandidate', label: 'Candidates', columns: [{ key: 'title', label: 'Title' }, { key: 'sourceType', label: 'Origin' }, { key: 'sourceRef', label: 'Ref' }, { key: 'estimateMUSD', label: 'Est $M' }, { key: 'notificationId', label: 'SAP Notif' }] },
      { objectType: 'EmergentWorkRequest', label: 'Emergent Work', columns: [{ key: 'title', label: 'Title' }, { key: 'scheduleImpactDays', label: 'Sched Δd' }, { key: 'costImpactMUSD', label: 'Cost Δ$M' }] },
      { objectType: 'MaintenanceNotificationProxy', label: 'SAP Notifications', columns: [{ key: 'desc', label: 'Description' }, { key: 'equipmentId', label: 'Equipment' }, { key: 'priority', label: 'Priority' }] },
      { objectType: 'APMRecommendationMirror', label: 'APM Recommendations', columns: [{ key: 'title', label: 'Title' }, { key: 'healthScore', label: 'Health' }, { key: 'confidence', label: 'Confidence' }] }
    ],
    actionIds: ['scope.submit', 'scope.decide', 'scope.freeze', 'scope.create_notification']
  },
  'work-packages': {
    title: 'Work Package Studio',
    purpose: 'Assemble Work Package 360 across operations, labor, materials, services, permits, QA, documents, schedule. Release fails closed on incomplete readiness.',
    tabs: [
      { objectType: 'WorkPackage', label: 'Work Packages', columns: [{ key: 'title', label: 'Title' }, { key: 'orderId', label: 'SAP Order' }, { key: 'p6ActivityId', label: 'P6 Activity' }, { key: 'readiness', label: 'Readiness' }] },
      { objectType: 'MaintenanceOrderProxy', label: 'SAP Orders', columns: [{ key: 'desc', label: 'Description' }, { key: 'notifId', label: 'Notification' }, { key: 'wbsId', label: 'WBS' }, { key: 'status', label: 'SAP Status' }] },
      { objectType: 'MaintenanceOperationProxy', label: 'Operations', columns: [{ key: 'orderId', label: 'Order' }, { key: 'desc', label: 'Description' }, { key: 'workCenterId', label: 'Work Center' }, { key: 'hours', label: 'Plan Hrs' }, { key: 'status', label: 'SAP Status' }] }
    ],
    actionIds: ['wp.validate', 'wp.release']
  },
  schedule: {
    title: 'Schedule & Constraints',
    purpose: 'P6 mirror, critical path, constraints, impact review and human-approved rebaseline (AI may propose recovery, never rebaseline).',
    tabs: [
      { objectType: 'ScheduleActivityMirror', label: 'P6 Activities', columns: [{ key: 'name', label: 'Activity' }, { key: 'start', label: 'Start' }, { key: 'finish', label: 'Finish' }, { key: 'pct', label: '%' }, { key: 'critical', label: 'Critical' }, { key: 'float', label: 'Float d' }] },
      { objectType: 'Constraint', label: 'Constraints', columns: [{ key: 'title', label: 'Constraint' }, { key: 'type', label: 'Type' }, { key: 'activityId', label: 'Activity' }, { key: 'needBy', label: 'Need by' }] }
    ],
    actionIds: ['constraint.create', 'schedule.rebaseline']
  },
  materials: {
    title: 'Materials, Kits, Tools & Logistics',
    purpose: 'Demand → reservation → PR/PO → staging → issue/return with shortage-to-critical-path linkage. SAP APIs: reservation, PR, material document.',
    tabs: [
      { objectType: 'MaterialDemand', label: 'Demands', columns: [{ key: 'materialId', label: 'Material' }, { key: 'wpId', label: 'Work Pkg' }, { key: 'qty', label: 'Qty' }, { key: 'needBy', label: 'Need by' }, { key: 'reservation', label: 'SAP Resvn' }] },
      { objectType: 'ReservationProxy', label: 'SAP Reservations', columns: [{ key: 'desc', label: 'Description' }, { key: 'materialId', label: 'Material' }, { key: 'quantity', label: 'Qty' }] },
      { objectType: 'MaterialMirror', label: 'Material Master', columns: [{ key: 'desc', label: 'Description' }, { key: 'stock', label: 'Stock' }, { key: 'uom', label: 'UoM' }, { key: 'sloc', label: 'SLoc' }] },
      { objectType: 'ExpeditingCase', label: 'Expediting', columns: [{ key: 'demandId', label: 'Demand' }, { key: 'vendorId', label: 'Vendor' }, { key: 'promiseDate', label: 'Promise' }, { key: 'note', label: 'Note' }] }
    ],
    actionIds: ['material.reserve', 'material.request_pr', 'material.issue']
  },
  permits: {
    title: 'WCM, Permits, Isolation & LOTO',
    purpose: 'Fail-closed safety visibility. WCM/ePTW is the source of record — this platform never writes permit state; it routes correction requests to the WCM authority.',
    tabs: [
      { objectType: 'PermitProxy', label: 'Permits', columns: [{ key: 'type', label: 'Type' }, { key: 'wpId', label: 'Work Pkg' }, { key: 'expires', label: 'Expires' }, { key: 'note', label: 'Note' }] },
      { objectType: 'IsolationCertificateProxy', label: 'Isolations', columns: [{ key: 'description', label: 'Description' }, { key: 'wpId', label: 'Work Pkg' }] },
      { objectType: 'SafetyReadinessException', label: 'Correction Requests', columns: [{ key: 'permitId', label: 'Permit' }, { key: 'reason', label: 'Reason' }] }
    ],
    actionIds: ['permit.request_correction', 'permit.update_status']
  },
  'area-risk': {
    title: 'Area Risk Map & SIMOPS',
    purpose: 'Area risk computed from SIMOPS, permits, work density, criticality. Worker identity masked; historian/OT read-only; no automated safety clearance.',
    tabs: [
      { objectType: 'AreaRisk', label: 'Area Risk', columns: [{ key: 'area', label: 'Area' }, { key: 'score', label: 'Score' }, { key: 'workers', label: 'Workers' }, { key: 'permits', label: 'Permits' }, { key: 'drivers', label: 'Drivers' }] },
      { objectType: 'SIMOPSConflict', label: 'SIMOPS Conflicts', columns: [{ key: 'title', label: 'Conflict' }, { key: 'area', label: 'Area' }, { key: 'severity', label: 'Severity' }, { key: 'mitigation', label: 'Mitigation' }] }
    ],
    actionIds: ['simops.assign_mitigation']
  },
  contractors: {
    title: 'Contractor & Commercial Control',
    purpose: 'Roster, burned-vs-earned, leakage, claims, SES readiness. Fieldglass/MM-SRV integration; finance-critical decisions carry four-eyes.',
    tabs: [
      { objectType: 'ContractorRoster', label: 'Contractors', columns: [{ key: 'vendor', label: 'Vendor' }, { key: 'headcount', label: 'HC' }, { key: 'badged', label: 'Badged' }, { key: 'burnedMUSD', label: 'Burned $M' }, { key: 'earnedMUSD', label: 'Earned $M' }, { key: 'leakagePct', label: 'Leakage %' }] },
      { objectType: 'CommercialClaim', label: 'Claims', columns: [{ key: 'title', label: 'Claim' }, { key: 'vendorId', label: 'Vendor' }, { key: 'amountUSD', label: 'Amount $' }] }
    ],
    actionIds: ['claim.decide', 'ses.prepare']
  },
  field: {
    title: 'Field Execution & Daily Control',
    purpose: 'Progress, confirmations, emergent work, handovers. Field start fails closed without released package + active WCM clearance.',
    tabs: [
      { objectType: 'OperationExecution', label: 'Active Operations', columns: [{ key: 'operationId', label: 'SAP Operation' }, { key: 'wpId', label: 'Work Pkg' }, { key: 'progressPct', label: 'Progress %' }] },
      { objectType: 'EmergentWorkRequest', label: 'Emergent Work', columns: [{ key: 'title', label: 'Title' }, { key: 'scheduleImpactDays', label: 'Sched Δd' }, { key: 'costImpactMUSD', label: 'Cost Δ$M' }] },
      { objectType: 'ShiftHandover', label: 'Shift Handover', columns: [{ key: 'shift', label: 'Shift' }, { key: 'highlights', label: 'Highlights' }] }
    ],
    actionIds: ['progress.submit', 'operation.confirm', 'emergent.raise']
  },
  'labor-time': {
    title: 'Time, Labor, CATS & Payroll',
    purpose: 'Time capture with effective-dated worker validation → CATS posting (SAP_COM_0027) → payroll release → finance accrual. Each target is its own governed object.',
    tabs: [
      { objectType: 'LaborEntry', label: 'Time Entries', columns: [{ key: 'workerId', label: 'Worker' }, { key: 'date', label: 'Date' }, { key: 'hours', label: 'Hours' }, { key: 'payCode', label: 'Pay Code' }, { key: 'costObject', label: 'Cost Object' }, { key: 'catsRef', label: 'CATS Ref' }] },
      { objectType: 'Worker', label: 'Workers', columns: [{ key: 'name', label: 'Name' }, { key: 'craft', label: 'Craft' }, { key: 'payGroup', label: 'Pay Group' }, { key: 'rateClass', label: 'Rate Class' }, { key: 'homeCostCenter', label: 'Home CC' }] },
      { objectType: 'PayPeriod', label: 'Pay Periods', columns: [{ key: 'start', label: 'Start' }, { key: 'end', label: 'End' }, { key: 'status', label: 'Status' }] }
    ],
    actionIds: ['labor.submit', 'labor.post_cats', 'payroll.release']
  },
  qa: {
    title: 'QA/QC, Punch & Turnover',
    purpose: 'ITPs, punch, test packs, turnover with evidence. Turnover fails closed on open class-A punch or missing inspection.',
    tabs: [
      { objectType: 'PunchItem', label: 'Punch List', columns: [{ key: 'title', label: 'Item' }, { key: 'sevClass', label: 'Class' }, { key: 'wpId', label: 'Work Pkg' }] },
      { objectType: 'TestPack', label: 'Test Packs', columns: [{ key: 'title', label: 'Pack' }, { key: 'wpId', label: 'Work Pkg' }, { key: 'evidenceCount', label: 'Evidence' }] },
      { objectType: 'TurnoverPackage', label: 'Turnover', columns: [{ key: 'system', label: 'System' }, { key: 'openPunchA', label: 'Open A' }, { key: 'openPunchB', label: 'Open B' }] }
    ],
    actionIds: ['punch.create', 'punch.close', 'turnover.approve']
  },
  'startup-readiness': {
    title: 'Startup, PSSR & Return to Service',
    purpose: 'RTS gate assembled from punch, QA, turnover, isolation restoration, PSSR. Human operations authority only — AI is structurally blocked.',
    tabs: [
      { objectType: 'StartupReadiness', label: 'RTS Gates', columns: [{ key: 'pssrPct', label: 'PSSR %' }, { key: 'blockers', label: 'Blockers' }] },
      { objectType: 'PSSRChecklist', label: 'PSSR Checklists', columns: [{ key: 'items', label: 'Items' }, { key: 'complete', label: 'Complete' }] }
    ],
    actionIds: ['startup.approve_rts']
  },
  cost: {
    title: 'Cost & Controls',
    purpose: 'Budget, forecast, commitments (Datasphere read models — read only), claims, accrual post/reverse via Journal Entry API with finance approval.',
    tabs: [
      { objectType: 'CostForecast', label: 'Forecast', columns: [{ key: 'period', label: 'Period' }, { key: 'forecastMUSD', label: 'Forecast $M' }, { key: 'varianceMUSD', label: 'Variance $M' }, { key: 'drivers', label: 'Drivers' }] },
      { objectType: 'CommitmentMirror', label: 'Commitments (read model)', columns: [{ key: 'openCommitmentsMUSD', label: 'Open $M' }, { key: 'poCount', label: 'POs' }, { key: 'sourceNote', label: 'Source' }] },
      { objectType: 'ActualCostMirror', label: 'Actuals (read model)', columns: [{ key: 'actualsMUSD', label: 'Actuals $M' }, { key: 'sourceNote', label: 'Source' }] },
      { objectType: 'CommercialClaim', label: 'Claims', columns: [{ key: 'title', label: 'Claim' }, { key: 'amountUSD', label: 'Amount $' }] }
    ],
    actionIds: ['forecast.submit_change', 'accrual.post']
  },
  lessons: {
    title: 'Closeout, Lessons & Norms',
    purpose: 'Lessons → corrective actions → SAP notifications / MDG norm updates → benchmarks for the next event.',
    tabs: [
      { objectType: 'LessonLearned', label: 'Lessons', columns: [{ key: 'title', label: 'Lesson' }, { key: 'category', label: 'Category' }, { key: 'rootCause', label: 'Root Cause' }] }
    ],
    actionIds: ['lesson.capture', 'capa.approve', 'mdg.submit_change']
  },
  'data-foundation': {
    title: 'Data Foundation & BDC Readiness',
    purpose: 'Data product certification, freshness, lineage, quality. BDC/Datasphere/CDS/SLT are read-side only; master data changes go through MDG.',
    tabs: [
      { objectType: 'DataProduct', label: 'Data Products', columns: [{ key: 'name', label: 'Product' }, { key: 'refresh', label: 'Refresh' }, { key: 'lineage', label: 'Lineage' }, { key: 'note', label: 'Note' }] },
      { objectType: 'DataQualityIssue', label: 'Quality Issues', columns: [{ key: 'title', label: 'Issue' }, { key: 'dataProduct', label: 'Product' }, { key: 'severity', label: 'Severity' }] }
    ],
    actionIds: ['dataproduct.certify', 'mdg.submit_change']
  },
  admin: {
    title: 'Admin, Tenant & Certification',
    purpose: 'Tenants, roles, scopes, source modes, connector/API certification and release evidence.',
    tabs: [
      { objectType: 'Plant', label: 'Plants', columns: [{ key: 'name', label: 'Name' }, { key: 'companyCode', label: 'Company Code' }] },
      { objectType: 'Unit', label: 'Units', columns: [{ key: 'name', label: 'Name' }, { key: 'plantId', label: 'Plant' }] },
      { objectType: 'WorkCenter', label: 'Work Centers', columns: [{ key: 'name', label: 'Name' }, { key: 'plantId', label: 'Plant' }] }
    ],
    actionIds: ['connector.toggle']
  }
};
