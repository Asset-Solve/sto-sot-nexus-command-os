import { ctxFromRequest, json } from '@/server/http';
import { decideTransaction, requestReversal } from '@/server/core/engine';

export async function POST(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const body = await req.json();
  if (body.decision === 'reverse') {
    const result = await requestReversal(db, body.transactionId, user.id, body.reason ?? '');
    return json(result, result.ok ? 200 : 422);
  }
  const result = await decideTransaction(db, body.transactionId, user.id, body.decision, body.reason);
  return json(result, result.ok ? 200 : 422);
}
