'use client';

import React from 'react';

export function Chip({ tone = '', children, mono = false }: { tone?: string; children: React.ReactNode; mono?: boolean }) {
  return <span className={`chip ${tone} ${mono ? 'mono' : ''}`}>{children}</span>;
}

export function stateTone(state: string): string {
  const s = state.toLowerCase();
  if (['posted', 'reconciled', 'approved', 'released', 'active', 'certified', 'matched', 'completed', 'closed', 'passed', 'mobilized', 'established', 'approved_rts', 'published'].some((x) => s.includes(x))) return 'ok';
  if (['pending', 'submitted', 'queued', 'draft', 'in_development', 'in_progress', 'in_review', 'assembling', 'requested', 'challenged', 'open', 'stale', 'computed'].some((x) => s.includes(x))) return 'warn';
  if (['dead', 'failed', 'rejected', 'suspended', 'expired', 'blocked', 'shortage', 'mismatch', 'violation'].some((x) => s.includes(x))) return 'bad';
  return '';
}

export function SourceBadge({ system, mode, freshness }: { system: string; mode?: string; freshness?: string }) {
  const safety = system === 'SAP_WCM' || system === 'EPTW' || system === 'HISTORIAN_PI';
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <Chip tone={safety ? 'safety' : 'info'} mono>{system}</Chip>
      {mode && <Chip mono>{mode}</Chip>}
      {freshness === 'STALE' && <Chip tone="warn">STALE</Chip>}
    </span>
  );
}

export function Panel({ title, right, children }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-h">{title}<span className="spacer" />{right}</div>
      <div className="panel-b">{children}</div>
    </div>
  );
}

export function Toast({ msg, tone, onDone }: { msg: string; tone: string; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`toast ${tone}`}>{msg}</div>;
}

export function Drawer({ title, onClose, footer, children, badge }: {
  title: React.ReactNode; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-h">
          <b>{title}</b>{badge}
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-b">{children}</div>
        {footer && <div className="drawer-f">{footer}</div>}
      </div>
    </>
  );
}
