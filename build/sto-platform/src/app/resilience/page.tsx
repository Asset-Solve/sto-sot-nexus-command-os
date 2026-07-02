'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { Chip, Panel, Toast, stateTone } from '@/components/ui';

export default function ResilienceOps() {
  const [ops, setOps] = useState<any>({ outbox: [], deadLetters: [], reconciliations: [] });
  const [txns, setTxns] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);

  const load = useCallback(() => {
    get('/api/ops').then(setOps);
    get('/api/transactions').then((r) => setTxns(r.items ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function tick() {
    const r = await post('/api/ops', { op: 'tick', ignoreBackoff: true });
    setToast({ msg: `Worker tick: ${JSON.stringify(r.summary)}`, tone: 'ok' });
    load();
  }
  async function replay(dlqId: string) {
    const r = await post('/api/ops', { op: 'replay', dlqId, reason });
    setToast({ msg: r.message, tone: r.ok ? 'ok' : 'bad' });
    load();
  }
  async function reverse(transactionId: string) {
    const r = await post('/api/transactions/decide', { transactionId, decision: 'reverse', reason: reason || 'reversal requested from resilience console' });
    setToast({ msg: r.message, tone: r.ok ? 'ok' : 'bad' });
    load();
  }

  return (
    <div>
      <h1 className="page">Resilience Ops & Writeback Console</h1>
      <div className="page-purpose">
        Enterprise control plane: canonical transactions, outbox, retries, DLQ, replay-with-reason, read-back, reconciliation, payload snapshots. Posted records reverse via linked transactions — never in-place edits.
      </div>

      <div className="toolbar">
        <button className="btn primary" onClick={tick}>▶ Run worker tick</button>
        <input placeholder="Reason (required for replay / reversal — recorded in audit)" value={reason} onChange={(e) => setReason(e.target.value)} style={{ maxWidth: 420 }} />
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn ghost" onClick={load}>↻ Refresh</button>
      </div>

      <div className="split">
        <div>
          <Panel title="Canonical transactions" right={<Chip mono>{txns.length}</Chip>}>
            <table className="grid">
              <thead><tr><th>Txn</th><th>Action</th><th>State</th><th>Doc #</th><th>Reconciliation</th><th></th></tr></thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.transactionId} className={`row ${sel?.transactionId === t.transactionId ? 'selected' : ''}`} onClick={() => setSel(t)}>
                    <td className="mono">{t.transactionId.slice(0, 16)}…</td>
                    <td>{t.actionId}<div className="faint">{t.connectorId ?? 'local'}</div></td>
                    <td><Chip tone={stateTone(t.lifecycleState)}>{t.lifecycleState}</Chip></td>
                    <td className="mono">{t.targetDocumentNumber ?? '—'}</td>
                    <td><Chip tone={t.reconciliationStatus === 'MATCHED' ? 'ok' : t.reconciliationStatus === 'MISMATCH' ? 'bad' : ''}>{t.reconciliationStatus}</Chip></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {['posted', 'reconciled'].includes(t.lifecycleState) && <button className="btn danger" onClick={() => reverse(t.transactionId)}>Reverse</button>}
                    </td>
                  </tr>
                ))}
                {txns.length === 0 && <tr><td colSpan={6} className="empty">No transactions yet — submit a governed action from any workbench.</td></tr>}
              </tbody>
            </table>
          </Panel>

          <Panel title="Outbox" right={<Chip mono>{ops.outbox.length}</Chip>}>
            <table className="grid">
              <thead><tr><th>Msg</th><th>Connector</th><th>Op</th><th>State</th><th>Attempts</th><th>Last error</th></tr></thead>
              <tbody>
                {ops.outbox.map((m: any) => (
                  <tr key={m.id}>
                    <td className="mono">{m.id.slice(0, 14)}…</td>
                    <td>{m.connectorId}</td>
                    <td className="mono">{m.operation}</td>
                    <td><Chip tone={stateTone(m.state)}>{m.state}</Chip></td>
                    <td className="mono">{m.attempts}/{m.maxAttempts}</td>
                    <td className="faint">{m.lastError?.slice(0, 60) ?? '—'}</td>
                  </tr>
                ))}
                {ops.outbox.length === 0 && <tr><td colSpan={6} className="empty">Outbox empty.</td></tr>}
              </tbody>
            </table>
          </Panel>

          <Panel title="Dead letter queue" right={<Chip mono tone={ops.deadLetters.filter((d: any) => !d.replayedAt).length ? 'bad' : 'ok'}>{ops.deadLetters.length}</Chip>}>
            <table className="grid">
              <thead><tr><th>DLQ</th><th>Connector</th><th>Error</th><th>Replay</th></tr></thead>
              <tbody>
                {ops.deadLetters.map((d: any) => (
                  <tr key={d.id}>
                    <td className="mono">{d.id.slice(0, 14)}…</td>
                    <td>{d.connectorId}</td>
                    <td className="faint">{d.error.slice(0, 70)}</td>
                    <td>
                      {d.replayedAt
                        ? <Chip tone="ok">replayed by {d.replayedBy}</Chip>
                        : <button className="btn primary" onClick={() => replay(d.id)} title="Requires integration_operator role + reason">Replay</button>}
                    </td>
                  </tr>
                ))}
                {ops.deadLetters.length === 0 && <tr><td colSpan={4} className="empty">DLQ empty.</td></tr>}
              </tbody>
            </table>
          </Panel>
        </div>

        <div>
          {sel ? (
            <Panel title={<>Transaction <span className="mono faint">{sel.transactionId.slice(0, 20)}…</span></>}>
              <dl className="kv">
                <dt>Action</dt><dd>{sel.actionId}</dd>
                <dt>Posting path</dt><dd><Chip mono>{sel.postingPath?.path}</Chip><div className="faint">{sel.postingPath?.reason}</div></dd>
                <dt>Submitted</dt><dd>{sel.submittedBy} ({sel.submittedByRole})</dd>
                <dt>Approved by</dt><dd>{sel.approvedBy ?? '—'}</dd>
                <dt>Idempotency</dt><dd className="mono faint">{sel.idempotencyKey?.slice(0, 40)}…</dd>
                <dt>Correlation</dt><dd className="mono faint">{sel.correlationId}</dd>
                <dt>Payload hash</dt><dd className="mono faint">{sel.payloadHash ?? '—'}</dd>
              </dl>
              {sel.payloadPreview && <><div style={{ margin: '10px 0 4px' }}><b>Payload snapshot</b></div><pre className="payload">{JSON.stringify(sel.payloadPreview, null, 2)}</pre></>}
              <div style={{ margin: '10px 0 4px' }}><b>Lifecycle history</b></div>
              <div className="timeline">
                {(sel.history ?? []).map((h: any, i: number) => (
                  <div key={i} className="tl-item">
                    <div className="when">{new Date(h.at).toLocaleTimeString()}</div>
                    <div><Chip tone={stateTone(h.state)}>{h.state}</Chip> <span className="dim">{h.actor}</span></div>
                    {h.note && <div className="faint">{h.note}</div>}
                  </div>
                ))}
              </div>
            </Panel>
          ) : (
            <Panel title="Reconciliation records">
              <table className="grid">
                <thead><tr><th>Key</th><th>Status</th></tr></thead>
                <tbody>
                  {ops.reconciliations.map((r: any) => (
                    <tr key={r.id}><td className="mono">{r.reconciliationKey}</td><td><Chip tone={r.status === 'MATCHED' ? 'ok' : 'warn'}>{r.status}</Chip></td></tr>
                  ))}
                  {ops.reconciliations.length === 0 && <tr><td colSpan={2} className="empty">No reconciliations yet.</td></tr>}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
