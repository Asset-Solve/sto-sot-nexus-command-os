import { ctxFromRequest, json } from '@/server/http';
import { processOutbox, replayDeadLetter } from '@/server/core/outbox';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const t = user.tenantId;
  return json({
    outbox: [...db.outbox.values()].filter((m) => m.tenantId === t).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    deadLetters: [...db.deadLetters.values()].filter((d) => d.tenantId === t),
    reconciliations: [...db.reconciliations.values()].filter((r) => r.tenantId === t)
  });
}

export async function POST(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const body = await req.json();
  if (body.op === 'tick') {
    const summary = await processOutbox(db, { ignoreBackoff: !!body.ignoreBackoff });
    return json({ ok: true, summary });
  }
  if (body.op === 'replay') {
    const result = await replayDeadLetter(db, body.dlqId, user, body.reason ?? '');
    return json(result, result.ok ? 200 : 422);
  }
  return json({ error: 'unknown op' }, 400);
}
