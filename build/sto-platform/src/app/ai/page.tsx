'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { Chip, Panel, Toast } from '@/components/ui';

export default function AIWorkbench() {
  const [data, setData] = useState<any>({ agents: [], recommendations: [], runs: [] });
  const [busy, setBusy] = useState(false);
  const [blockedProof, setBlockedProof] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);

  const load = useCallback(() => { get('/api/ai').then(setData); }, []);
  useEffect(() => { load(); }, [load]);

  async function run(agentId: string) {
    setBusy(true);
    const r = await post('/api/ai', { op: 'run', agentId, eventId: 'EV-1001' });
    setBusy(false);
    setToast({ msg: `${r.recommendations.length} recommendation(s) generated with citations.`, tone: 'ok' });
    load();
  }

  async function proveBlocked() {
    const r = await post('/api/ai', { op: 'attempt-blocked-action', actionId: 'startup.approve_rts' });
    setBlockedProof(r);
  }

  return (
    <div>
      <h1 className="page">AI Agents & Workbench</h1>
      <div className="page-purpose">
        Agents read governed data and produce cited review packages routed to human authorities. The policy gateway structurally blocks AI from approving, posting, releasing, restoring, rebaselining or replaying — try it live below.
      </div>

      <div className="toolbar">
        <button className="btn primary" disabled={busy} onClick={() => run('all')}>▶ Run full agent roster</button>
        <button className="btn danger" onClick={proveBlocked} title="AI actor attempts startup.approve_rts — watch it get refused and audited">
          ⛔ Prove blocked action (AI tries to approve RTS)
        </button>
      </div>

      {blockedProof && (
        <Panel title="Policy gateway proof" right={<button className="btn ghost" onClick={() => setBlockedProof(null)}>✕</button>}>
          <div className={`vmsg ${blockedProof.blocked ? 'ERROR' : 'WARNING'}`}>
            <b>{blockedProof.blocked ? 'BLOCKED ✓' : 'UNEXPECTED'}</b> — {blockedProof.blockedReason ?? blockedProof.message}
          </div>
          <div className="faint">The attempt was written to the immutable audit log as <span className="mono">ai.blocked_action_attempt</span>. No transaction was created.</div>
        </Panel>
      )}

      <div className="split">
        <div>
          <Panel title="Review packages & recommendations" right={<Chip mono>{data.recommendations.length}</Chip>}>
            {data.recommendations.length === 0 && <div className="empty">Run the agent roster to generate cited review packages.</div>}
            {data.recommendations.map((r: any) => (
              <div key={r.id} className="panel" style={{ marginBottom: 10 }}>
                <div className="panel-h">
                  {r.title}
                  <span className="spacer" />
                  <Chip tone={r.policyDecision === 'BLOCKED' ? 'bad' : r.policyDecision === 'REVIEW_REQUIRED' ? 'warn' : 'ok'}>{r.policyDecision}</Chip>
                  <Chip mono>{r.modelRoute}</Chip>
                  <Chip mono>conf {Math.round(r.confidence * 100)}%</Chip>
                </div>
                <div className="panel-b">
                  <div style={{ marginBottom: 6 }}>{r.narrative}</div>
                  {r.blockedExplanation && <div className="vmsg ERROR">{r.blockedExplanation}</div>}
                  <div className="faint" style={{ marginBottom: 4 }}>
                    Agent <b>{r.agentId}</b> · action class <span className="mono">{r.actionClass}</span> · human authority: <b>{r.humanReviewerRole}</b> · tools: <span className="mono">{(r.toolCalls ?? []).join(', ')}</span>
                  </div>
                  <div>
                    {(r.citations ?? []).map((c: any, i: number) => (
                      <Chip key={i} mono tone="info">{c.objectType}:{c.objectId}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </Panel>
        </div>
        <div>
          <Panel title="Agent roster" right={<Chip mono>{data.agents.length}</Chip>}>
            {data.agents.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1 }}>
                  <b>{a.name}</b>
                  <div className="faint">{a.description}</div>
                  <div className="faint mono">route {a.modelRoute.route} → {a.modelRoute.model} · reviewer {a.humanReviewerRole}</div>
                </div>
                <button className="btn" disabled={busy} onClick={() => run(a.id)}>Run</button>
              </div>
            ))}
          </Panel>
          <Panel title="Run log">
            {data.runs.map((r: any) => (
              <div key={r.id} className="faint mono" style={{ marginBottom: 4 }}>
                {new Date(r.startedAt).toLocaleTimeString()} · {r.agentId} · {r.modelRoute} · {r.outputRecommendationIds.length} rec(s){r.policyBlocks.length ? ` · ${r.policyBlocks.length} blocked` : ''}
              </div>
            ))}
            {data.runs.length === 0 && <div className="faint">No runs yet.</div>}
          </Panel>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
