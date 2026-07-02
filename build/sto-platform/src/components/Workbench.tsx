'use client';

/**
 * Contract-driven transactional workbench.
 *
 * Process-first UX: the lifecycle ribbon shows where this screen sits in the
 * turnaround, every row exposes the governed actions valid for the object's
 * CURRENT lifecycle state and the user's role (object-state → action matrix),
 * and the detail pane explains what must happen next. Every trigger runs
 * through /api/actions/execute — no local-state pretending.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Chip, Panel, SourceBadge, Toast, stateTone } from './ui';
import ActionDrawer, { type ActionMeta } from './ActionDrawer';
import ProcessRibbon from './ProcessRibbon';

export interface TabDef { objectType: string; label: string; columns: { key: string; label: string }[] }
export interface WorkbenchDef { title: string; purpose: string; tabs: TabDef[]; actionIds: string[] }

interface StateAction { objectType: string; states: string[]; actionId: string; prefill?: Record<string, string>; hint: string }

function cellValue(o: any, key: string): React.ReactNode {
  const v = key === 'id' ? o.id : key === 'lifecycleState' ? o.lifecycleState : key === 'owner' ? o.owner : o.data?.[key];
  if (v === undefined || v === null || v === '') return <span className="faint">—</span>;
  if (key === 'lifecycleState') return <Chip tone={stateTone(String(v))}>{String(v)}</Chip>;
  if (typeof v === 'object') return <span className="mono faint">{JSON.stringify(v).slice(0, 60)}</span>;
  return String(v);
}

function buildPrefill(item: any, map?: Record<string, string>, fields?: ActionMeta['fields']): Record<string, unknown> {
  const out: Record<string, unknown> = { sourceObjectId: item.id };
  if (map) {
    for (const [field, key] of Object.entries(map)) {
      if (key === '$id') out[field] = item.id;
      else if (key === '$sourceReference') out[field] = item.sourceReference;
      else if (item.data?.[key] !== undefined) out[field] = item.data[key];
    }
  }
  // generic fill: same-named object fields flow into the form
  for (const f of fields ?? []) {
    if (out[f.name] === undefined && item.data?.[f.name] !== undefined) out[f.name] = item.data[f.name];
  }
  return out;
}

export default function Workbench({ def }: { def: WorkbenchDef }) {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<ActionMeta[]>([]);
  const [stateActions, setStateActions] = useState<StateAction[]>([]);
  const [role, setRole] = useState<string>('');
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
    get('/api/bootstrap').then((b) => setRole(b.user?.role ?? ''));
    get('/api/process').then((p) => setStateActions(p.stateActions ?? []));
    get('/api/actions').then((r) => {
      setAllActions(r.actions ?? []);
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
  }, []);

  useEffect(() => {
    if (selected) get(`/api/audit?objectId=${selected.id}`).then((r) => setAudit(r.items ?? []));
  }, [selected]);

  const toolbarActions = allActions.filter((a) => def.actionIds.includes(a.id));

  const roleOk = (a: ActionMeta) => a.allowedRoles.includes('*') || a.allowedRoles.includes(role) || role === 'tenant_admin';

  /** governed actions valid for this object's current state + my role */
  function rowActions(item: any): { action: ActionMeta; sa: StateAction }[] {
    return stateActions
      .filter((sa) => sa.objectType === item.objectType && sa.states.includes(item.lifecycleState))
      .map((sa) => ({ sa, action: allActions.find((a) => a.id === sa.actionId)! }))
      .filter((x) => x.action && roleOk(x.action));
  }

  function startAction(action: ActionMeta, item: any, sa?: StateAction) {
    setSelected(item);
    setOpenAction({ action, initial: buildPrefill(item, sa?.prefill, action.fields) });
  }

  const selectedActions = selected ? rowActions(selected) : [];
  const selectedBlocked = selected
    ? stateActions.filter((sa) => sa.objectType === selected.objectType && sa.states.includes(selected.lifecycleState))
        .map((sa) => ({ sa, action: allActions.find((a) => a.id === sa.actionId)! }))
        .filter((x) => x.action && !roleOk(x.action))
    : [];

  return (
    <div>
      <h1 className="page">{def.title}</h1>
      <div className="page-purpose">{def.purpose}</div>
      <ProcessRibbon />

      <div className="toolbar">
        {toolbarActions.map((a) => (
          <button key={a.id} className={`btn ${a.actionClass === 'CONTROLLED' || a.actionClass === 'BLOCKED_FOR_AI' ? 'primary' : ''}`}
            title={`${a.description}${roleOk(a) ? '' : ` — requires role: ${a.allowedRoles.join(', ')}`}`}
            disabled={!roleOk(a)}
            onClick={() => setOpenAction({ action: a, initial: selected ? buildPrefill(selected, undefined, a.fields) : {} })}>
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
          <div className="panel-h">{activeTab.label} <Chip mono>{items.length}</Chip><span className="spacer" /><span className="faint" style={{ fontWeight: 400 }}>row buttons = actions valid for that object's state & your role</span></div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? <div className="empty">Loading from read models…</div> : items.length === 0 ? (
              <div className="empty">No {activeTab.label.toLowerCase()} in scope. Backend returned an empty, governed result — not a mock.</div>
            ) : (
              <table className="grid">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeTab.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                    <th>State</th><th>Source</th><th>Act now</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => {
                    const acts = rowActions(o);
                    return (
                      <tr key={o.id} className={`row ${selected?.id === o.id ? 'selected' : ''}`} onClick={() => setSelected(o)}>
                        <td className="mono">{o.id}</td>
                        {activeTab.columns.map((c) => <td key={c.key}>{cellValue(o, c.key)}</td>)}
                        <td><Chip tone={stateTone(o.lifecycleState)}>{o.lifecycleState}</Chip></td>
                        <td><SourceBadge system={o.sourceSystem} mode={o.sourceMode} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <span className="rowact">
                            {acts.slice(0, 2).map(({ action, sa }) => (
                              <button key={action.id} className="btn primary" title={sa.hint} onClick={() => startAction(action, o, sa)}>
                                {action.label.split(' ').slice(0, 2).join(' ')}
                              </button>
                            ))}
                            {acts.length === 0 && <span className="faint">—</span>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <Panel title="What happens next" right={<Chip tone={stateTone(selected.lifecycleState)}>{selected.lifecycleState}</Chip>}>
                {selectedActions.length === 0 && selectedBlocked.length === 0 && (
                  <div className="faint">No process action is due on this object in state '{selected.lifecycleState}'. It advances when an upstream action or connector read-back moves it.</div>
                )}
                {selectedActions.map(({ action, sa }) => (
                  <div key={action.id} className="nextact">
                    <b>{action.label}</b> <Chip tone={action.actionClass === 'CONTROLLED' || action.actionClass === 'BLOCKED_FOR_AI' ? 'warn' : 'info'}>{action.actionClass}</Chip>
                    <div className="hint">{sa.hint}{action.approverRoles?.length ? ` · approval: ${action.approverRoles.join(' / ')}` : ''}</div>
                    <button className="btn primary" onClick={() => startAction(action, selected, sa)}>Start ▸</button>
                  </div>
                ))}
                {selectedBlocked.map(({ action, sa }) => (
                  <div key={action.id} className="nextact" style={{ borderLeftColor: 'var(--line-2)', opacity: 0.75 }}>
                    <b>{action.label}</b> <Chip>needs {action.allowedRoles.join(' / ')}</Chip>
                    <div className="hint">{sa.hint} — switch to an authorized persona to act.</div>
                  </div>
                ))}
              </Panel>
              <Panel title={<>Detail <span className="mono faint">{selected.id}</span></>}>
                <dl className="kv">
                  <dt>Owner</dt><dd>{selected.owner}</dd>
                  <dt>Source</dt><dd><SourceBadge system={selected.sourceSystem} mode={selected.sourceMode} /> <span className="faint mono">{selected.sourceObject}/{selected.sourceReference}</span></dd>
                  <dt>Risk</dt><dd><Chip tone={String(selected.riskClass).includes('SAFETY') ? 'safety' : ''}>{selected.riskClass}</Chip></dd>
                  <dt>Freshness</dt><dd className="faint mono">{new Date(selected.sourceFreshness).toLocaleString()}</dd>
                  {Object.entries(selected.data ?? {}).slice(0, 12).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt>{k}</dt><dd>{typeof v === 'object' ? <span className="mono faint">{JSON.stringify(v)}</span> : String(v)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </Panel>
              <Panel title="Audit trail">
                {audit.length === 0 ? <div className="faint">No audit events yet for this object.</div> : (
                  <div className="timeline">
                    {audit.slice(0, 10).map((a) => (
                      <div key={a.id} className="tl-item">
                        <div className="when">{new Date(a.at).toLocaleString()}</div>
                        <div><b>{a.action}</b> — {a.actor} <Chip mono>{a.actorType}</Chip></div>
                        {a.reason && <div className="dim">"{a.reason}"</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <Panel title="How to work this screen">
              <div className="faint" style={{ lineHeight: 1.8 }}>
                The ribbon above shows where this workbench sits in the turnaround lifecycle and how many open items each stage carries.
                Blue buttons on each row are the governed actions valid for that object <i>right now</i> — they open pre-filled, show validation + SAP payload, and route to approval.
                Select a row to see "what happens next", full detail and its audit trail. Your personal queue across all screens is in <b>My Work</b>.
              </div>
            </Panel>
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
