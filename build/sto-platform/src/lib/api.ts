'use client';

/** Client API layer. Persona (simulated identity) travels as x-user-id; in
 * production this is the IdP session (XSUAA/Entra) — never a client choice. */

export function currentUserId(): string {
  if (typeof window === 'undefined') return 'u-sto';
  return window.localStorage.getItem('sto.userId') ?? 'u-sto';
}

export function setCurrentUserId(id: string) {
  window.localStorage.setItem('sto.userId', id);
  window.dispatchEvent(new Event('sto:user-changed'));
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-user-id': currentUserId(), ...(init?.headers ?? {}) },
    cache: 'no-store'
  });
  return res.json();
}

export const get = <T = any>(path: string) => api<T>(path);
export const post = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });
