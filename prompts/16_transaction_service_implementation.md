# Prompt 16 - Transaction Service Implementation

Implement the approved transaction services only after Stages 01 through 12 are approved.

Required service actions:

- read
- lookup
- validate
- saveDraft
- submit
- approve
- reject
- requestCorrection
- payloadPreview
- release
- queueOutbox
- post
- acknowledge
- readBack
- reconcile
- cancel
- reverse
- close
- audit

Rules:

- Preserve tenant context, correlation ID, actor, role, approval state, and risk class.
- Use source-of-record and native integration mapping.
- Use outbox for every outbound write.
- Use idempotency for every side-effecting command.
- Never directly edit posted transactions.
- Add unit, integration, outbox, approval, and reconciliation tests.

