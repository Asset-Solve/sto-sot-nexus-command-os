# Canonical ERP Data Model Template

## Object classes

| Class | Description | Examples |
|---|---|---|
| Master data | Long-lived enterprise object | Equipment, asset, material, supplier, employee, cost center |
| Transaction header | Business document header | Work order, PO, invoice, permit, time sheet |
| Transaction line | Item/operation/component level | PO line, work order operation, material component |
| Reference/config | Rules and allowed values | reason codes, statuses, order types, approval thresholds |
| Workflow | Assignment and approval state | approval step, task, escalation |
| Outbox | Pending external write | outbound payload and retry state |
| Reconciliation | Read-back and mismatch cases | target document check, status mismatch |
| Audit | Immutable evidence | action, actor, timestamp, payload hash |
| AI evidence | Model outputs and sources | recommendation, citation, confidence, prompt version |

## Core canonical transaction fields

- transactionId
- tenantId
- businessCapability
- transactionType
- sourceSystem
- targetSystem
- sourceReferences[]
- targetReferences[]
- status
- lifecycleState
- riskClass
- approvalState
- currentOwner
- currentApprover
- businessFields
- lineItems[]
- attachments[]
- validationResults[]
- payloadPreview
- outboxId
- targetDocumentNumber
- reconciliationStatus
- auditTrail[]
- aiEvidence[]
