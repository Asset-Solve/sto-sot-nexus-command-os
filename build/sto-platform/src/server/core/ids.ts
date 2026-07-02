let counter = 0;

export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newCorrelationId(): string {
  return newId('corr');
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** stable deterministic hash for payload snapshots (FNV-1a) */
export function hashPayload(payload: unknown): string {
  const s = JSON.stringify(payload) ?? '';
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a-${(h >>> 0).toString(16)}`;
}
