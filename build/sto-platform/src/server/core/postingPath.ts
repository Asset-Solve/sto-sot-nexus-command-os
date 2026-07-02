/**
 * Posting-path decision engine — the single pure function that decides how a
 * write is allowed to travel (KICKOFF_PROMPT section 13). No other write path
 * may exist in the platform.
 */

import type { ActionClass, ActorType, PostingPathDecision, SourceSystem, WritePolicy } from './types';

export interface PostingPathInput {
  actorType: ActorType;
  actionClass: ActionClass;
  targetSystem: SourceSystem;
  /** write policy of the connector owning the target object, if external */
  connectorWritePolicy?: WritePolicy;
  connectorId?: string;
  connectorEnabled?: boolean;
  /** true when target object family has a released write API in the tenant */
  hasReleasedWriteApi?: boolean;
  /** finance / payroll / startup / WCM controlled action */
  regulated?: boolean;
}

export function decidePostingPath(input: PostingPathInput): PostingPathDecision {
  // Rule 1: AI actors never get a write path for controlled actions.
  if (input.actorType === 'AI_AGENT' && (input.actionClass === 'CONTROLLED' || input.actionClass === 'BLOCKED_FOR_AI')) {
    return {
      path: 'REVIEW_PACKAGE_ONLY',
      reason: 'AI actor with controlled/blocked action: review package only, human authority required.',
      requiresApproval: true,
      requiresSoD: true
    };
  }

  // Rule 2: WCM / OT / safety source objects fail closed for writes.
  if (input.connectorWritePolicy === 'FAIL_CLOSED') {
    return {
      path: 'FAIL_CLOSED',
      reason: 'Safety/OT/WCM source of record: writes fail closed. Request correction in owning system.',
      requiresApproval: true,
      requiresSoD: true,
      connectorId: input.connectorId
    };
  }

  // Rule 3: read-only source-owned object.
  if (input.connectorWritePolicy === 'READ_ONLY') {
    return {
      path: 'READ_IMPACT_ONLY',
      reason: 'Source-owned read-only object: platform records impact, no outbound write.',
      requiresApproval: false,
      requiresSoD: false,
      connectorId: input.connectorId
    };
  }

  // Rule 4: platform-owned object -> local controlled write with workflow/audit.
  if (input.targetSystem === 'STO_PLATFORM') {
    const controlled = input.actionClass === 'CONTROLLED';
    return {
      path: 'LOCAL_CONTROLLED_WRITE',
      reason: 'SOT-owned object: local controlled write with workflow and audit.',
      requiresApproval: controlled || !!input.regulated,
      requiresSoD: controlled || !!input.regulated
    };
  }

  // Rule 5: external object without released write API -> staged package + ADR.
  if (input.connectorWritePolicy === 'STAGE_ONLY' || input.hasReleasedWriteApi === false) {
    return {
      path: 'STAGED_PACKAGE',
      reason: 'No released write API: staged package with visible "not posted to source" state; wrapper ADR required.',
      requiresApproval: true,
      requiresSoD: true,
      connectorId: input.connectorId
    };
  }

  // Rule 6: connector disabled blocks writes server-side.
  if (input.connectorEnabled === false) {
    return {
      path: 'STAGED_PACKAGE',
      reason: 'Connector disabled: write staged locally with visible "not posted" state until connector re-enabled.',
      requiresApproval: true,
      requiresSoD: true,
      connectorId: input.connectorId
    };
  }

  // Rule 7: SAP/non-SAP owned object with released write API -> governed writeback.
  return {
    path: 'GOVERNED_WRITEBACK',
    reason: 'Released write API available: governed writeback via approval, outbox, read-back and reconciliation.',
    requiresApproval: true,
    requiresSoD: true,
    connectorId: input.connectorId
  };
}
