import { ctxFromRequest, json } from '@/server/http';
import { listObjects } from '@/server/core/store';
import { inScope } from '@/server/core/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { db, user } = ctxFromRequest(req);
  const { type } = await params;
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const items = listObjects(db, user.tenantId, type, (o) => {
    if (eventId && o.data['eventId'] && o.data['eventId'] !== eventId) return false;
    return inScope(user, o);
  });
  return json({ items, objectType: type });
}
