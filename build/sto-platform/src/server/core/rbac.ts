/**
 * RBAC + ABAC + SoD (KICKOFF_PROMPT section 7 personas, section 14 SoD).
 * Role -> permission verbs; ABAC via user scope filters (plant/unit/companyCode).
 */

import type { User } from './types';

export const ROLES = [
  'executive_viewer',
  'event_sponsor',
  'sto_manager',
  'outage_manager',
  'operations_startup_authority',
  'production_planner',
  'scope_board_member',
  'reliability_engineer',
  'maintenance_planner',
  'scheduler_project_controls',
  'work_package_owner',
  'engineer',
  'maintenance_supervisor',
  'field_technician',
  'timekeeper',
  'crew_supervisor',
  'payroll_user',
  'finance_cost_controller',
  'procurement_user',
  'material_planner',
  'warehouse_lead',
  'tool_crib_attendant',
  'contractor_coordinator',
  'contractor_supervisor',
  'hse_safety_reviewer',
  'wcm_authority',
  'qa_qc_inspector',
  'turnover_coordinator',
  'data_steward',
  'integration_operator',
  'ai_platform_owner',
  'tenant_admin',
  'auditor'
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Permission verbs per role. Action definitions declare allowedRoles /
 * approverRoles explicitly; these verb sets gate generic API surfaces
 * (replay, reversal, connector admin, audit read).
 */
const ROLE_VERBS: Record<string, string[]> = {
  executive_viewer: ['view'],
  auditor: ['view', 'audit.read'],
  event_sponsor: ['view', 'approve'],
  sto_manager: ['view', 'edit', 'approve', 'escalate'],
  outage_manager: ['view', 'edit', 'approve', 'escalate'],
  operations_startup_authority: ['view', 'approve', 'startup.approve'],
  production_planner: ['view', 'edit'],
  scope_board_member: ['view', 'approve'],
  reliability_engineer: ['view', 'edit'],
  maintenance_planner: ['view', 'edit'],
  scheduler_project_controls: ['view', 'edit', 'approve'],
  work_package_owner: ['view', 'edit'],
  engineer: ['view', 'edit'],
  maintenance_supervisor: ['view', 'edit', 'approve'],
  field_technician: ['view', 'edit'],
  timekeeper: ['view', 'edit'],
  crew_supervisor: ['view', 'edit', 'approve'],
  payroll_user: ['view', 'edit', 'payroll.release'],
  finance_cost_controller: ['view', 'edit', 'approve', 'finance.post'],
  procurement_user: ['view', 'edit'],
  material_planner: ['view', 'edit'],
  warehouse_lead: ['view', 'edit'],
  tool_crib_attendant: ['view', 'edit'],
  contractor_coordinator: ['view', 'edit'],
  contractor_supervisor: ['view', 'edit'],
  hse_safety_reviewer: ['view', 'edit', 'approve'],
  wcm_authority: ['view', 'edit', 'approve', 'safety.approve'],
  qa_qc_inspector: ['view', 'edit'],
  turnover_coordinator: ['view', 'edit', 'approve'],
  data_steward: ['view', 'edit', 'data.certify'],
  integration_operator: ['view', 'edit', 'connector.admin', 'replay', 'reconcile'],
  ai_platform_owner: ['view', 'edit', 'ai.admin'],
  tenant_admin: ['view', 'edit', 'approve', 'admin', 'connector.admin', 'replay', 'reconcile', 'audit.read']
};

export function hasVerb(user: User, verb: string): boolean {
  return (ROLE_VERBS[user.role] ?? []).includes(verb);
}

export function roleAllowed(user: User, allowedRoles: string[]): boolean {
  return allowedRoles.includes('*') || allowedRoles.includes(user.role) || user.role === 'tenant_admin';
}

/** ABAC scope check — object plant/unit must be inside user scope. */
export function inScope(user: User, obj: { data: Record<string, unknown> }): boolean {
  const plant = obj.data['plantId'] as string | undefined;
  const unit = obj.data['unitId'] as string | undefined;
  if (plant && user.scopes.plants.length && !user.scopes.plants.includes(plant)) return false;
  if (unit && user.scopes.units.length && !user.scopes.units.includes(unit)) return false;
  return true;
}

/** Four-eyes: submitter can never final-approve their own controlled transaction. */
export function sodViolation(submitterId: string, approverId: string): boolean {
  return submitterId === approverId;
}
