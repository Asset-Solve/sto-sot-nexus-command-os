import { ctxFromRequest, json } from '@/server/http';
import { workQueueForUser } from '@/server/domain/process';

/** Persona work queue: approvals waiting on me, process actions in my court, AI reviews for my role. */
export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  return json({ user: { id: user.id, name: user.name, role: user.role }, ...workQueueForUser(db, user) });
}
