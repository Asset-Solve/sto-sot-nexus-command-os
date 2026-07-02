'use client';

/**
 * Contract-driven transactional workbench: object queues (tabs) → split pane
 * (list / detail + audit) → governed action drawer. Every action goes through
 * /api/actions/execute; nothing mutates local state pretending a target
 * system was updated.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Chip, Panel, SourceBadge, Toast, stateTone } from './ui';
import ActionDrawer, { type ActionMeta } from './ActionDrawer';

export interface TabDef { objectType: string; label: string; columns: { key: string; label: string }[] }
export interface WorkbenchDef { title: string; purpose: string; tabs: TabDef[]; actionIds: string[] }

function cellValue(o: any, key: string): React.ReactNode {
  const v = key === 'id' ? o.id : key === 'lifecycleState' ? o.lifecycleState : key === 'owner' ? o.owner : o.data?.[key];
  if (v === undefined || v === null || v === '') return <span className="faint">—</span>;
  if (key === 'lifecycleState') return <Chip tone={stateTone(String(v))}>{String(v)}</Chip>;
  if (typeof v === 'object') return <span className="mono faint">{JSON.stringify(v).slice(0, 60)}</span>;
  return String(v);
}

export default function Workbench({ def }: { def: WorkbenchDef }) {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [actions, setActions] = useState<ActionMeta[]>([]);
  const [openAction, setOpenAction] = useState<{ action: ActionMeta; initial?: Record<string, unknown> } | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const search = useSearchParams();

  const activeTab = def.tabs[tab];

  const load = useCallback(async () => {
    setLoading(true);
    const r = await get(`/api/objects/${activeTab.objectType}`);
    setItems(r.items ?? []);
    setLoading(false);
  }, [activeTab.objectType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    get('/api/actions').then((r) => {
      const mine = (r.actions ?? []).filter((a: ActionMeta) => def.actionIds.includes(a.id));
      setActions(mine);
      // voice draft handoff: /route?draft={actionId,payload}
      const draft = search.get('draft');
      if (draft) {
        try {
          const d = JSON.parse(draft);
          const a = (r.actions ?? []).find((x: ActionMeta) => x.id === d.actionId);
          if (a) setOpenAction({ action: a, initial: d.payload });
        } catch { /* ignore malformed drafts */ }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.actionIds.join(',')]);

  useEffect(() => {
    if (selected) get(`/api/audit?objectId=${selected.id}`).then((r) => setAudit(r.items ?? []));
  }, [selected]);

  return (
    <div>
      <h1 className="page">{def.title}</h1>
      <div className="page-purpose">{def.purpose}</div>

      <div className="toolbar">
        {actions.map((a) => (
          <button key={a.id} className={`btn ${a.actionClass === 'CONTROLLED' || a.actionClass === 'BLOCKED_FOR_AI' ? 'primary' : ''}`}
            title={a.description} onClick={() => setOpenAction({ action: a, initial: selected ? { sourceObjectId: selected.id } : {} })}>
            {a.label}
          </button>
        ))}
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn ghost" onClick={load}>↻ Refresh</button>
      </div>

      {def.tabs.length > 1 && (
        <div className="tabs">
          {def.tabs.map((t, i) => (
            <div key={t.objectType} className={`tab ${i === tab ? 'active' : ''}`} onClick={() => { setTab(i); setSelected(null); }}>{t.label}</div>
          ))}
        </div>
      )}

      <div className="split">
        <div className="panel">
          <div className="panel-h">{activeTab.label} <Chip mono>{items.length}</Chip></div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? <div className="empty">Loading from read models…</div> : items.length === 0 ? (
              <div className="empty">No {activeTab.label.toLowerCase()} in scope. Backend returned an empty, governed result — not a mock.</div>
            ) : (
              <table className="grid">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeTab.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                    <th>State</th><th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o.id} className={`row ${selected?.id === o.id ? 'selected' : ''}`} onClick={() => setSelected(o)}>
                      <td className="mono">{o.id}</td>
                      {activeTab.columns.map((c) => <td key={c.key}>{cellValue(o, c.key)}</td>)}
                      <td><Chip tone={stateTone(o.lifecycleState)}>{o.lifecycleState}</Chip></td>
                      <td><SourceBadge system={o.sourceSystem} mode={o.sourceMode} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <Panel title={<>Detail <span className="mono faint">{selected.id}</span></>} right={<Chip tone={stateTone(selected.lifecycleState)}>{selected.lifecycleState}</Chip>}>
                <dl className="kv">
                  <dt>Owner</dt><dd>{selected.owner}</dd>
                  <dt>Source</dt><dd><SourceBadge system={selected.sourceSystem} mode={selected.sourceMode} /> <span className="faint mono">{selected.sourceObject}/{selected.sourceReference}</span></dd>
                  <dt>Risk</dt><dd><Chip tone={String(selected.riskClass).includes('SAFETY') ? 'safety' : ''}>{selected.riskClass}</Chip></dd>
                  <dt>Freshness</dt><dd className="faint mono">{new Date(selected.sourceFreshness).toLocaleString()}</dd>
                  {Object.entries(selected.data ?? {}).slice(0, 14).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt>{k}</dt><dd>{typeof v === 'object' ? <span className="mono faint">{JSON.stringify(v)}</span> : String(v)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </Panel>
              <Panel title="Audit trail">
                {audit.length === 0 ? <div className="faint">No audit events yet for this object.</div> : (
                  <div className="timeline">
                    {audit.slice(0, 12).map((a) => (
                      <div key={a.id} className="tl-item">
                        <div className="when">{new Date(a.at).toLocaleString()}</div>
                        <div><b>{a.action}</b> — {a.actor} <Chip mono>{a.actorType}</Chip></div>
                        {a.reason && <div className="dim">“{a.reason}”</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <Panel title="Context"><div className="faint">Select a record to see source lineage, field detail and its audit trail. Actions in the toolbar prefill from the selection.</div></Panel>
          )}
        </div>
      </div>

      {openAction && (
        <ActionDrawer
          action={openAction.action}
          initial={openAction.initial}
          onClose={() => setOpenAction(null)}
          onDone={(msg, tone) => { setToast({ msg, tone }); load(); }}
        />
      )}
      {toast && <Toast msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
