'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { Chip, Drawer, Panel, Toast } from '@/components/ui';

export default function IntegrationHub() {
  const [items, setItems] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [dry, setDry] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);

  const load = useCallback(() => { get('/api/connectors').then((r) => setItems(r.items ?? [])); }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(c: any) {
    const r = await post('/api/actions/execute', {
      actionId: 'connector.toggle',
      payload: { connectorId: c.connectorId, enabled: !c.enabled, reason: `${c.enabled ? 'Disable' : 'Enable'} via Integration Hub` }
    });
    setToast({ msg: r.blocked ? r.blockedReason : r.message, tone: r.ok ? 'ok' : 'bad' });
    load();
  }

  async function runTest(c: any) { setTest(await post('/api/connectors', { connectorId: c.connectorId, op: 'test' })); }
  async function runDry(c: any) {
    setDry(await post('/api/connectors', { connectorId: c.connectorId, op: 'dryrun', operation: 'create', payload: { sample: true, note: 'dry-run creates no transaction' } }));
  }

  return (
    <div>
      <h1 className="page">Connectors & Integration Hub</h1>
      <div className="page-purpose">
        Object-specific native connectors — never one generic SAP adapter. Credentials live in BTP Destination / vault; the app holds logical names only.
        Disabling a connector blocks writes server-side and holds outbox messages.
      </div>

      <Panel title="Connector runtime" right={<Chip mono>{items.length} connectors</Chip>}>
        <table className="grid">
          <thead><tr><th>Connector</th><th>API / Interface</th><th>Mode</th><th>Write policy</th><th>Capabilities</th><th>Certification</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.connectorId} className="row" onClick={() => setSel(c)}>
                <td><b>{c.label}</b><div className="faint mono">{c.connectorId} · {c.logicalDestination}</div></td>
                <td className="mono">{c.apiServiceName}{c.communicationScenario ? <div className="faint">{c.communicationScenario}</div> : null}</td>
                <td><Chip mono tone={c.enabled ? '' : 'bad'}>{c.enabled ? c.sourceMode : 'DISABLED'}</Chip></td>
                <td><Chip mono tone={c.writePolicy === 'FAIL_CLOSED' ? 'safety' : c.writePolicy === 'READ_ONLY' ? 'info' : ''}>{c.writePolicy}</Chip></td>
                <td className="faint mono">{Object.entries(c.capabilities).filter(([, v]) => v).map(([k]) => k).join(' ')}</td>
                <td className="faint">{c.certificationStatus}</td>
                <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn" onClick={() => runTest(c)}>Test</button>{' '}
                  <button className="btn" onClick={() => runDry(c)}>Dry-run</button>{' '}
                  <button className={`btn ${c.enabled ? 'danger' : 'primary'}`} onClick={() => toggle(c)}>{c.enabled ? 'Disable' : 'Enable'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {test && (
        <Panel title="Connection test result" right={<button className="btn ghost" onClick={() => setTest(null)}>✕</button>}>
          <pre className="payload">{JSON.stringify(test, null, 2)}</pre>
        </Panel>
      )}
      {dry && (
        <Panel title="Dry-run payload (no transaction created)" right={<button className="btn ghost" onClick={() => setDry(null)}>✕</button>}>
          {(dry.warnings ?? []).map((w: string, i: number) => <div key={i} className="vmsg WARNING">{w}</div>)}
          <pre className="payload">{JSON.stringify(dry, null, 2)}</pre>
        </Panel>
      )}

      {sel && (
        <Drawer title={sel.label} badge={<Chip mono>{sel.sourceSystem}</Chip>} onClose={() => setSel(null)}>
          <dl className="kv">
            <dt>API service</dt><dd className="mono">{sel.apiServiceName} v{sel.apiVersion}</dd>
            <dt>Path</dt><dd className="mono faint">{sel.apiPath}</dd>
            <dt>Auth</dt><dd>{sel.authMode}</dd>
            <dt>CSRF / ETag</dt><dd className="faint">{sel.csrfPolicy} · {sel.etagPolicy}</dd>
            <dt>Idempotency</dt><dd className="mono faint">{sel.idempotencyKeyPattern}</dd>
            <dt>Read-back</dt><dd>{sel.readbackMethod} → key {sel.reconciliationKey}</dd>
            <dt>Retry / DLQ</dt><dd className="faint">{sel.retryPolicy.maxAttempts} attempts · {sel.dlqPolicy}</dd>
            <dt>Replay</dt><dd className="faint">{sel.replayPolicy}</dd>
            <dt>Mapping</dt><dd className="mono">{sel.mappingProfile} @ {sel.mappingVersion}</dd>
            <dt>Owner / steward</dt><dd>{sel.ownerRole} / {sel.dataSteward}</dd>
            <dt>Metadata refresh</dt><dd className="faint mono">{new Date(sel.lastMetadataRefresh).toLocaleString()}</dd>
            {sel.docsUrl && <><dt>Contract proof</dt><dd className="faint">{sel.docsUrl}</dd></>}
          </dl>
        </Drawer>
      )}
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
