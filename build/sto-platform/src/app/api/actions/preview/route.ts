import { ctxFromRequest, json } from '@/server/http';
import { getActionById } from '@/server/domain/registry';
import { decidePostingPath } from '@/server/core/postingPath';
import { adapterFor } from '@/server/connectors/simulator';
import { DOC_PREFIX } from '@/server/connectors/registry';

/** Validation + exact payload preview + posting-path explanation. No side effects. */
export async function POST(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const body = await req.json();
  const action = getActionById(body.actionId);
  if (!action) return json({ error: 'unknown action' }, 404);
  const ctx = { user, actorType: 'HUMAN' as const, tenantId: user.tenantId, screen: body.screen ?? 'preview' };
  const validation = action.validate(body.payload ?? {}, ctx);
  const connector = action.connectorId ? db.connectors.get(action.connectorId) : undefined;
  const decision = decidePostingPath({
    actorType: 'HUMAN',
    actionClass: action.actionClass,
    targetSystem: action.targetSystem,
    connectorWritePolicy: connector?.writePolicy,
    connectorId: connector?.connectorId,
    connectorEnabled: connector?.enabled,
    hasReleasedWriteApi: connector ? connector.capabilities.create || connector.capabilities.update : undefined,
    regulated: action.riskClass === 'SAFETY_CRITICAL' || action.riskClass === 'FINANCE_CRITICAL'
  });
  const payload = action.buildPayload ? action.buildPayload(body.payload ?? {}, ctx) : undefined;
  let dryRun = null;
  if (connector && payload) {
    const adapter = adapterFor(connector, DOC_PREFIX[connector.connectorId] ?? 'DOC');
    dryRun = await adapter.dryRun(action.connectorOperation ?? 'create', payload);
  }
  return json({
    validation, decision, payloadPreview: payload, dryRun,
    connector: connector ? {
      connectorId: connector.connectorId, label: connector.label, apiServiceName: connector.apiServiceName,
      apiPath: connector.apiPath, mode: connector.sourceMode, writePolicy: connector.writePolicy,
      mappingVersion: connector.mappingVersion, enabled: connector.enabled
    } : null,
    approval: {
      required: decision.requiresApproval,
      approverRoles: action.approverRoles ?? [],
      sod: action.sod,
      readback: connector ? `${connector.readbackMethod} → reconcile on ${connector.reconciliationKey}` : 'local commit + audit'
    }
  });
}
