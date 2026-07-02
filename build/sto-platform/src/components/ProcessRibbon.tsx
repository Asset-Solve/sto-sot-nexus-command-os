'use client';

/**
 * Turnaround lifecycle ribbon — shows where the event is in the end-to-end
 * process, which stage the current screen serves, and how many open items
 * each stage is carrying. Every chip navigates to the owning workbench.
 */

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { get } from '@/lib/api';

export default function ProcessRibbon({ eventId = 'EV-1001' }: { eventId?: string }) {
  const [stages, setStages] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    get(`/api/process?eventId=${eventId}`).then((r) => setStages(r.stages ?? []));
  }, [eventId]);

  if (!stages.length) return null;

  return (
    <div className="ribbon" role="navigation" aria-label="Turnaround process">
      {stages.map((s) => {
        const here = pathname === s.route || (s.route === '/field' && pathname === '/execution') || (s.route === '/resilience' && pathname === '/writeback');
        return (
          <button
            key={s.id}
            className={`stage ${s.status} ${here ? 'here' : ''}`}
            onClick={() => router.push(s.route)}
            title={`Stage ${s.num}: ${s.name}\nKickoff steps ${s.kickoffSteps} · ${s.phase}\nExit: ${s.exitCriteria}\nOpen: ${s.openItems} ${s.openNote}`}
          >
            <span className="num">{s.num}</span>
            <span className="nm">{s.name}</span>
            {s.openItems > 0 && <span className="open">{s.openItems}</span>}
          </button>
        );
      })}
    </div>
  );
}
