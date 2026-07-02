/**
 * Tenant-aware in-process repository layer.
 *
 * SIMULATOR/SEED_DATA persistence driver. The repository interface is the
 * production seam: swap `MemoryDriver` for a PostgreSQL driver (row-level
 * security by tenantId) without touching domain services.
 * See docs/data/SOURCE_OF_RECORD_AND_WRITE_POLICY_REGISTER.md.
 */

import type {
  AuditEvent,
  BusinessObject,
  CanonicalTransaction,
  ConnectorRecord,
  DeadLetterMessage,
  OutboxMessage,
  ReconciliationRecord,
  AIRecommendation,
  AgentRun,
  User
} from './types';

export interface Db {
  objects: Map<string, BusinessObject>;
  transactions: Map<string, CanonicalTransaction>;
  outbox: Map<string, OutboxMessage>;
  deadLetters: Map<string, DeadLetterMessage>;
  reconciliations: Map<string, ReconciliationRecord>;
  audit: AuditEvent[];
  connectors: Map<string, ConnectorRecord>;
  users: Map<string, User>;
  aiRecommendations: Map<string, AIRecommendation>;
  agentRuns: Map<string, AgentRun>;
  idempotencyIndex: Map<string, string>; // idempotencyKey -> transactionId
  seeded: boolean;
}

function createDb(): Db {
  return {
    objects: new Map(),
    transactions: new Map(),
    outbox: new Map(),
    deadLetters: new Map(),
    reconciliations: new Map(),
    audit: [],
    connectors: new Map(),
    users: new Map(),
    aiRecommendations: new Map(),
    agentRuns: new Map(),
    idempotencyIndex: new Map(),
    seeded: false
  };
}

/** survive Next.js dev-mode HMR by pinning to globalThis */
const g = globalThis as unknown as { __stoDb?: Db };

export function getDb(): Db {
  if (!g.__stoDb) g.__stoDb = createDb();
  return g.__stoDb;
}

export function resetDb(): Db {
  g.__stoDb = createDb();
  return g.__stoDb;
}

// -------------------------------------------------------------------------
// object repository helpers (always tenant-scoped)
// -------------------------------------------------------------------------

export function putObject(db: Db, obj: BusinessObject): BusinessObject {
  db.objects.set(obj.id, obj);
  return obj;
}

export function getObject(db: Db, tenantId: string, id: string): BusinessObject | undefined {
  const o = db.objects.get(id);
  return o && o.tenantId === tenantId ? o : undefined;
}

export function listObjects(
  db: Db,
  tenantId: string,
  objectType: string,
  filter?: (o: BusinessObject) => boolean
): BusinessObject[] {
  const out: BusinessObject[] = [];
  for (const o of db.objects.values()) {
    if (o.tenantId !== tenantId || o.objectType !== objectType) continue;
    if (filter && !filter(o)) continue;
    out.push(o);
  }
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function findObject(
  db: Db,
  tenantId: string,
  objectType: string,
  pred: (o: BusinessObject) => boolean
): BusinessObject | undefined {
  for (const o of db.objects.values()) {
    if (o.tenantId === tenantId && o.objectType === objectType && pred(o)) return o;
  }
  return undefined;
}
