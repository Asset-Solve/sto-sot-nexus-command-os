import { ctxFromRequest, json } from '@/server/http';
import { listObjects } from '@/server/core/store';

/** Command-center rollup. Every KPI carries a drill target (workbench + objectType). */
export async function GET(req: Request) {
  const { db, user } = ctxFromRequest(req);
  const t = user.tenantId;
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId') ?? 'EV-1001';
  const ev = listObjects(db, t, 'TurnaroundEvent', (o) => o.id === eventId)[0];

  const inEvent = (o: { data: Record<string, unknown> }) => !o.data['eventId'] || o.data['eventId'] === eventId;
  const scopeOpen = listObjects(db, t, 'ScopeCandidate', (o) => inEvent(o) && ['submitted', 'challenged'].includes(o.lifecycleState));
  const wpsBlocked = listObjects(db, t, 'WorkPackage', (o) => inEvent(o) && o.lifecycleState !== 'released');
  const shortages = listObjects(db, t, 'MaterialDemand', (o) => inEvent(o) && o.lifecycleState === 'shortage');
  const permitIssues = listObjects(db, t, 'PermitProxy', (o) => ['suspended', 'expired'].includes(o.lifecycleState));
  const simops = listObjects(db, t, 'SIMOPSConflict', (o) => o.lifecycleState === 'open');
  const constraints = listObjects(db, t, 'Constraint', (o) => inEvent(o) && o.lifecycleState === 'open');
  const punchA = listObjects(db, t, 'PunchItem', (o) => inEvent(o) && o.data['sevClass'] === 'A' && o.lifecycleState === 'open');
  const pendingApprovals = [...db.transactions.values()].filter((x) => x.tenantId === t && x.lifecycleState === 'pending_approval');
  const dlq = [...db.deadLetters.values()].filter((d) => d.tenantId === t && !d.replayedAt);
  const outboxOpen = [...db.outbox.values()].filter((m) => m.tenantId === t && ['QUEUED', 'FAILED_RETRYABLE', 'DISPATCHING'].includes(m.state));
  const aiOpen = [...db.aiRecommendations.values()].filter((r) => r.tenantId === t && r.status === 'OPEN');
  const staleData = listObjects(db, t, 'DataProduct', (o) => o.lifecycleState === 'stale');
  const connectors = [...db.connectors.values()].filter((c) => c.tenantId === t);

  return json({
    event: ev ? { id: ev.id, ...ev.data } : null,
    kpis: [
      { id: 'progress', label: 'Progress vs Plan', value: `${ev?.data['progressPct'] ?? 0}% / ${ev?.data['planPct'] ?? 0}%`, tone: (Number(ev?.data['progressPct']) < Number(ev?.data['planPct'])) ? 'warn' : 'ok', drill: '/schedule', detail: `Schedule variance ${ev?.data['scheduleVarianceDays']}d` },
      { id: 'cost', label: 'Forecast vs Budget', value: `$${ev?.data['forecastMUSD']}M / $${ev?.data['budgetMUSD']}M`, tone: Number(ev?.data['forecastMUSD']) > Number(ev?.data['budgetMUSD']) ? 'bad' : 'ok', drill: '/cost', detail: 'Drill to commitments, actuals, claims' },
      { id: 'scope', label: 'Open Scope Decisions', value: String(scopeOpen.length), tone: scopeOpen.length ? 'warn' : 'ok', drill: '/scope', detail: scopeOpen.map((s) => s.id).join(', ') },
      { id: 'wp', label: 'Packages Not Released', value: String(wpsBlocked.length), tone: wpsBlocked.length ? 'warn' : 'ok', drill: '/work-packages', detail: wpsBlocked.map((w) => w.id).join(', ') },
      { id: 'materials', label: 'Critical Shortages', value: String(shortages.length), tone: shortages.length ? 'bad' : 'ok', drill: '/materials', detail: shortages.map((s) => String(s.data['materialId'])).join(', ') },
      { id: 'safety', label: 'Permit / SIMOPS Issues', value: String(permitIssues.length + simops.length), tone: permitIssues.length + simops.length ? 'bad' : 'ok', drill: '/permits', detail: [...permitIssues.map((p) => p.id), ...simops.map((s) => s.id)].join(', ') },
      { id: 'constraints', label: 'Open Constraints', value: String(constraints.length), tone: constraints.length ? 'warn' : 'ok', drill: '/schedule', detail: constraints.map((c) => c.id).join(', ') },
      { id: 'punch', label: 'Class-A Punch Open', value: String(punchA.length), tone: punchA.length ? 'bad' : 'ok', drill: '/qa', detail: punchA.map((p) => p.id).join(', ') },
      { id: 'approvals', label: 'Pending Approvals', value: String(pendingApprovals.length), tone: pendingApprovals.length ? 'warn' : 'ok', drill: '/resilience', detail: 'Four-eyes queue' },
      { id: 'integration', label: 'Outbox / DLQ', value: `${outboxOpen.length} / ${dlq.length}`, tone: dlq.length ? 'bad' : 'ok', drill: '/resilience', detail: 'Retry, replay, reconcile' },
      { id: 'ai', label: 'AI Review Packages', value: String(aiOpen.length), tone: aiOpen.length ? 'info' : 'ok', drill: '/ai', detail: 'Cited recommendations awaiting human review' },
      { id: 'data', label: 'Stale Data Products', value: String(staleData.length), tone: staleData.length ? 'warn' : 'ok', drill: '/data-foundation', detail: staleData.map((d) => d.id).join(', ') }
    ],
    integrationHealth: connectors.map((c) => ({
      connectorId: c.connectorId, label: c.label, mode: c.sourceMode, enabled: c.enabled,
      writePolicy: c.writePolicy, lastSyncAt: c.lastSyncAt, certification: c.certificationStatus
    })),
    approvals: pendingApprovals.map((p) => ({
      transactionId: p.transactionId, actionId: p.actionId, label: p.actionId, submittedBy: p.submittedBy,
      submittedByRole: p.submittedByRole, riskClass: p.riskClass, createdAt: p.createdAt
    }))
  });
}
