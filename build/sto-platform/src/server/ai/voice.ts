/**
 * Voice / natural-language command interpreter.
 *
 * The browser captures speech (Web Speech API) and posts the transcript here.
 * The interpreter resolves intent + entities against governed read models and
 * returns one of:
 *   navigate      — open a workbench (optionally filtered)
 *   query         — spoken + visual answer assembled from read models
 *   draft_action  — a pre-filled controlled-action draft. NEVER executed:
 *                   the user must review validation + payload preview and
 *                   submit; approval/SoD still applies downstream.
 *   blocked       — controlled/safety intent that voice may not even draft
 *                   (e.g. permit approval), with explanation.
 *
 * This mirrors the AI policy gateway: voice is an input modality, not an
 * authority. Same grammar works for typed commands.
 */

import { listObjects, type Db } from '../core/store';
import { sanitizeUntrusted } from './router';
import { actionCatalog } from '../domain/registry';

export interface VoiceResult {
  intent: 'navigate' | 'query' | 'draft_action' | 'blocked' | 'unknown';
  transcript: string;
  speech: string; // spoken back via speechSynthesis
  route?: string;
  filter?: Record<string, string>;
  draft?: { actionId: string; label: string; payload: Record<string, unknown>; requiresApproval: boolean };
  data?: Record<string, unknown>;
  injectionFlagged?: boolean;
}

const ROUTES: { route: string; words: string[] }[] = [
  { route: '/command-center', words: ['command center', 'command centre', 'home', 'overview', 'cockpit'] },
  { route: '/portfolio', words: ['portfolio', 'event strategy', 'premise'] },
  { route: '/scope', words: ['scope'] },
  { route: '/work-packages', words: ['work package', 'work packages', 'package studio'] },
  { route: '/schedule', words: ['schedule', 'critical path', 'lookahead'] },
  { route: '/materials', words: ['material', 'materials', 'kits', 'warehouse', 'shortage'] },
  { route: '/permits', words: ['permit', 'permits', 'isolation', 'loto', 'safety clearance', 'wcm'] },
  { route: '/area-risk', words: ['area risk', 'risk map', 'simops'] },
  { route: '/contractors', words: ['contractor', 'contractors', 'claims', 'commercial'] },
  { route: '/field', words: ['field', 'execution', 'progress', 'shift handover'] },
  { route: '/labor-time', words: ['labor', 'labour', 'time', 'timesheet', 'cats', 'payroll'] },
  { route: '/qa', words: ['qa', 'quality', 'punch', 'turnover', 'test pack'] },
  { route: '/startup-readiness', words: ['startup', 'pssr', 'return to service', 'rts'] },
  { route: '/cost', words: ['cost', 'budget', 'forecast', 'accrual', 'variance'] },
  { route: '/lessons', words: ['lesson', 'lessons', 'closeout'] },
  { route: '/data-foundation', words: ['data foundation', 'data product', 'datasphere', 'lineage'] },
  { route: '/connectors', words: ['connector', 'connectors', 'integration hub'] },
  { route: '/resilience', words: ['resilience', 'outbox', 'dead letter', 'dlq', 'writeback', 'reconciliation'] },
  { route: '/ai', words: ['agents', 'ai workbench', 'recommendations'] },
  { route: '/admin', words: ['admin', 'tenant', 'roles'] }
];

/** voice-draftable actions: verb phrases -> actionId (+ payload extractors) */
const DRAFT_GRAMMAR: { actionId: string; phrases: RegExp }[] = [
  { actionId: 'material.reserve', phrases: /(reserve|reservation).*(material|mat[- ]?\d|gasket|bolt|bundle|seal|refractory)|(create|make).*(reservation)/ },
  { actionId: 'material.request_pr', phrases: /(request|create|raise).*(purchase requisition|procurement|pr\b)/ },
  { actionId: 'emergent.raise', phrases: /(raise|create|report).*(emergent|urgent|new)\s*work/ },
  { actionId: 'labor.submit', phrases: /(enter|submit|log|record).*(time|hours|labor|labour)/ },
  { actionId: 'punch.create', phrases: /(create|raise|add).*(punch)/ },
  { actionId: 'constraint.create', phrases: /(create|raise|add).*(constraint)/ },
  { actionId: 'scope.submit', phrases: /(submit|create|add).*(scope)/ },
  { actionId: 'progress.submit', phrases: /(update|submit|report).*(progress)/ }
];

/** intents voice must refuse even as drafts (safety/finance/startup approvals) */
const HARD_BLOCKED = [
  { re: /(approve|issue|release|restore|suspend|close).*(permit|isolation|loto|clearance)/, why: 'Permit and isolation decisions belong to the WCM authority in the owning safety system. Voice cannot draft or approve them.' },
  { re: /(approve).*(startup|return to service|rts|pssr)/, why: 'Return-to-service approval requires the human operations authority acting directly in the workbench with full evidence review.' },
  { re: /(post|approve).*(journal|accrual|payroll)/, why: 'Finance postings require the finance controller in the Cost workbench with four-eyes approval.' },
  { re: /(replay).*(dlq|dead letter|production)/, why: 'DLQ replay requires the integration operator role with a recorded reason — use the Resilience workbench.' },
  { re: /(approve|freeze).*(scope|rebaseline|claim|turnover)/, why: 'This is a controlled approval. Open the workbench to review validation, payload and evidence before deciding.' }
];

function matchEntities(db: Db, tenantId: string, text: string): Record<string, string> {
  const f: Record<string, string> = {};
  const events = listObjects(db, tenantId, 'TurnaroundEvent');
  for (const ev of events) {
    const name = (ev.data['name'] as string).toLowerCase();
    if (text.includes(ev.id.toLowerCase()) || name.split(' ').slice(0, 2).every((w) => text.includes(w.toLowerCase()))) {
      f['eventId'] = ev.id;
      break;
    }
  }
  const wpMatch = text.match(/wp[- ]?(\d{3,5})/i);
  if (wpMatch) f['workPackageId'] = `WP-${wpMatch[1]}`;
  const matMatch = text.match(/mat[- ]?(\d{3,5})/i);
  if (matMatch) f['materialId'] = `MAT-${matMatch[1]}`;
  const qtyMatch = text.match(/(\d+)\s*(units|pieces|sets|each|bags|kits)?/);
  if (qtyMatch && /reserve|reservation|issue/.test(text)) f['quantity'] = qtyMatch[1];
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*hours?/);
  if (hoursMatch) f['hours'] = hoursMatch[1];
  return f;
}

export function interpretCommand(db: Db, tenantId: string, transcriptRaw: string): VoiceResult {
  const { text: transcript, flagged } = sanitizeUntrusted(transcriptRaw.trim());
  const text = transcript.toLowerCase();

  // 1) hard-blocked intents
  for (const b of HARD_BLOCKED) {
    if (b.re.test(text)) {
      return {
        intent: 'blocked', transcript, injectionFlagged: flagged,
        speech: `I can't do that by voice. ${b.why}`
      };
    }
  }

  // 2) queries
  if (/^(what|how|show me the status|status of|any|are there|tell me)/.test(text) || text.includes('status')) {
    const ents = matchEntities(db, tenantId, text);
    if (text.includes('shortage') || text.includes('material')) {
      const shortages = listObjects(db, tenantId, 'MaterialDemand', (o) => o.lifecycleState === 'shortage');
      return {
        intent: 'query', transcript, injectionFlagged: flagged, route: '/materials',
        speech: shortages.length
          ? `There ${shortages.length === 1 ? 'is one critical shortage' : `are ${shortages.length} shortages`}: ${shortages.map((s) => `${s.data['materialId']} for ${s.data['wpId']}`).join(', ')}. Opening Materials.`
          : 'No open material shortages. Opening Materials.',
        data: { shortages: shortages.map((s) => s.id) }
      };
    }
    if (text.includes('permit') || text.includes('safety')) {
      const bad = listObjects(db, tenantId, 'PermitProxy', (o) => ['suspended', 'expired'].includes(o.lifecycleState));
      return {
        intent: 'query', transcript, injectionFlagged: flagged, route: '/permits',
        speech: bad.length
          ? `${bad.length} permit issue${bad.length > 1 ? 's' : ''}: ${bad.map((p) => `${p.id} is ${p.lifecycleState}`).join(', ')}. Field start will fail closed. Opening Permits.`
          : 'All permits active. Opening Permits.'
      };
    }
    if (text.includes('progress') || text.includes('event') || ents['eventId']) {
      const ev = listObjects(db, tenantId, 'TurnaroundEvent', (o) => o.id === (ents['eventId'] ?? 'EV-1001'))[0];
      if (ev) {
        return {
          intent: 'query', transcript, injectionFlagged: flagged, route: '/command-center',
          speech: `${ev.data['name']}: day ${ev.data['dayOf']} of ${ev.data['totalDays']}, ${ev.data['progressPct']} percent complete versus ${ev.data['planPct']} planned, schedule variance ${ev.data['scheduleVarianceDays']} days, forecast ${ev.data['forecastMUSD']} million against ${ev.data['budgetMUSD']} budget.`
        };
      }
    }
    if (text.includes('dead letter') || text.includes('dlq') || text.includes('integration')) {
      const dlq = [...db.deadLetters.values()].filter((d) => d.tenantId === tenantId && !d.replayedAt);
      return {
        intent: 'query', transcript, injectionFlagged: flagged, route: '/resilience',
        speech: `${dlq.length} message${dlq.length === 1 ? '' : 's'} in the dead letter queue. Opening Resilience Ops.`
      };
    }
  }

  // 3) draft controlled/advisory actions (never executed by voice)
  for (const g of DRAFT_GRAMMAR) {
    if (g.phrases.test(text)) {
      const action = actionCatalog().find((a) => a.id === g.actionId)!;
      const ents = matchEntities(db, tenantId, text);
      const payload: Record<string, unknown> = {};
      for (const fld of action.fields) if (ents[fld.name]) payload[fld.name] = ents[fld.name];
      const controlled = action.actionClass !== 'ADVISORY' && action.actionClass !== 'INFORMATIONAL';
      return {
        intent: 'draft_action', transcript, injectionFlagged: flagged, route: action.screen,
        draft: { actionId: action.id, label: action.label, payload, requiresApproval: controlled },
        speech: `Drafting ${action.label}. I've pre-filled ${Object.keys(payload).length} field${Object.keys(payload).length === 1 ? '' : 's'} — review the validation and payload preview, then submit.${controlled ? ' This is a controlled action and will route for approval.' : ''}`
      };
    }
  }

  // 4) navigation
  for (const r of ROUTES) {
    if (r.words.some((w) => text.includes(w))) {
      return { intent: 'navigate', transcript, injectionFlagged: flagged, route: r.route, speech: `Opening ${r.route.replace('/', '').replace('-', ' ')}.` };
    }
  }

  return {
    intent: 'unknown', transcript, injectionFlagged: flagged,
    speech: 'I did not catch a known command. Try: "show material shortages", "open permits", "reserve 6 sets of MAT 4714", or "what is the event status".'
  };
}
