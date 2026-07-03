/**
 * SAP-native actionability regression.
 *
 * These tests protect against the "dashboard-only" failure mode: S/4-owned
 * rows must expose governed user triggers that create typed SAP payloads,
 * require four-eyes where appropriate, and update local proxies only after the
 * connector path posts/stages successfully.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb, getObject } from '@/server/core/store';
import { ensureSeeded } from '@/server/core/seed';
import { resetSimulator } from '@/server/connectors/simulator';
import { executeAction, decideTransaction } from '@/server/core/engine';
import { getActionById } from '@/server/domain/registry';
import { nextActionsForObject, workQueueForUser } from '@/server/domain/process';
import { SCREENS } from '@/lib/screens';
import type { Db } from '@/server/core/store';

let db: Db;
beforeEach(() => {
  resetDb();
  resetSimulator();
  db = ensureSeeded();
});

describe('screen contracts expose SAP-native work triggers', () => {
  it('puts S/4 EAM order, component and DMS actions on work package screens', () => {
    expect(SCREENS.scope.actionIds).toContain('scope.create_order');
    expect(SCREENS['work-packages'].actionIds).toEqual(expect.arrayContaining([
      'order.add_operation',
      'order.add_component',
      'order.change_component_qty',
      'order.set_status',
      'order.attach_evidence'
    ]));
    expect(SCREENS.materials.actionIds).toEqual(expect.arrayContaining([
      'reservation.change_quantity',
      'material.issue',
      'material.return',
      'order.change_component_qty'
    ]));
    for (const actionId of ['scope.create_order', 'order.add_component', 'reservation.change_quantity', 'material.return']) {
      const action = getActionById(actionId)!;
      expect(action.targetSystem).toBe('SAP_S4');
      expect(action.connectorId).toBeTruthy();
      expect(action.buildPayload!({} as any, { user: db.users.get('u-admin')!, actorType: 'HUMAN', tenantId: 't1', screen: 'test' } as any).apiService).toBeTruthy();
    }
  });

  it('turns SAP component and reservation rows into persona-specific work', () => {
    const component = getObject(db, 't1', 'CMP-4000103-0010-001')!;
    const plannerActions = nextActionsForObject(component, 'maintenance_planner').map((a) => a.actionId);
    expect(plannerActions).toContain('order.change_component_qty');

    const reservation = getObject(db, 't1', 'RES-0002100244')!;
    const matActions = nextActionsForObject(reservation, 'material_planner').map((a) => a.actionId);
    expect(matActions).toContain('reservation.change_quantity');
    expect(matActions).toContain('material.return');

    const plannerQueue = workQueueForUser(db, db.users.get('u-planner')!);
    expect(plannerQueue.actions.some((a) => a.actionId === 'order.add_component')).toBe(true);
    expect(plannerQueue.actions.some((a) => a.actionId === 'order.change_component_qty')).toBe(true);
  });
});

describe('SAP EAM/MM transactional flows', () => {
  it('adds a SAP order component through API_MAINTENANCEORDER_0002 and read-back reconciliation', async () => {
    const submit = await executeAction(db, 'order.add_component', {
      orderId: 'ORD-4000103',
      operationId: 'OP-4000103-0010',
      materialId: 'MAT-4715',
      quantity: 1,
      plantId: 'P100',
      storageLocation: 'SL02',
      requirementDate: '2026-07-05'
    }, 'u-planner');
    expect(submit.transaction!.payloadPreview).toMatchObject({ apiService: 'API_MAINTENANCEORDER_0002' });

    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-super', 'approve', 'component is required for refractory scope');
    expect(approved.transaction!.lifecycleState).toBe('reconciled');
    expect([...db.objects.values()].some((o) => o.objectType === 'MaintenanceOrderComponentProxy' && o.sourceReference === approved.transaction!.targetDocumentNumber)).toBe(true);
  });

  it('changes component and reservation quantities through governed SAP update actions', async () => {
    const comp = await executeAction(db, 'order.change_component_qty', {
      componentId: 'CMP-4000103-0010-001',
      orderId: 'ORD-4000103',
      operationId: 'OP-4000103-0010',
      materialId: 'MAT-4713',
      oldQuantity: 80,
      newQuantity: 96,
      requirementDate: '2026-07-05',
      reason: 'Additional refractory found during inspection'
    }, 'u-planner');
    await decideTransaction(db, comp.transaction!.transactionId, 'u-super', 'approve', 'quantity supported by inspection finding');
    expect(getObject(db, 't1', 'CMP-4000103-0010-001')!.data.quantity).toBe(96);

    const res = await executeAction(db, 'reservation.change_quantity', {
      reservation: '0002100244',
      reservationItem: '0010',
      materialId: 'MAT-4712',
      oldQuantity: 1,
      newQuantity: 2,
      requiredDate: '2026-07-02',
      reason: 'One additional bundle added to the retube sequence'
    }, 'u-matl');
    await decideTransaction(db, res.transaction!.transactionId, 'u-super', 'approve', 'materials confirmed');
    expect(getObject(db, 't1', 'RES-0002100244')!.lifecycleState).toBe('quantity_changed');
    expect(getObject(db, 't1', 'RES-0002100244')!.data.quantity).toBe(2);
  });

  it('posts a material return as a separate SAP material document, not a local edit', async () => {
    const submit = await executeAction(db, 'material.return', {
      reservation: '0002100244',
      orderId: 'ORD-4000102',
      materialId: 'MAT-4712',
      quantity: 1,
      plantId: 'P100',
      storageLocation: 'SL02',
      reason: 'Unused outage stock returned after inspection cancellation'
    }, 'u-wh');
    expect(submit.transaction!.payloadPreview).toMatchObject({
      apiService: 'API_MATERIAL_DOCUMENT_SRV',
      MaterialDocument: { GoodsMovementType: '262' }
    });
    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-matl', 'approve', 'warehouse count reconciled');
    expect(approved.transaction!.lifecycleState).toBe('reconciled');
    expect([...db.objects.values()].some((o) => o.objectType === 'GoodsMovementProxy' && o.lifecycleState === 'returned')).toBe(true);
  });

  it('blocks unsafe TECO/close and allows a release status transition through the order connector', async () => {
    const blocked = await executeAction(db, 'order.set_status', {
      orderId: 'ORD-4000101',
      newStatus: 'teco',
      reason: 'try to close while punch and WCM are open'
    }, 'u-super');
    expect(blocked.ok).toBe(false);
    expect(blocked.validation!.map((v) => v.message).join(' ')).toContain('TECO/close blocked');

    const release = await executeAction(db, 'order.set_status', {
      orderId: 'ORD-4000103',
      newStatus: 'release',
      reason: 'Package ready to release for field prep'
    }, 'u-planner');
    await decideTransaction(db, release.transaction!.transactionId, 'u-super', 'approve', 'planner evidence accepted');
    expect(getObject(db, 't1', 'ORD-4000103')!.lifecycleState).toBe('released');
  });

  it('stages a released work package to SSAM mobile without pretending it posted to S/4', async () => {
    const submit = await executeAction(db, 'mobile.dispatch_package', {
      workPackageId: 'WP-1001',
      crewId: 'CREW-M1',
      shift: 'Day 07-02',
      dispatchNote: 'Dispatch C-101 tray package with latest QA evidence'
    }, 'u-super');
    const approved = await decideTransaction(db, submit.transaction!.transactionId, 'u-outage', 'approve', 'mobile packet is ready');
    expect(approved.transaction!.postingPath.path).toBe('STAGED_PACKAGE');
    expect(approved.transaction!.targetDocumentNumber).toBe('STAGED_NOT_POSTED');
    expect([...db.objects.values()].some((o) => o.objectType === 'DispatchPacket' && o.lifecycleState === 'dispatched')).toBe(true);
  });
});
