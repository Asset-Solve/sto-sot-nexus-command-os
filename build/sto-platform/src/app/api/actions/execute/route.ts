import { ctxFromRequest, json } from '@/server/http';
import { executeAction } from '@/server/core/engine';

export async function POST(req: Request) {
  const { user } = ctxFromRequest(req);
  const body = await req.json();
  const result = await executeAction(
    ctxFromRequest(req).db,
    body.actionId,
    body.payload ?? {},
    user.id,
    body.actorType ?? 'HUMAN',
    body.screen ?? 'api'
  );
  return json(result, result.ok ? 200 : 422);
}
