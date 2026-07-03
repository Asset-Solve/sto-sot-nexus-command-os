/**
 * Nexus enhancement regression — proves the market-leading STO/SOT additions
 * are not decorative screens. They are connector-backed objects, role-filtered
 * work items, governed actions and end-to-end transactions.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb, getObject } from '@/server/core/store';
import { ensureSeeded } from '@/server/core/seed';
import { resetSimulator } from '@/server/connectors/simulator';
import { executeAction, decideTransaction } from '@/server/core/engine';
import { buildConnectorRecords } from '@/server/connectors/registry';
import { nextActionsForObject, stageStatuses, workQueueForUser } from '@/server/domain/process';
import { SCREENS } from '@/lib/screens';
import type { Db } from '@/server/core/store';

let db: Db;
beforeEach(() => {
  resetDb();
  resetSimulator();
  db = ensureSeeded();
});

describe('market-leading screen and connector coverage', () => {
  it('adds the enhanced workbenches as contract-driven screens', () => {
    for (const route of ['mobility-readiness', 'fel-readiness', 'control-of-work', 'execution-map', 'contract-performance', 'cost-reconciliation', 'analytics']) {
      expect(SCREENS[route], `missing screen ${route}`).toBeTruthy();
      expect(SCREENS[route].tabs.length).toBeGreaterThan(1);
      expect(SCREENS[route].actionIds.length).toBeGreaterThan(0);
    }
  });

  it('registers native-ready connectors for mobile, FSM, training, access and document control', () => {
    const ids = buildConnectorRecords('t1').map((c) => c.connectorId);
    expect(ids).toEqual(expect.arrayContaining(['sap-ssam-mobile', 'sap-fsm-dispatch', 'lms-training', 'iam-access', 'opentext-dms']));
  });

  it('stage telemetry counts new readiness, safety, execution and cost blockers', () => {
    const stages = stageStatuses(db, 't1', 'EV-1001');
    expect(stages.find((s) => s.id === 'contractors')!.openItems).toBeGreaterThanOrEqual(2);
    expect(stages.find((s) => s.id === 'materials')!.openItems).toBeGreaterThanOrEqual(5);
    expect(stages.find((s) => s.id === 'safety')!.openItems).toBeGreaterThanOrEqual(5);
    expect(stages.find((s) => s.id === 'cost')!.openItems).toBeGreaterThanOrEqual(4);
  });
});

describe('new object-state triggers and work queues', () => {
  it('turns expired training credentials into LMS remediation actions', () => {
    const credential = getObject(db, 't1', 'TC-W2001-HOT')!;
    const actions = nextActionsForObject(credential, 'contractor_coordinator');
    const refresher = actions.find((a) => a.actionId === 'training.assign_refresher')!;
    expect(refresher).toBeTruthy();
    expect(refresher.prefill).toMatchObject({ sourceObjectId: 'TC-W2001-HOT', workerId: 'W-2001', credential: 'HOT_WORK_OBSERVER' });
  });

  it('routes mobility, tool, RTLS and commercial work to the right personas', () => {
    const contractor = workQueueForUser(db, db.users.get('u-contr')!);
    expect(contractor.actions.some((a) => a.actionId === 'training.assign_refresher')).toBe(true);
    expect(contractor.actions.some((a) => a.actionId === 'onboarding.request_missing_evidence')).toBe(true);

    const materials = workQueueForUser(db, db.users.get('u-matl')!);
    expect(materials.actions.some((a) => a.actionId === 'tool.reserve')).toBe(true);
    expect(materials.actions.some((a) => a.actionId === 'material.substitute')).toBe(true);

    const hse = workQueueForUser(db, db.users.get('u-hse')!);
    expect(hse.actions.some((a) => a.actionId === 'safety.acknowledge_location_alert')).toBe(true);

    const finance = workQueueForUser(db, db.users.get('u-fin')!);
    expect(finance.actions.some((a) => a.actionId === 'cost.reconcile_case')).toBe(true);
    expect(finance.actions.some((a) => a.actionId === 'accrual.approve_post')).toBe(true);
  });
});

describe('new governed transactions', () => {
  it('stages LMS refresher through four-eyes and updates credential state', async () => {
    const submit = await executeAction(db, 'training.assign_refresher', {
      sourceObjectId: 'TC-W2001-HOT',
      workerId: 'W-2001',
      credential: 'HOT_WORK_OBSERVER',
      dueDate: '2026-07-03',
      reason: 'Hot work access is blocked until refresher is complete.'
    }, 'u-contr');
    expect(submit.transaction!.lifecycleState).toBe('pending_approval');

    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-hse', 'approve', 'safety remediation required');
    expect(approved.ok).toBe(true);
    expect(getObject(db, 't1', 'TC-W2001-HOT')!.lifecycleState).toBe('refresher_assigned');
  });

  it('publishes the daily execution plan and accepts field progress through governed workflow', async () => {
    const plan = await executeAction(db, 'plan.publish', {
      sourceObjectId: 'DEP-20260702-D',
      publishNote: 'Critical path plan released after materials and WCM review.',
      reason: 'Day shift plan is ready.'
    }, 'u-super');
    await decideTransaction(db, plan.transaction!.transactionId, 'u-outage', 'approve', 'outage manager approves');
    expect(getObject(db, 't1', 'DEP-20260702-D')!.lifecycleState).toBe('published');

    const progress = await executeAction(db, 'progress.supervisor_accept', {
      sourceObjectId: 'PU-OP40001010020',
      acceptedProgressPct: 82,
      acceptanceNote: 'Field update matches supervisor walkdown.'
    }, 'u-crew');
    await decideTransaction(db, progress.transaction!.transactionId, 'u-super', 'approve', 'accepted');
    expect(getObject(db, 't1', 'PU-OP40001010020')!.lifecycleState).toBe('accepted');
  });

  it('reconciles invoice variance and posts accrual through SAP FI/CO simulator', async () => {
    const variance = await executeAction(db, 'contract.reconcile_invoice', {
      sourceObjectId: 'ISV-MECHCO-0701',
      decision: 'accrue',
      reason: 'Standby claim accrual accepted pending PTW evidence.'
    }, 'u-contr');
    await decideTransaction(db, variance.transaction!.transactionId, 'u-fin', 'approve', 'finance agrees');
    expect(getObject(db, 't1', 'ISV-MECHCO-0701')!.lifecycleState).toBe('variance_accrue');

    const accrual = await executeAction(db, 'accrual.approve_post', {
      sourceObjectId: 'AE-CRANE-0702',
      companyCode: '1000',
      postingPeriod: '2026-07',
      costObject: 'WBS-TA26-02',
      amountUSD: 36000,
      reason: 'Crane rental accrual with evidence TD-CRANE-01 / ER-CRANE-01.'
    }, 'u-fin');
    const approved = await decideTransaction(db, accrual.transaction!.transactionId, 'u-admin', 'approve', 'tenant admin approval in simulator');
    expect(approved.transaction!.lifecycleState).toBe('reconciled');
    expect(approved.transaction!.targetDocumentNumber).toMatch(/^19/);
    expect(getObject(db, 't1', 'AE-CRANE-0702')!.lifecycleState).toBe('posted');
  });
});
