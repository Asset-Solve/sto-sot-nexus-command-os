import { ctxFromRequest, json } from '@/server/http';
import { runLookup } from '@/server/core/lookup';

export async function GET(req: Request, { params }: { params: Promise<{ category: string }> }) {
  const { db, user } = ctxFromRequest(req);
  const { category } = await params;
  const url = new URL(req.url);
  const q: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (q[k] = v));
  const result = runLookup(db, user.tenantId, category, q);
  if (!result) return json({ error: `Unknown lookup category '${category}'` }, 404);
  return json(result);
}
