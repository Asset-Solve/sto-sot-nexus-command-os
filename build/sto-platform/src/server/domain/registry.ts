/**
 * Domain action catalog — the workflow/action catalog of the platform.
 * Every screen button maps to exactly one ActionDefinition here; the engine
 * (core/engine.ts) is the only executor. This file is the machine-readable
 * source for docs/workflows/CONTROLLED_WRITE_AND_APPROVAL_CATALOG.md.
 */

import type { ActionContext, ActionDefinition, ValidationResult } from '../core/types';
import { getDb, getObject, listObjects, putObject } from '../core/store';
import { newId, nowIso } from '../core/ids';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function req(payload: Record<string, unknown>, fields: string[]): ValidationResult[] {
  const out: ValidationResult[] = [];
  for (const f of fields) {
    const v = payload[f];
    if (v === undefined || v === null || v === '') {
      out.push({ severity: 'ERROR', field: f, message: `${f} is required.` });
    }
  }
  return out;
}

function touch(obj: { updatedAt: string; updatedBy: string }, user: string) {
  obj.updatedAt = nowIso();
  obj.updatedBy = user;
}

function setState(tenantId: string, id: string, state: string, ctx: ActionContext, extra?: Record<string, unknown>) {
  const db = getDb();
  const o = getObject(db, tenantId, id);
  if (o) {
    o.lifecycleState = state;
    if (extra) Object.assign(o.data, extra);
    touch(o, ctx.user.id);
  }
}

// ---------------------------------------------------------------------------
// action catalog
// ---------------------------------------------------------------------------

export const ACTIONS: ActionDefinition[] = [
  // ======================= PORTFOLIO / EVENT =======================
  {
    id: 'event.create',
    label: 'Create Outage Event',
    description: 'Create outage master with premise linkage. Requires plant, unit, dates, owner, type, WBS, company code.',
    screen: '/portfolio', businessCapability: 'Event Strategy', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['sto_manager', 'outage_manager', 'event_sponsor'], approverRoles: ['event_sponsor', 'sto_manager'],
    sod: true, targetObjectType: 'TurnaroundEvent', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'name', label: 'Event name', type: 'text', required: true },
      { name: 'plantId', label: 'Plant', type: 'lookup', lookupCategory: 'plants', required: true },
      { name: 'unitId', label: 'Unit', type: 'lookup', lookupCategory: 'units', dependsOn: ['plantId'], required: true },
      { name: 'start', label: 'Start date', type: 'date', required: true },
      { name: 'end', label: 'End date', type: 'date', required: true },
      { name: 'outageType', label: 'Outage type', type: 'text', required: true },
      { name: 'wbsId', label: 'WBS element', type: 'lookup', lookupCategory: 'wbsElements', required: true }
    ],
    validate: (p) => [
      ...req(p, ['name', 'plantId', 'unitId', 'start', 'end', 'outageType', 'wbsId']),
      ...((p['start'] as string) >= (p['end'] as string) ? [{ severity: 'ERROR' as const, field: 'end', message: 'End must be after start.' }] : [])
    ],
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('EV'), tenantId: ctx.tenantId, objectType: 'TurnaroundEvent', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'TurnaroundEvent', sourceReference: txn.transactionId,
        lifecycleState: 'planning', approvalState: 'APPROVED', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId,
        data: { ...p, phase: 'PLANNING', progressPct: 0, planPct: 0, budgetMUSD: 0, forecastMUSD: 0, dayOf: 0, totalDays: 0, scheduleVarianceDays: 0, safetyTRIR: 0 }
      });
    }
  },
  {
    id: 'premise.approve',
    label: 'Approve Event Premise',
    description: 'Approve premise document and event strategy.',
    screen: '/portfolio', businessCapability: 'Event Strategy', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['sto_manager', 'outage_manager'], approverRoles: ['event_sponsor'], requiresReason: true,
    sod: true, targetObjectType: 'TurnaroundEvent', targetSystem: 'STO_PLATFORM',
    fields: [{ name: 'sourceObjectId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true }],
    validate: (p) => req(p, ['sourceObjectId']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'premise_approved', ctx)
  },

  // ======================= SCOPE =======================
  {
    id: 'scope.submit',
    label: 'Submit Scope Candidate',
    description: 'Create a scope candidate from notification, APM, inspection, operator log or manual request.',
    screen: '/scope', businessCapability: 'Scope Management', actionClass: 'ADVISORY', riskClass: 'LOW',
    allowedRoles: ['*'], sod: false, targetObjectType: 'ScopeCandidate', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'sourceType', label: 'Source type', type: 'text', required: true },
      { name: 'notificationId', label: 'SAP notification', type: 'lookup', lookupCategory: 'notifications' },
      { name: 'estimateMUSD', label: 'Estimate (MUSD)', type: 'number', required: true }
    ],
    validate: (p) => req(p, ['title', 'eventId', 'sourceType', 'estimateMUSD']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('SC'), tenantId: ctx.tenantId, objectType: 'ScopeCandidate', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'ScopeCandidate', sourceReference: txn.transactionId,
        lifecycleState: 'submitted', approvalState: 'PENDING', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, plantId: 'P100' }
      });
    }
  },
  {
    id: 'scope.decide',
    label: 'Decide Scope (Include / Reject / Defer)',
    description: 'Scope board decision. Reject/defer requires reason.',
    screen: '/scope', businessCapability: 'Scope Management', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['scope_board_member', 'sto_manager'], approverRoles: ['sto_manager', 'outage_manager'], requiresReason: true,
    sod: true, targetObjectType: 'ScopeCandidate', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Scope candidate', type: 'lookup', lookupCategory: 'scopeCandidates', required: true },
      { name: 'decision', label: 'Decision (include/reject/defer)', type: 'text', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'decision']);
      if (p['decision'] && !['include', 'reject', 'defer'].includes(p['decision'] as string)) {
        out.push({ severity: 'ERROR', field: 'decision', message: 'Decision must be include, reject or defer.' });
      }
      return out;
    },
    apply: (p, _t, ctx) => {
      const map: Record<string, string> = { include: 'approved', reject: 'rejected', defer: 'deferred' };
      setState(ctx.tenantId, p['sourceObjectId'] as string, map[p['decision'] as string], ctx, { decisionReason: p['reason'] });
    }
  },
  {
    id: 'scope.freeze',
    label: 'Freeze Scope',
    description: 'Freeze event scope. Blocked while critical candidates remain unresolved.',
    screen: '/scope', businessCapability: 'Scope Management', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['sto_manager'], approverRoles: ['event_sponsor', 'outage_manager'], requiresReason: true,
    sod: true, targetObjectType: 'TurnaroundEvent', targetSystem: 'STO_PLATFORM',
    fields: [{ name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true }],
    validate: (p, ctx) => {
      const out = req(p, ['eventId']);
      const db = getDb();
      const open = listObjects(db, ctx.tenantId, 'ScopeCandidate',
        (o) => o.data['eventId'] === p['eventId'] && ['submitted', 'challenged'].includes(o.lifecycleState) && (o.riskClass === 'HIGH' || o.riskClass === 'SAFETY_CRITICAL'));
      if (open.length > 0) {
        out.push({ severity: 'ERROR', field: 'eventId', message: `Scope freeze blocked: ${open.length} unresolved critical candidate(s): ${open.map((o) => o.id).join(', ')}.` });
      }
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['eventId'] as string, 'scope_frozen', ctx)
  },
  {
    id: 'scope.create_notification',
    label: 'Create SAP Notification from Scope',
    description: 'Create maintenance notification in SAP via API_MAINTNOTIFICATION (governed writeback).',
    screen: '/scope', businessCapability: 'Scope Management', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['maintenance_planner', 'scope_board_member', 'sto_manager'], approverRoles: ['sto_manager', 'outage_manager'],
    sod: true, targetObjectType: 'MaintenanceNotificationProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-eam-notification', connectorOperation: 'create',
    fields: [
      { name: 'sourceObjectId', label: 'Scope candidate', type: 'lookup', lookupCategory: 'scopeCandidates', required: true },
      { name: 'equipmentId', label: 'Technical object', type: 'lookup', lookupCategory: 'equipment', required: true },
      { name: 'shortText', label: 'Notification text', type: 'text', required: true },
      { name: 'priority', label: 'Priority', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'equipmentId', 'shortText', 'priority']),
    buildPayload: (p) => ({
      apiService: 'API_MAINTNOTIFICATION',
      MaintenanceNotification: { NotificationText: p['shortText'], TechnicalObject: p['equipmentId'], NotificationType: 'M2', MaintPriority: p['priority'] }
    }),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: `NOTIF-${txn.targetDocumentNumber ?? txn.transactionId}`, tenantId: ctx.tenantId,
        objectType: 'MaintenanceNotificationProxy', sourceSystem: 'SAP_S4', sourceMode: 'SIMULATOR',
        sourceObject: 'MaintenanceNotification', sourceReference: txn.targetDocumentNumber ?? 'PENDING',
        lifecycleState: 'created', approvalState: 'APPROVED', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId,
        data: { desc: p['shortText'], equipmentId: p['equipmentId'], priority: p['priority'], plantId: 'P100', fromScope: p['sourceObjectId'] }
      });
      setState(ctx.tenantId, p['sourceObjectId'] as string, 'associated', ctx, { notificationId: txn.targetDocumentNumber });
    }
  },
  {
    id: 'emergent.raise',
    label: 'Raise Emergent Work',
    description: 'Raise emergent work with risk, owner, schedule and cost impact.',
    screen: '/field', businessCapability: 'Execution', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['field_technician', 'maintenance_supervisor', 'work_package_owner'], approverRoles: ['sto_manager', 'outage_manager'],
    sod: true, targetObjectType: 'EmergentWorkRequest', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'scheduleImpactDays', label: 'Schedule impact (days)', type: 'number', required: true },
      { name: 'costImpactMUSD', label: 'Cost impact (MUSD)', type: 'number', required: true },
      { name: 'riskNote', label: 'Risk', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['title', 'eventId', 'scheduleImpactDays', 'costImpactMUSD', 'riskNote']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('EWR'), tenantId: ctx.tenantId, objectType: 'EmergentWorkRequest', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'EmergentWorkRequest', sourceReference: txn.transactionId,
        lifecycleState: 'approved', approvalState: 'APPROVED', riskClass: 'HIGH', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, plantId: 'P100' }
      });
    }
  },

  // ======================= WORK PACKAGES =======================
  {
    id: 'wp.release',
    label: 'Release Work Package',
    description: 'Release a work package. Blocked until all nine readiness dimensions are complete and a valid SAP order exists.',
    screen: '/work-packages', businessCapability: 'Work Package Management', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['work_package_owner', 'maintenance_planner'], approverRoles: ['maintenance_supervisor', 'sto_manager'],
    sod: true, targetObjectType: 'WorkPackage', targetSystem: 'STO_PLATFORM',
    fields: [{ name: 'sourceObjectId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages', required: true }],
    validate: (p, ctx) => {
      const out = req(p, ['sourceObjectId']);
      const db = getDb();
      const wp = getObject(db, ctx.tenantId, p['sourceObjectId'] as string);
      if (!wp) { out.push({ severity: 'ERROR', field: 'sourceObjectId', message: 'Work package not found.' }); return out; }
      if (!wp.data['orderId']) out.push({ severity: 'ERROR', message: 'No SAP maintenance order associated — release blocked.' });
      const readiness = (wp.data['readiness'] ?? {}) as Record<string, boolean>;
      const missing = Object.entries(readiness).filter(([, v]) => !v).map(([k]) => k);
      if (missing.length) out.push({ severity: 'ERROR', message: `Readiness incomplete: ${missing.join(', ')}. Release blocked.` });
      const permits = listObjects(db, ctx.tenantId, 'PermitProxy', (o) => o.data['wpId'] === wp.id && ['suspended', 'expired'].includes(o.lifecycleState));
      if (permits.length) out.push({ severity: 'ERROR', message: `Safety fail-closed: permit(s) ${permits.map((x) => x.id).join(', ')} suspended/expired.` });
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'released', ctx)
  },
  {
    id: 'wp.validate',
    label: 'Validate Package Readiness',
    description: 'Run completeness validation across labor, materials, services, permits, schedule, tools, risk, QA, documents.',
    screen: '/work-packages', businessCapability: 'Work Package Management', actionClass: 'ADVISORY', riskClass: 'LOW',
    allowedRoles: ['*'], sod: false, targetObjectType: 'WorkPackage', targetSystem: 'STO_PLATFORM',
    fields: [{ name: 'sourceObjectId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages', required: true }],
    validate: (p, ctx) => {
      const out = req(p, ['sourceObjectId']);
      if (out.length) return out;
      const db = getDb();
      const wp = getObject(db, ctx.tenantId, p['sourceObjectId'] as string);
      const readiness = (wp?.data['readiness'] ?? {}) as Record<string, boolean>;
      for (const [k, v] of Object.entries(readiness)) {
        out.push({ severity: v ? 'INFO' : 'WARNING', message: `${k}: ${v ? 'ready' : 'NOT READY'}` });
      }
      return out;
    }
  },

  // ======================= MARKET-LEADING READINESS / MOBILITY =======================
  {
    id: 'training.assign_refresher',
    label: 'Assign Refresher Training',
    description: 'Stage a credential remediation package to the LMS/training connector. Work remains blocked until the source credential is refreshed and read back.',
    screen: '/mobility-readiness', businessCapability: 'Mobility & Compliance', actionClass: 'CONTROLLED', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['contractor_coordinator', 'hse_safety_reviewer', 'maintenance_supervisor'], approverRoles: ['hse_safety_reviewer'],
    sod: true, targetObjectType: 'TrainingCredential', targetSystem: 'LMS',
    connectorId: 'lms-training', connectorOperation: 'update',
    fields: [
      { name: 'sourceObjectId', label: 'Credential record', type: 'text', required: true },
      { name: 'workerId', label: 'Worker', type: 'lookup', lookupCategory: 'workers', required: true },
      { name: 'credential', label: 'Credential', type: 'text', required: true },
      { name: 'dueDate', label: 'Due date', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'workerId', 'credential', 'dueDate', 'reason']),
    buildPayload: (p) => ({
      apiService: 'LMS_CREDENTIAL_API',
      CredentialAssignment: { Worker: p['workerId'], CredentialCode: p['credential'], DueDate: p['dueDate'], Reason: p['reason'] }
    }),
    apply: (p, txn, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'refresher_assigned', ctx, { dueDate: p['dueDate'], lmsPackage: txn.targetDocumentNumber ?? 'STAGED_NOT_POSTED' })
  },
  {
    id: 'onboarding.request_missing_evidence',
    label: 'Request Missing Evidence',
    description: 'Create a contractor onboarding evidence request with an auditable owner and due date. Access stays blocked until evidence is read back from the source system.',
    screen: '/mobility-readiness', businessCapability: 'Mobility & Compliance', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['contractor_coordinator', 'hse_safety_reviewer'], approverRoles: ['maintenance_supervisor', 'hse_safety_reviewer'],
    sod: true, targetObjectType: 'ContractorOnboardingPacket', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Onboarding packet', type: 'text', required: true },
      { name: 'missingEvidence', label: 'Missing evidence', type: 'textarea', required: true },
      { name: 'dueDate', label: 'Due date', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'missingEvidence', 'dueDate', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'evidence_requested', ctx, { missingEvidence: p['missingEvidence'], evidenceDueDate: p['dueDate'] })
  },
  {
    id: 'gate.assign_blocker',
    label: 'Assign Gate Blocker',
    description: 'Create a gate blocker from a readiness exception with owner role, evidence requirement and due date.',
    screen: '/fel-readiness', businessCapability: 'FEL Readiness', actionClass: 'ADVISORY', riskClass: 'HIGH',
    allowedRoles: ['sto_manager', 'outage_manager', 'scheduler_project_controls', 'hse_safety_reviewer', 'material_planner'], sod: false,
    targetObjectType: 'GateBlocker', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Blocker title', type: 'text', required: true },
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'sourceObjectId', label: 'Source object', type: 'text', required: true },
      { name: 'ownerRole', label: 'Owner role', type: 'text', required: true },
      { name: 'requiredEvidence', label: 'Required evidence', type: 'textarea', required: true },
      { name: 'dueDate', label: 'Due date', type: 'date', required: true }
    ],
    validate: (p) => req(p, ['title', 'eventId', 'sourceObjectId', 'ownerRole', 'requiredEvidence', 'dueDate']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('GB'), tenantId: ctx.tenantId, objectType: 'GateBlocker', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'GateBlocker', sourceReference: txn.transactionId,
        lifecycleState: 'open', approvalState: 'NOT_REQUIRED', riskClass: 'HIGH', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId, data: { ...p, stage: 'Readiness Gate' }
      });
    }
  },
  {
    id: 'gate.request_waiver',
    label: 'Request Gate Waiver',
    description: 'Route a readiness waiver through STO leadership. Waivers do not close the exception; they record a governed risk acceptance.',
    screen: '/fel-readiness', businessCapability: 'FEL Readiness', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['sto_manager', 'outage_manager'], approverRoles: ['event_sponsor', 'operations_startup_authority'], requiresReason: true,
    sod: true, targetObjectType: 'FELGate', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Gate', type: 'text', required: true },
      { name: 'waiverScope', label: 'Waiver scope', type: 'textarea', required: true },
      { name: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
      { name: 'reason', label: 'Risk acceptance reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'waiverScope', 'expiryDate', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'waiver_requested', ctx, { waiverScope: p['waiverScope'], waiverExpiryDate: p['expiryDate'], waiverReason: p['reason'] })
  },
  {
    id: 'readiness.resolve',
    label: 'Resolve Readiness Exception',
    description: 'Resolve a readiness exception only with evidence and owner signoff.',
    screen: '/fel-readiness', businessCapability: 'FEL Readiness', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['sto_manager', 'outage_manager', 'material_planner', 'hse_safety_reviewer', 'work_package_owner'], approverRoles: ['sto_manager', 'outage_manager'],
    sod: true, targetObjectType: 'ReadinessException', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Exception', type: 'text', required: true },
      { name: 'evidenceRef', label: 'Evidence reference', type: 'text', required: true },
      { name: 'resolution', label: 'Resolution note', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'evidenceRef', 'resolution']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'resolved', ctx, { evidenceRef: p['evidenceRef'], resolution: p['resolution'] })
  },
  {
    id: 'document.request_revision',
    label: 'Request Document Revision',
    description: 'Stage a document-control revision request for stale or missing e-workpack evidence.',
    screen: '/work-packages', businessCapability: 'Digital Workpacks', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['work_package_owner', 'maintenance_planner', 'qa_qc_inspector'], approverRoles: ['work_package_owner', 'sto_manager'],
    sod: true, targetObjectType: 'DocumentBundle', targetSystem: 'OPENTEXT_DMS',
    connectorId: 'opentext-dms', connectorOperation: 'update',
    fields: [
      { name: 'sourceObjectId', label: 'Document bundle', type: 'text', required: true },
      { name: 'revisionReason', label: 'Revision reason', type: 'textarea', required: true },
      { name: 'requiredBy', label: 'Required by', type: 'date', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'revisionReason', 'requiredBy']),
    buildPayload: (p) => ({
      apiService: 'DOCUMENT_CONTROL_API',
      DocumentRevisionRequest: { DocumentBundle: p['sourceObjectId'], Reason: p['revisionReason'], RequiredBy: p['requiredBy'] }
    }),
    apply: (p, txn, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'revision_requested', ctx, { revisionReason: p['revisionReason'], dmsPackage: txn.targetDocumentNumber ?? 'STAGED_NOT_POSTED' })
  },

  // ======================= SCHEDULE =======================
  {
    id: 'schedule.rebaseline',
    label: 'Approve Schedule Rebaseline',
    description: 'Human-approved rebaseline pushed to P6 as approved delta. AI may propose recovery but can never rebaseline.',
    screen: '/schedule', businessCapability: 'Schedule Management', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['scheduler_project_controls'], approverRoles: ['sto_manager', 'outage_manager'], requiresReason: true,
    sod: true, targetObjectType: 'ScheduleBaseline', targetSystem: 'P6',
    connectorId: 'p6-schedule', connectorOperation: 'update',
    fields: [
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'baselineId', label: 'Baseline ID', type: 'text', required: true },
      { name: 'affectedActivities', label: 'Affected activities (comma sep)', type: 'text', required: true },
      { name: 'productionImpact', label: 'Production impact', type: 'textarea', required: true },
      { name: 'costImpactMUSD', label: 'Cost impact (MUSD)', type: 'number', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['eventId', 'baselineId', 'affectedActivities', 'productionImpact', 'costImpactMUSD', 'reason']),
    buildPayload: (p) => ({ p6: { baseline: p['baselineId'], activities: String(p['affectedActivities']).split(','), approvedDelta: true } })
  },
  {
    id: 'constraint.create',
    label: 'Create Constraint',
    description: 'Record a schedule/material/equipment constraint with owner and need-by date.',
    screen: '/schedule', businessCapability: 'Schedule Management', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['*'], sod: false, targetObjectType: 'Constraint', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'activityId', label: 'Schedule activity', type: 'lookup', lookupCategory: 'scheduleActivities', dependsOn: ['eventId'] },
      { name: 'needBy', label: 'Need by', type: 'date', required: true }
    ],
    validate: (p) => req(p, ['title', 'eventId', 'needBy']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('CON'), tenantId: ctx.tenantId, objectType: 'Constraint', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'Constraint', sourceReference: txn.transactionId,
        lifecycleState: 'open', approvalState: 'NOT_REQUIRED', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, plantId: 'P100' }
      });
    }
  },

  {
    id: 'constraint.close',
    label: 'Close Constraint',
    description: 'Close a constraint with resolution evidence.',
    screen: '/schedule', businessCapability: 'Schedule Management', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['scheduler_project_controls', 'sto_manager', 'material_planner', 'maintenance_supervisor'], sod: false,
    targetObjectType: 'Constraint', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Constraint ID', type: 'text', required: true },
      { name: 'resolution', label: 'Resolution evidence', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'resolution']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'closed', ctx, { resolution: p['resolution'] })
  },

  // ======================= MATERIALS =======================
  {
    id: 'material.reserve',
    label: 'Reserve Material (SAP)',
    description: 'Create SAP reservation via API_RESERVATION_DOCUMENT_SRV with four-eyes approval, outbox, read-back and reconciliation.',
    screen: '/materials', businessCapability: 'Materials Management', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['material_planner', 'maintenance_planner', 'work_package_owner'], approverRoles: ['maintenance_supervisor', 'sto_manager'],
    sod: true, targetObjectType: 'ReservationProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-mm-reservation', connectorOperation: 'create',
    fields: [
      { name: 'materialId', label: 'Material', type: 'lookup', lookupCategory: 'materials', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'plantId', label: 'Plant', type: 'lookup', lookupCategory: 'plants', required: true },
      { name: 'storageLocation', label: 'Storage location', type: 'lookup', lookupCategory: 'storageLocations', dependsOn: ['plantId'], required: true },
      { name: 'requiredDate', label: 'Required date', type: 'date', required: true },
      { name: 'orderId', label: 'Receiver order', type: 'lookup', lookupCategory: 'orders', required: true },
      { name: 'workPackageId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages' }
    ],
    validate: (p) => {
      const out = req(p, ['materialId', 'quantity', 'plantId', 'storageLocation', 'requiredDate', 'orderId']);
      if (Number(p['quantity']) <= 0) out.push({ severity: 'ERROR', field: 'quantity', message: 'Quantity must be positive.' });
      return out;
    },
    buildPayload: (p) => ({
      apiService: 'API_RESERVATION_DOCUMENT_SRV',
      ReservationDocument: {
        GoodsMovementType: '261', Material: p['materialId'], Plant: p['plantId'], StorageLocation: p['storageLocation'],
        ResvnItmRequiredQtyInBaseUnit: p['quantity'], RequirementDate: p['requiredDate'], MaintenanceOrder: p['orderId']
      },
      __simulateFailure: p['__simulateFailure']
    }),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: `RES-${txn.targetDocumentNumber ?? txn.transactionId}`, tenantId: ctx.tenantId, objectType: 'ReservationProxy',
        sourceSystem: 'SAP_S4', sourceMode: 'SIMULATOR', sourceObject: 'ReservationDocument',
        sourceReference: txn.targetDocumentNumber ?? 'PENDING', lifecycleState: 'created', approvalState: 'APPROVED',
        riskClass: 'MEDIUM', owner: ctx.user.id, sourceFreshness: nowIso(),
        createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(), correlationId: txn.correlationId,
        data: { ...p, desc: `Reservation ${txn.targetDocumentNumber} / ${p['materialId']} x ${p['quantity']}` }
      });
      // link demand if provided
      const demand = p['demandId'] as string | undefined;
      if (demand) setState(ctx.tenantId, demand, 'reserved', ctx, { reservation: txn.targetDocumentNumber });
    }
  },
  {
    id: 'material.request_pr',
    label: 'Request Procurement (PR)',
    description: 'Create SAP purchase requisition via API_PURCHASEREQUISITION_2.',
    screen: '/materials', businessCapability: 'Materials Management', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['procurement_user', 'material_planner'], approverRoles: ['sto_manager', 'finance_cost_controller'],
    sod: true, targetObjectType: 'PurchaseRequisitionProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-mm-pr', connectorOperation: 'create',
    fields: [
      { name: 'materialId', label: 'Material', type: 'lookup', lookupCategory: 'materials', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'plantId', label: 'Plant', type: 'lookup', lookupCategory: 'plants', required: true },
      { name: 'requiredDate', label: 'Required date', type: 'date', required: true },
      { name: 'purchasingGroup', label: 'Purchasing group', type: 'text', required: true },
      { name: 'accountAssignment', label: 'Account assignment (order/WBS)', type: 'lookup', lookupCategory: 'costObjects', required: true }
    ],
    validate: (p) => req(p, ['materialId', 'quantity', 'plantId', 'requiredDate', 'purchasingGroup', 'accountAssignment']),
    buildPayload: (p) => ({
      apiService: 'API_PURCHASEREQUISITION_2',
      PurchaseRequisition: { Material: p['materialId'], RequestedQuantity: p['quantity'], Plant: p['plantId'], DeliveryDate: p['requiredDate'], PurchasingGroup: p['purchasingGroup'], AccountAssignment: p['accountAssignment'] }
    })
  },
  {
    id: 'material.issue',
    label: 'Issue Material (Goods Issue)',
    description: 'Post goods issue via API_MATERIAL_DOCUMENT_SRV (movement 261) against reservation/order.',
    screen: '/materials', businessCapability: 'Materials Management', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['warehouse_lead'], approverRoles: ['material_planner', 'sto_manager'],
    sod: true, targetObjectType: 'GoodsMovementProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-mm-matdoc', connectorOperation: 'create',
    fields: [
      { name: 'reservation', label: 'Reservation', type: 'text', required: true },
      { name: 'materialId', label: 'Material', type: 'lookup', lookupCategory: 'materials', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'plantId', label: 'Plant', type: 'lookup', lookupCategory: 'plants', required: true }
    ],
    validate: (p) => req(p, ['reservation', 'materialId', 'quantity', 'plantId']),
    buildPayload: (p) => ({
      apiService: 'API_MATERIAL_DOCUMENT_SRV',
      MaterialDocument: { GoodsMovementCode: '03', Material: p['materialId'], QuantityInEntryUnit: p['quantity'], Plant: p['plantId'], Reservation: p['reservation'], GoodsMovementType: '261' }
    })
  },
  {
    id: 'material.substitute',
    label: 'Approve Material Substitute',
    description: 'Create a governed substitute decision for an unavailable material, preserving SAP material master and engineering approval traceability.',
    screen: '/materials', businessCapability: 'Materials Management', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['material_planner', 'maintenance_planner', 'reliability_engineer'], approverRoles: ['sto_manager', 'maintenance_supervisor'],
    requiresReason: true, sod: true, targetObjectType: 'MaterialSubstitutionRequest', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Demand / shortage', type: 'text', required: true },
      { name: 'originalMaterialId', label: 'Original material', type: 'lookup', lookupCategory: 'materials', required: true },
      { name: 'substituteMaterialId', label: 'Substitute material', type: 'lookup', lookupCategory: 'materials', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'reason', label: 'Engineering/material reason', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'originalMaterialId', 'substituteMaterialId', 'quantity', 'reason']);
      if (p['originalMaterialId'] === p['substituteMaterialId']) out.push({ severity: 'ERROR', field: 'substituteMaterialId', message: 'Substitute must differ from original material.' });
      return out;
    },
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('MSR'), tenantId: ctx.tenantId, objectType: 'MaterialSubstitutionRequest', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'MaterialSubstitutionRequest', sourceReference: txn.transactionId,
        lifecycleState: 'approved', approvalState: 'APPROVED', riskClass: 'HIGH', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId,
        data: { ...p, eventId: 'EV-1001', plantId: 'P100', approvalTrace: txn.transactionId }
      });
      setState(ctx.tenantId, p['sourceObjectId'] as string, 'substitution_approved', ctx, { substituteMaterialId: p['substituteMaterialId'] });
    }
  },
  {
    id: 'tool.reserve',
    label: 'Reserve Tool / Rental Equipment',
    description: 'Govern tool or rental equipment readiness; reserves internal tooling or stages a rental request for procurement/contractor coordination.',
    screen: '/materials', businessCapability: 'Tools & Logistics', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['material_planner', 'warehouse_lead', 'work_package_owner'], approverRoles: ['maintenance_supervisor'],
    sod: true, targetObjectType: 'ToolDemand', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Tool demand', type: 'text', required: true },
      { name: 'toolClass', label: 'Tool class', type: 'text', required: true },
      { name: 'needBy', label: 'Need by', type: 'date', required: true },
      { name: 'fulfillmentPath', label: 'Fulfillment path (reserve/rent)', type: 'text', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'toolClass', 'needBy', 'fulfillmentPath']);
      if (p['fulfillmentPath'] && !['reserve', 'rent'].includes(String(p['fulfillmentPath']))) {
        out.push({ severity: 'ERROR', field: 'fulfillmentPath', message: 'Fulfillment path must be reserve or rent.' });
      }
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, p['fulfillmentPath'] === 'rent' ? 'rental_requested' : 'reserved', ctx, { fulfillmentPath: p['fulfillmentPath'] })
  },

  // ======================= PERMITS / SAFETY =======================
  {
    id: 'permit.update_status',
    label: 'Update Permit Status (WCM)',
    description: 'Attempted direct write to WCM permit — exists to prove the platform fails closed. WCM is the safety source of record.',
    screen: '/permits', businessCapability: 'Safety / WCM', actionClass: 'CONTROLLED', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['wcm_authority'], approverRoles: ['wcm_authority'],
    sod: true, targetObjectType: 'PermitProxy', targetSystem: 'SAP_WCM',
    connectorId: 'sap-wcm', connectorOperation: 'update',
    fields: [
      { name: 'sourceObjectId', label: 'Permit', type: 'lookup', lookupCategory: 'permits', required: true },
      { name: 'newStatus', label: 'New status', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'newStatus'])
  },
  {
    id: 'permit.request_correction',
    label: 'Request Correction in WCM/ePTW',
    description: 'Create a correction request package routed to the WCM authority — the compliant path for permit changes.',
    screen: '/permits', businessCapability: 'Safety / WCM', actionClass: 'CONTROLLED', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['hse_safety_reviewer', 'maintenance_supervisor', 'wcm_authority'], approverRoles: ['wcm_authority'], requiresReason: true,
    sod: true, targetObjectType: 'SafetyReadinessException', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Permit', type: 'lookup', lookupCategory: 'permits', required: true },
      { name: 'reason', label: 'Correction needed', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'reason']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('SRE'), tenantId: ctx.tenantId, objectType: 'SafetyReadinessException', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'SafetyReadinessException', sourceReference: txn.transactionId,
        lifecycleState: 'routed_to_wcm', approvalState: 'APPROVED', riskClass: 'SAFETY_CRITICAL', owner: 'u-wcm',
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { permitId: p['sourceObjectId'], reason: p['reason'], plantId: 'P100' }
      });
    }
  },
  {
    id: 'permit.request_preplan',
    label: 'Request Isolation / Permit Preplan',
    description: 'Create a WCM/ePTW preplanning package for isolation, LOTO, blinds or gas testing. This does not write permit status; it routes work to the WCM authority.',
    screen: '/control-of-work', businessCapability: 'Safety / WCM', actionClass: 'CONTROLLED', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['work_package_owner', 'maintenance_planner', 'hse_safety_reviewer', 'maintenance_supervisor'], approverRoles: ['wcm_authority'],
    requiresReason: true, sod: true, targetObjectType: 'SafetyReadinessException', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'workPackageId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages', required: true },
      { name: 'preplanType', label: 'Preplan type', type: 'text', required: true },
      { name: 'requiredBy', label: 'Required by', type: 'date', required: true },
      { name: 'reason', label: 'Reason / hazard context', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['workPackageId', 'preplanType', 'requiredBy', 'reason']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('SRE'), tenantId: ctx.tenantId, objectType: 'SafetyReadinessException', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'PermitPreplanRequest', sourceReference: txn.transactionId,
        lifecycleState: 'routed_to_wcm', approvalState: 'APPROVED', riskClass: 'SAFETY_CRITICAL', owner: 'u-wcm',
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId,
        data: { wpId: p['workPackageId'], preplanType: p['preplanType'], requiredBy: p['requiredBy'], reason: p['reason'], plantId: 'P100' }
      });
    }
  },
  {
    id: 'simops.assign_mitigation',
    label: 'Assign SIMOPS Mitigation',
    description: 'Assign mitigation and owner for a SIMOPS conflict.',
    screen: '/area-risk', businessCapability: 'Safety / Area Risk', actionClass: 'ADVISORY', riskClass: 'HIGH',
    allowedRoles: ['hse_safety_reviewer', 'wcm_authority', 'sto_manager'], sod: false,
    targetObjectType: 'SIMOPSConflict', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Conflict ID', type: 'text', required: true },
      { name: 'mitigation', label: 'Mitigation', type: 'textarea', required: true },
      { name: 'ownerRole', label: 'Owner role', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'mitigation', 'ownerRole']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'mitigating', ctx, { mitigation: p['mitigation'], mitigationOwner: p['ownerRole'] })
  },
  {
    id: 'safety.acknowledge_location_alert',
    label: 'Acknowledge Location Risk Alert',
    description: 'Acknowledge an RTLS/geofence risk alert and assign a human mitigation. RTLS remains read-only; the platform records the response.',
    screen: '/execution-map', businessCapability: 'Safety / Area Risk', actionClass: 'CONTROLLED', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['hse_safety_reviewer', 'maintenance_supervisor', 'wcm_authority'], approverRoles: ['hse_safety_reviewer'],
    sod: true, targetObjectType: 'LocationRiskAlert', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Location alert', type: 'text', required: true },
      { name: 'mitigation', label: 'Mitigation', type: 'textarea', required: true },
      { name: 'ownerRole', label: 'Owner role', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'mitigation', 'ownerRole']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'acknowledged', ctx, { mitigation: p['mitigation'], mitigationOwner: p['ownerRole'] })
  },

  // ======================= CONTRACTORS / COST =======================
  {
    id: 'claim.decide',
    label: 'Approve / Reject Commercial Claim',
    description: 'Finance-critical claim decision with four-eyes.',
    screen: '/contractors', businessCapability: 'Commercial Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['contractor_coordinator', 'finance_cost_controller'], approverRoles: ['finance_cost_controller', 'sto_manager'], requiresReason: true,
    sod: true, targetObjectType: 'CommercialClaim', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Claim ID', type: 'text', required: true },
      { name: 'decision', label: 'Decision (approve/reject)', type: 'text', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'decision', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, p['decision'] === 'approve' ? 'approved' : 'rejected', ctx, { decisionReason: p['reason'] })
  },
  {
    id: 'ses.prepare',
    label: 'Prepare Service Entry Sheet',
    description: 'Create SES package in SAP via API_SERVICE_ENTRY_SHEET_SRV from contractor evidence.',
    screen: '/contractors', businessCapability: 'Commercial Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['contractor_coordinator', 'procurement_user'], approverRoles: ['finance_cost_controller'],
    sod: true, targetObjectType: 'ServiceEntrySheetProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-ses', connectorOperation: 'create',
    fields: [
      { name: 'vendorId', label: 'Vendor', type: 'lookup', lookupCategory: 'vendors', required: true },
      { name: 'purchaseOrder', label: 'Service PO', type: 'text', required: true },
      { name: 'amountUSD', label: 'Amount (USD)', type: 'number', required: true },
      { name: 'periodCovered', label: 'Period covered', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['vendorId', 'purchaseOrder', 'amountUSD', 'periodCovered']),
    buildPayload: (p) => ({ apiService: 'API_SERVICE_ENTRY_SHEET_SRV', ServiceEntrySheet: { PurchaseOrder: p['purchaseOrder'], Supplier: p['vendorId'], NetAmount: p['amountUSD'] } })
  },
  {
    id: 'forecast.submit_change',
    label: 'Submit Forecast Change',
    description: 'Submit cost forecast change with drivers; finance approval required.',
    screen: '/cost', businessCapability: 'Cost Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['finance_cost_controller', 'sto_manager'], approverRoles: ['event_sponsor', 'finance_cost_controller'], requiresReason: true,
    sod: true, targetObjectType: 'CostForecast', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'eventId', label: 'Event', type: 'lookup', lookupCategory: 'events', required: true },
      { name: 'forecastMUSD', label: 'New forecast (MUSD)', type: 'number', required: true },
      { name: 'reason', label: 'Drivers / reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['eventId', 'forecastMUSD', 'reason']),
    apply: (p, _t, ctx) => {
      const db = getDb();
      const ev = getObject(db, ctx.tenantId, p['eventId'] as string);
      if (ev) { ev.data['forecastMUSD'] = p['forecastMUSD']; touch(ev, ctx.user.id); }
    }
  },
  {
    id: 'accrual.post',
    label: 'Post Finance Accrual',
    description: 'Post labor/contractor accrual via SAP Journal Entry interface. Finance approval, period validation, idempotent, reversible.',
    screen: '/cost', businessCapability: 'Cost Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['finance_cost_controller'], approverRoles: ['finance_cost_controller', 'event_sponsor'], requiresReason: true,
    sod: true, targetObjectType: 'JournalEntryProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-fico-journal', connectorOperation: 'create',
    fields: [
      { name: 'companyCode', label: 'Company code', type: 'text', required: true },
      { name: 'postingPeriod', label: 'Posting period', type: 'text', required: true },
      { name: 'costObject', label: 'Cost object', type: 'lookup', lookupCategory: 'costObjects', required: true },
      { name: 'amountUSD', label: 'Amount (USD)', type: 'number', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['companyCode', 'postingPeriod', 'costObject', 'amountUSD', 'reason']);
      if (p['postingPeriod'] && !/^\d{4}-\d{2}$/.test(String(p['postingPeriod']))) {
        out.push({ severity: 'ERROR', field: 'postingPeriod', message: 'Posting period must be YYYY-MM.' });
      }
      return out;
    },
    buildPayload: (p) => ({
      apiService: 'JournalEntryCreateRequest', JournalEntry: {
        CompanyCode: p['companyCode'], PostingDate: `${p['postingPeriod']}-30`, AccrualItem: { CostObject: p['costObject'], AmountInCoCodeCrcy: p['amountUSD'] }
      }
    })
  },
  {
    id: 'contract.reconcile_invoice',
    label: 'Reconcile Invoice Variance',
    description: 'Reconcile vendor invoice variance against schedule progress, earned value, SES evidence and contract terms.',
    screen: '/contract-performance', businessCapability: 'Commercial Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['finance_cost_controller', 'contractor_coordinator'], approverRoles: ['finance_cost_controller', 'sto_manager'],
    requiresReason: true, sod: true, targetObjectType: 'InvoiceScheduleVariance', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Variance case', type: 'text', required: true },
      { name: 'decision', label: 'Decision (accept/dispute/accrue)', type: 'text', required: true },
      { name: 'reason', label: 'Commercial reason', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'decision', 'reason']);
      if (p['decision'] && !['accept', 'dispute', 'accrue'].includes(String(p['decision']))) out.push({ severity: 'ERROR', field: 'decision', message: 'Decision must be accept, dispute or accrue.' });
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, `variance_${p['decision']}`, ctx, { decisionReason: p['reason'] })
  },
  {
    id: 'cost.reconcile_case',
    label: 'Resolve Cost Reconciliation Case',
    description: 'Resolve a commitment/actual/accrual mismatch with root-cause, evidence and next-step posting path.',
    screen: '/cost-reconciliation', businessCapability: 'Cost Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['finance_cost_controller', 'sto_manager'], approverRoles: ['finance_cost_controller', 'event_sponsor'],
    requiresReason: true, sod: true, targetObjectType: 'CostReconciliationCase', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Reconciliation case', type: 'text', required: true },
      { name: 'resolutionPath', label: 'Resolution path', type: 'text', required: true },
      { name: 'evidenceRef', label: 'Evidence reference', type: 'text', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'resolutionPath', 'evidenceRef', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'resolved', ctx, { resolutionPath: p['resolutionPath'], evidenceRef: p['evidenceRef'], reason: p['reason'] })
  },
  {
    id: 'accrual.approve_post',
    label: 'Approve & Post Accrual Estimate',
    description: 'Post a governed accrual estimate to SAP FI/CO Journal Entry after confidence and evidence validation.',
    screen: '/cost-reconciliation', businessCapability: 'Cost Control', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['finance_cost_controller'], approverRoles: ['finance_cost_controller', 'event_sponsor'],
    requiresReason: true, sod: true, targetObjectType: 'JournalEntryProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-fico-journal', connectorOperation: 'create',
    fields: [
      { name: 'sourceObjectId', label: 'Accrual estimate', type: 'text', required: true },
      { name: 'companyCode', label: 'Company code', type: 'text', required: true },
      { name: 'postingPeriod', label: 'Posting period', type: 'text', required: true },
      { name: 'costObject', label: 'Cost object', type: 'lookup', lookupCategory: 'costObjects', required: true },
      { name: 'amountUSD', label: 'Amount (USD)', type: 'number', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'companyCode', 'postingPeriod', 'costObject', 'amountUSD', 'reason']);
      if (p['postingPeriod'] && !/^\d{4}-\d{2}$/.test(String(p['postingPeriod']))) out.push({ severity: 'ERROR', field: 'postingPeriod', message: 'Posting period must be YYYY-MM.' });
      return out;
    },
    buildPayload: (p) => ({
      apiService: 'JournalEntryCreateRequest',
      JournalEntry: {
        CompanyCode: p['companyCode'], PostingDate: `${p['postingPeriod']}-30`,
        HeaderText: `STO accrual ${p['sourceObjectId']}`,
        AccrualItem: { CostObject: p['costObject'], AmountInCoCodeCrcy: p['amountUSD'], Reason: p['reason'] }
      }
    }),
    apply: (p, txn, ctx) => {
      setState(ctx.tenantId, p['sourceObjectId'] as string, 'posted', ctx, { accountingDocument: txn.targetDocumentNumber });
      const db = getDb();
      putObject(db, {
        id: `JE-${txn.targetDocumentNumber ?? txn.transactionId}`, tenantId: ctx.tenantId, objectType: 'JournalEntryProxy',
        sourceSystem: 'SAP_S4', sourceMode: 'SIMULATOR', sourceObject: 'JournalEntry', sourceReference: txn.targetDocumentNumber ?? 'PENDING',
        lifecycleState: 'created', approvalState: 'APPROVED', riskClass: 'FINANCE_CRITICAL', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId, data: { ...p, desc: `Accrual ${p['sourceObjectId']} posted` }
      });
    }
  },
  {
    id: 'analytics.create_action',
    label: 'Create Action From Insight',
    description: 'Convert a KPI exception into a routed work item with source-object traceability.',
    screen: '/analytics', businessCapability: 'Analytics & Insights', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['sto_manager', 'outage_manager', 'scheduler_project_controls', 'finance_cost_controller', 'hse_safety_reviewer'], sod: false,
    targetObjectType: 'ExceptionToAction', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Action title', type: 'text', required: true },
      { name: 'sourceKpi', label: 'Source KPI', type: 'text', required: true },
      { name: 'targetRoute', label: 'Owning screen route', type: 'text', required: true },
      { name: 'ownerRole', label: 'Owner role', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['title', 'sourceKpi', 'targetRoute', 'ownerRole']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('ETA'), tenantId: ctx.tenantId, objectType: 'ExceptionToAction', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'ExceptionToAction', sourceReference: txn.transactionId,
        lifecycleState: 'open', approvalState: 'NOT_REQUIRED', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        correlationId: txn.correlationId, data: { ...p, eventId: 'EV-1001' }
      });
    }
  },

  // ======================= EXECUTION / LABOR =======================
  {
    id: 'progress.submit',
    label: 'Submit Field Progress',
    description: 'Submit progress for an operation. Requires valid work package + SAP operation and active WCM clearance.',
    screen: '/field', businessCapability: 'Execution', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['field_technician', 'maintenance_supervisor', 'crew_supervisor'], sod: false,
    targetObjectType: 'FieldProgressEvent', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'workPackageId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages', required: true },
      { name: 'operationId', label: 'SAP operation', type: 'lookup', lookupCategory: 'operations', required: true },
      { name: 'progressPct', label: 'Progress %', type: 'number', required: true },
      { name: 'note', label: 'Note', type: 'textarea' }
    ],
    validate: (p, ctx) => {
      const out = req(p, ['workPackageId', 'operationId', 'progressPct']);
      const db = getDb();
      const wp = getObject(db, ctx.tenantId, p['workPackageId'] as string);
      if (wp && wp.lifecycleState !== 'released') out.push({ severity: 'ERROR', message: `Work package ${wp.id} is not released — field work cannot start.` });
      const suspended = wp ? listObjects(db, ctx.tenantId, 'PermitProxy', (o) => o.data['wpId'] === wp.id && ['suspended', 'expired'].includes(o.lifecycleState)) : [];
      if (suspended.length) out.push({ severity: 'ERROR', message: `WCM clearance fail-closed: ${suspended.map((s) => s.id).join(', ')} not active.` });
      return out;
    },
    apply: (p, txn, ctx) => {
      const db = getDb();
      const ex = listObjects(db, ctx.tenantId, 'OperationExecution', (o) => o.data['operationId'] === p['operationId'])[0];
      if (ex) { ex.data['progressPct'] = p['progressPct']; touch(ex, ctx.user.id); }
    }
  },
  {
    id: 'plan.publish',
    label: 'Publish Daily Execution Plan',
    description: 'Publish the daily plan after verifying critical path jobs, crew coverage, permits, tools, material kits and SIMOPS readiness.',
    screen: '/execution-map', businessCapability: 'Execution', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['maintenance_supervisor', 'scheduler_project_controls', 'sto_manager'], approverRoles: ['outage_manager', 'sto_manager'],
    sod: true, targetObjectType: 'DailyExecutionPlan', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Daily plan', type: 'text', required: true },
      { name: 'publishNote', label: 'Publish note', type: 'textarea', required: true },
      { name: 'reason', label: 'Decision reason', type: 'textarea', required: true }
    ],
    validate: (p, ctx) => {
      const out = req(p, ['sourceObjectId', 'publishNote', 'reason']);
      const db = getDb();
      const plan = getObject(db, ctx.tenantId, p['sourceObjectId'] as string);
      const blockers = ((plan?.data['blockers'] ?? []) as unknown[]).length;
      if (blockers > 0) out.push({ severity: 'ERROR', message: `Daily plan has ${blockers} unresolved blocker(s).` });
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'published', ctx, { publishNote: p['publishNote'] })
  },
  {
    id: 'progress.supervisor_accept',
    label: 'Accept Progress Update',
    description: 'Supervisor acceptance of a mobile/field progress update before it can drive SAP confirmation or schedule earned value.',
    screen: '/execution-map', businessCapability: 'Execution', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['maintenance_supervisor', 'crew_supervisor'], approverRoles: ['maintenance_supervisor', 'sto_manager'],
    sod: true, targetObjectType: 'ProgressUpdate', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Progress update', type: 'text', required: true },
      { name: 'acceptedProgressPct', label: 'Accepted progress %', type: 'number', required: true },
      { name: 'acceptanceNote', label: 'Acceptance note', type: 'textarea', required: true }
    ],
    validate: (p) => {
      const out = req(p, ['sourceObjectId', 'acceptedProgressPct', 'acceptanceNote']);
      if (Number(p['acceptedProgressPct']) < 0 || Number(p['acceptedProgressPct']) > 100) out.push({ severity: 'ERROR', field: 'acceptedProgressPct', message: 'Accepted progress must be 0..100.' });
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'accepted', ctx, { acceptedProgressPct: p['acceptedProgressPct'], acceptanceNote: p['acceptanceNote'] })
  },
  {
    id: 'operation.confirm',
    label: 'Confirm Operation (SAP PM)',
    description: 'Post PM order confirmation via API_MAINTORDERCONFIRMATION.',
    screen: '/field', businessCapability: 'Execution', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['maintenance_supervisor', 'crew_supervisor'], approverRoles: ['maintenance_supervisor', 'sto_manager'],
    sod: true, targetObjectType: 'MaintenanceOrderConfirmationProxy', targetSystem: 'SAP_S4',
    connectorId: 'sap-eam-confirmation', connectorOperation: 'confirm',
    fields: [
      { name: 'orderId', label: 'Order', type: 'lookup', lookupCategory: 'orders', required: true },
      { name: 'operationId', label: 'Operation', type: 'lookup', lookupCategory: 'operations', dependsOn: ['orderId'], required: true },
      { name: 'actualHours', label: 'Actual hours', type: 'number', required: true },
      { name: 'finalConfirmation', label: 'Final confirmation', type: 'boolean' }
    ],
    validate: (p, ctx) => {
      const out = req(p, ['orderId', 'operationId', 'actualHours']);
      if (p['finalConfirmation']) {
        const db = getDb();
        const wp = listObjects(db, ctx.tenantId, 'WorkPackage', (o) => o.data['orderId'] === p['orderId'])[0];
        if (wp) {
          const punchA = listObjects(db, ctx.tenantId, 'PunchItem', (o) => o.data['wpId'] === wp.id && o.data['sevClass'] === 'A' && o.lifecycleState === 'open');
          if (punchA.length) out.push({ severity: 'ERROR', message: `Final confirmation blocked: open class-A punch ${punchA.map((x) => x.id).join(', ')}.` });
        }
      }
      return out;
    },
    buildPayload: (p) => ({
      apiService: 'API_MAINTORDERCONFIRMATION',
      Confirmation: { MaintenanceOrder: p['orderId'], MaintenanceOrderOperation: p['operationId'], ActualWorkQuantity: p['actualHours'], IsFinalConfirmation: !!p['finalConfirmation'] }
    })
  },
  {
    id: 'labor.submit',
    label: 'Submit Time Entry',
    description: 'Create a labor entry with worker/cost-object/pay-code lookups; validates effective-dated worker and open pay period.',
    screen: '/labor-time', businessCapability: 'Time & Labor', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['timekeeper', 'crew_supervisor', 'field_technician'], sod: false,
    targetObjectType: 'LaborEntry', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'workerId', label: 'Worker', type: 'lookup', lookupCategory: 'workers', required: true },
      { name: 'workDate', label: 'Work date', type: 'date', required: true },
      { name: 'hours', label: 'Hours', type: 'number', required: true },
      { name: 'payCode', label: 'Pay code', type: 'lookup', lookupCategory: 'payCodes', required: true },
      { name: 'costObject', label: 'Cost object', type: 'lookup', lookupCategory: 'costObjects', required: true }
    ],
    validate: (p, ctx) => {
      const out = req(p, ['workerId', 'workDate', 'hours', 'payCode', 'costObject']);
      const db = getDb();
      const w = getObject(db, ctx.tenantId, p['workerId'] as string);
      if (w && p['workDate']) {
        const d = p['workDate'] as string;
        if ((w.data['effectiveFrom'] as string) > d || (w.data['effectiveTo'] as string) < d) {
          out.push({ severity: 'ERROR', field: 'workDate', message: 'Worker not effective on this date.' });
        }
      }
      if (Number(p['hours']) > 16) out.push({ severity: 'ERROR', field: 'hours', message: 'Fatigue rule: more than 16h/day requires exception approval.' });
      return out;
    },
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('LE'), tenantId: ctx.tenantId, objectType: 'LaborEntry', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'LaborEntry', sourceReference: txn.transactionId,
        lifecycleState: 'submitted', approvalState: 'PENDING', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, date: p['workDate'], state: 'submitted', plantId: 'P100', eventId: 'EV-1001', payPeriod: 'PP-2026-14' }
      });
    }
  },
  {
    id: 'labor.post_cats',
    label: 'Approve Crew Time → Post to CATS',
    description: 'Approve crew time and post workforce timesheet via API_MANAGE_WORKFORCE_TIMESHEET (SAP_COM_0027).',
    screen: '/labor-time', businessCapability: 'Time & Labor', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['crew_supervisor', 'timekeeper'], approverRoles: ['maintenance_supervisor', 'sto_manager'],
    sod: true, targetObjectType: 'WorkforceTimesheet', targetSystem: 'SAP_S4',
    connectorId: 'sap-cats', connectorOperation: 'create',
    fields: [
      { name: 'laborEntryId', label: 'Labor entry', type: 'text', required: true },
      { name: 'workerId', label: 'Worker', type: 'lookup', lookupCategory: 'workers', required: true },
      { name: 'costObject', label: 'Cost object', type: 'lookup', lookupCategory: 'costObjects', required: true },
      { name: 'hours', label: 'Hours', type: 'number', required: true },
      { name: 'payCode', label: 'Pay code', type: 'lookup', lookupCategory: 'payCodes', required: true }
    ],
    validate: (p) => req(p, ['laborEntryId', 'workerId', 'costObject', 'hours', 'payCode']),
    buildPayload: (p, ctx) => {
      const db = getDb();
      const pay = getObject(db, ctx.tenantId, p['payCode'] as string);
      return {
        apiService: 'API_MANAGE_WORKFORCE_TIMESHEET', communicationScenario: 'SAP_COM_0027',
        TimeSheetEntry: {
          PersonWorkAgreement: p['workerId'], TimeSheetDate: p['workDate'] ?? nowIso().slice(0, 10),
          RecordedQuantity: p['hours'], CostObject: p['costObject'], WageType: pay?.data['wageType'] ?? 'WT-1000'
        }
      };
    },
    apply: (p, txn, ctx) => setState(ctx.tenantId, p['laborEntryId'] as string, 'posted_cats', ctx, { catsRef: txn.targetDocumentNumber, state: 'approved' })
  },
  {
    id: 'payroll.release',
    label: 'Release Payroll Batch',
    description: 'Release approved time to payroll gateway. Separate object from CATS/PM confirmation — never implies finance posting.',
    screen: '/labor-time', businessCapability: 'Time & Labor', actionClass: 'CONTROLLED', riskClass: 'FINANCE_CRITICAL',
    allowedRoles: ['payroll_user'], approverRoles: ['finance_cost_controller'], requiresReason: true,
    sod: true, targetObjectType: 'PayrollBatch', targetSystem: 'PAYROLL',
    connectorId: 'payroll-gateway', connectorOperation: 'create',
    fields: [
      { name: 'payPeriod', label: 'Pay period', type: 'lookup', lookupCategory: 'payPeriods', required: true },
      { name: 'entryCount', label: 'Entries in batch', type: 'number', required: true },
      { name: 'reason', label: 'Release note', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['payPeriod', 'entryCount', 'reason']),
    buildPayload: (p) => ({ PayrollBatch: { period: p['payPeriod'], entries: p['entryCount'], mappingVersion: 'wage-map-v3' } })
  },

  // ======================= QA / TURNOVER / STARTUP =======================
  {
    id: 'punch.create',
    label: 'Create Punch Item',
    description: 'Raise a punch item with severity class and owner.',
    screen: '/qa', businessCapability: 'Quality & Turnover', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['qa_qc_inspector', 'field_technician', 'maintenance_supervisor', 'turnover_coordinator'], sod: false,
    targetObjectType: 'PunchItem', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'sevClass', label: 'Severity (A/B/C)', type: 'text', required: true },
      { name: 'workPackageId', label: 'Work package', type: 'lookup', lookupCategory: 'workPackages', required: true }
    ],
    validate: (p) => req(p, ['title', 'sevClass', 'workPackageId']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('PUNCH'), tenantId: ctx.tenantId, objectType: 'PunchItem', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'PunchItem', sourceReference: txn.transactionId,
        lifecycleState: 'open', approvalState: 'NOT_REQUIRED', riskClass: p['sevClass'] === 'A' ? 'HIGH' : 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { title: p['title'], sevClass: p['sevClass'], wpId: p['workPackageId'], eventId: 'EV-1001', plantId: 'P100' }
      });
    }
  },
  {
    id: 'punch.close',
    label: 'Close & Verify Punch',
    description: 'Close punch with evidence; class A requires QA verification approval.',
    screen: '/qa', businessCapability: 'Quality & Turnover', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['qa_qc_inspector', 'maintenance_supervisor'], approverRoles: ['qa_qc_inspector', 'turnover_coordinator'], requiresReason: true,
    sod: true, targetObjectType: 'PunchItem', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Punch ID', type: 'text', required: true },
      { name: 'reason', label: 'Closure evidence', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'closed', ctx, { closureEvidence: p['reason'] })
  },
  {
    id: 'turnover.approve',
    label: 'Approve Turnover Package',
    description: 'Approve system turnover. Blocked with open class-A punch, missing inspection or open permits.',
    screen: '/qa', businessCapability: 'Quality & Turnover', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['turnover_coordinator'], approverRoles: ['operations_startup_authority'], requiresReason: true,
    sod: true, targetObjectType: 'TurnoverPackage', targetSystem: 'STO_PLATFORM',
    fields: [{ name: 'sourceObjectId', label: 'Turnover package', type: 'text', required: true }],
    validate: (p, ctx) => {
      const out = req(p, ['sourceObjectId']);
      const db = getDb();
      const top = getObject(db, ctx.tenantId, p['sourceObjectId'] as string);
      if (top) {
        const wpIds = (top.data['wpIds'] as string[]) ?? [];
        const punchA = listObjects(db, ctx.tenantId, 'PunchItem', (o) => wpIds.includes(o.data['wpId'] as string) && o.data['sevClass'] === 'A' && o.lifecycleState === 'open');
        if (punchA.length) out.push({ severity: 'ERROR', message: `Turnover blocked: open class-A punch ${punchA.map((x) => x.id).join(', ')}.` });
      }
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'approved', ctx)
  },
  {
    id: 'startup.approve_rts',
    label: 'Approve Return to Service',
    description: 'Human operations authority approves RTS. Blocked while PSSR incomplete, class-A punch open, or isolations not restored. AI can never execute this.',
    screen: '/startup-readiness', businessCapability: 'Startup & RTS', actionClass: 'BLOCKED_FOR_AI', riskClass: 'SAFETY_CRITICAL',
    allowedRoles: ['operations_startup_authority'], approverRoles: ['operations_startup_authority'], requiresReason: true,
    sod: true, targetObjectType: 'StartupReadiness', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Startup readiness ID', type: 'text', required: true },
      { name: 'reason', label: 'Authority statement', type: 'textarea', required: true }
    ],
    validate: (p, ctx) => {
      const out = req(p, ['sourceObjectId', 'reason']);
      const db = getDb();
      const sur = getObject(db, ctx.tenantId, p['sourceObjectId'] as string);
      const blockers = (sur?.data['blockers'] as string[]) ?? [];
      if (blockers.length) out.push({ severity: 'ERROR', message: `RTS blocked: ${blockers.join(' | ')}` });
      return out;
    },
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'approved_rts', ctx)
  },

  // ======================= LESSONS / DATA / ADMIN =======================
  {
    id: 'lesson.capture',
    label: 'Capture Lesson Learned',
    description: 'Capture a lesson with root cause and proposed corrective action.',
    screen: '/lessons', businessCapability: 'Continuous Improvement', actionClass: 'ADVISORY', riskClass: 'LOW',
    allowedRoles: ['*'], sod: false, targetObjectType: 'LessonLearned', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text', required: true },
      { name: 'rootCause', label: 'Root cause', type: 'textarea', required: true },
      { name: 'proposedAction', label: 'Proposed corrective action', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['title', 'category', 'rootCause', 'proposedAction']),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('LL'), tenantId: ctx.tenantId, objectType: 'LessonLearned', sourceSystem: 'STO_PLATFORM',
        sourceMode: 'SIMULATOR', sourceObject: 'LessonLearned', sourceReference: txn.transactionId,
        lifecycleState: 'draft', approvalState: 'NOT_REQUIRED', riskClass: 'LOW', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, eventId: 'EV-1001' }
      });
    }
  },
  {
    id: 'capa.approve',
    label: 'Approve Corrective Action',
    description: 'Approve a corrective action from a lesson learned.',
    screen: '/lessons', businessCapability: 'Continuous Improvement', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['sto_manager', 'reliability_engineer'], approverRoles: ['sto_manager', 'event_sponsor'], requiresReason: true,
    sod: true, targetObjectType: 'CorrectiveAction', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Lesson ID', type: 'text', required: true },
      { name: 'reason', label: 'Approval note', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'action_approved', ctx)
  },
  {
    id: 'dataproduct.certify',
    label: 'Certify Data Product',
    description: 'Certify a governed data product with owner, lineage, refresh and quality evidence.',
    screen: '/data-foundation', businessCapability: 'Data Foundation', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['data_steward'], approverRoles: ['tenant_admin', 'sto_manager'], requiresReason: true,
    sod: true, targetObjectType: 'DataProduct', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'sourceObjectId', label: 'Data product', type: 'lookup', lookupCategory: 'dataProducts', required: true },
      { name: 'reason', label: 'Certification evidence', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['sourceObjectId', 'reason']),
    apply: (p, _t, ctx) => setState(ctx.tenantId, p['sourceObjectId'] as string, 'certified', ctx, { certifiedBy: ctx.user.id, certifiedAt: nowIso() })
  },
  {
    id: 'mdg.submit_change',
    label: 'Submit Master Data Change (MDG)',
    description: 'Route master data change through SAP MDG change request — never direct table writes.',
    screen: '/data-foundation', businessCapability: 'Data Foundation', actionClass: 'CONTROLLED', riskClass: 'MEDIUM',
    allowedRoles: ['data_steward', 'material_planner'], approverRoles: ['data_steward', 'tenant_admin'],
    sod: true, targetObjectType: 'MDGChangeRequest', targetSystem: 'SAP_MDG',
    connectorId: 'sap-mdg', connectorOperation: 'create',
    fields: [
      { name: 'objectType', label: 'Master object type', type: 'text', required: true },
      { name: 'objectId', label: 'Object ID', type: 'text', required: true },
      { name: 'changeSummary', label: 'Change summary', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['objectType', 'objectId', 'changeSummary']),
    buildPayload: (p) => ({ MDGChangeRequest: { ObjectType: p['objectType'], ObjectID: p['objectId'], Description: p['changeSummary'] } })
  },
  {
    id: 'connector.toggle',
    label: 'Enable / Disable Connector',
    description: 'Enable or disable a connector. Disabled connectors block writes server-side; queued messages hold in outbox.',
    screen: '/connectors', businessCapability: 'Integration Operations', actionClass: 'CONTROLLED', riskClass: 'HIGH',
    allowedRoles: ['integration_operator', 'tenant_admin'], approverRoles: ['tenant_admin', 'integration_operator'], requiresReason: true,
    sod: true, targetObjectType: 'ConnectorRuntime', targetSystem: 'STO_PLATFORM',
    fields: [
      { name: 'connectorId', label: 'Connector', type: 'lookup', lookupCategory: 'connectors', required: true },
      { name: 'enabled', label: 'Enabled', type: 'boolean', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ],
    validate: (p) => req(p, ['connectorId', 'reason']),
    apply: (p) => {
      const db = getDb();
      const c = db.connectors.get(p['connectorId'] as string);
      if (c) { c.enabled = !!p['enabled']; c.sourceMode = c.enabled ? 'SIMULATOR' : 'DISABLED'; }
    }
  },
  {
    id: 'incident.create',
    label: 'Create Integration Incident (ServiceNow)',
    description: 'Open an incident in ServiceNow for an integration failure.',
    screen: '/resilience', businessCapability: 'Integration Operations', actionClass: 'ADVISORY', riskClass: 'MEDIUM',
    allowedRoles: ['integration_operator', 'tenant_admin'], sod: false,
    targetObjectType: 'IntegrationIncident', targetSystem: 'SERVICENOW',
    connectorId: 'servicenow', connectorOperation: 'create',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'connectorId', label: 'Connector', type: 'lookup', lookupCategory: 'connectors', required: true },
      { name: 'severity', label: 'Severity', type: 'text', required: true }
    ],
    validate: (p) => req(p, ['title', 'connectorId', 'severity']),
    buildPayload: (p) => ({ incident: { short_description: p['title'], severity: p['severity'], cmdb_ci: p['connectorId'] } }),
    apply: (p, txn, ctx) => {
      const db = getDb();
      putObject(db, {
        id: newId('II'), tenantId: ctx.tenantId, objectType: 'IntegrationIncident', sourceSystem: 'SERVICENOW',
        sourceMode: 'SIMULATOR', sourceObject: 'Incident', sourceReference: txn.targetDocumentNumber ?? 'PENDING',
        lifecycleState: 'open', approvalState: 'NOT_REQUIRED', riskClass: 'MEDIUM', owner: ctx.user.id,
        sourceFreshness: nowIso(), createdBy: ctx.user.id, createdAt: nowIso(), updatedBy: ctx.user.id, updatedAt: nowIso(),
        data: { ...p, servicenowRef: txn.targetDocumentNumber }
      });
    }
  }
];

const INDEX = new Map(ACTIONS.map((a) => [a.id, a]));

export function getActionById(id: string): ActionDefinition | undefined {
  return INDEX.get(id);
}

export function actionCatalog() {
  return ACTIONS.map((a) => ({
    id: a.id, label: a.label, description: a.description, screen: a.screen,
    businessCapability: a.businessCapability, actionClass: a.actionClass, riskClass: a.riskClass,
    allowedRoles: a.allowedRoles, approverRoles: a.approverRoles, sod: a.sod, requiresReason: a.requiresReason,
    targetObjectType: a.targetObjectType, targetSystem: a.targetSystem,
    connectorId: a.connectorId, connectorOperation: a.connectorOperation, fields: a.fields
  }));
}
