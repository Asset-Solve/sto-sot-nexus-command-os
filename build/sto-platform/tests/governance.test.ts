/**
 * Governance regression suite — proves the non-negotiable controls from
 * KICKOFF_PROMPT sections 19 and 24.12 at the engine level (no HTTP needed;
 * API routes are thin delegates over these same functions).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '@/server/core/store';
import { ensureSeeded } from '@/server/core/seed';
import { resetSimulator } from '@/server/connectors/simulator';
import { executeAction, decideTransaction, requestReversal } from '@/server/core/engine';
import { processOutbox, replayDeadLetter } from '@/server/core/outbox';
import { runLookup } from '@/server/core/lookup';
import { decidePostingPath } from '@/server/core/postingPath';
import { runAgent } from '@/server/ai/agents';
import { interpretCommand } from '@/server/ai/voice';
import type { Db } from '@/server/core/store';

let db: Db;
beforeEach(() => {
  resetDb();
  resetSimulator();
  db = ensureSeeded();
});

const validReservation = {
  materialId: 'MAT-4712', quantity: 1, plantId: 'P100', storageLocation: 'SL02',
  requiredDate: '2026-07-05', orderId: 'ORD-4000102'
};

describe('connector-backed lookups (section 11)', () => {
  it('every lookup item carries source metadata and posting eligibility', () => {
    const r = runLookup(db, 't1', 'materials', {})!;
    expect(r.items.length).toBeGreaterThan(0);
    for (const i of r.items) {
      expect(i.sourceSystem).toBeTruthy();
      expect(i.sourceMode).toBeTruthy();
      expect(i.sourceObject).toBeTruthy();
      expect(i.lastSyncAt).toBeTruthy();
      expect(typeof i.postingAllowed).toBe('boolean');
      expect(i.provider).toContain('lookup:');
    }
  });

  it('dependent filtering: order -> operations, plant -> units', () => {
    const ops = runLookup(db, 't1', 'operations', { orderId: 'ORD-4000101' })!;
    expect(ops.items.length).toBe(3);
    expect(ops.items.every((i) => (i.metadata as any).orderId === 'ORD-4000101')).toBe(true);
    const units = runLookup(db, 't1', 'units', { plantId: 'P200' })!;
    expect(units.items.map((i) => i.id)).toEqual(['U-GBA']);
  });

  it('worker lookup hydrates effective-dated defaults (craft, supervisor, cost center, rate class)', () => {
    const workers = runLookup(db, 't1', 'workers', { workDate: '2026-07-01' })!;
    const w = workers.items.find((i) => i.id === 'W-1001')!;
    expect(w.metadata).toMatchObject({ craft: 'Boilermaker', homeCostCenter: 'CC-3100', rateClass: 'RC-BM-J', payGroup: 'PG-UNION-A' });
    const none = runLookup(db, 't1', 'workers', { workDate: '2027-06-01' })!;
    expect(none.items.length).toBe(0);
  });
});

describe('posting path decision engine (section 13)', () => {
  it('routes AI controlled actions to review package only', () => {
    const d = decidePostingPath({ actorType: 'AI_AGENT', actionClass: 'CONTROLLED', targetSystem: 'SAP_S4' });
    expect(d.path).toBe('REVIEW_PACKAGE_ONLY');
  });
  it('fails closed for WCM writes', () => {
    const d = decidePostingPath({ actorType: 'HUMAN', actionClass: 'CONTROLLED', targetSystem: 'SAP_WCM', connectorWritePolicy: 'FAIL_CLOSED' });
    expect(d.path).toBe('FAIL_CLOSED');
  });
  it('routes released-API SAP writes to governed writeback with SoD', () => {
    const d = decidePostingPath({ actorType: 'HUMAN', actionClass: 'CONTROLLED', targetSystem: 'SAP_S4', connectorWritePolicy: 'APPROVAL_REQUIRED', hasReleasedWriteApi: true, connectorEnabled: true });
    expect(d.path).toBe('GOVERNED_WRITEBACK');
    expect(d.requiresSoD).toBe(true);
  });
  it('stages writes when the connector is disabled (server-side block)', () => {
    const d = decidePostingPath({ actorType: 'HUMAN', actionClass: 'CONTROLLED', targetSystem: 'SAP_S4', connectorWritePolicy: 'APPROVAL_REQUIRED', hasReleasedWriteApi: true, connectorEnabled: false });
    expect(d.path).toBe('STAGED_PACKAGE');
  });
});

describe('validation gates', () => {
  it('blocks SAP reservation with missing mandatory fields', async () => {
    const r = await executeAction(db, 'material.reserve', { materialId: 'MAT-4711' }, 'u-matl');
    expect(r.ok).toBe(false);
    expect(r.validation!.some((v) => v.field === 'plantId')).toBe(true);
  });

  it('blocks scope freeze while critical candidates are unresolved', async () => {
    const r = await executeAction(db, 'scope.freeze', { eventId: 'EV-1001', reason: 'attempt freeze' }, 'u-sto');
    expect(r.ok).toBe(false);
    expect(r.validation![0].message).toContain('SC-004');
  });

  it('blocks work package release on incomplete readiness + suspended permit', async () => {
    const r = await executeAction(db, 'wp.release', { sourceObjectId: 'WP-1002' }, 'u-wpo');
    expect(r.ok).toBe(false);
    const msgs = r.validation!.map((v) => v.message).join(' ');
    expect(msgs).toContain('Readiness incomplete');
    expect(msgs).toContain('PTW-88103');
  });

  it('blocks RTS approval while blockers exist, even for the operations authority', async () => {
    const r = await executeAction(db, 'startup.approve_rts', { sourceObjectId: 'SUR-EV1', reason: 'attempt' }, 'u-ops');
    expect(r.ok).toBe(false);
    expect(r.validation![0].message).toContain('RTS blocked');
  });
});

describe('fail-closed safety writes (section 24.3 WCM)', () => {
  it('blocks any write attempt against the WCM permit source of record', async () => {
    const r = await executeAction(db, 'permit.update_status', { sourceObjectId: 'PTW-88101', newStatus: 'CLOSED' }, 'u-wcm');
    expect(r.ok).toBe(false);
    expect(r.blocked).toBe(true);
    expect(r.blockedReason).toContain('fail closed');
    expect(db.audit.some((a) => a.action === 'posting_path.fail_closed')).toBe(true);
  });
});

describe('AI governance (section 17)', () => {
  it('AI actor can never execute a controlled action; the attempt is audited', async () => {
    const r = await executeAction(db, 'startup.approve_rts', { sourceObjectId: 'SUR-EV1', reason: 'ai tries' }, 'u-aiops', 'AI_AGENT');
    expect(r.ok).toBe(false);
    expect(r.blocked).toBe(true);
    expect(db.transactions.size).toBe(0);
    expect(db.audit.some((a) => a.action === 'ai.blocked_action_attempt')).toBe(true);
  });

  it('agent output carries citations, confidence, model route and human authority', () => {
    const { recommendations } = runAgent(db, 't1', 'startup-pssr', 'EV-1001');
    expect(recommendations.length).toBeGreaterThan(0);
    const rec = recommendations[0];
    expect(rec.citations.length).toBeGreaterThan(0);
    expect(rec.policyDecision).toBe('BLOCKED');
    expect(rec.humanReviewerRole).toBe('operations_startup_authority');
    expect(rec.modelRoute).toBe('HIGH_REASONING_REVIEW');
    expect(rec.blockedExplanation).toBeTruthy();
  });

  it('voice refuses safety approvals and only drafts controlled actions', () => {
    const blocked = interpretCommand(db, 't1', 'approve permit PTW-88103');
    expect(blocked.intent).toBe('blocked');
    const before = db.transactions.size;
    const draft = interpretCommand(db, 't1', 'reserve 6 sets of MAT-4714');
    expect(draft.intent).toBe('draft_action');
    expect(draft.draft!.actionId).toBe('material.reserve');
    expect(draft.draft!.payload['materialId']).toBe('MAT-4714');
    expect(db.transactions.size).toBe(before); // nothing executed
  });
});

describe('RBAC / ABAC / SoD (sections 7, 14)', () => {
  it('denies actions outside the role contract', async () => {
    const r = await executeAction(db, 'material.reserve', validReservation, 'u-tech');
    expect(r.blocked).toBe(true);
    expect(r.blockedReason).toContain('not authorized');
  });

  it('enforces four-eyes: submitter cannot approve own transaction', async () => {
    const submit = await executeAction(db, 'wp.release', { sourceObjectId: 'WP-1001' }, 'u-wpo');
    expect(submit.ok).toBe(true);
    expect(submit.transaction!.lifecycleState).toBe('pending_approval');
    // u-wpo is not an approver role anyway; use a user who is BOTH submitter-capable and approver to isolate SoD:
    const submit2 = await executeAction(db, 'scope.decide', { sourceObjectId: 'SC-006', decision: 'reject', reason: 'duplicate of SC-001' }, 'u-sto');
    const sod = await decideTransaction(db, submit2.transaction!.transactionId, 'u-sto', 'approve');
    expect(sod.blocked).toBe(true);
    expect(sod.blockedReason).toContain('Segregation of duties');
    const ok = await decideTransaction(db, submit2.transaction!.transactionId, 'u-outage', 'approve', 'agreed, duplicate');
    expect(ok.ok).toBe(true);
  });

  it('isolates tenants: another tenant cannot see or decide the transaction', async () => {
    const submit = await executeAction(db, 'wp.release', { sourceObjectId: 'WP-1001' }, 'u-wpo');
    const r = await decideTransaction(db, submit.transaction!.transactionId, 'u2-admin', 'approve');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Tenant isolation');
  });
});

describe('canonical transaction + outbox + read-back (sections 12, 24.2)', () => {
  it('full governed writeback: approve -> outbox -> posted -> read-back -> reconciled, with SAP doc number', async () => {
    const submit = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    expect(submit.transaction!.lifecycleState).toBe('pending_approval');
    expect(submit.transaction!.payloadPreview).toBeTruthy();
    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve', 'materials ready');
    expect(approved.ok).toBe(true);
    const txn = db.transactions.get(submit.transaction!.transactionId)!;
    expect(txn.lifecycleState).toBe('reconciled');
    expect(txn.targetDocumentNumber).toMatch(/^0002/);
    expect(txn.reconciliationStatus).toBe('MATCHED');
    const recs = [...db.reconciliations.values()].filter((r) => r.transactionId === txn.transactionId);
    expect(recs.length).toBe(1);
    expect(recs[0].status).toBe('MATCHED');
    // local proxy object created only after external post proven
    expect([...db.objects.values()].some((o) => o.objectType === 'ReservationProxy' && o.sourceReference === txn.targetDocumentNumber)).toBe(true);
  });

  it('idempotent resubmit returns the same transaction', async () => {
    const a = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    const b = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    expect(b.transaction!.transactionId).toBe(a.transaction!.transactionId);
    expect(b.message).toContain('Idempotent');
  });

  it('retries transient failures then dead-letters; replay needs role + reason and succeeds idempotently', async () => {
    const submit = await executeAction(db, 'material.reserve', { ...validReservation, __simulateFailure: 'transient' }, 'u-matl');
    await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve');
    // exhaust retries
    await processOutbox(db, { ignoreBackoff: true });
    await processOutbox(db, { ignoreBackoff: true });
    const txn = db.transactions.get(submit.transaction!.transactionId)!;
    expect(txn.lifecycleState).toBe('dead_letter');
    const dlq = [...db.deadLetters.values()].find((d) => d.transactionId === txn.transactionId)!;
    expect(dlq).toBeTruthy();

    // unauthorized role
    const noRole = await replayDeadLetter(db, dlq.id, db.users.get('u-sto')!, 'valid reason here');
    expect(noRole.ok).toBe(false);
    // missing reason
    const noReason = await replayDeadLetter(db, dlq.id, db.users.get('u-intops')!, '');
    expect(noReason.ok).toBe(false);
    // authorized replay succeeds (failure injection stripped, same idempotency key)
    const ok = await replayDeadLetter(db, dlq.id, db.users.get('u-intops')!, 'root cause fixed: gateway restored');
    expect(ok.ok).toBe(true);
    expect(db.transactions.get(txn.transactionId)!.lifecycleState).toBe('reconciled');
    expect(db.deadLetters.get(dlq.id)!.replayedBy).toBe('u-intops');
  });

  it('disabled connector stages the write instead of posting (visible not-posted state)', async () => {
    db.connectors.get('sap-mm-reservation')!.enabled = false;
    const submit = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve');
    expect(approved.ok).toBe(true);
    const txn = db.transactions.get(submit.transaction!.transactionId)!;
    expect(txn.targetDocumentNumber).toBe('STAGED_NOT_POSTED');
    expect(txn.postingPath.path).toBe('STAGED_PACKAGE');
  });

  it('posted records are reversed via a linked reversing transaction, never edited in place', async () => {
    const submit = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve');
    const rev = await requestReversal(db, submit.transaction!.transactionId, 'u-matl', 'wrong storage location');
    expect(rev.ok).toBe(true);
    expect(rev.transaction!.transactionId).not.toBe(submit.transaction!.transactionId);
    expect(rev.transaction!.transactionType).toBe('reverse');
    const original = db.transactions.get(submit.transaction!.transactionId)!;
    expect(original.lifecycleState).toBe('reversing_transaction_created');
    expect(original.targetDocumentNumber).toMatch(/^0002/); // untouched
  });
});

describe('audit completeness', () => {
  it('captures submit, approval and posting steps with actor, role and correlation', async () => {
    const submit = await executeAction(db, 'material.reserve', validReservation, 'u-matl');
    await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve', 'ok');
    const trail = db.audit.filter((a) => a.correlationId === submit.transaction!.correlationId);
    const actions = trail.map((a) => a.action);
    expect(actions).toContain('action.submit:material.reserve');
    expect(actions).toContain('approval.approve');
    expect(actions).toContain('outbox.posted');
    expect(trail.every((a) => a.tenantId === 't1' && a.actor)).toBe(true);
  });
});
