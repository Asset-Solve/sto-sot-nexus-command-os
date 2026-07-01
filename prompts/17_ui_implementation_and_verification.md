# Prompt 17 - UI Implementation And Verification

Build UI only from approved screen contracts.

Required behavior:

- Role-based guided workbenches, not generic CRUD.
- Every field uses approved lookup, validation, defaulting, and source metadata.
- Every button calls a backend domain action.
- Every controlled action shows payload preview, blocking reasons, approval status, audit timeline, and next step.
- Every screen shows connector mode, source freshness, lifecycle state, owner, approver, reconciliation state, and evidence where relevant.
- Loading, empty, error, permission-denied, stale-data, partial-failure, and offline states exist.
- Accessibility requirements are implemented.

Verification:

- Run e2e tests for each critical workflow.
- Run accessibility checks.
- Confirm no hard-coded governed lookups remain.
- Confirm no frontend direct ERP/system-of-record calls exist.

