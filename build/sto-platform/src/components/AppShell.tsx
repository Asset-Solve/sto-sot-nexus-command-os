'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { get, currentUserId, setCurrentUserId } from '@/lib/api';
import VoiceBar from './VoiceBar';
import { Chip } from './ui';

const NAV: { group: string; items: { route: string; label: string }[] }[] = [
  {
    group: 'Operate',
    items: [
      { route: '/command-center', label: 'Command Center' },
      { route: '/field', label: 'Field Execution' },
      { route: '/permits', label: 'Permits & WCM' },
      { route: '/area-risk', label: 'Area Risk Map' },
      { route: '/labor-time', label: 'Time & Labor' }
    ]
  },
  {
    group: 'Plan',
    items: [
      { route: '/portfolio', label: 'Portfolio & Premise' },
      { route: '/scope', label: 'Scope Control Room' },
      { route: '/work-packages', label: 'Work Package Studio' },
      { route: '/schedule', label: 'Schedule & Constraints' },
      { route: '/materials', label: 'Materials & Logistics' },
      { route: '/contractors', label: 'Contractors & Commercial' }
    ]
  },
  {
    group: 'Assure',
    items: [
      { route: '/qa', label: 'QA & Turnover' },
      { route: '/startup-readiness', label: 'Startup / PSSR / RTS' },
      { route: '/cost', label: 'Cost & Controls' },
      { route: '/lessons', label: 'Lessons & Norms' }
    ]
  },
  {
    group: 'Platform',
    items: [
      { route: '/ai', label: 'AI Workbench' },
      { route: '/data-foundation', label: 'Data Foundation' },
      { route: '/connectors', label: 'Integration Hub' },
      { route: '/resilience', label: 'Resilience Ops' },
      { route: '/admin', label: 'Admin & Tenancy' }
    ]
  }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [personas, setPersonas] = useState<{ id: string; name: string; role: string }[]>([]);
  const [userId, setUserId] = useState('u-sto');

  useEffect(() => {
    setUserId(currentUserId());
    get('/api/bootstrap').then((b) => setPersonas(b.personas ?? []));
    const onChange = () => setUserId(currentUserId());
    window.addEventListener('sto:user-changed', onChange);
    return () => window.removeEventListener('sto:user-changed', onChange);
  }, []);

  const me = personas.find((p) => p.id === userId);

  return (
    <div className="shell">
      <nav className="sidenav">
        <div className="brand">
          <b>STO / SOT Platform</b>
          <span>Turnaround Command &amp; Control</span>
        </div>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="navgroup">{g.group}</div>
            {g.items.map((i) => (
              <Link key={i.route} href={i.route} className={`navlink ${pathname === i.route ? 'active' : ''}`}>
                {i.label}
              </Link>
            ))}
          </div>
        ))}
        <div style={{ padding: '14px 16px' }}>
          <Chip mono>SIMULATOR MODE</Chip>
        </div>
      </nav>
      <div className="main">
        <div className="topbar">
          <VoiceBar />
          <span className="spacer" />
          <Chip tone="info" mono>EV-1001 · CDU TA 2026</Chip>
          <select
            style={{ width: 230 }}
            value={userId}
            onChange={(e) => { setCurrentUserId(e.target.value); setUserId(e.target.value); location.reload(); }}
            title="Simulated persona (IdP session in production)"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
            ))}
          </select>
          {me && <Chip mono>{me.role}</Chip>}
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
