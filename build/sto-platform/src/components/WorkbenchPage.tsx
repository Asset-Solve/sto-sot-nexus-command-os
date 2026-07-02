'use client';

import { Suspense } from 'react';
import Workbench from './Workbench';
import { SCREENS } from '@/lib/screens';

export default function WorkbenchPage({ screen }: { screen: string }) {
  const def = SCREENS[screen];
  if (!def) return <div className="empty">Unknown screen contract: {screen}</div>;
  return (
    <Suspense fallback={<div className="empty">Loading workbench…</div>}>
      <Workbench def={def} />
    </Suspense>
  );
}
