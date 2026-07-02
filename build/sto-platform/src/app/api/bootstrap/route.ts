import { ctxFromRequest, json } from '@/server/http';
import { listObjects } from '@/server/core/store';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const personas = [...db.users.values()].filter((u) => u.tenantId === user.tenantId)
    .map((u) => ({ id: u.id, name: u.name, role: u.role }));
  const events = listObjects(db, user.tenantId, 'TurnaroundEvent').map((e) => ({ id: e.id, ...e.data, lifecycleState: e.lifecycleState }));
  return json({ user, personas, events });
}
