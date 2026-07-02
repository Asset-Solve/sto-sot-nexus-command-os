CREATE SCHEMA IF NOT EXISTS erp_sandbox;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reconciliation;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE erp_sandbox.connector_mode AS ENUM ('SIMULATOR', 'SANDBOX', 'LIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE erp_sandbox.test_status AS ENUM ('planned', 'running', 'passed', 'failed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp_sandbox.test_tenant (
  tenant_id text PRIMARY KEY,
  display_name text NOT NULL,
  primary_erp text NOT NULL,
  backup_erp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sandbox.connector_endpoint (
  connector_id text PRIMARY KEY,
  mode erp_sandbox.connector_mode NOT NULL,
  base_url text NOT NULL,
  source_of_record_role text NOT NULL,
  live_writes_allowed boolean NOT NULL DEFAULT false,
  health_path text NOT NULL,
  owner text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sandbox.source_of_record_route (
  route_id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES erp_sandbox.test_tenant(tenant_id),
  business_object text NOT NULL,
  primary_connector_id text NOT NULL REFERENCES erp_sandbox.connector_endpoint(connector_id),
  backup_connector_id text REFERENCES erp_sandbox.connector_endpoint(connector_id),
  write_failover_allowed boolean NOT NULL DEFAULT false,
  dual_post_allowed boolean NOT NULL DEFAULT false,
  read_staleness_seconds integer NOT NULL DEFAULT 300,
  UNIQUE (tenant_id, business_object)
);

CREATE TABLE IF NOT EXISTS erp_sandbox.integration_test_case (
  test_case_id text PRIMARY KEY,
  name text NOT NULL,
  use_case_family text NOT NULL,
  business_object text NOT NULL,
  stage_coverage text[] NOT NULL,
  connector_ids text[] NOT NULL,
  expected_control text NOT NULL,
  test_types jsonb NOT NULL,
  status erp_sandbox.test_status NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sandbox.idempotency_key (
  idempotency_key text PRIMARY KEY,
  tenant_id text NOT NULL,
  business_object text NOT NULL,
  business_key text NOT NULL,
  request_hash text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sandbox.outbox_message (
  outbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  connector_id text NOT NULL,
  business_object text NOT NULL,
  action text NOT NULL,
  payload_preview jsonb NOT NULL,
  idempotency_key text NOT NULL REFERENCES erp_sandbox.idempotency_key(idempotency_key),
  status text NOT NULL DEFAULT 'queued',
  retry_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sandbox.target_document_reference (
  target_reference_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id uuid NOT NULL REFERENCES erp_sandbox.outbox_message(outbox_id),
  connector_id text NOT NULL,
  target_document_type text NOT NULL,
  target_document_number text NOT NULL,
  target_status text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connector_id, target_document_type, target_document_number)
);

CREATE TABLE IF NOT EXISTS erp_sandbox.readback_snapshot (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_reference_id uuid NOT NULL REFERENCES erp_sandbox.target_document_reference(target_reference_id),
  readback_payload jsonb NOT NULL,
  readback_status text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconciliation.reconciliation_case (
  reconciliation_case_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  target_reference_id uuid REFERENCES erp_sandbox.target_document_reference(target_reference_id),
  mismatch_type text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assigned_owner text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit.audit_event (
  audit_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL,
  business_object text NOT NULL,
  business_key text,
  decision_basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit.ai_evidence (
  ai_evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  use_case_family text NOT NULL,
  model_profile text NOT NULL,
  prompt_version text NOT NULL,
  source_citations jsonb NOT NULL,
  confidence numeric(5,4) NOT NULL,
  controlled_action_blocked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO erp_sandbox.test_tenant (tenant_id, display_name, primary_erp, backup_erp)
VALUES ('tenant_demo', 'Demo Tenant', 'sap_s4hana', 'oracle_fusion')
ON CONFLICT (tenant_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    primary_erp = EXCLUDED.primary_erp,
    backup_erp = EXCLUDED.backup_erp;

INSERT INTO erp_sandbox.connector_endpoint (connector_id, mode, base_url, source_of_record_role, live_writes_allowed, health_path, owner)
VALUES
  ('sap_s4hana', 'SANDBOX', 'http://sap-s4-simulator:8080', 'primary', false, '/sap/health', 'integration-platform-team'),
  ('sap_integration_suite', 'SANDBOX', 'http://middleware-simulator:8080', 'middleware', false, '/sap-is/health', 'integration-platform-team'),
  ('sap_advanced_event_mesh', 'SANDBOX', 'amqp://rabbitmq:5672', 'eventing', false, '/api/healthchecks/node', 'integration-platform-team'),
  ('oracle_fusion', 'SANDBOX', 'http://oracle-fusion-simulator:8080', 'backup', false, '/oracle/health', 'integration-platform-team'),
  ('oracle_integration_cloud', 'SANDBOX', 'http://middleware-simulator:8080', 'middleware', false, '/oic/health', 'integration-platform-team'),
  ('maximo', 'SANDBOX', 'http://non-sap-simulator:8080', 'non_sap_eam', false, '/maximo/health', 'eam-integration-team'),
  ('service_now', 'SANDBOX', 'http://non-sap-simulator:8080', 'non_sap_itsm', false, '/servicenow/health', 'itsm-integration-team'),
  ('aveva_pi', 'SANDBOX', 'http://non-sap-simulator:8080', 'historian', false, '/piwebapi/system', 'ot-data-team'),
  ('opc_ua', 'SANDBOX', 'http://non-sap-simulator:8080', 'ot_protocol', false, '/opcua/health', 'ot-data-team')
ON CONFLICT (connector_id) DO UPDATE
SET mode = EXCLUDED.mode,
    base_url = EXCLUDED.base_url,
    source_of_record_role = EXCLUDED.source_of_record_role,
    live_writes_allowed = EXCLUDED.live_writes_allowed,
    health_path = EXCLUDED.health_path,
    owner = EXCLUDED.owner;

INSERT INTO erp_sandbox.source_of_record_route (route_id, tenant_id, business_object, primary_connector_id, backup_connector_id, write_failover_allowed, dual_post_allowed, read_staleness_seconds)
VALUES
  ('route-equipment', 'tenant_demo', 'Equipment', 'sap_s4hana', 'oracle_fusion', false, false, 300),
  ('route-maintenance-order', 'tenant_demo', 'MaintenanceOrder', 'sap_s4hana', 'oracle_fusion', false, false, 120),
  ('route-purchase-requisition', 'tenant_demo', 'PurchaseRequisition', 'sap_s4hana', 'oracle_fusion', false, false, 120),
  ('route-journal-entry', 'tenant_demo', 'JournalEntry', 'sap_s4hana', 'oracle_fusion', false, false, 60),
  ('route-goods-movement', 'tenant_demo', 'GoodsMovement', 'sap_s4hana', 'oracle_fusion', false, false, 60),
  ('route-business-partner', 'tenant_demo', 'BusinessPartner', 'sap_s4hana', 'oracle_fusion', false, false, 300),
  ('route-work-order-fallback', 'tenant_demo', 'ExternalWorkOrder', 'maximo', 'sap_s4hana', false, false, 300),
  ('route-incident-fallback', 'tenant_demo', 'ServiceIncident', 'service_now', 'sap_s4hana', false, false, 300),
  ('route-historian-reading', 'tenant_demo', 'HistorianReading', 'aveva_pi', NULL, false, false, 30)
ON CONFLICT (tenant_id, business_object) DO UPDATE
SET primary_connector_id = EXCLUDED.primary_connector_id,
    backup_connector_id = EXCLUDED.backup_connector_id,
    write_failover_allowed = EXCLUDED.write_failover_allowed,
    dual_post_allowed = EXCLUDED.dual_post_allowed,
    read_staleness_seconds = EXCLUDED.read_staleness_seconds;

INSERT INTO erp_sandbox.integration_test_case (test_case_id, name, use_case_family, business_object, stage_coverage, connector_ids, expected_control, test_types)
VALUES
  ('SBX-001', 'Golden transaction posts through outbox and reconciles', 'cross_use_case', 'MaintenanceOrder', ARRAY['08','09','10','11','14','16','20'], ARRAY['sap_s4hana','sap_integration_suite'], 'payload_preview_outbox_readback_reconciliation', '["integration","contract","reconciliation"]'::jsonb),
  ('SBX-002', 'Dual ERP write routing blocks automatic failover', 'cross_use_case', 'PurchaseRequisition', ARRAY['07','08','10','16'], ARRAY['sap_s4hana','oracle_fusion'], 'no_dual_post_no_auto_write_failover', '["integration","security","reconciliation"]'::jsonb),
  ('SBX-003', 'Connector failure retries and parks in DLQ', 'cross_use_case', 'MaintenanceOrder', ARRAY['09','10','16','19'], ARRAY['sap_s4hana','sap_advanced_event_mesh'], 'retry_limit_then_dead_letter', '["integration","resilience","reconciliation"]'::jsonb),
  ('SBX-004', 'Reconciliation mismatch opens owned case', 'cross_use_case', 'JournalEntry', ARRAY['10','16','19','20'], ARRAY['sap_s4hana'], 'mismatch_case_with_owner_and_audit', '["reconciliation","contract"]'::jsonb),
  ('SBX-005', 'Four-eyes policy blocks self approval', 'workflow', 'PurchaseRequisition', ARRAY['11','14','16','17'], ARRAY['sap_s4hana'], 'segregation_of_duties_block', '["integration","security","e2e"]'::jsonb),
  ('SBX-006', 'Tenant isolation blocks cross tenant read', 'security', 'MaintenanceOrder', ARRAY['14','19','20'], ARRAY['sap_s4hana'], 'tenant_context_required', '["security","integration"]'::jsonb),
  ('SBX-007', 'AI recommendation cannot post controlled action', 'ai_governance', 'MaintenanceOrder', ARRAY['18','20'], ARRAY['sap_s4hana'], 'human_approval_required', '["ai_evals","security"]'::jsonb),
  ('SBX-008', 'Historian reading maps to asset indicator without OT write', 'ot_historian', 'HistorianReading', ARRAY['08','09','14','20'], ARRAY['aveva_pi','opc_ua'], 'read_only_ot_ingestion', '["integration","contract","security"]'::jsonb)
ON CONFLICT (test_case_id) DO UPDATE
SET name = EXCLUDED.name,
    use_case_family = EXCLUDED.use_case_family,
    business_object = EXCLUDED.business_object,
    stage_coverage = EXCLUDED.stage_coverage,
    connector_ids = EXCLUDED.connector_ids,
    expected_control = EXCLUDED.expected_control,
    test_types = EXCLUDED.test_types;
