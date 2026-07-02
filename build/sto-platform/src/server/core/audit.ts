import type { ActorType, AuditEvent } from './types';
import type { Db } from './store';
import { newId, nowIso } from './ids';

export function writeAudit(
  db: Db,
  e: Omit<AuditEvent, 'id' | 'at'>
): AuditEvent {
  const event: AuditEvent = { ...e, id: newId('aud'), at: nowIso() };
  db.audit.push(event);
  return event;
}

export function auditFor(db: Db, tenantId: string, objectId: string): AuditEvent[] {
  return db.audit.filter((a) => a.tenantId === tenantId && (a.objectId === objectId || a.correlationId === objectId));
}

export function recentAudit(db: Db, tenantId: string, limit = 100): AuditEvent[] {
  return db.audit.filter((a) => a.tenantId === tenantId).slice(-limit).reverse();
}

export function actor(db: Db, userId: string, actorType: ActorType = 'HUMAN') {
  const u = db.users.get(userId);
  return { actor: u?.name ?? userId, actorType, actorRole: u?.role };
}
