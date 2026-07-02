import { ctxFromRequest, json } from '@/server/http';
import { auditFor, recentAudit } from '@/server/core/audit';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const url = new URL(req.url);
  const objectId = url.searchParams.get('objectId');
  const items = objectId ? auditFor(db, user.tenantId, objectId) : recentAudit(db, user.tenantId, 150);
  return json({ items });
}
