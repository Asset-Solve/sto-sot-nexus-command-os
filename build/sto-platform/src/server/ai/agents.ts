/**
 * AI agent roster (section 8.19). Agents read governed data, produce cited
 * review packages, and can never execute controlled actions — the engine's
 * policy gateway blocks AI actors structurally, and every recommendation
 * carries citations, confidence, model route and required human authority.
 *
 * The analysis below is deterministic (rule-driven over read models) so the
 * simulator is fully offline; the agent interface is the seam where hosted
 * model calls plug in (model router already decides the route).
 */

import type { AICitation, AIRecommendation, AgentRun } from '../core/types';
import { listObjects, type Db } from '../core/store';
import { newId, nowIso } from '../core/ids';
import { aiPolicyDecision, routeFor, type AITaskKind } from './router';

export interface AgentDef {
  id: string;
  name: string;
  taskKind: AITaskKind;
  humanReviewerRole: string;
  description: string;
  run: (db: Db, tenantId: string, eventId: string) => Omit<AIRecommendation, 'id' | 'tenantId' | 'agentId' | 'modelRoute' | 'policyDecision' | 'humanReviewerRole' | 'status' | 'createdAt'>[];
}

function cite(objectType: string, objectId: string, label: string, field?: string, value?: unknown): AICitation {
  return { objectType, objectId, label, field, value };
}

export const AGENTS: AgentDef[] = [
  {
    id: 'orchestrator', name: 'Master STO Orchestrator', taskKind: 'advisory_analysis', humanReviewerRole: 'sto_manager',
    description: 'Cross-domain exception rollup and command meeting brief.',
    run: (db, t, ev) => {
      const constraints = listObjects(db, t, 'Constraint', (o) => o.data['eventId'] === ev && o.lifecycleState === 'open');
      const simops = listObjects(db, t, 'SIMOPSConflict', (o) => o.lifecycleState === 'open');
      const dlq = [...db.deadLetters.values()].filter((d) => d.tenantId === t && !d.replayedAt);
      return [{
        actionClass: 'ADVISORY',
        targetObjectType: 'TurnaroundEvent', targetObjectId: ev,
        title: `Command brief: ${constraints.length} open constraint(s), ${simops.length} SIMOPS conflict(s), ${dlq.length} dead-letter(s)`,
        narrative: `Today's top risks: ${constraints.map((c) => c.data['title']).join('; ') || 'none'}. Safety: ${simops.map((s) => s.data['title']).join('; ') || 'no open SIMOPS conflicts'}. Integration: ${dlq.length} message(s) in DLQ awaiting operator replay. Recommend addressing critical-path material constraint first (drives 1.8d schedule variance).`,
        citations: [
          ...constraints.map((c) => cite('Constraint', c.id, c.data['title'] as string)),
          ...simops.map((s) => cite('SIMOPSConflict', s.id, s.data['title'] as string)),
          ...dlq.map((d) => cite('DeadLetterMessage', d.id, d.error))
        ],
        confidence: 0.92, toolCalls: ['objects.constraints', 'objects.simops', 'resilience.dlq']
      }];
    }
  },
  {
    id: 'scope-intel', name: 'Scope Intelligence Agent', taskKind: 'advisory_analysis', humanReviewerRole: 'scope_board_member',
    description: 'Duplicate detection, scope challenge, benchmark comparison.',
    run: (db, t, ev) => {
      const cands = listObjects(db, t, 'ScopeCandidate', (o) => o.data['eventId'] === ev);
      const dupPair = cands.filter((c) => (c.data['title'] as string).toLowerCase().includes('c-101'));
      if (dupPair.length < 2) return [];
      return [{
        actionClass: 'ADVISORY' as const, targetObjectType: 'ScopeCandidate', targetObjectId: dupPair[1].id,
        title: `Possible duplicate scope: ${dupPair[1].id} overlaps ${dupPair[0].id}`,
        narrative: `"${dupPair[1].data['title']}" appears to cover equipment already in "${dupPair[0].data['title']}". Recommend the scope board reject or merge ${dupPair[1].id}. Draft rejection reason prepared — human decision required (scope.decide is a controlled action).`,
        citations: dupPair.map((d) => cite('ScopeCandidate', d.id, d.data['title'] as string)),
        confidence: 0.81, toolCalls: ['objects.scopeCandidates', 'similarity.cluster']
      }];
    }
  },
  {
    id: 'wp-readiness', name: 'Work Package Readiness Agent', taskKind: 'work_package_review', humanReviewerRole: 'work_package_owner',
    description: 'Missing-evidence checklists and readiness narratives.',
    run: (db, t, ev) => listObjects(db, t, 'WorkPackage', (o) => o.data['eventId'] === ev && o.lifecycleState !== 'released').map((wp) => {
      const readiness = (wp.data['readiness'] ?? {}) as Record<string, boolean>;
      const missing = Object.entries(readiness).filter(([, v]) => !v).map(([k]) => k);
      return {
        actionClass: 'ADVISORY' as const, targetObjectType: 'WorkPackage', targetObjectId: wp.id,
        title: `${wp.id} not releasable: ${missing.length} readiness gap(s)`,
        narrative: `${wp.data['title']} is blocked on: ${missing.join(', ')}. Suggested sequence: resolve permits first (longest lead), then materials. Release remains a human-controlled action with four-eyes approval.`,
        citations: [cite('WorkPackage', wp.id, wp.data['title'] as string, 'readiness', missing.join(','))],
        confidence: 0.95, toolCalls: ['objects.workPackages']
      };
    })
  },
  {
    id: 'materials', name: 'Materials & Procurement Agent', taskKind: 'advisory_analysis', humanReviewerRole: 'material_planner',
    description: 'Shortage prioritization by critical-path impact.',
    run: (db, t, ev) => {
      const shortages = listObjects(db, t, 'MaterialDemand', (o) => o.data['eventId'] === ev && o.lifecycleState === 'shortage');
      return shortages.map((s) => ({
        actionClass: 'ADVISORY' as const, targetObjectType: 'MaterialDemand', targetObjectId: s.id,
        title: `Critical shortage ${s.data['materialId']} blocks ${s.data['wpId']}`,
        narrative: `Demand ${s.id} (need by ${s.data['needBy']}) has zero stock. Linked constraint sits on the critical path. Draft PR prepared for approval (material.request_pr) and expediting case EXP-001 promise date is 2026-07-02 — 1 day of float. Recommend approving air freight.`,
        citations: [cite('MaterialDemand', s.id, `${s.data['materialId']} x ${s.data['qty']}`), cite('Constraint', 'CON-001', 'Stud bolts block tray torque-up')],
        confidence: 0.88, toolCalls: ['objects.materialDemands', 'objects.constraints', 'lookup.materials']
      }));
    }
  },
  {
    id: 'schedule-recovery', name: 'Schedule Recovery Agent', taskKind: 'advisory_analysis', humanReviewerRole: 'scheduler_project_controls',
    description: 'Proposes recovery scenarios; can never rebaseline.',
    run: (db, t, ev) => [{
      actionClass: 'ADVISORY' as const, targetObjectType: 'ScheduleActivityMirror', targetObjectId: 'P6-A1010',
      title: 'Recovery option: resequence tray install night shift (+1.2d recovery)',
      narrative: 'P6-A1010 is 55% complete against 62% plan. Moving torque-up crew to night shift and pre-staging MAT-4714 on arrival recovers ~1.2 days without extending the crane conflict window (CON-002). Rebaseline is NOT proposed; this is a working-schedule recovery scenario for scheduler review.',
      citations: [cite('ScheduleActivityMirror', 'P6-A1010', 'C-101 tray replacement', 'pct', 55), cite('Constraint', 'CON-002', 'Crane conflict 7/4-7/5')],
      confidence: 0.74, toolCalls: ['objects.schedule', 'objects.constraints']
    }]
  },
  {
    id: 'wcm-safety', name: 'WCM / Safety Review Agent', taskKind: 'safety_review', humanReviewerRole: 'wcm_authority',
    description: 'Permit/isolation readiness review packages. Blocked from any permit action.',
    run: (db, t, ev) => {
      const bad = listObjects(db, t, 'PermitProxy', (o) => ['suspended', 'expired'].includes(o.lifecycleState));
      return bad.map((p) => ({
        actionClass: 'BLOCKED_FOR_AI' as const, targetObjectType: 'PermitProxy', targetObjectId: p.id,
        title: `Permit ${p.id} ${p.lifecycleState}: work on ${p.data['wpId']} must hold`,
        narrative: `${p.data['type']} permit ${p.id} is ${p.lifecycleState} (${p.data['note'] ?? 'see WCM'}). Field start validation will fail closed. This agent cannot and will not modify permit state — the WCM authority must re-issue after gas test. Correction request package drafted for human submission.`,
        citations: [cite('PermitProxy', p.id, `${p.data['type']} — ${p.lifecycleState}`)],
        confidence: 0.99, toolCalls: ['objects.permits (read-only)']
      }));
    }
  },
  {
    id: 'area-risk', name: 'Area Risk Agent', taskKind: 'safety_review', humanReviewerRole: 'hse_safety_reviewer',
    description: 'Explains area risk spikes from contributing signals.',
    run: (db, t) => listObjects(db, t, 'AreaRisk', (o) => (o.data['score'] as number) > 70).map((a) => ({
      actionClass: 'ADVISORY' as const, targetObjectType: 'AreaRisk', targetObjectId: a.id,
      title: `${a.data['area']} risk ${a.data['score']}/100 — drivers explained`,
      narrative: `Risk drivers: ${(a.data['drivers'] as string[]).join(', ')}. ${a.data['workers']} workers and ${a.data['permits']} active permits in area. Recommend HSE walkdown and resolving SIM-001 before 10:00 hot-work window. Worker identities are masked per privacy policy.`,
      citations: [cite('AreaRisk', a.id, a.data['area'] as string, 'score', a.data['score']), cite('SIMOPSConflict', 'SIM-001', 'Hot work near catalyst unloading')],
      confidence: 0.86, toolCalls: ['objects.areaRisk', 'objects.simops']
    }))
  },
  {
    id: 'integration-triage', name: 'Integration Triage Agent', taskKind: 'integration_triage', humanReviewerRole: 'integration_operator',
    description: 'Clusters integration errors, drafts replay rationale.',
    run: (db, t) => {
      const dlq = [...db.deadLetters.values()].filter((d) => d.tenantId === t && !d.replayedAt);
      return dlq.map((d) => ({
        actionClass: 'ADVISORY' as const, targetObjectType: 'DeadLetterMessage', targetObjectId: d.id,
        title: `DLQ triage: ${d.connectorId} — ${d.error.slice(0, 60)}`,
        narrative: `Error class: ${d.error.includes('503') || d.error.includes('timeout') ? 'TRANSIENT — safe to replay' : 'BUSINESS VALIDATION — fix payload before replay'}. Draft replay reason prepared. Replay itself requires integration_operator role and a recorded reason; production replay requires stronger approval.`,
        citations: [cite('DeadLetterMessage', d.id, d.error), cite('CanonicalTransaction', d.transactionId, 'Origin transaction')],
        confidence: 0.9, toolCalls: ['resilience.dlq', 'resilience.outbox']
      }));
    }
  },
  {
    id: 'labor-cost', name: 'Labor / Cost Agent', taskKind: 'finance_review', humanReviewerRole: 'finance_cost_controller',
    description: 'Cost variance narratives; accrual drafts for finance review.',
    run: (db, t, ev) => {
      const cf = listObjects(db, t, 'CostForecast', (o) => o.data['eventId'] === ev)[0];
      if (!cf) return [];
      return [{
        actionClass: 'BLOCKED_FOR_AI' as const, targetObjectType: 'CostForecast', targetObjectId: cf.id,
        title: `Forecast variance +$${cf.data['varianceMUSD']}M — accrual draft prepared`,
        narrative: `Variance drivers: ${(cf.data['drivers'] as string[]).join('; ')}. A labor accrual draft for period 2026-07 is prepared for finance review. Posting to SAP FI (accrual.post) is finance-critical and blocked for AI — requires finance_cost_controller submission and sponsor approval.`,
        citations: [cite('CostForecast', cf.id, `Forecast ${cf.data['forecastMUSD']}M vs budget`), cite('CommercialClaim', 'CLM-001', 'MechCo standby claim pending')],
        confidence: 0.83, toolCalls: ['objects.cost', 'objects.claims']
      }];
    }
  },
  {
    id: 'qa-turnover', name: 'QA / Turnover Agent', taskKind: 'work_package_review', humanReviewerRole: 'turnover_coordinator',
    description: 'Turnover completeness and missing evidence checklists.',
    run: (db, t, ev) => listObjects(db, t, 'TurnoverPackage', (o) => o.data['eventId'] === ev).map((top) => ({
      actionClass: 'ADVISORY' as const, targetObjectType: 'TurnoverPackage', targetObjectId: top.id,
      title: `${top.id}: ${top.data['openPunchA']} class-A punch blocks turnover`,
      narrative: `Turnover of ${top.data['system']} is blocked by PUNCH-102 (missing PMI cert for N7 weld). Evidence checklist drafted: PMI certificate, weld map update, hydrotest chart TP-201. Approval remains with turnover coordinator + operations authority.`,
      citations: [cite('TurnoverPackage', top.id, top.data['system'] as string), cite('PunchItem', 'PUNCH-102', 'Missing PMI cert (class A)')],
      confidence: 0.94, toolCalls: ['objects.turnover', 'objects.punch']
    }))
  },
  {
    id: 'startup-pssr', name: 'Startup / PSSR Agent', taskKind: 'startup_review', humanReviewerRole: 'operations_startup_authority',
    description: 'Startup readiness review package. Structurally blocked from approving RTS.',
    run: (db, t, ev) => listObjects(db, t, 'StartupReadiness', (o) => o.data['eventId'] === ev).map((s) => ({
      actionClass: 'BLOCKED_FOR_AI' as const, targetObjectType: 'StartupReadiness', targetObjectId: s.id,
      title: `RTS readiness ${s.data['pssrPct']}% — ${(s.data['blockers'] as string[]).length} blocker(s)`,
      narrative: `Blockers: ${(s.data['blockers'] as string[]).join(' | ')}. This agent compiles the PSSR evidence package only. Return-to-service approval is reserved for the human operations/startup authority (startup.approve_rts) and will fail validation until all blockers clear.`,
      citations: [cite('StartupReadiness', s.id, 'RTS gate EV-1001'), cite('PSSRChecklist', 'PSSR-EV1', 'PSSR 54/66 complete')],
      confidence: 0.97, toolCalls: ['objects.startup', 'objects.pssr']
    }))
  },
  {
    id: 'lessons', name: 'Lessons / Norms Agent', taskKind: 'advisory_analysis', humanReviewerRole: 'sto_manager',
    description: 'Drafts lessons and norm updates from event actuals.',
    run: (db, t, ev) => [{
      actionClass: 'ADVISORY' as const, targetObjectType: 'LessonLearned', targetObjectId: 'LL-001',
      title: 'Draft norm update: TA material min-max profile',
      narrative: 'MAT-4714 stockout traces to routine-demand min-max settings. Draft MDG change request prepared to raise TA-season min level to 12 sets, plus norm template update for future events. Master data change routes through MDG governance (mdg.submit_change).',
      citations: [cite('LessonLearned', 'LL-001', 'Stud bolt min-max wrong'), cite('MaterialDemand', 'MD-002', 'Shortage MAT-4714')],
      confidence: 0.8, toolCalls: ['objects.lessons', 'objects.materialDemands']
    }]
  }
];

export function listAgents() {
  return AGENTS.map((a) => ({
    id: a.id, name: a.name, description: a.description,
    modelRoute: routeFor(a.taskKind), humanReviewerRole: a.humanReviewerRole, taskKind: a.taskKind
  }));
}

export function runAgent(db: Db, tenantId: string, agentId: string, eventId: string): { run: AgentRun; recommendations: AIRecommendation[] } {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) throw new Error(`Unknown agent ${agentId}`);
  const started = nowIso();
  const route = routeFor(agent.taskKind);
  const raw = agent.run(db, tenantId, eventId);
  const recommendations: AIRecommendation[] = raw.map((r) => ({
    ...r,
    id: newId('rec'),
    tenantId,
    agentId,
    modelRoute: route.route,
    policyDecision: aiPolicyDecision(r.actionClass),
    humanReviewerRole: agent.humanReviewerRole,
    status: 'OPEN',
    blockedExplanation: aiPolicyDecision(r.actionClass) === 'BLOCKED'
      ? `Action class ${r.actionClass}: AI cannot execute. Review package routed to ${agent.humanReviewerRole}.`
      : undefined,
    createdAt: nowIso()
  }));
  for (const rec of recommendations) db.aiRecommendations.set(rec.id, rec);
  const run: AgentRun = {
    id: newId('run'), tenantId, agentId, trigger: 'manual',
    modelRoute: route.route, inputSummary: `event=${eventId}`,
    outputRecommendationIds: recommendations.map((r) => r.id),
    policyBlocks: recommendations.filter((r) => r.policyDecision === 'BLOCKED').map((r) => r.id),
    startedAt: started, finishedAt: nowIso()
  };
  db.agentRuns.set(run.id, run);
  return { run, recommendations };
}

export function runAllAgents(db: Db, tenantId: string, eventId: string) {
  return AGENTS.map((a) => runAgent(db, tenantId, a.id, eventId));
}
