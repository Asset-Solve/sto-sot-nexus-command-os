/**
 * STO/SOT process backbone — the "how work actually flows" model.
 *
 * Three artifacts, all machine-readable and all consumed by the UI:
 *
 * 1. PROCESS_STAGES — the event lifecycle (KICKOFF §6 steps 1–21 grouped into
 *    15 operating stages), each bound to a workbench route, personas and the
 *    objects worked there. Rendered as the process ribbon on every screen.
 *
 * 2. STATE_ACTIONS — object-state → action matrix: which governed action is
 *    valid for which object in which lifecycle state, with field prefill
 *    mapping. This is what turns a list row into a transaction trigger.
 *
 * 3. workQueueForUser — the day-in-the-life engine: for a persona, collect
 *    (a) approvals waiting on them (SoD-filtered), (b) objects sitting in a
 *    state their role must act on, (c) AI review packages addressed to them.
 */

import type { BusinessObject, User } from '../core/types';
import { listObjects, type Db } from '../core/store';
import { roleAllowed } from '../core/rbac';
import { getActionById } from './registry';

// ---------------------------------------------------------------------------
// 1. Process stages
// ---------------------------------------------------------------------------

export interface ProcessStage {
  id: string;
  num: number;
  name: string;
  route: string;
  kickoffSteps: string; // §6 step numbers covered
  personas: string[];
  objects: string[];
  exitCriteria: string;
  phase: 'STRATEGY' | 'PLANNING' | 'READINESS' | 'EXECUTION' | 'CLOSE' | 'ALWAYS_ON';
}

export const PROCESS_STAGES: ProcessStage[] = [
  { id: 'premise', num: 1, name: 'Portfolio & Premise', route: '/portfolio', kickoffSteps: '1–3', phase: 'STRATEGY', personas: ['event_sponsor', 'sto_manager'], objects: ['TurnaroundEvent', 'PremiseDocument', 'BudgetEnvelope', 'ReadinessGate'], exitCriteria: 'Event created, premise + strategy approved, budget envelope released' },
  { id: 'scope', num: 2, name: 'Scope Intake, Challenge & Freeze', route: '/scope', kickoffSteps: '4–6', phase: 'PLANNING', personas: ['scope_board_member', 'reliability_engineer', 'maintenance_planner'], objects: ['ScopeCandidate', 'APMRecommendationMirror', 'InspectionFinding', 'EmergentWorkRequest'], exitCriteria: 'All candidates decided with reasons; scope frozen; late work governed' },
  { id: 'orders', num: 3, name: 'Order Association, E-Workpacks & Packages', route: '/work-packages', kickoffSteps: '7–8', phase: 'PLANNING', personas: ['maintenance_planner', 'work_package_owner'], objects: ['MaintenanceOrderProxy', 'MaintenanceOperationProxy', 'MaintenanceOrderComponentProxy', 'WorkPackage', 'ElectronicWorkpack', 'DocumentBundle'], exitCriteria: 'Every approved scope has SAP order/operations/components; WP360/e-workpack assembled; readiness 9/9' },
  { id: 'materials', num: 4, name: 'Materials, Tools & Procurement Readiness', route: '/materials', kickoffSteps: '9', phase: 'READINESS', personas: ['material_planner', 'procurement_user', 'warehouse_lead'], objects: ['MaterialDemand', 'MaintenanceOrderComponentProxy', 'ReservationProxy', 'GoodsMovementProxy', 'StagingKit', 'ToolDemand', 'ExpeditingCase'], exitCriteria: 'No critical shortages; reservations posted to SAP; kits/tools staged; goods issue/return controlled' },
  { id: 'contractors', num: 5, name: 'Contractor Mobilization, Mobility & Commercial', route: '/mobility-readiness', kickoffSteps: '10', phase: 'READINESS', personas: ['contractor_coordinator', 'finance_cost_controller', 'hse_safety_reviewer'], objects: ['WorkerReadinessProfile', 'ContractorOnboardingPacket', 'TrainingCredential', 'ContractorRoster', 'CommercialClaim', 'ServiceEntrySheetProxy'], exitCriteria: 'Crews trained, badged, mobile-ready, SOW aligned, claims current, SES pipeline clean' },
  { id: 'cost', num: 6, name: 'Cost Baseline, Reconciliation & Controls', route: '/cost-reconciliation', kickoffSteps: '11', phase: 'READINESS', personas: ['finance_cost_controller', 'event_sponsor'], objects: ['BudgetEnvelope', 'CostForecast', 'CommitmentMirror', 'CostReconciliationCase', 'AccrualEstimate'], exitCriteria: 'Forecast approved, variance drivers owned, accrual/reconciliation policy set' },
  { id: 'schedule', num: 7, name: 'Schedule Integration & Constraints', route: '/schedule', kickoffSteps: '12', phase: 'READINESS', personas: ['scheduler_project_controls'], objects: ['ScheduleActivityMirror', 'Constraint'], exitCriteria: 'P6 baseline linked to WPs; constraints owned with need-by dates' },
  { id: 'safety', num: 8, name: 'Control of Work, Permits & Area Risk', route: '/control-of-work', kickoffSteps: '13–14', phase: 'READINESS', personas: ['wcm_authority', 'hse_safety_reviewer'], objects: ['PermitProxy', 'IsolationPlan', 'LOTOPackage', 'SIMOPSConflict', 'AreaRisk', 'LocationRiskAlert'], exitCriteria: 'Clearances active, SIMOPS mitigated, geofence risks acknowledged, no stale safety read models' },
  { id: 'execution', num: 9, name: 'Daily Execution, RTLS & Emergent Work', route: '/execution-map', kickoffSteps: '15–16', phase: 'EXECUTION', personas: ['maintenance_supervisor', 'field_technician', 'crew_supervisor'], objects: ['DailyExecutionPlan', 'CrewAssignment', 'OperationExecution', 'ProgressUpdate', 'EmergentWorkRequest', 'ShiftHandover'], exitCriteria: 'Daily plan published; progress accepted/confirmed to SAP; emergent work governed; handover published' },
  { id: 'labor', num: 10, name: 'Time, Labor & Payroll', route: '/labor-time', kickoffSteps: '17', phase: 'EXECUTION', personas: ['timekeeper', 'crew_supervisor', 'payroll_user'], objects: ['LaborEntry', 'PayrollBatch', 'PayPeriod'], exitCriteria: 'Time approved daily → CATS posted → payroll released on period close' },
  { id: 'qa', num: 11, name: 'QA, Punch & Turnover', route: '/qa', kickoffSteps: '18', phase: 'EXECUTION', personas: ['qa_qc_inspector', 'turnover_coordinator'], objects: ['PunchItem', 'TestPack', 'TurnoverPackage'], exitCriteria: 'Class-A punch closed with evidence; test packs approved; systems turned over' },
  { id: 'startup', num: 12, name: 'PSSR & Return to Service', route: '/startup-readiness', kickoffSteps: '19', phase: 'EXECUTION', personas: ['operations_startup_authority'], objects: ['StartupReadiness', 'PSSRChecklist'], exitCriteria: 'All blockers cleared; human RTS approval recorded' },
  { id: 'closeout', num: 13, name: 'Closeout, Lessons & Norms', route: '/lessons', kickoffSteps: '20', phase: 'CLOSE', personas: ['sto_manager', 'reliability_engineer'], objects: ['LessonLearned', 'CorrectiveAction'], exitCriteria: 'Lessons captured, CAPAs approved, norms/MDG updates submitted' },
  { id: 'platform', num: 14, name: 'Integration & Data Operations', route: '/resilience', kickoffSteps: '21', phase: 'ALWAYS_ON', personas: ['integration_operator', 'data_steward'], objects: ['OutboxMessage', 'DeadLetterMessage', 'DataProduct'], exitCriteria: 'Outbox healthy, DLQ empty, data products certified & fresh' },
  { id: 'ai-ops', num: 15, name: 'AI Review & Governance', route: '/ai', kickoffSteps: '21', phase: 'ALWAYS_ON', personas: ['ai_platform_owner', 'sto_manager'], objects: ['AIRecommendation', 'AgentRun'], exitCriteria: 'Review packages dispositioned by their human authority' }
];

const PHASE_TO_ACTIVE_STAGE: Record<string, string> = {
  PLANNING: 'scope',
  SCOPE_DEVELOPMENT: 'scope',
  READINESS: 'materials',
  EXECUTION: 'execution',
  STARTUP: 'startup',
  CLOSE: 'closeout'
};

// ---------------------------------------------------------------------------
// 2. Object-state → action matrix
// ---------------------------------------------------------------------------

export interface StateAction {
  objectType: string;
  states: string[];
  actionId: string;
  /** action field -> object data key. Tokens: '$id' = object id, '$sourceReference' = source ref */
  prefill?: Record<string, string>;
  hint: string;
}

export const STATE_ACTIONS: StateAction[] = [
  { objectType: 'TurnaroundEvent', states: ['planning'], actionId: 'premise.approve', prefill: { sourceObjectId: '$id' }, hint: 'Premise awaiting sponsor approval' },
  { objectType: 'TurnaroundEvent', states: ['planning', 'premise_approved'], actionId: 'scope.freeze', prefill: { eventId: '$id' }, hint: 'Freeze scope once critical candidates are resolved' },
  { objectType: 'ScopeCandidate', states: ['submitted', 'challenged'], actionId: 'scope.decide', prefill: { sourceObjectId: '$id' }, hint: 'Scope board decision required' },
  { objectType: 'ScopeCandidate', states: ['approved'], actionId: 'scope.create_notification', prefill: { sourceObjectId: '$id', shortText: 'title' }, hint: 'Associate to SAP via notification create' },
  { objectType: 'ScopeCandidate', states: ['approved', 'associated'], actionId: 'scope.create_order', prefill: { sourceObjectId: '$id', notificationId: 'notificationId', shortText: 'title', plantId: 'plantId' }, hint: 'Create or associate the SAP maintenance order so planning can proceed in this app' },
  { objectType: 'MaintenanceOrderProxy', states: ['created'], actionId: 'order.add_operation', prefill: { orderId: '$id', workCenterId: 'workCenterId' }, hint: 'Add a SAP operation before building the electronic work package' },
  { objectType: 'MaintenanceOrderProxy', states: ['created', 'rescheduled'], actionId: 'order.set_status', prefill: { orderId: '$id' }, hint: 'Release the SAP order when planning/safety prerequisites are ready' },
  { objectType: 'MaintenanceOrderProxy', states: ['released'], actionId: 'order.attach_evidence', prefill: { orderId: '$id' }, hint: 'Attach approved workpack, QA or field evidence to the SAP order' },
  { objectType: 'MaintenanceOrderProxy', states: ['released'], actionId: 'order.set_status', prefill: { orderId: '$id' }, hint: 'Drive TECO/business close from STO controls once punch and WCM are clear' },
  { objectType: 'MaintenanceOperationProxy', states: ['released'], actionId: 'order.add_component', prefill: { orderId: 'orderId', operationId: '$id', workCenterId: 'workCenterId' }, hint: 'Add required components to this SAP operation' },
  { objectType: 'MaintenanceOrderComponentProxy', states: ['shortage', 'change_needed'], actionId: 'order.change_component_qty', prefill: { componentId: '$id', orderId: 'orderId', operationId: 'operationId', materialId: 'materialId', oldQuantity: 'oldQuantity', newQuantity: 'quantity', requirementDate: 'requirementDate' }, hint: 'Change SAP order component quantity before reservation/procurement' },
  { objectType: 'WorkPackage', states: ['in_development'], actionId: 'wp.validate', prefill: { sourceObjectId: '$id' }, hint: 'Check readiness dimensions' },
  { objectType: 'WorkPackage', states: ['in_development'], actionId: 'wp.release', prefill: { sourceObjectId: '$id' }, hint: 'Release when 9/9 ready' },
  { objectType: 'WorkPackage', states: ['released'], actionId: 'operation.confirm', prefill: { orderId: 'orderId' }, hint: 'Confirm executed operations to SAP' },
  { objectType: 'WorkPackage', states: ['released'], actionId: 'mobile.dispatch_package', prefill: { workPackageId: '$id' }, hint: 'Dispatch released package to SSAM/FSM mobile execution' },
  { objectType: 'DocumentBundle', states: ['stale', 'missing'], actionId: 'document.request_revision', prefill: { sourceObjectId: '$id' }, hint: 'Request latest controlled workpack documents' },
  { objectType: 'TrainingCredential', states: ['expired', 'expiring'], actionId: 'training.assign_refresher', prefill: { sourceObjectId: '$id', workerId: 'workerId', credential: 'credential' }, hint: 'Assign refresher before the worker can access controlled work' },
  { objectType: 'ContractorOnboardingPacket', states: ['missing_evidence'], actionId: 'onboarding.request_missing_evidence', prefill: { sourceObjectId: '$id', missingEvidence: 'missingEvidence' }, hint: 'Request missing onboarding evidence' },
  { objectType: 'FELGate', states: ['blocked'], actionId: 'gate.request_waiver', prefill: { sourceObjectId: '$id' }, hint: 'Escalate a governed waiver only when leadership accepts risk' },
  { objectType: 'ReadinessException', states: ['open'], actionId: 'gate.assign_blocker', prefill: { title: 'title', eventId: 'eventId', sourceObjectId: 'sourceObjectId', ownerRole: 'ownerRole', requiredEvidence: 'requiredEvidence', dueDate: 'due' }, hint: 'Create or refresh a blocker owned by the accountable role' },
  { objectType: 'ReadinessException', states: ['open'], actionId: 'readiness.resolve', prefill: { sourceObjectId: '$id' }, hint: 'Resolve with evidence and signoff' },
  { objectType: 'ScheduleActivityMirror', states: ['in_progress'], actionId: 'constraint.create', prefill: { activityId: '$id', eventId: 'eventId' }, hint: 'Log a constraint against this activity' },
  { objectType: 'Constraint', states: ['open'], actionId: 'constraint.close', prefill: { sourceObjectId: '$id' }, hint: 'Close with resolution evidence' },
  { objectType: 'MaterialDemand', states: ['draft', 'requested', 'shortage'], actionId: 'material.reserve', prefill: { demandId: '$id', materialId: 'materialId', quantity: 'qty', plantId: 'plantId', storageLocation: 'storageLocation', requiredDate: 'needBy', orderId: 'orderId', workPackageId: 'wpId' }, hint: 'Reserve stock in SAP' },
  { objectType: 'MaterialDemand', states: ['shortage'], actionId: 'material.request_pr', prefill: { materialId: 'materialId', quantity: 'qty', plantId: 'plantId', requiredDate: 'needBy' }, hint: 'No stock — raise purchase requisition' },
  { objectType: 'MaterialDemand', states: ['shortage'], actionId: 'material.substitute', prefill: { sourceObjectId: '$id', originalMaterialId: 'materialId', quantity: 'qty' }, hint: 'Evaluate and approve a substitute material path' },
  { objectType: 'ToolDemand', states: ['unavailable', 'requested'], actionId: 'tool.reserve', prefill: { sourceObjectId: '$id', toolClass: 'toolClass', needBy: 'needBy' }, hint: 'Reserve internal tooling or stage rental request' },
  { objectType: 'ReservationProxy', states: ['created', 'quantity_changed'], actionId: 'reservation.change_quantity', prefill: { reservation: '$sourceReference', reservationItem: 'reservationItem', materialId: 'materialId', oldQuantity: 'quantity', newQuantity: 'quantity', requiredDate: 'requiredDate' }, hint: 'Change reservation quantity through SAP before issue' },
  { objectType: 'ReservationProxy', states: ['created', 'quantity_changed'], actionId: 'material.issue', prefill: { reservation: '$sourceReference', materialId: 'materialId', quantity: 'quantity', plantId: 'plantId' }, hint: 'Post goods issue against reservation' },
  { objectType: 'ReservationProxy', states: ['created', 'quantity_changed'], actionId: 'material.return', prefill: { reservation: '$sourceReference', orderId: 'orderId', materialId: 'materialId', quantity: 'quantity', plantId: 'plantId', storageLocation: 'storageLocation' }, hint: 'Return unused outage material to stock with SAP material document' },
  { objectType: 'PermitProxy', states: ['suspended', 'expired', 'requested'], actionId: 'permit.request_correction', prefill: { sourceObjectId: '$id' }, hint: 'Route correction to WCM authority (fail-closed source)' },
  { objectType: 'PermitRequirement', states: ['missing'], actionId: 'permit.request_preplan', prefill: { workPackageId: 'wpId', orderId: 'orderId', preplanType: 'permitType', requiredBy: 'requiredBy' }, hint: 'Request WCM/ePTW permit preplan package linked to the SAP order' },
  { objectType: 'IsolationPlan', states: ['draft'], actionId: 'permit.request_preplan', prefill: { workPackageId: 'wpId', orderId: 'orderId', preplanType: 'isolationType' }, hint: 'Route isolation preplan to WCM authority' },
  { objectType: 'SIMOPSConflict', states: ['open'], actionId: 'simops.assign_mitigation', prefill: { sourceObjectId: '$id' }, hint: 'Assign mitigation + owner' },
  { objectType: 'LocationRiskAlert', states: ['open'], actionId: 'safety.acknowledge_location_alert', prefill: { sourceObjectId: '$id', mitigation: 'recommendedAction' }, hint: 'Acknowledge RTLS/geofence alert with mitigation' },
  { objectType: 'CommercialClaim', states: ['pending_approval'], actionId: 'claim.decide', prefill: { sourceObjectId: '$id' }, hint: 'Finance decision with four-eyes' },
  { objectType: 'InvoiceScheduleVariance', states: ['open'], actionId: 'contract.reconcile_invoice', prefill: { sourceObjectId: '$id' }, hint: 'Reconcile invoice against earned value and schedule evidence' },
  { objectType: 'ContractorRoster', states: ['mobilized'], actionId: 'ses.prepare', prefill: { vendorId: 'vendorId' }, hint: 'Prepare SES from contractor evidence' },
  { objectType: 'DailyExecutionPlan', states: ['draft'], actionId: 'plan.publish', prefill: { sourceObjectId: '$id' }, hint: 'Publish the daily control board once blockers are clear' },
  { objectType: 'OperationExecution', states: ['in_progress'], actionId: 'progress.submit', prefill: { workPackageId: 'wpId', operationId: 'operationId', progressPct: 'progressPct' }, hint: "Submit today's progress" },
  { objectType: 'ProgressUpdate', states: ['submitted'], actionId: 'progress.supervisor_accept', prefill: { sourceObjectId: '$id', acceptedProgressPct: 'reportedProgressPct' }, hint: 'Supervisor acceptance required before earned value/confirmation' },
  { objectType: 'LaborEntry', states: ['submitted'], actionId: 'labor.post_cats', prefill: { laborEntryId: '$id', workerId: 'workerId', costObject: 'costObject', hours: 'hours', payCode: 'payCode' }, hint: 'Approve crew time → post CATS' },
  { objectType: 'PayPeriod', states: ['open'], actionId: 'payroll.release', prefill: { payPeriod: '$id' }, hint: 'Release period to payroll gateway' },
  { objectType: 'PunchItem', states: ['open'], actionId: 'punch.close', prefill: { sourceObjectId: '$id' }, hint: 'Close with evidence; class A needs QA verify' },
  { objectType: 'TurnoverPackage', states: ['assembling'], actionId: 'turnover.approve', prefill: { sourceObjectId: '$id' }, hint: 'Approve turnover (blocked by class-A punch)' },
  { objectType: 'StartupReadiness', states: ['blocked', 'ready'], actionId: 'startup.approve_rts', prefill: { sourceObjectId: '$id' }, hint: 'Human RTS authority only' },
  { objectType: 'CostForecast', states: ['current'], actionId: 'forecast.submit_change', prefill: { eventId: 'eventId', forecastMUSD: 'forecastMUSD' }, hint: 'Submit forecast change for approval' },
  { objectType: 'CostReconciliationCase', states: ['open'], actionId: 'cost.reconcile_case', prefill: { sourceObjectId: '$id' }, hint: 'Resolve cost mismatch with evidence' },
  { objectType: 'AccrualEstimate', states: ['proposed'], actionId: 'accrual.approve_post', prefill: { sourceObjectId: '$id', costObject: 'costObject', amountUSD: 'amountUSD', postingPeriod: 'period', companyCode: 'companyCode' }, hint: 'Approve and post accrual to SAP FI/CO' },
  { objectType: 'KPITrace', states: ['action_required'], actionId: 'analytics.create_action', prefill: { title: 'kpi', sourceKpi: 'kpi', targetRoute: 'drillRoute' }, hint: 'Turn KPI exception into an owned action' },
  { objectType: 'LessonLearned', states: ['draft'], actionId: 'capa.approve', prefill: { sourceObjectId: '$id' }, hint: 'Approve corrective action' },
  { objectType: 'DataProduct', states: ['stale'], actionId: 'dataproduct.certify', prefill: { sourceObjectId: '$id' }, hint: 'Re-certify after freshness fix' },
  { objectType: 'EmergentWorkRequest', states: ['pending_approval'], actionId: 'emergent.raise', prefill: { title: 'title', eventId: 'eventId' }, hint: 'Emergent work awaiting approval — see approval queue' }
];

/** Actions valid for this object right now, filtered to the caller's role. */
export function nextActionsForObject(obj: BusinessObject, role?: string) {
  return STATE_ACTIONS
    .filter((sa) => sa.objectType === obj.objectType && sa.states.includes(obj.lifecycleState))
    .map((sa) => ({ ...sa, action: getActionById(sa.actionId) }))
    .filter((x) => x.action && (!role || roleAllowed({ role, id: '', tenantId: '', name: '', scopes: { plants: [], units: [], companyCodes: [] } } as User, x.action.allowedRoles)))
    .map((x) => ({
      actionId: x.actionId,
      label: x.action!.label,
      actionClass: x.action!.actionClass,
      screen: x.action!.screen,
      hint: x.hint,
      prefill: buildPrefill(obj, x.prefill)
    }));
}

export function buildPrefill(obj: BusinessObject, map?: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = { sourceObjectId: obj.id };
  if (map) {
    for (const [field, key] of Object.entries(map)) {
      if (key === '$id') out[field] = obj.id;
      else if (key === '$sourceReference') out[field] = obj.sourceReference;
      else if (obj.data[key] !== undefined) out[field] = obj.data[key];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. Stage status + work queue
// ---------------------------------------------------------------------------

export interface StageStatus extends ProcessStage {
  status: 'done' | 'active' | 'pending';
  openItems: number;
  openNote: string;
}

export function stageStatuses(db: Db, tenantId: string, eventId: string): StageStatus[] {
  const ev = listObjects(db, tenantId, 'TurnaroundEvent', (o) => o.id === eventId)[0];
  const phase = (ev?.data['phase'] as string) ?? 'PLANNING';
  const activeId = PHASE_TO_ACTIVE_STAGE[phase] ?? 'scope';
  const activeNum = PROCESS_STAGES.find((s) => s.id === activeId)?.num ?? 2;
  const inEvent = (o: BusinessObject) => !o.data['eventId'] || o.data['eventId'] === eventId;

  const count = (id: string): { n: number; note: string } => {
    switch (id) {
      case 'premise': { const n = listObjects(db, tenantId, 'ReadinessGate', (o) => inEvent(o) && o.lifecycleState === 'pending').length; return { n, note: 'gates pending' }; }
      case 'scope': { const n = listObjects(db, tenantId, 'ScopeCandidate', (o) => inEvent(o) && ['submitted', 'challenged'].includes(o.lifecycleState)).length; return { n, note: 'candidates undecided' }; }
      case 'orders': { const n = listObjects(db, tenantId, 'WorkPackage', (o) => inEvent(o) && o.lifecycleState !== 'released').length; return { n, note: 'packages not released' }; }
      case 'materials': {
        const n = listObjects(db, tenantId, 'MaterialDemand', (o) => inEvent(o) && ['shortage', 'requested', 'draft'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'MaintenanceOrderComponentProxy', (o) => inEvent(o) && ['shortage', 'change_needed'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'ReservationProxy', (o) => inEvent(o) && ['created', 'quantity_changed'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'ToolDemand', (o) => inEvent(o) && ['unavailable', 'requested'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'StagingKit', (o) => inEvent(o) && ['partial', 'blocked'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'ShortageCase', (o) => inEvent(o) && o.lifecycleState === 'open').length;
        return { n, note: 'demands/tools/kits unresolved' };
      }
      case 'contractors': {
        const n = listObjects(db, tenantId, 'CommercialClaim', (o) => inEvent(o) && o.lifecycleState === 'pending_approval').length
          + listObjects(db, tenantId, 'TrainingCredential', (o) => inEvent(o) && ['expired', 'expiring'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'ContractorOnboardingPacket', (o) => inEvent(o) && ['missing_evidence'].includes(o.lifecycleState)).length;
        return { n, note: 'claims/credentials/onboarding pending' };
      }
      case 'cost': {
        const cf = listObjects(db, tenantId, 'CostForecast', (o) => inEvent(o))[0];
        const n = (cf && Number(cf.data['varianceMUSD']) > 0 ? 1 : 0)
          + listObjects(db, tenantId, 'InvoiceScheduleVariance', (o) => inEvent(o) && o.lifecycleState === 'open').length
          + listObjects(db, tenantId, 'CostReconciliationCase', (o) => inEvent(o) && o.lifecycleState === 'open').length
          + listObjects(db, tenantId, 'AccrualEstimate', (o) => inEvent(o) && o.lifecycleState === 'proposed').length;
        return { n, note: 'forecast/reconciliation/accrual exceptions' };
      }
      case 'schedule': { const n = listObjects(db, tenantId, 'Constraint', (o) => inEvent(o) && o.lifecycleState === 'open').length; return { n, note: 'open constraints' }; }
      case 'safety': {
        const n = listObjects(db, tenantId, 'PermitProxy', (o) => ['suspended', 'expired'].includes(o.lifecycleState)).length
          + listObjects(db, tenantId, 'SIMOPSConflict', (o) => o.lifecycleState === 'open').length
          + listObjects(db, tenantId, 'PermitRequirement', (o) => inEvent(o) && o.lifecycleState === 'missing').length
          + listObjects(db, tenantId, 'GasTestEvidence', (o) => inEvent(o) && o.lifecycleState === 'expired').length
          + listObjects(db, tenantId, 'LocationRiskAlert', (o) => inEvent(o) && o.lifecycleState === 'open').length;
        return { n, note: 'permit/SIMOPS/location issues' };
      }
      case 'execution': {
        const n = listObjects(db, tenantId, 'EmergentWorkRequest', (o) => inEvent(o) && o.lifecycleState === 'pending_approval').length
          + listObjects(db, tenantId, 'DailyExecutionPlan', (o) => inEvent(o) && o.lifecycleState === 'draft').length
          + listObjects(db, tenantId, 'ProgressUpdate', (o) => inEvent(o) && o.lifecycleState === 'submitted').length;
        return { n, note: 'plans/progress/emergent work pending' };
      }
      case 'labor': { const n = listObjects(db, tenantId, 'LaborEntry', (o) => inEvent(o) && o.lifecycleState === 'submitted').length; return { n, note: 'time entries awaiting approval' }; }
      case 'qa': { const n = listObjects(db, tenantId, 'PunchItem', (o) => inEvent(o) && o.lifecycleState === 'open').length; return { n, note: 'open punch items' }; }
      case 'startup': { const s = listObjects(db, tenantId, 'StartupReadiness', (o) => inEvent(o))[0]; const n = ((s?.data['blockers'] as string[]) ?? []).length; return { n, note: 'RTS blockers' }; }
      case 'closeout': { const n = listObjects(db, tenantId, 'LessonLearned', (o) => inEvent(o) && o.lifecycleState === 'draft').length; return { n, note: 'lessons undispositioned' }; }
      case 'platform': { const n = [...db.deadLetters.values()].filter((d) => d.tenantId === tenantId && !d.replayedAt).length + listObjects(db, tenantId, 'DataProduct', (o) => o.lifecycleState === 'stale').length; return { n, note: 'DLQ + stale data products' }; }
      case 'ai-ops': { const n = [...db.aiRecommendations.values()].filter((r) => r.tenantId === tenantId && r.status === 'OPEN').length; return { n, note: 'review packages open' }; }
      default: return { n: 0, note: '' };
    }
  };

  return PROCESS_STAGES.map((s) => {
    const { n, note } = count(s.id);
    const status: StageStatus['status'] =
      s.phase === 'ALWAYS_ON' ? 'active' : s.num < activeNum ? 'done' : s.num === activeNum ? 'active' : 'pending';
    return { ...s, status, openItems: n, openNote: note };
  });
}

export interface WorkItem {
  kind: 'approval' | 'action' | 'ai_review';
  title: string;
  detail: string;
  screen: string;
  objectId?: string;
  transactionId?: string;
  actionId?: string;
  prefill?: Record<string, unknown>;
  riskClass?: string;
  stage?: string;
}

export function workQueueForUser(db: Db, user: User): { approvals: WorkItem[]; actions: WorkItem[]; aiReviews: WorkItem[] } {
  // (a) transactions waiting on this persona as approver (four-eyes: never own submissions)
  const approvals: WorkItem[] = [...db.transactions.values()]
    .filter((t) => t.tenantId === user.tenantId && t.lifecycleState === 'pending_approval' && t.submittedBy !== user.id)
    .filter((t) => {
      const action = getActionById(t.actionId);
      return action ? roleAllowed(user, action.approverRoles ?? ['sto_manager', 'outage_manager']) : false;
    })
    .map((t) => ({
      kind: 'approval' as const,
      title: `Approve/reject: ${getActionById(t.actionId)?.label ?? t.actionId}`,
      detail: `Submitted by ${db.users.get(t.submittedBy)?.name ?? t.submittedBy} (${t.submittedByRole}) · ${t.riskClass}`,
      screen: getActionById(t.actionId)?.screen ?? '/resilience',
      transactionId: t.transactionId,
      riskClass: t.riskClass
    }));

  // (b) objects sitting in a state this role must act on
  const actions: WorkItem[] = [];
  for (const sa of STATE_ACTIONS) {
    const action = getActionById(sa.actionId);
    // universal ('*') advisory tools are available to everyone but are nobody's
    // personal obligation — they stay on the workbench rows, not in My Work
    if (!action || action.allowedRoles.includes('*') || !roleAllowed(user, action.allowedRoles)) continue;
    for (const obj of listObjects(db, user.tenantId, sa.objectType, (o) => sa.states.includes(o.lifecycleState))) {
      const stage = PROCESS_STAGES.find((s) => s.route === action.screen);
      actions.push({
        kind: 'action',
        title: `${action.label}: ${(obj.data['title'] as string) ?? (obj.data['name'] as string) ?? (obj.data['desc'] as string) ?? obj.id}`,
        detail: `${sa.hint} · ${obj.objectType} ${obj.id} is '${obj.lifecycleState}'`,
        screen: action.screen,
        objectId: obj.id,
        actionId: sa.actionId,
        prefill: buildPrefill(obj, sa.prefill),
        riskClass: obj.riskClass,
        stage: stage?.name
      });
    }
  }

  // (c) AI review packages addressed to this role
  const aiReviews: WorkItem[] = [...db.aiRecommendations.values()]
    .filter((r) => r.tenantId === user.tenantId && r.status === 'OPEN' && (r.humanReviewerRole === user.role || user.role === 'tenant_admin'))
    .map((r) => ({
      kind: 'ai_review' as const,
      title: r.title,
      detail: `Agent ${r.agentId} · ${r.policyDecision} · confidence ${Math.round(r.confidence * 100)}%`,
      screen: '/ai',
      objectId: r.id
    }));

  return { approvals, actions: actions.slice(0, 50), aiReviews };
}
