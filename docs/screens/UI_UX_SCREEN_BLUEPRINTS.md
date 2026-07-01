# Enterprise UI/UX Screen Blueprints

## Required screen types

| Screen type | Purpose | Mandatory controls |
|---|---|---|
| Command Center | Portfolio view and exception triage | KPI source, freshness, drill-through, no write-back without action screen |
| Work Inbox | Assigned tasks and approvals | approve/reject/request correction, SLA, owner, audit |
| Create Wizard | Guided transaction creation | connector-backed lookups, validation, draft save |
| Transaction Detail Workbench | Complete business document view | header, lines, source data, related objects, lifecycle, notes, attachments |
| Approval Workbench | Controlled decision making | payload preview, risk, evidence, SoD, comments, e-signature |
| Posting Monitor | Outbox and connector status | retry, DLQ, response, target document, replay approval |
| Reconciliation Workbench | Source-target comparison | mismatch reason, correction, close case |
| Master Data Console | Reference and replicated objects | source ownership, read-only/write policy, change workflow |
| Connector Console | Integration admin | mode, auth, health, mapping, test read/write |
| Rules Console | Business rules | effective dates, test cases, approval before activation |
| AI Copilot | Contextual assistant | citations, confidence, action class, human approval |
| Evidence Center | Audit/compliance package | immutable timeline, source refs, payload hash, export |

## Screen contract

Every screen must define:

- route
- persona
- business process step
- object ownership
- fields and lookups
- actions and backend endpoints
- validations
- workflow states
- approval requirements
- integration behavior
- audit events
- tests
