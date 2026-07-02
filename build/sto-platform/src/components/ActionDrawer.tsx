'use client';

/**
 * Governed action drawer: form (connector-backed lookups with dependent
 * filtering) → validation + posting-path + exact payload preview → submit.
 * Controlled actions route to four-eyes approval; the drawer shows read-back
 * and reconciliation plan before anything is dispatched.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { Chip, Drawer, SourceBadge } from './ui';

export interface ActionMeta {
  id: string; label: string; description: string; actionClass: string; riskClass: string;
  allowedRoles: string[]; approverRoles?: string[]; sod: boolean; requiresReason?: boolean;
  targetSystem: string; connectorId?: string;
  fields: { name: string; label: string; type: string; lookupCategory?: string; dependsOn?: string[]; required?: boolean }[];
}

function LookupSelect({ category, value, payload, onChange }: {
  category: string; value: string; payload: Record<string, unknown>; onChange: (v: string, meta?: Record<string, unknown>) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const dependsKey = JSON.stringify(['plantId', 'orderId', 'wbsId', 'eventId', 'workDate', 'crewId', 'workPackageId'].map((k) => payload[k] ?? ''));

  useEffect(() => {
    const params = new URLSearchParams();
    for (const k of ['plantId', 'orderId', 'wbsId', 'eventId', 'workDate', 'crewId', 'workPackageId']) {
      if (payload[k]) params.set(k, String(payload[k]));
    }
    get(`/api/lookups/${category}?${params}`).then((r) => setItems(r.items ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, dependsKey]);

  const sel = items.find((i) => i.id === value);
  return (
    <>
      <select value={value} onChange={(e) => {
        const it = items.find((i) => i.id === e.target.value);
        onChange(e.target.value, it?.metadata);
      }}>
        <option value="">— select —</option>
        {items.map((i) => (
          <option key={i.id} value={i.id} disabled={i.postingAllowed === false}>
            {i.label} ({i.code}){i.postingAllowed === false ? ' — read only' : ''}
          </option>
        ))}
      </select>
      {sel && (
        <span className="src">
          source {sel.sourceSystem} · {sel.sourceObject} · {sel.sourceMode} · sync {new Date(sel.lastSyncAt).toLocaleTimeString()} {sel.freshness === 'STALE' ? '· STALE' : ''}
        </span>
      )}
    </>
  );
}

export default function ActionDrawer({ action, initial, onClose, onDone }: {
  action: ActionMeta; initial?: Record<string, unknown>; onClose: () => void; onDone: (msg: string, tone: string) => void;
}) {
  const [payload, setPayload] = useState<Record<string, unknown>>(initial ?? {});
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const refreshPreview = useCallback(async (p: Record<string, unknown>) => {
    const r = await post('/api/actions/preview', { actionId: action.id, payload: p });
    setPreview(r);
  }, [action.id]);

  useEffect(() => { refreshPreview(payload); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function setField(name: string, v: unknown, meta?: Record<string, unknown>) {
    const next = { ...payload, [name]: v };
    // worker default hydration: craft/supervisor/cost center from backend lookup metadata
    if (name === 'workerId' && meta) {
      if (!next['costObject'] && meta['homeCostCenter']) next['costObject'] = meta['homeCostCenter'];
      if (!next['payCode']) next['payCode'] = 'PC-REG';
    }
    setPayload(next);
    refreshPreview(next);
  }

  async function submit() {
    setBusy(true);
    const r = await post('/api/actions/execute', { actionId: action.id, payload, screen: action.id });
    setBusy(false);
    setResult(r);
    if (r.ok) {
      onDone(r.message, 'ok');
    } else if (r.blocked) {
      onDone(r.blockedReason ?? r.message, 'bad');
    }
  }

  const errors = (preview?.validation ?? []).filter((v: any) => v.severity === 'ERROR');
  const controlled = action.actionClass !== 'ADVISORY' && action.actionClass !== 'INFORMATIONAL';

  return (
    <Drawer
      title={action.label}
      badge={<>
        <Chip tone={controlled ? 'warn' : 'info'}>{action.actionClass}</Chip>
        <Chip tone={action.riskClass.includes('SAFETY') ? 'safety' : action.riskClass.includes('FINANCE') ? 'bad' : ''}>{action.riskClass}</Chip>
      </>}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={busy || errors.length > 0} onClick={submit} title={errors.length ? 'Resolve validation errors first' : ''}>
          {controlled ? 'Submit for approval' : 'Submit'}
        </button>
      </>}
    >
      <p className="dim" style={{ marginTop: 0 }}>{action.description}</p>

      {action.fields.map((f) => (
        <label key={f.name} className="fld">
          <span>{f.label}{f.required ? ' *' : ''}</span>
          {f.type === 'lookup' && f.lookupCategory ? (
            <LookupSelect category={f.lookupCategory} value={String(payload[f.name] ?? '')} payload={payload} onChange={(v, m) => setField(f.name, v, m)} />
          ) : f.type === 'textarea' ? (
            <textarea rows={3} value={String(payload[f.name] ?? '')} onChange={(e) => setField(f.name, e.target.value)} />
          ) : f.type === 'boolean' ? (
            <select value={String(payload[f.name] ?? 'false')} onChange={(e) => setField(f.name, e.target.value === 'true')}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          ) : (
            <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={String(payload[f.name] ?? '')} onChange={(e) => setField(f.name, f.type === 'number' ? Number(e.target.value) : e.target.value)} />
          )}
        </label>
      ))}

      {preview && (
        <>
          <div className="panel-h" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>Validation</div>
          <div style={{ margin: '8px 0' }}>
            {(preview.validation ?? []).length === 0 && <div className="vmsg INFO">No findings.</div>}
            {(preview.validation ?? []).map((v: any, i: number) => (
              <div key={i} className={`vmsg ${v.severity}`}>{v.field ? `[${v.field}] ` : ''}{v.message}</div>
            ))}
          </div>

          <div className="panel-h" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>Posting path & governance</div>
          <dl className="kv" style={{ margin: '8px 0' }}>
            <dt>Decision</dt><dd><Chip tone={preview.decision?.path === 'FAIL_CLOSED' ? 'bad' : 'info'} mono>{preview.decision?.path}</Chip> <span className="faint">{preview.decision?.reason}</span></dd>
            <dt>Approval</dt><dd>{preview.approval?.required ? `Required — ${preview.approval.approverRoles.join(' / ')}${preview.approval.sod ? ' · four-eyes (SoD)' : ''}` : 'Not required'}</dd>
            <dt>Read-back</dt><dd className="faint">{preview.approval?.readback}</dd>
            {preview.connector && (
              <>
                <dt>Connector</dt>
                <dd>
                  <SourceBadge system={preview.connector.label} mode={preview.connector.mode} />
                  <div className="faint mono">{preview.connector.apiServiceName} · map {preview.connector.mappingVersion} · {preview.connector.enabled ? 'enabled' : 'DISABLED'}</div>
                </dd>
              </>
            )}
          </dl>

          {preview.payloadPreview && (
            <>
              <div className="panel-h" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>Exact payload preview</div>
              {preview.dryRun?.warnings?.map((w: string, i: number) => <div key={i} className="vmsg WARNING">{w}</div>)}
              <pre className="payload">{JSON.stringify(preview.dryRun?.payload ?? preview.payloadPreview, null, 2)}</pre>
              {preview.dryRun && <div className="faint mono">endpoint: {preview.dryRun.endpoint}</div>}
            </>
          )}
        </>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          <div className={`vmsg ${result.ok ? 'INFO' : 'ERROR'}`}>
            {result.message} {result.blockedReason ?? ''}
            {result.transaction && (
              <div className="mono faint" style={{ marginTop: 4 }}>
                {result.transaction.transactionId} → {result.transaction.lifecycleState}
                {result.transaction.targetDocumentNumber ? ` · doc ${result.transaction.targetDocumentNumber}` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
