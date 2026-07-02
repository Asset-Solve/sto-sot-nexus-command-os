# Use-Case Ideation and Research Workflow

## Research questions

1. What business outcome is needed?
2. Who performs the work today?
3. Which ERP or operational process owns it?
4. Which data objects are created, updated, cancelled, reversed, or closed?
5. Which decisions require approval?
6. Which existing market applications solve part of this?
7. What gaps remain in those applications?
8. Which native APIs/connectors exist? (SAP: released APIs on the Business
   Accelerator Hub + `sap.s4.beh.*` events; Oracle backup: Fusion REST/FBDI)
9. What does standard SAP/Oracle already do for this use case, and does SAP
   Joule / embedded Business AI already ship an agent or skill for it?
   (Fit-to-standard: reuse > configure > extend side-by-side > custom.)
10. Which data model extensions are needed?
11. Which UI/UX workbenches are required?
12. Can the resulting design be reused for adjacent use cases (same canonical
    transaction, connectors, and workbenches with different configuration)?

## Research output structure

| Section | Required content |
|---|---|
| Industry process baseline | Standard process, subprocesses, activities, controls |
| Market capability benchmark | SAP/Oracle/Maximo/ServiceNow/leading SaaS capability comparison |
| Pain points | Manual handoffs, duplicate entry, missing approvals, poor reconciliation |
| Gaps | Missing data model, missing integration, missing workflow, poor UX |
| Opportunity | AI-assisted decision support, guided workflow, automation with approval |
| Transaction scope | Objects, actions, states, source-of-record, target systems |
| Risk class | Informational, advisory, controlled side effect, blocked autonomous action |
| MVP scope | Simulator-backed but production-shaped |
| Production scope | Native connector-backed, governed, audited, monitored |
