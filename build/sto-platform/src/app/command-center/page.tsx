'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { get, post } from '@/lib/api';
import { Chip, Panel, Toast, stateTone } from '@/components/ui';

export default function CommandCenter() {
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);
  const [reason, setReason] = useState('');
  const router = useRouter();

  const load = useCallback(() => { get('/api/kpis?eventId=EV-1001').then(setData); }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(transactionId: string, decision: string) {
    const r = await post('/api/transactions/decide', { transactionId, decision, reason: reason || `${decision} via command center` });
    setToast({ msg: r.blocked ? r.blockedReason : r.message, tone: r.ok ? 'ok' : 'bad' });
    load();
  }

  if (!data) return <div className="empty">Loading operating picture…</div>;
  const ev = data.event;

  return (
    <div>
      <h1 className="page">Event Command Center</h1>
      <div className="page-purpose">
        {ev?.name} — {ev?.plantId}/{ev?.unitId} · Day {ev?.dayOf} of {ev?.totalDays} · Phase <Chip tone="info">{ev?.phase}</Chip> · Every KPI drills to its transactional records.
      </div>

      <div className="kpi-grid">
        {data.kpis.map((k: any) => (
          <div key={k.id} className={`kpi ${k.tone}`} onClick={() => router.push(k.drill)} title={`Drill to ${k.drill}`}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="detail">{k.detail || '—'}</div>
          </div>
        ))}
      </div>

      <div className="split">
        <div>
          <Panel title="Approval queue (four-eyes)" right={<Chip mono>{data.approvals.length}</Chip>}>
            {data.approvals.length === 0 ? (
              <div className="faint">No transactions pending approval. Submitted controlled actions appear here for a different approver (SoD enforced server-side).</div>
            ) : (
              <>
                <input placeholder="Approval reason / note (recorded in audit)" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 8 }} />
                <table className="grid">
                  <thead><tr><th>Transaction</th><th>Action</th><th>Submitted by</th><th>Risk</th><th></th></tr></thead>
                  <tbody>
                    {data.approvals.map((a: any) => (
                      <tr key={a.transactionId}>
                        <td className="mono">{a.transactionId.slice(0, 18)}…</td>
                        <td>{a.actionId}</td>
                        <td className="dim">{a.submittedBy} <span className="faint">({a.submittedByRole})</span></td>
                        <td><Chip tone={String(a.riskClass).includes('SAFETY') ? 'safety' : String(a.riskClass).includes('FINANCE') ? 'bad' : ''}>{a.riskClass}</Chip></td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn primary" onClick={() => decide(a.transactionId, 'approve')}>Approve</button>{' '}
                          <button className="btn danger" onClick={() => decide(a.transactionId, 'reject')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Panel>

          <Panel title="Integration health" right={<a className="btn ghost" href="/connectors">Open hub →</a>}>
            <table className="grid">
              <thead><tr><th>Connector</th><th>Mode</th><th>Write policy</th><th>Certification</th><th>Last sync</th></tr></thead>
              <tbody>
                {data.integrationHealth.slice(0, 10).map((c: any) => (
                  <tr key={c.connectorId}>
                    <td>{c.label}</td>
                    <td><Chip mono tone={c.enabled ? '' : 'bad'}>{c.enabled ? c.mode : 'DISABLED'}</Chip></td>
                    <td><Chip mono tone={c.writePolicy === 'FAIL_CLOSED' ? 'safety' : c.writePolicy === 'READ_ONLY' ? 'info' : ''}>{c.writePolicy}</Chip></td>
                    <td className="faint">{c.certification}</td>
                    <td className="faint mono">{new Date(c.lastSyncAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div>
          <Panel title="Voice command examples">
            <div className="dim" style={{ lineHeight: 1.9 }}>
              “<i>Show material shortages</i>” · “<i>What is the event status</i>” · “<i>Open permits</i>” ·
              “<i>Reserve 6 sets of MAT-4714</i>” (drafts a governed SAP reservation) ·
              “<i>Raise emergent work</i>” · “<i>Log 10 hours for W-1001</i>” ·
              “<i>Any dead letters?</i>”
              <div className="faint" style={{ marginTop: 8 }}>
                Voice drafts controlled actions — it never approves, posts, releases, or replays. Safety/finance/startup approvals are refused by the voice policy outright.
              </div>
            </div>
          </Panel>
          <Panel title="Event vitals">
            <dl className="kv">
              <dt>Window</dt><dd>{ev?.start} → {ev?.end}</dd>
              <dt>Progress</dt><dd>{ev?.progressPct}% vs {ev?.planPct}% plan</dd>
              <dt>Schedule var.</dt><dd><Chip tone={ev?.scheduleVarianceDays > 0 ? 'warn' : 'ok'}>{ev?.scheduleVarianceDays} days</Chip></dd>
              <dt>Cost</dt><dd>${ev?.forecastMUSD}M forecast / ${ev?.budgetMUSD}M budget</dd>
              <dt>Safety TRIR</dt><dd>{ev?.safetyTRIR}</dd>
              <dt>Integration</dt><dd className="faint">{ev?.integrationProfile}</dd>
              <dt>WBS</dt><dd className="mono">{ev?.wbsId}</dd>
            </dl>
          </Panel>
          <Panel title="AI review queue" right={<a className="btn ghost" href="/ai">Workbench →</a>}>
            <div className="faint">Run the agent roster in the AI Workbench to generate cited review packages. AI recommendations always route to a named human authority; blocked action classes are shown with an explanation.</div>
          </Panel>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
