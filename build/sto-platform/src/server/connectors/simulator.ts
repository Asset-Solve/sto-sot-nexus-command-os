/**
 * Simulator connector adapter.
 *
 * Implements the exact ConnectorAdapter contract used by SANDBOX/LIVE
 * adapters (section 24.2): same operations, same response envelope, same
 * read-back semantics, same idempotency behavior. Switching mode never
 * requires a UI rewrite — only the adapter binding changes.
 */

import type {
  ConnectorAdapter,
  ConnectorContext,
  ConnectorRecord,
  ConnectorResponse
} from '../core/types';
import { nowIso } from '../core/ids';

interface PostedDoc {
  documentNumber: string;
  operation: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  correlationId: string;
  postedAt: string;
}

/** simulated SAP/non-SAP document store, keyed per connector */
const g = globalThis as unknown as {
  __simDocs?: Map<string, Map<string, PostedDoc>>; // connectorId -> idempotencyKey -> doc
  __simSeq?: Map<string, number>;
};

function docs(connectorId: string): Map<string, PostedDoc> {
  if (!g.__simDocs) g.__simDocs = new Map();
  if (!g.__simDocs.has(connectorId)) g.__simDocs.set(connectorId, new Map());
  return g.__simDocs.get(connectorId)!;
}

function nextSeq(connectorId: string): number {
  if (!g.__simSeq) g.__simSeq = new Map();
  const n = (g.__simSeq.get(connectorId) ?? 100000) + 1;
  g.__simSeq.set(connectorId, n);
  return n;
}

export function resetSimulator(): void {
  g.__simDocs = new Map();
  g.__simSeq = new Map();
}

export class SimulatorAdapter implements ConnectorAdapter {
  constructor(
    public record: ConnectorRecord,
    private docPrefix: string
  ) {}

  private base(): Omit<ConnectorResponse, 'ok'> {
    return { latencyMs: 40 + Math.floor(Math.random() * 80), connectorId: this.record.connectorId, mode: this.record.sourceMode, at: nowIso() };
  }

  async execute(operation: string, payload: Record<string, unknown>, ctx: ConnectorContext): Promise<ConnectorResponse> {
    const b = this.base();

    if (!this.record.enabled || this.record.sourceMode === 'DISABLED') {
      return { ...b, ok: false, error: `Connector ${this.record.connectorId} is disabled — write blocked server-side.`, retryable: false };
    }
    if (this.record.writePolicy === 'FAIL_CLOSED') {
      return { ...b, ok: false, error: `POLICY_VIOLATION: ${this.record.sourceObject} is safety/OT controlled. Writes fail closed; request correction in the owning system.`, retryable: false };
    }
    if (this.record.writePolicy === 'READ_ONLY') {
      return { ...b, ok: false, error: `POLICY_VIOLATION: ${this.record.sourceObject} is read-only from this platform.`, retryable: false };
    }

    // capability check — object-specific, mirrors SAP business validation errors
    const capMap: Record<string, keyof ConnectorRecord['capabilities']> = {
      create: 'create', update: 'update', cancel: 'cancel', reverse: 'reverse', confirm: 'confirm', attach: 'attach', delete: 'delete'
    };
    const cap = capMap[operation];
    const reverseOk = operation === 'reverse' && (this.record.capabilities.reverse || this.record.capabilities.cancel);
    if (cap && !this.record.capabilities[cap] && !reverseOk) {
      return { ...b, ok: false, error: `CAPABILITY_MISSING: ${this.record.apiServiceName} does not expose '${operation}' for ${this.record.sourceObject}.`, retryable: false };
    }

    // deterministic failure injection for resilience demos/tests
    const inject = payload['__simulateFailure'] as string | undefined;
    if (inject === 'transient') {
      return { ...b, ok: false, error: 'HTTP 503: simulated gateway timeout (transient).', retryable: true };
    }
    if (inject === 'permanent') {
      return { ...b, ok: false, error: 'SAP business validation: simulated hard failure (e.g. posting period closed).', retryable: false };
    }

    // idempotency: same key returns the same document (exactly-once effect)
    const store = docs(this.record.connectorId);
    const existing = store.get(ctx.idempotencyKey);
    if (existing) {
      return { ...b, ok: true, documentNumber: existing.documentNumber, status: 'DUPLICATE_IGNORED', body: { ...existing.payload, idempotentReplay: true } };
    }

    const documentNumber = `${this.docPrefix}${String(nextSeq(this.record.connectorId)).padStart(6, '0')}`;
    const posted: PostedDoc = {
      documentNumber, operation, payload, idempotencyKey: ctx.idempotencyKey, correlationId: ctx.correlationId, postedAt: nowIso()
    };
    store.set(ctx.idempotencyKey, posted);
    this.record.lastSyncAt = nowIso();

    return {
      ...b, ok: true, documentNumber, status: 'POSTED',
      body: { [this.record.reconciliationKey]: documentNumber, operation, echo: payload }
    };
  }

  async readBack(reconciliationKey: string, _expected: Record<string, unknown>, _ctx: ConnectorContext): Promise<ConnectorResponse> {
    const b = this.base();
    for (const doc of docs(this.record.connectorId).values()) {
      if (doc.documentNumber === reconciliationKey) {
        return { ...b, ok: true, documentNumber: doc.documentNumber, status: 'FOUND', body: { ...doc.payload, postedAt: doc.postedAt } };
      }
    }
    return { ...b, ok: false, error: `READBACK_MISS: ${this.record.sourceObject} ${reconciliationKey} not found in target.`, retryable: true };
  }

  async dryRun(operation: string, payload: Record<string, unknown>) {
    const warnings: string[] = [];
    if (this.record.writePolicy === 'FAIL_CLOSED') warnings.push('Target is FAIL_CLOSED — this payload can never be posted from this platform.');
    if (this.record.writePolicy === 'READ_ONLY') warnings.push('Target is READ_ONLY — dry-run only, no write path exists.');
    if (!this.record.enabled) warnings.push('Connector is disabled — writes are blocked server-side.');
    return {
      payload: { apiService: this.record.apiServiceName, operation, mappingVersion: this.record.mappingVersion, body: payload },
      endpoint: `${this.record.logicalDestination}${this.record.apiPath}`,
      warnings
    };
  }

  async testConnection(): Promise<ConnectorResponse> {
    const b = this.base();
    if (!this.record.enabled) return { ...b, ok: false, error: 'Connector disabled.' };
    return { ...b, ok: true, status: 'OK', body: { destination: this.record.logicalDestination, csrf: this.record.csrfPolicy } };
  }
}

export function adapterFor(record: ConnectorRecord, docPrefix: string): ConnectorAdapter {
  // SIMULATOR | SEED_DATA | CACHE all bind the simulator implementation today.
  // SANDBOX/LIVE bind HTTP adapters with identical contracts (future module);
  // certification gate blocks promotion until sandbox evidence exists.
  return new SimulatorAdapter(record, docPrefix);
}
