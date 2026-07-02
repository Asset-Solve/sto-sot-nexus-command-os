import { ctxFromRequest, json } from '@/server/http';
import { adapterFor } from '@/server/connectors/simulator';
import { DOC_PREFIX } from '@/server/connectors/registry';

export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  return json({ items: [...db.connectors.values()].filter((c) => c.tenantId === user.tenantId) });
}

export async function POST(req: Request) {
  const { db } = ctxFromRequest(req);
  const body = await req.json();
  const connector = db.connectors.get(body.connectorId);
  if (!connector) return json({ error: 'connector not found' }, 404);
  const adapter = adapterFor(connector, DOC_PREFIX[connector.connectorId] ?? 'DOC');
  if (body.op === 'test') return json(await adapter.testConnection());
  if (body.op === 'dryrun') return json(await adapter.dryRun(body.operation ?? 'create', body.payload ?? {}));
  if (body.op === 'refresh-metadata') {
    connector.lastMetadataRefresh = new Date().toISOString();
    return json({ ok: true, lastMetadataRefresh: connector.lastMetadataRefresh });
  }
  return json({ error: 'unknown op' }, 400);
}
