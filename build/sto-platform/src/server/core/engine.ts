/**
 * Governed action execution engine.
 *
 * Single pipeline for every screen action (section 24.2: UI -> domain service
 * -> action service -> connector adapter). Enforces RBAC, ABAC scope, AI
 * policy, validation, posting-path decision, canonical transaction envelope,
 * approval + SoD, outbox dispatch, and audit. No other write path exists.
 */

import type {
  ActionContext,
  ActionDefinition,
  ActorType,
  CanonicalTransaction,
  ExecuteResult,
  User,
  ValidationResult
} from './types';
import type { Db } from './store';
import { hashPayload, newCorrelationId, newId, nowIso } from './ids';
import { writeAudit } from './audit';
import { decidePostingPath } from './postingPath';
import { inScope, roleAllowed, sodViolation } from './rbac';
import { enqueueOutbox, processOutbox } from './outbox';
import { getActionById } from '../domain/registry';

export function resolveUser(db: Db, userId: string): User {
  const u = db.users.get(userId);
  if (!u) throw new Error(`Unknown user ${userId}`);
  return u;
}

function deterministicIdempotencyKey(tenantId: string, actionId: string, payload: Record<string, unknown>): string {
  const business = { ...payload };
  delete business['reason'];
  delete business['comment'];
  return `${tenantId}:${actionId}:${hashPayload(business)}`;
}

export async function executeAction(
  db: Db,
  actionId: string,
  payload: Record<string, unknown>,
  userId: string,
  actorType: ActorType = 'HUMAN',
  screen = 'api'
): Promise<ExecuteResult> {
  const action = getActionById(actionId);
  if (!action) return { ok: false, message: `Unknown action '${actionId}'.` };
  const user = resolveUser(db, userId);
  const ctx: ActionContext = { user, actorType, tenantId: user.tenantId, screen };

  // ---- AI policy gateway: controlled actions can never execute for AI actors
  if (actorType === 'AI_AGENT' && (action.actionClass === 'CONTROLLED' || action.actionClass === 'BLOCKED_FOR_AI')) {
    writeAudit(db, {
      tenantId: user.tenantId, actor: userId, actorType: 'AI_AGENT', action: 'ai.blocked_action_attempt',
      objectType: action.targetObjectType, objectId: actionId,
      details: { reason: 'AI actors cannot execute controlled actions', actionClass: action.actionClass }
    });
    return {
      ok: false,
      blocked: true,
      blockedReason: `AI policy: '${action.label}' is ${action.actionClass}. AI may only produce a review package; a human ${action.approverRoles?.join(' / ') ?? 'authority'} must decide.`,
      message: 'Blocked by AI governance policy.'
    };
  }

  // ---- RBAC
  if (!roleAllowed(user, action.allowedRoles)) {
    writeAudit(db, {
      tenantId: user.tenantId, actor: user.name, actorType, actorRole: user.role, action: 'rbac.denied',
      objectType: action.targetObjectType, objectId: actionId, details: { required: action.allowedRoles }
    });
    return { ok: false, blocked: true, blockedReason: `Role '${user.role}' is not authorized for '${action.label}'. Required: ${action.allowedRoles.join(', ')}.`, message: 'Not authorized.' };
  }

  // ---- ABAC scope (plant/unit)
  if (payload['plantId'] && !inScope(user, { data: payload })) {
    return { ok: false, blocked: true, blockedReason: `Plant/unit outside your assigned scope (${user.scopes.plants.join(', ') || 'all'}).`, message: 'Out of scope.' };
  }

  // ---- Reason requirement
  if (action.requiresReason && !(payload['reason'] as string)?.trim()) {
    return { ok: false, validation: [{ severity: 'ERROR', field: 'reason', message: 'A reason is required for this controlled action.' }], message: 'Validation failed.' };
  }

  // ---- Validation
  const validation: ValidationResult[] = action.validate(payload, ctx);
  if (validation.some((v) => v.severity === 'ERROR')) {
    return { ok: false, validation, message: 'Validation failed.' };
  }

  // ---- Posting path decision (single pure engine)
  const connector = action.connectorId ? db.connectors.get(action.connectorId) : undefined;
  const decision = decidePostingPath({
    actorType,
    actionClass: action.actionClass,
    targetSystem: action.targetSystem,
    connectorWritePolicy: connector?.writePolicy,
    connectorId: connector?.connectorId,
    connectorEnabled: connector?.enabled,
    hasReleasedWriteApi: connector ? connector.capabilities.create || connector.capabilities.update : undefined,
    regulated: action.riskClass === 'SAFETY_CRITICAL' || action.riskClass === 'FINANCE_CRITICAL'
  });

  if (decision.path === 'FAIL_CLOSED') {
    writeAudit(db, {
      tenantId: user.tenantId, actor: user.name, actorType, actorRole: user.role, action: 'posting_path.fail_closed',
      objectType: action.targetObjectType, objectId: actionId, details: { reason: decision.reason }
    });
    return { ok: false, blocked: true, blockedReason: decision.reason, message: 'Write blocked: fail-closed target.' };
  }
  if (decision.path === 'READ_IMPACT_ONLY' && action.actionClass === 'CONTROLLED') {
    return { ok: false, blocked: true, blockedReason: decision.reason, message: 'Target is read-only from this platform.' };
  }

  // ---- Idempotency: identical business resubmit returns the same transaction
  const idempotencyKey = deterministicIdempotencyKey(user.tenantId, actionId, payload);
  const existingId = db.idempotencyIndex.get(idempotencyKey);
  if (existingId) {
    const existing = db.transactions.get(existingId)!;
    return { ok: true, transaction: existing, validation, message: `Idempotent resubmit: returning existing transaction ${existing.transactionId} (${existing.lifecycleState}).` };
  }

  // ---- Canonical transaction envelope
  const payloadPreview = action.buildPayload ? action.buildPayload(payload, ctx) : undefined;
  const txn: CanonicalTransaction = {
    transactionId: newId('txn'),
    tenantId: user.tenantId,
    businessCapability: action.businessCapability,
    transactionType: action.connectorOperation ?? 'local',
    actionId: action.id,
    sourceScreen: screen,
    sourceObject: (payload['sourceObjectId'] as string) ?? action.targetObjectType,
    targetObject: action.targetObjectType,
    sourceSystem: 'STO_PLATFORM',
    targetSystem: action.targetSystem,
    sourceReferences: [payload['sourceObjectId'] as string].filter(Boolean) as string[],
    targetReferences: [],
    lifecycleState: 'validated',
    approvalState: decision.requiresApproval ? 'PENDING' : 'NOT_REQUIRED',
    riskClass: action.riskClass,
    actionClass: action.actionClass,
    connectorId: connector?.connectorId,
    connectorMode: connector?.sourceMode,
    mappingVersion: connector?.mappingVersion,
    idempotencyKey,
    correlationId: newCorrelationId(),
    submittedBy: user.id,
    submittedByRole: user.role,
    currentOwner: user.id,
    currentApprover: decision.requiresApproval ? (action.approverRoles?.[0] ?? 'sto_manager') : undefined,
    businessFields: payload,
    lineItems: (payload['lineItems'] as Record<string, unknown>[]) ?? [],
    attachments: (payload['attachments'] as string[]) ?? [],
    validationResults: validation,
    payloadPreview,
    payloadHash: payloadPreview ? hashPayload(payloadPreview) : undefined,
    reconciliationStatus: 'NOT_STARTED',
    postingPath: decision,
    aiEvidence: (payload['aiEvidence'] as string[]) ?? [],
    retryCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), state: 'validated', actor: user.name }]
  };
  db.transactions.set(txn.transactionId, txn);
  db.idempotencyIndex.set(idempotencyKey, txn.transactionId);

  writeAudit(db, {
    tenantId: user.tenantId, actor: user.name, actorType, actorRole: user.role,
    action: `action.submit:${action.id}`, objectType: action.targetObjectType, objectId: txn.transactionId,
    correlationId: txn.correlationId, reason: payload['reason'] as string | undefined,
    details: { postingPath: decision.path, connector: connector?.connectorId }
  });

  if (decision.requiresApproval) {
    txn.lifecycleState = 'pending_approval';
    txn.history.push({ at: nowIso(), state: 'pending_approval', actor: user.name });
    return { ok: true, transaction: txn, validation, message: `Submitted for approval (${action.approverRoles?.join(' / ') ?? 'approver'}). Four-eyes applies — you cannot approve your own submission.` };
  }

  // no approval required -> commit immediately
  return commitTransaction(db, txn, action, ctx);
}

async function commitTransaction(db: Db, txn: CanonicalTransaction, action: ActionDefinition, ctx: ActionContext): Promise<ExecuteResult> {
  if (txn.postingPath.path === 'GOVERNED_WRITEBACK') {
    enqueueOutbox(db, txn);
    await processOutbox(db);
    const fresh = db.transactions.get(txn.transactionId)!;
    return { ok: true, transaction: fresh, message: `Dispatched via outbox — now ${fresh.lifecycleState}${fresh.targetDocumentNumber ? `, document ${fresh.targetDocumentNumber}` : ''}.` };
  }
  if (txn.postingPath.path === 'STAGED_PACKAGE') {
    txn.lifecycleState = 'approved';
    txn.targetDocumentNumber = 'STAGED_NOT_POSTED';
    txn.history.push({ at: nowIso(), state: 'approved', actor: 'system', note: 'staged package — NOT posted to target system' });
    action.apply?.(txn.businessFields, txn, ctx);
    return { ok: true, transaction: txn, message: 'Staged locally with visible "not posted to target" state.' };
  }
  // LOCAL_CONTROLLED_WRITE / READ_IMPACT_ONLY
  action.apply?.(txn.businessFields, txn, ctx);
  txn.lifecycleState = 'posted';
  txn.reconciliationStatus = 'MATCHED';
  txn.history.push({ at: nowIso(), state: 'posted', actor: 'system', note: 'local platform write' });
  txn.lifecycleState = 'reconciled';
  txn.history.push({ at: nowIso(), state: 'reconciled', actor: 'system' });
  return { ok: true, transaction: txn, message: 'Committed locally with audit.' };
}

export async function decideTransaction(
  db: Db,
  transactionId: string,
  approverId: string,
  decision: 'approve' | 'reject' | 'return',
  reason?: string
): Promise<ExecuteResult> {
  const txn = db.transactions.get(transactionId);
  if (!txn) return { ok: false, message: 'Transaction not found.' };
  const approver = resolveUser(db, approverId);
  if (approver.tenantId !== txn.tenantId) return { ok: false, message: 'Tenant isolation: transaction not visible.' };
  const action = getActionById(txn.actionId);
  if (!action) return { ok: false, message: 'Action definition missing.' };

  if (txn.lifecycleState !== 'pending_approval') {
    return { ok: false, message: `Transaction is ${txn.lifecycleState}; only pending_approval can be decided.` };
  }

  // ---- SoD: submitter cannot approve own transaction
  if (decision === 'approve' && sodViolation(txn.submittedBy, approverId)) {
    writeAudit(db, {
      tenantId: txn.tenantId, actor: approver.name, actorType: 'HUMAN', actorRole: approver.role,
      action: 'sod.violation_blocked', objectType: 'CanonicalTransaction', objectId: txn.transactionId,
      correlationId: txn.correlationId
    });
    return { ok: false, blocked: true, blockedReason: 'Segregation of duties: the submitter cannot approve their own transaction (four-eyes).', message: 'SoD violation blocked.' };
  }

  // ---- approver role check
  const approverRoles = action.approverRoles ?? ['sto_manager', 'outage_manager'];
  if (!roleAllowed(approver, approverRoles)) {
    return { ok: false, blocked: true, blockedReason: `Role '${approver.role}' cannot approve '${action.label}'. Required: ${approverRoles.join(', ')}.`, message: 'Not an eligible approver.' };
  }

  if (decision === 'reject' || decision === 'return') {
    txn.lifecycleState = decision === 'reject' ? 'rejected' : 'returned_for_rework';
    txn.approvalState = 'REJECTED';
    txn.approvedBy = approverId;
    txn.approvalReason = reason;
    txn.updatedAt = nowIso();
    txn.history.push({ at: nowIso(), state: txn.lifecycleState, actor: approver.name, note: reason });
    writeAudit(db, {
      tenantId: txn.tenantId, actor: approver.name, actorType: 'HUMAN', actorRole: approver.role,
      action: `approval.${decision}`, objectType: 'CanonicalTransaction', objectId: txn.transactionId,
      correlationId: txn.correlationId, reason
    });
    return { ok: true, transaction: txn, message: `Transaction ${txn.lifecycleState}.` };
  }

  txn.approvalState = 'APPROVED';
  txn.approvedBy = approverId;
  txn.approvalReason = reason;
  txn.lifecycleState = 'approved';
  txn.history.push({ at: nowIso(), state: 'approved', actor: approver.name, note: reason });
  writeAudit(db, {
    tenantId: txn.tenantId, actor: approver.name, actorType: 'HUMAN', actorRole: approver.role,
    action: 'approval.approve', objectType: 'CanonicalTransaction', objectId: txn.transactionId,
    correlationId: txn.correlationId, reason
  });

  const ctx: ActionContext = { user: approver, actorType: 'HUMAN', tenantId: txn.tenantId, screen: 'approval' };
  return commitTransaction(db, txn, action, ctx);
}

/**
 * Reversal/correction: posted records are never edited in place. Creates a
 * linked reversing transaction that itself requires approval.
 */
export async function requestReversal(
  db: Db,
  transactionId: string,
  userId: string,
  reason: string
): Promise<ExecuteResult> {
  const original = db.transactions.get(transactionId);
  if (!original) return { ok: false, message: 'Transaction not found.' };
  if (!['posted', 'reconciled'].includes(original.lifecycleState)) {
    return { ok: false, message: `Only posted/reconciled transactions can be reversed (current: ${original.lifecycleState}).` };
  }
  if (!reason?.trim()) return { ok: false, message: 'Reversal requires a reason.' };
  const user = resolveUser(db, userId);

  original.lifecycleState = 'correction_requested';
  original.history.push({ at: nowIso(), state: 'correction_requested', actor: user.name, note: reason });

  const reversal: CanonicalTransaction = {
    ...original,
    transactionId: newId('txn'),
    transactionType: 'reverse',
    lifecycleState: 'pending_approval',
    approvalState: 'PENDING',
    idempotencyKey: `${original.idempotencyKey}:reversal`,
    correlationId: newCorrelationId(),
    submittedBy: userId,
    submittedByRole: user.role,
    sourceReferences: [original.transactionId],
    targetDocumentNumber: undefined,
    outboxId: undefined,
    responseSnapshot: undefined,
    reconciliationStatus: 'NOT_STARTED',
    retryCount: 0,
    businessFields: { ...original.businessFields, reversalOf: original.transactionId, reason },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), state: 'pending_approval', actor: user.name, note: `reversal of ${original.transactionId}` }]
  };
  db.transactions.set(reversal.transactionId, reversal);
  db.idempotencyIndex.set(reversal.idempotencyKey, reversal.transactionId);
  original.lifecycleState = 'reversing_transaction_created';
  original.history.push({ at: nowIso(), state: 'reversing_transaction_created', actor: user.name, note: reversal.transactionId });

  writeAudit(db, {
    tenantId: original.tenantId, actor: user.name, actorType: 'HUMAN', actorRole: user.role,
    action: 'transaction.reversal_requested', objectType: 'CanonicalTransaction', objectId: original.transactionId,
    correlationId: reversal.correlationId, reason, details: { reversalTransaction: reversal.transactionId }
  });
  return { ok: true, transaction: reversal, message: `Reversing transaction ${reversal.transactionId} created (pending approval). Original is never edited in place.` };
}
