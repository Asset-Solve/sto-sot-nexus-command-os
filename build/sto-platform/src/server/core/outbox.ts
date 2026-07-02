/**
 * Transactional outbox, retry, DLQ, replay, read-back and reconciliation.
 * Every external write travels through here — no exceptions (section 12, 8.18).
 * In production this runs in the dedicated worker service; the module boundary
 * is already worker-shaped (pure functions over the Db + connector registry).
 */

import type { CanonicalTransaction, DeadLetterMessage, OutboxMessage, ReconciliationRecord, User } from './types';
import type { Db } from './store';
import { hashPayload, newId, nowIso } from './ids';
import { writeAudit } from './audit';
import { adapterFor } from '../connectors/simulator';
import { DOC_PREFIX } from '../connectors/registry';
import { hasVerb } from './rbac';
import { getActionById } from '../domain/registry';

export function enqueueOutbox(db: Db, txn: CanonicalTransaction): OutboxMessage {
  const connector = db.connectors.get(txn.connectorId!)!;
  const msg: OutboxMessage = {
    id: newId('obx'),
    tenantId: txn.tenantId,
    transactionId: txn.transactionId,
    connectorId: txn.connectorId!,
    operation: txn.transactionType,
    payload: txn.payloadPreview ?? txn.businessFields,
    payloadHash: hashPayload(txn.payloadPreview ?? txn.businessFields),
    idempotencyKey: txn.idempotencyKey,
    correlationId: txn.correlationId,
    state: 'QUEUED',
    attempts: 0,
    maxAttempts: connector.retryPolicy.maxAttempts,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  db.outbox.set(msg.id, msg);
  txn.outboxId = msg.id;
  txn.lifecycleState = 'queued';
  txn.history.push({ at: nowIso(), state: 'queued', actor: 'system', note: `outbox ${msg.id}` });
  return msg;
}

function transition(db: Db, txn: CanonicalTransaction, state: CanonicalTransaction['lifecycleState'], note?: string) {
  txn.lifecycleState = state;
  txn.updatedAt = nowIso();
  txn.history.push({ at: nowIso(), state, actor: 'system', note });
}

/**
 * Worker tick. Dispatches due outbox messages, performs read-back and
 * reconciliation for posted transactions. Returns a processing summary.
 */
export async function processOutbox(db: Db, opts?: { ignoreBackoff?: boolean }): Promise<{ dispatched: number; posted: number; deadLettered: number; reconciled: number }> {
  let dispatched = 0, posted = 0, deadLettered = 0, reconciled = 0;
  const now = Date.now();

  for (const msg of db.outbox.values()) {
    if (msg.state !== 'QUEUED' && msg.state !== 'FAILED_RETRYABLE') continue;
    if (!opts?.ignoreBackoff && msg.nextAttemptAt && Date.parse(msg.nextAttemptAt) > now) continue;

    const connector = db.connectors.get(msg.connectorId);
    const txn = db.transactions.get(msg.transactionId);
    if (!connector || !txn) continue;

    if (!connector.enabled || connector.sourceMode === 'DISABLED') {
      // hold — disabled connector blocks writes server-side but does not lose them
      msg.lastError = 'Connector disabled; message held in outbox.';
      msg.updatedAt = nowIso();
      continue;
    }

    const adapter = adapterFor(connector, DOC_PREFIX[connector.connectorId] ?? 'DOC');
    msg.state = 'DISPATCHING';
    msg.attempts += 1;
    dispatched += 1;
    transition(db, txn, 'sent_to_connector', `attempt ${msg.attempts}`);

    const res = await adapter.execute(msg.operation, msg.payload, {
      tenantId: msg.tenantId, correlationId: msg.correlationId, idempotencyKey: msg.idempotencyKey, actor: 'outbox-worker'
    });
    msg.responseSnapshot = res as unknown as Record<string, unknown>;
    msg.updatedAt = nowIso();

    if (res.ok) {
      msg.state = 'SENT';
      txn.targetDocumentNumber = res.documentNumber;
      txn.responseSnapshot = res as unknown as Record<string, unknown>;
      transition(db, txn, 'posted_pending_readback', `document ${res.documentNumber}`);
      posted += 1;

      // read-back + reconciliation
      const rb = await adapter.readBack(res.documentNumber!, msg.payload, {
        tenantId: msg.tenantId, correlationId: msg.correlationId, idempotencyKey: msg.idempotencyKey, actor: 'outbox-worker'
      });
      const rec: ReconciliationRecord = {
        id: newId('rec'),
        tenantId: msg.tenantId,
        transactionId: txn.transactionId,
        connectorId: msg.connectorId,
        reconciliationKey: res.documentNumber!,
        expected: { payloadHash: msg.payloadHash, documentNumber: res.documentNumber },
        actual: rb.ok ? rb.body : undefined,
        status: rb.ok ? 'MATCHED' : 'PENDING',
        createdAt: nowIso()
      };
      db.reconciliations.set(rec.id, rec);
      if (rb.ok) {
        txn.reconciliationStatus = 'MATCHED';
        transition(db, txn, 'posted');
        transition(db, txn, 'reconciled', `readback matched ${res.documentNumber}`);
        msg.state = 'COMPLETED';
        reconciled += 1;
        // apply local platform effects now that the external post is proven
        const actionDef = getActionById(txn.actionId);
        const submitter = db.users.get(txn.submittedBy);
        if (actionDef?.apply && submitter) {
          actionDef.apply(txn.businessFields, txn, { user: submitter, actorType: 'SYSTEM', tenantId: txn.tenantId, screen: 'outbox-worker' });
        }
      } else {
        txn.reconciliationStatus = 'PENDING';
        transition(db, txn, 'reconciliation_failed', rb.error);
      }
      writeAudit(db, {
        tenantId: msg.tenantId, actor: 'outbox-worker', actorType: 'SYSTEM', action: 'outbox.posted',
        objectType: 'CanonicalTransaction', objectId: txn.transactionId, correlationId: msg.correlationId,
        details: { documentNumber: res.documentNumber, reconciliation: rec.status }
      });
    } else if (res.retryable && msg.attempts < msg.maxAttempts) {
      msg.state = 'FAILED_RETRYABLE';
      msg.lastError = res.error;
      msg.nextAttemptAt = new Date(now + 500 * Math.pow(2, msg.attempts)).toISOString();
      transition(db, txn, 'pending_retry', res.error);
    } else {
      msg.state = 'DEAD_LETTER';
      msg.lastError = res.error;
      const dlq: DeadLetterMessage = {
        id: newId('dlq'),
        tenantId: msg.tenantId,
        outboxId: msg.id,
        transactionId: msg.transactionId,
        connectorId: msg.connectorId,
        error: res.error ?? 'unknown',
        payload: msg.payload,
        replayable: true,
        createdAt: nowIso()
      };
      db.deadLetters.set(dlq.id, dlq);
      transition(db, txn, 'dead_letter', res.error);
      deadLettered += 1;
      writeAudit(db, {
        tenantId: msg.tenantId, actor: 'outbox-worker', actorType: 'SYSTEM', action: 'outbox.dead_letter',
        objectType: 'CanonicalTransaction', objectId: txn.transactionId, correlationId: msg.correlationId,
        details: { error: res.error }
      });
    }
  }
  return { dispatched, posted, deadLettered, reconciled };
}

/** Replay a dead letter. Requires replay verb + mandatory reason (section 8.18). */
export async function replayDeadLetter(
  db: Db,
  dlqId: string,
  user: User,
  reason: string
): Promise<{ ok: boolean; message: string }> {
  if (!hasVerb(user, 'replay')) {
    return { ok: false, message: `Role ${user.role} is not authorized to replay DLQ messages.` };
  }
  if (!reason || reason.trim().length < 5) {
    return { ok: false, message: 'Replay requires a substantive reason (min 5 chars).' };
  }
  const dlq = db.deadLetters.get(dlqId);
  if (!dlq || dlq.tenantId !== user.tenantId) return { ok: false, message: 'Dead letter not found.' };
  if (dlq.replayedAt) return { ok: false, message: 'Dead letter already replayed.' };

  const txn = db.transactions.get(dlq.transactionId);
  if (!txn) return { ok: false, message: 'Original transaction missing.' };

  // strip failure injection so the replay can succeed; same idempotency key
  const payload = { ...dlq.payload };
  delete payload['__simulateFailure'];

  const original = db.outbox.get(dlq.outboxId);
  const msg: OutboxMessage = {
    id: newId('obx'),
    tenantId: dlq.tenantId,
    transactionId: dlq.transactionId,
    connectorId: dlq.connectorId,
    operation: original?.operation ?? 'create',
    payload,
    payloadHash: hashPayload(payload),
    idempotencyKey: original?.idempotencyKey ?? txn.idempotencyKey,
    correlationId: txn.correlationId,
    state: 'QUEUED',
    attempts: 0,
    maxAttempts: 3,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  db.outbox.set(msg.id, msg);
  dlq.replayedBy = user.id;
  dlq.replayReason = reason;
  dlq.replayedAt = nowIso();
  transition(db, txn, 'replay_requested', `by ${user.name}: ${reason}`);
  writeAudit(db, {
    tenantId: dlq.tenantId, actor: user.name, actorType: 'HUMAN', actorRole: user.role,
    action: 'dlq.replay', objectType: 'DeadLetterMessage', objectId: dlqId,
    correlationId: txn.correlationId, reason
  });
  await processOutbox(db, { ignoreBackoff: true });
  const after = db.transactions.get(dlq.transactionId)!;
  if (after.lifecycleState === 'reconciled' || after.lifecycleState === 'posted') {
    transition(db, after, 'replayed', 'replay succeeded');
    after.lifecycleState = 'reconciled';
  }
  return { ok: true, message: `Replay dispatched. Transaction now ${after.lifecycleState}.` };
}
