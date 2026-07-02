import { ctxFromRequest, json } from '@/server/http';
import { listAgents, runAgent, runAllAgents } from '@/server/ai/agents';
import { executeAction } from '@/server/core/engine';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  return json({
    agents: listAgents(),
    recommendations: [...db.aiRecommendations.values()].filter((r) => r.tenantId === user.tenantId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    runs: [...db.agentRuns.values()].filter((r) => r.tenantId === user.tenantId).slice(-20).reverse()
  });
}

export async function POST(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const body = await req.json();
  if (body.op === 'run') {
    const result = body.agentId === 'all'
      ? runAllAgents(db, user.tenantId, body.eventId ?? 'EV-1001')
      : [runAgent(db, user.tenantId, body.agentId, body.eventId ?? 'EV-1001')];
    return json({ ok: true, runs: result.map((r) => r.run), recommendations: result.flatMap((r) => r.recommendations) });
  }
  if (body.op === 'attempt-blocked-action') {
    // proves the policy gateway: an AI actor attempting a controlled action is refused + audited
    const result = await executeAction(db, body.actionId ?? 'startup.approve_rts', body.payload ?? { sourceObjectId: 'SUR-EV1', reason: 'AI attempt' }, user.id, 'AI_AGENT', '/ai');
    return json(result, 200);
  }
  return json({ error: 'unknown op' }, 400);
}
