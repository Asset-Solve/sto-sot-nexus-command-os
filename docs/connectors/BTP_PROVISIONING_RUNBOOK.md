# BTP Provisioning Runbook (per SAP connector)

Applies to every `sap-*` connector in `build/sto-platform/src/server/connectors/registry.ts`. Promotion order: SIMULATOR → SANDBOX → LIVE; a connector may not advance without evidence recorded in its certification record.

1. Confirm SAP product, deployment model, release/FPS, scope items, licensing and activated business functions for the target tenant.
2. Confirm source-of-record ownership, allowed operations and clean-core policy for the object family (`docs/data/SOURCE_OF_RECORD_AND_WRITE_POLICY_REGISTER.md`).
3. Create communication system/user or OAuth client in SAP.
4. Create the communication arrangement for the API (e.g. `SAP_COM_0027` for workforce timesheet); record service URL, scopes, roles and object authorizations.
5. Configure BTP Destination with the logical name from the connector record (`DEST_*`). Secrets stay in Destination/Credential Store/IAS — the platform stores logical names only.
6. Configure Cloud Connector with least-privilege exposed resources for private/on-premise endpoints (WCM wrapper, legacy interfaces).
7. Build Integration Suite iFlow where mediation/wrapping is required (WCM read model, BAPI/RFC/IDoc wrappers). Wrappers must preserve SAP authorizations, business validations, error messages and read-back.
8. Configure Event Mesh topics/queues for async events and read-back where available.
9. Import OpenAPI/EDMX metadata into the connector registry; regenerate mapping profile and bump `mappingVersion`; generate contract tests.
10. Validate CSRF token fetch, ETag/If-Match, paging, filtering, batch, rate limits, retry classification and API-specific error surfaces.
11. Execute dry-run then sandbox post with idempotency key and correlation ID.
12. Perform read-back and reconciliation using the connector's `reconciliationKey`.
13. Certify negative tests: auth failure, missing mandatory field, invalid status, duplicate, stale ETag, lock conflict, SAP business validation failure, retry exhaustion, replay.
14. Store evidence in the connector certification record and set `certificationStatus` (SANDBOX_CERTIFIED / LIVE_CERTIFIED). Only then flip `sourceMode`.

Special rules: WCM/ePTW connectors may never be promoted to a write mode without the owning safety authority's certified adapter — the platform stance stays FAIL_CLOSED. BDC/Datasphere/CDS/SLT connectors are read-only permanently. Batch Input/BDC sessions are `LEGACY_EXCEPTION` only (explicit approval, stronger audit, read-back still required).
