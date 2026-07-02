import { ctxFromRequest, json } from '@/server/http';
import { PROCESS_STAGES, STATE_ACTIONS, stageStatuses } from '@/server/domain/process';

/** Process backbone: lifecycle stages with live status + object-state action matrix. */
export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId') ?? 'EV-1001';
  return json({
    stages: stageStatuses(db, user.tenantId, eventId),
    stateActions: STATE_ACTIONS,
    stageCount: PROCESS_STAGES.length
  });
}
