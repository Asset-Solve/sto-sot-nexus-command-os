/**
 * Process backbone regression — proves the transactional (not dashboard)
 * behavior: object-state → action matrix, persona work queues, and lifecycle
 * stage coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb, getObject } from '@/server/core/store';
import { ensureSeeded } from '@/server/core/seed';
import { resetSimulator } from '@/server/connectors/simulator';
import { executeAction } from '@/server/core/engine';
import {
  PROCESS_STAGES,
  STATE_ACTIONS,
  nextActionsForObject,
  stageStatuses,
  workQueueForUser
} from '@/server/domain/process';
import { getActionById } from '@/server/domain/registry';
import { runAgent } from '@/server/ai/agents';
import type { Db } from '@/server/core/store';

let db: Db;
beforeEach(() => {
  resetDb();
  resetSimulator();
  db = ensureSeeded();
});

describe('process map integrity', () => {
  it('covers the full lifecycle with a route, personas, objects and exit criteria per stage', () => {
    expect(PROCESS_STAGES.length).toBeGreaterThanOrEqual(14);
    for (const s of PROCESS_STAGES) {
      expect(s.route.startsWith('/')).toBe(true);
      expect(s.personas.length).toBeGreaterThan(0);
      expect(s.objects.length).toBeGreaterThan(0);
      expect(s.exitCriteria.length).toBeGreaterThan(10);
    }
  });

  it('every state-action maps to a real governed action', () => {
    for (const sa of STATE_ACTIONS) {
      expect(getActionById(sa.actionId), `missing action ${sa.actionId}`).toBeTruthy();
    }
  });

  it('computes live stage status for the active event (EXECUTION phase)', () => {
    const stages = stageStatuses(db, 't1', 'EV-1001');
    const exec = stages.find((s) => s.id === 'execution')!;
    expect(exec.status).toBe('active');
    expect(stages.find((s) => s.id === 'scope')!.status).toBe('done');
    expect(stages.find((s) => s.id === 'closeout')!.status).toBe('pending');
    // open-item telemetry drives the ribbon badges
    expect(stages.find((s) => s.id === 'materials')!.openItems).toBeGreaterThan(0);
    expect(stages.find((s) => s.id === 'safety')!.openItems).toBeGreaterThan(0);
  });
});

describe('object-state → action triggers (transactional rows)', () => {
  it('offers scope decision only while a candidate is undecided', () => {
    const submitted = getObject(db, 't1', 'SC-004')!;
    const acts = nextActionsForObject(submitted, 'scope_board_member').map((a) => a.actionId);
    expect(acts).toContain('scope.decide');

    const approved = getObject(db, 't1', 'SC-001')!;
    const acts2 = nextActionsForObject(approved, 'scope_board_member').map((a) => a.actionId);
    expect(acts2).not.toContain('scope.decide');
  });

  it('prefills the governed draft from the object (shortage → SAP reservation)', () => {
    const demand = getObject(db, 't1', 'MD-002')!; // MAT-4714 shortage
    const reserve = nextActionsForObject(demand, 'material_planner').find((a) => a.actionId === 'material.reserve')!;
    expect(reserve).toBeTruthy();
    expect(reserve.prefill['materialId']).toBe('MAT-4714');
    expect(reserve.prefill['quantity']).toBe(6);
    expect(reserve.prefill['plantId']).toBe('P100');
    expect(reserve.prefill['orderId']).toBe('ORD-4000101');
    expect(reserve.prefill['requiredDate']).toBe('2026-07-03');
    expect(reserve.prefill['demandId']).toBe('MD-002');
  });

  it('filters row actions by role: a viewer gets none, the planner gets the trigger', () => {
    const demand = getObject(db, 't1', 'MD-002')!;
    expect(nextActionsForObject(demand, 'executive_viewer').length).toBe(0);
    expect(nextActionsForObject(demand, 'material_planner').length).toBeGreaterThan(0);
  });

  it('suspended permits expose only the compliant correction path (never a WCM write)', () => {
    const permit = getObject(db, 't1', 'PTW-88103')!;
    const acts = nextActionsForObject(permit, 'hse_safety_reviewer').map((a) => a.actionId);
    expect(acts).toContain('permit.request_correction');
    expect(acts).not.toContain('permit.update_status');
  });
});

describe('My Work — persona day-in-the-life queue', () => {
  it('gives the crew supervisor the submitted time entries to approve/post', () => {
    const q = workQueueForUser(db, db.users.get('u-crew')!);
    const cats = q.actions.filter((a) => a.actionId === 'labor.post_cats');
    expect(cats.length).toBe(3); // LE-001..003 submitted
    expect(cats[0].prefill!['laborEntryId']).toMatch(/^LE-/);
  });

  it('gives the executive viewer no action triggers (read-only persona)', () => {
    const q = workQueueForUser(db, db.users.get('u-exec')!);
    expect(q.actions.length).toBe(0);
    expect(q.approvals.length).toBe(0);
  });

  it('routes a submitted controlled transaction to eligible approvers but never back to the submitter', async () => {
    const submit = await executeAction(db, 'material.reserve', {
      materialId: 'MAT-4712', quantity: 1, plantId: 'P100', storageLocation: 'SL02',
      requiredDate: '2026-07-05', orderId: 'ORD-4000102'
    }, 'u-matl');
    expect(submit.transaction!.lifecycleState).toBe('pending_approval');

    const supervisor = workQueueForUser(db, db.users.get('u-super')!); // maintenance_supervisor = approver role
    expect(supervisor.approvals.some((a) => a.transactionId === submit.transaction!.transactionId)).toBe(true);

    const submitter = workQueueForUser(db, db.users.get('u-matl')!);
    expect(submitter.approvals.some((a) => a.transactionId === submit.transaction!.transactionId)).toBe(false);
  });

  it('routes open AI review packages to their human authority role', () => {
    // startup agent output routes to operations_startup_authority
    runAgent(db, 't1', 'startup-pssr', 'EV-1001');
    const ops = workQueueForUser(db, db.users.get('u-ops')!);
    expect(ops.aiReviews.length).toBeGreaterThan(0);
    const tech = workQueueForUser(db, db.users.get('u-tech')!);
    expect(tech.aiReviews.length).toBe(0);
  });
});
