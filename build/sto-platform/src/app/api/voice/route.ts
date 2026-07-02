import { ctxFromRequest, json } from '@/server/http';
import { interpretCommand } from '@/server/ai/voice';
import { writeAudit } from '@/server/core/audit';

export async function POST(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const body = await req.json();
  const result = interpretCommand(db, user.tenantId, body.transcript ?? '');
  writeAudit(db, {
    tenantId: user.tenantId, actor: user.name, actorType: 'HUMAN', actorRole: user.role,
    action: `voice.${result.intent}`, objectType: 'VoiceCommand', objectId: result.route ?? 'n/a',
    details: { transcript: result.transcript, injectionFlagged: result.injectionFlagged }
  });
  return json(result);
}
