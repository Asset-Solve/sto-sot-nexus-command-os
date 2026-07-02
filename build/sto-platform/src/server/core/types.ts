/**
 * Canonical type system for the STO/SOT enterprise operating platform.
 * Mirrors KICKOFF_PROMPT sections 9 (object catalog), 12 (transaction envelope),
 * 13 (posting paths), 14 (workflow/SoD) and 24.2 (connector contract).
 */

// ---------------------------------------------------------------------------
// Source + write governance
// ---------------------------------------------------------------------------

export type SourceMode = 'SIMULATOR' | 'SEED_DATA' | 'SANDBOX' | 'LIVE' | 'CACHE' | 'DISABLED';

export type WritePolicy =
  | 'READ_ONLY'
  | 'STAGE_ONLY'
  | 'APPROVAL_REQUIRED'
  | 'DIRECT_POST_ALLOWED'
  | 'FAIL_CLOSED';

export type SourceSystem =
  | 'SAP_S4'
  | 'SAP_WCM'
  | 'SAP_APM'
  | 'SAP_BDC'
  | 'SAP_MDG'
  | 'SAP_FIELDGLASS'
  | 'SAP_DMS'
  | 'P6'
  | 'MS_PROJECT'
  | 'EPTW'
  | 'HISTORIAN_PI'
  | 'RTLS'
  | 'PAYROLL'
  | 'POWERPLAN'
  | 'SERVICENOW'
  | 'CONTRACTOR_PORTAL'
  | 'STO_PLATFORM';

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL' | 'FINANCE_CRITICAL';

/** Action classes drive AI policy + approval requirements. */
export type ActionClass = 'INFORMATIONAL' | 'ADVISORY' | 'CONTROLLED' | 'BLOCKED_FOR_AI';

export type ActorType = 'HUMAN' | 'AI_AGENT' | 'SYSTEM';

// ---------------------------------------------------------------------------
// Base business object (section 9 mandatory envelope fields)
// ---------------------------------------------------------------------------

export interface BusinessObject {
  id: string;
  tenantId: string;
  objectType: string;
  sourceSystem: SourceSystem;
  sourceMode: SourceMode;
  sourceObject: string;
  sourceReference: string;
  lifecycleState: string;
  approvalState: string;
  riskClass: RiskClass;
  owner: string;
  sourceFreshness: string; // ISO timestamp of last sync from source of record
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  correlationId?: string;
  /** free-form business payload — typed per object family in domain services */
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Lookup contract (section 11)
// ---------------------------------------------------------------------------

export interface LookupItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  status: string;
  sourceSystem: SourceSystem;
  sourceMode: SourceMode;
  sourceObject: string;
  sourceReference: string;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
  postingAllowed: boolean;
  lastSyncAt: string;
  provider: string;
  isLive: boolean;
  freshness?: 'FRESH' | 'STALE' | 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Canonical transaction envelope (section 12)
// ---------------------------------------------------------------------------

export type TxnLifecycle =
  | 'draft'
  | 'validated'
  | 'pending_approval'
  | 'approved'
  | 'queued'
  | 'sent_to_connector'
  | 'posted_pending_readback'
  | 'posted'
  | 'reconciled'
  // exception lifecycle
  | 'validation_failed'
  | 'rejected'
  | 'returned_for_rework'
  | 'cancelled'
  | 'failed_integration'
  | 'pending_retry'
  | 'dead_letter'
  | 'replay_requested'
  | 'replayed'
  | 'reconciliation_failed'
  | 'manually_reconciled'
  // correction lifecycle
  | 'correction_requested'
  | 'reversing_transaction_created'
  | 'reversed';

export interface ValidationResult {
  field?: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  at: string;
  actor: string;
  actorType: ActorType;
  actorRole?: string;
  action: string;
  objectType: string;
  objectId: string;
  correlationId?: string;
  reason?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface CanonicalTransaction {
  transactionId: string;
  tenantId: string;
  businessCapability: string;
  transactionType: string;
  actionId: string;
  sourceScreen: string;
  sourceObject: string;
  targetObject: string;
  sourceSystem: SourceSystem;
  targetSystem: SourceSystem;
  sourceReferences: string[];
  targetReferences: string[];
  lifecycleState: TxnLifecycle;
  approvalState: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  riskClass: RiskClass;
  actionClass: ActionClass;
  connectorId?: string;
  connectorMode?: SourceMode;
  mappingVersion?: string;
  idempotencyKey: string;
  correlationId: string;
  submittedBy: string;
  submittedByRole: string;
  currentOwner: string;
  currentApprover?: string;
  approvedBy?: string;
  approvalReason?: string;
  businessFields: Record<string, unknown>;
  lineItems: Record<string, unknown>[];
  attachments: string[];
  validationResults: ValidationResult[];
  payloadPreview?: Record<string, unknown>;
  payloadHash?: string;
  outboxId?: string;
  targetDocumentNumber?: string;
  responseSnapshot?: Record<string, unknown>;
  reconciliationStatus: 'NOT_STARTED' | 'PENDING' | 'MATCHED' | 'MISMATCH' | 'MANUAL';
  postingPath: PostingPathDecision;
  aiEvidence: string[];
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  history: { at: string; state: TxnLifecycle; actor: string; note?: string }[];
}

// ---------------------------------------------------------------------------
// Posting path decision engine (section 13)
// ---------------------------------------------------------------------------

export type PostingPath =
  | 'READ_IMPACT_ONLY'
  | 'FAIL_CLOSED'
  | 'GOVERNED_WRITEBACK'
  | 'STAGED_PACKAGE'
  | 'LOCAL_CONTROLLED_WRITE'
  | 'REVIEW_PACKAGE_ONLY';

export interface PostingPathDecision {
  path: PostingPath;
  reason: string;
  requiresApproval: boolean;
  requiresSoD: boolean;
  connectorId?: string;
}

// ---------------------------------------------------------------------------
// Outbox / resilience (sections 12, 8.18)
// ---------------------------------------------------------------------------

export type OutboxState =
  | 'QUEUED'
  | 'DISPATCHING'
  | 'SENT'
  | 'FAILED_RETRYABLE'
  | 'DEAD_LETTER'
  | 'CANCELLED'
  | 'COMPLETED';

export interface OutboxMessage {
  id: string;
  tenantId: string;
  transactionId: string;
  connectorId: string;
  operation: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  idempotencyKey: string;
  correlationId: string;
  state: OutboxState;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  lastError?: string;
  responseSnapshot?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DeadLetterMessage {
  id: string;
  tenantId: string;
  outboxId: string;
  transactionId: string;
  connectorId: string;
  error: string;
  payload: Record<string, unknown>;
  replayable: boolean;
  replayedBy?: string;
  replayReason?: string;
  replayedAt?: string;
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  tenantId: string;
  transactionId: string;
  connectorId: string;
  reconciliationKey: string;
  expected: Record<string, unknown>;
  actual?: Record<string, unknown>;
  status: 'MATCHED' | 'MISMATCH' | 'PENDING' | 'MANUAL';
  resolvedBy?: string;
  note?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Connector contract (section 24.2)
// ---------------------------------------------------------------------------

export interface ConnectorCapabilities {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  cancel: boolean;
  reverse: boolean;
  confirm: boolean;
  approve: boolean;
  attach: boolean;
}

export interface ConnectorRecord {
  connectorId: string;
  tenantId: string;
  label: string;
  sourceSystem: SourceSystem;
  sourceModule: string;
  sourceMode: SourceMode;
  enabled: boolean;
  logicalDestination: string;
  authMode: string;
  communicationScenario?: string;
  apiServiceName: string;
  apiVersion: string;
  apiPath: string;
  sourceObject: string;
  sourceObjectKeys: string[];
  capabilities: ConnectorCapabilities;
  writePolicy: WritePolicy;
  mappingProfile: string;
  mappingVersion: string;
  payloadSchemaVersion: string;
  idempotencyKeyPattern: string;
  correlationIdPattern: string;
  csrfPolicy: string;
  etagPolicy: string;
  readbackMethod: string;
  reconciliationKey: string;
  retryPolicy: { maxAttempts: number; backoffMs: number };
  dlqPolicy: string;
  replayPolicy: string;
  ownerRole: string;
  dataSteward: string;
  lastMetadataRefresh: string;
  lastSyncAt: string;
  lastError?: string;
  certificationStatus: 'SIMULATOR_CERTIFIED' | 'SANDBOX_PENDING' | 'SANDBOX_CERTIFIED' | 'LIVE_CERTIFIED' | 'NOT_CERTIFIED';
  docsUrl?: string;
}

export interface ConnectorResponse {
  ok: boolean;
  documentNumber?: string;
  status?: string;
  body?: Record<string, unknown>;
  error?: string;
  retryable?: boolean;
  latencyMs: number;
  connectorId: string;
  mode: SourceMode;
  at: string;
}

export interface ConnectorContext {
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  actor: string;
}

export interface ConnectorAdapter {
  record: ConnectorRecord;
  execute(operation: string, payload: Record<string, unknown>, ctx: ConnectorContext): Promise<ConnectorResponse>;
  readBack(reconciliationKey: string, expected: Record<string, unknown>, ctx: ConnectorContext): Promise<ConnectorResponse>;
  dryRun(operation: string, payload: Record<string, unknown>): Promise<{ payload: Record<string, unknown>; endpoint: string; warnings: string[] }>;
  testConnection(): Promise<ConnectorResponse>;
}

// ---------------------------------------------------------------------------
// Users / RBAC / ABAC (section 7)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  scopes: {
    plants: string[];
    units: string[];
    companyCodes: string[];
  };
}

// ---------------------------------------------------------------------------
// AI governance (section 17)
// ---------------------------------------------------------------------------

export type ModelRoute =
  | 'FAST'
  | 'BALANCED'
  | 'LONG_CONTEXT'
  | 'STRUCTURED_REASONING'
  | 'HIGH_REASONING_REVIEW'
  | 'PRIVATE_DEPLOYMENT';

export interface AICitation {
  objectType: string;
  objectId: string;
  label: string;
  field?: string;
  value?: unknown;
}

export interface AIRecommendation {
  id: string;
  tenantId: string;
  agentId: string;
  actionClass: ActionClass;
  targetObjectType: string;
  targetObjectId: string;
  title: string;
  narrative: string;
  citations: AICitation[];
  confidence: number;
  modelRoute: ModelRoute;
  policyDecision: 'ALLOWED' | 'REVIEW_REQUIRED' | 'BLOCKED';
  humanReviewerRole: string;
  toolCalls: string[];
  blockedExplanation?: string;
  status: 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'CONVERTED_TO_DRAFT';
  createdAt: string;
}

export interface AgentRun {
  id: string;
  tenantId: string;
  agentId: string;
  trigger: string;
  modelRoute: ModelRoute;
  inputSummary: string;
  outputRecommendationIds: string[];
  policyBlocks: string[];
  startedAt: string;
  finishedAt: string;
}

// ---------------------------------------------------------------------------
// Action framework
// ---------------------------------------------------------------------------

export interface ActionField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'lookup' | 'textarea' | 'boolean';
  lookupCategory?: string;
  dependsOn?: string[];
  required?: boolean;
  help?: string;
}

export interface ActionContext {
  user: User;
  actorType: ActorType;
  tenantId: string;
  screen: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  screen: string;
  businessCapability: string;
  actionClass: ActionClass;
  riskClass: RiskClass;
  allowedRoles: string[];
  approverRoles?: string[];
  requiresReason?: boolean;
  sod: boolean;
  targetObjectType: string;
  targetSystem: SourceSystem;
  connectorId?: string;
  connectorOperation?: string;
  fields: ActionField[];
  /** server-side validation; returns list of results (ERROR blocks) */
  validate: (payload: Record<string, unknown>, ctx: ActionContext) => ValidationResult[];
  /** builds the outbound (SAP / non-SAP) payload preview */
  buildPayload?: (payload: Record<string, unknown>, ctx: ActionContext) => Record<string, unknown>;
  /** local platform state effects applied when txn reaches `posted`/local commit */
  apply?: (payload: Record<string, unknown>, txn: CanonicalTransaction, ctx: ActionContext) => void;
}

export interface ExecuteResult {
  ok: boolean;
  blocked?: boolean;
  blockedReason?: string;
  transaction?: CanonicalTransaction;
  validation?: ValidationResult[];
  message: string;
}
