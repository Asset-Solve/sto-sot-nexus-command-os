'use client';

/**
 * My Work — the persona's day-in-the-life queue. Answers "what must I do
 * right now": approvals waiting on me (four-eyes filtered), objects sitting
 * in a state my role must act on (from the process map), and AI review
 * packages addressed to my role. Every card deep-links into the owning
 * workbench with the governed action pre-filled.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { get, post } from '@/lib/api';
import { Chip, Panel, Toast } from '@/components/ui';
import ProcessRibbon from '@/components/ProcessRibbon';

export default function MyWork() {
  const [q, setQ] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);
  const router = useRouter();

  const load = useCallback(() => { get('/api/my-work').then(setQ); }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(transactionId: string, decision: string) {
    const r = await post('/api/transactions/decide', { transactionId, decision, reason: reason || `${decision} from My Work` });
    setToast({ msg: r.blocked ? r.blockedReason : r.message, tone: r.ok ? 'ok' : 'bad' });
    load();
  }

  function openAction(item: any) {
    const draft = encodeURIComponent(JSON.stringify({ actionId: item.actionId, payload: item.prefill ?? {} }));
    router.push(`${item.screen}?draft=${draft}`);
  }

  if (!q) return <div className="empty">Assembling your work queue…</div>;

  const riskTone = (r?: string) => (r?.includes('SAFETY') ? 'safety' : r?.includes('FINANCE') ? 'bad' : r === 'HIGH' ? 'warn' : '');

  return (
    <div>
      <h1 className="page">My Work — {q.user.name}</h1>
      <div className="page-purpose">
        Role <Chip mono>{q.user.role}</Chip> · {q.approvals.length} approval(s) · {q.actions.length} process action(s) · {q.aiReviews.length} AI review(s). Derived live from the process map, workflow queue and AI governance — not a static list.
      </div>
      <ProcessRibbon />

      <div className="split">
        <div>
          <Panel title="① Approvals waiting on you (four-eyes)" right={<Chip mono tone={q.approvals.length ? 'warn' : 'ok'}>{q.approvals.length}</Chip>}>
            {q.approvals.length === 0 ? <div className="faint">Nothing awaits your approval. Transactions you submitted yourself never appear here (SoD).</div> : (
              <>
                <input placeholder="Decision reason (recorded in audit)" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: 8 }} />
                {q.approvals.map((a: any) => (
                  <div key={a.transactionId} className="workcard">
                    <div style={{ flex: 1 }}>
                      <div className="t">{a.title}</div>
                      <div className="d">{a.detail}</div>
                    </div>
                    <Chip tone={riskTone(a.riskClass)}>{a.riskClass}</Chip>
                    <button className="btn primary" onClick={() => decide(a.transactionId, 'approve')}>Approve</button>
                    <button className="btn danger" onClick={() => decide(a.transactionId, 'reject')}>Reject</button>
                  </div>
                ))}
              </>
            )}
          </Panel>

          <Panel title="② Process actions in your court" right={<Chip mono tone={q.actions.length ? 'warn' : 'ok'}>{q.actions.length}</Chip>}>
            {q.actions.length === 0 ? <div className="faint">No objects are sitting in a state your role must act on.</div> :
              q.actions.map((a: any, i: number) => (
                <div key={i} className="workcard">
                  <div style={{ flex: 1 }}>
                    <div className="t">{a.title}</div>
                    <div className="d">{a.detail}{a.stage ? ` · stage: ${a.stage}` : ''}</div>
                  </div>
                  <Chip tone={riskTone(a.riskClass)}>{a.riskClass}</Chip>
                  <button className="btn primary" onClick={() => openAction(a)}>Open ↗</button>
                </div>
              ))}
          </Panel>
        </div>

        <div>
          <Panel title="③ AI review packages for your role" right={<Chip mono>{q.aiReviews.length}</Chip>}>
            {q.aiReviews.length === 0 ? <div className="faint">No open AI review packages route to your role. Run agents in the AI Workbench.</div> :
              q.aiReviews.map((a: any, i: number) => (
                <div key={i} className="workcard">
                  <div style={{ flex: 1 }}>
                    <div className="t">{a.title}</div>
                    <div className="d">{a.detail}</div>
                  </div>
                  <button className="btn" onClick={() => router.push('/ai')}>Review ↗</button>
                </div>
              ))}
          </Panel>
          <Panel title="How this queue is built">
            <div className="faint" style={{ lineHeight: 1.8 }}>
              ① canonical transactions in <span className="mono">pending_approval</span> where your role is an eligible approver and you are not the submitter.<br />
              ② the object-state → action matrix (process map) joined against live objects and your role contract.<br />
              ③ AI recommendations whose human authority is your role.<br />
              Switch persona in the top bar to see another role's day.
            </div>
          </Panel>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
