/** BFF helpers: user resolution + tenant scoping for API route handlers. */

import { ensureSeeded } from './core/seed';
import type { Db } from './core/store';
import type { User } from './core/types';

export function ctxFromRequest(req: Request): { db: Db; user: User } {
  const db = ensureSeeded();
  const userId = req.headers.get('x-user-id') ?? 'u-sto';
  const user = db.users.get(userId) ?? db.users.get('u-sto')!;
  return { db, user };
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}
