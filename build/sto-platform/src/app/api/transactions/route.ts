import { ctxFromRequest, json } from '@/server/http';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const items = [...db.transactions.values()]
    .filter((t) => t.tenantId === user.tenantId && (!state || t.lifecycleState === state))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return json({ items });
}
