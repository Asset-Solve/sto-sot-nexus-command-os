/**
 * AI model router + policy gateway (KICKOFF_PROMPT section 17).
 * Routing is deterministic and logged; safety/finance/startup tasks always
 * route to HIGH_REASONING_REVIEW and produce review packages only.
 */

import type { ActionClass, ModelRoute } from '../core/types';

export type AITaskKind =
  | 'informational'
  | 'advisory_analysis'
  | 'work_package_review'
  | 'integration_triage'
  | 'safety_review'
  | 'finance_review'
  | 'startup_review'
  | 'restricted_data';

export const MODEL_ROUTES: Record<AITaskKind, { route: ModelRoute; model: string; note: string }> = {
  informational: { route: 'FAST', model: 'claude-haiku-4-5', note: 'Summaries, classification, lookups' },
  advisory_analysis: { route: 'BALANCED', model: 'claude-sonnet-5', note: 'Scope challenge, delay classification, shortage prioritization' },
  work_package_review: { route: 'LONG_CONTEXT', model: 'claude-sonnet-5 (200k)', note: 'Long package/document review' },
  integration_triage: { route: 'STRUCTURED_REASONING', model: 'claude-sonnet-5 + JSON schema', note: 'Error clustering, retry classification' },
  safety_review: { route: 'HIGH_REASONING_REVIEW', model: 'claude-opus-4-8', note: 'Review package only — never executes' },
  finance_review: { route: 'HIGH_REASONING_REVIEW', model: 'claude-opus-4-8', note: 'Review package only — never executes' },
  startup_review: { route: 'HIGH_REASONING_REVIEW', model: 'claude-opus-4-8', note: 'Review package only — never executes' },
  restricted_data: { route: 'PRIVATE_DEPLOYMENT', model: 'tenant private endpoint', note: 'Per-tenant data residency policy' }
};

export function routeFor(kind: AITaskKind) {
  return MODEL_ROUTES[kind];
}

/** AI policy: which classes may AI act on autonomously. */
export function aiPolicyDecision(actionClass: ActionClass): 'ALLOWED' | 'REVIEW_REQUIRED' | 'BLOCKED' {
  if (actionClass === 'INFORMATIONAL') return 'ALLOWED';
  if (actionClass === 'ADVISORY') return 'REVIEW_REQUIRED';
  return 'BLOCKED';
}

/** Prompt-injection defense: strip/flag instruction-like content from untrusted sources. */
export function sanitizeUntrusted(text: string): { text: string; flagged: boolean } {
  const patterns = /(ignore (all|previous) instructions|system prompt|approve .* without|bypass approval|execute immediately)/i;
  const flagged = patterns.test(text);
  return { text: flagged ? `[UNTRUSTED CONTENT QUARANTINED] ${text}` : text, flagged };
}
