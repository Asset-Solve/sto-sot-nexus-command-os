# Prompt 10 — Transactional Outbox, Write-Back, Read-Back, Reconciliation

All outbound writes must use an outbox record with idempotency key, payload hash, correlation ID, target system/object/action, connector, status, retry count, response payload, target document number, and reconciliation status.

Implement retry, DLQ, replay approval, read-back polling/event handling, target status capture, mismatch detection, and reconciliation case management.
