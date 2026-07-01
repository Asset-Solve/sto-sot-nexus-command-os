# Enterprise Layered Architecture

```mermaid
flowchart TB
  UI[Experience Layer: Web GUI, Copilot, Workbenches] --> API[API/BFF Layer]
  API --> Domain[Domain Services]
  Domain --> Workflow[Workflow, Approval, SoD]
  Domain --> Rules[Rules and Posting Path Engine]
  Domain --> Lookup[Lookup Provider]
  Domain --> Outbox[Transactional Outbox]
  Outbox --> Connectors[Connector Registry and Workers]
  Connectors --> SAP[SAP S/4HANA/BTP/APM/WCM/FSM/Ariba]
  Connectors --> Oracle[Oracle Fusion/OIC/VB Studio]
  Connectors --> NonSAP[Maximo, ServiceNow, PI, OPC UA, P6, ESRI]
  Domain --> Data[Operational DB, Audit, Read Models]
  API --> AI[AI Gateway, Model Router, Agents, RAG]
  AI --> Tools[Tool Registry and MCP]
  Data --> Obs[Logs, Metrics, Traces, Audit Evidence]
```

## Minimum production layers

| Layer | Mandatory capability |
|---|---|
| Frontend | Role-aware app shell, route guards, accessible components, no secrets |
| API | Tenant context, correlation ID, auth, validation, OpenAPI |
| Domain | Aggregates, invariants, lifecycle states, transaction services |
| Workflow | Approval, SoD, assignment, escalation, e-signature if needed |
| Rules | Validation, defaulting, derivation, posting path, fallback policy |
| Connectors | Object-aware, simulator/sandbox/live, idempotent, audited |
| Data | RLS, audit ledger, outbox, idempotency, read models |
| AI | Model router, agent policies, source grounding, evals, audit |
| Security | RBAC, ABAC, RLS, data classification, secrets, policy engine |
| Observability | OTel traces, structured logs, alerts, DLQ metrics, AI quality metrics |
| DevSecOps | CI/CD, IaC, environment promotion, rollback, DR, runbooks |
