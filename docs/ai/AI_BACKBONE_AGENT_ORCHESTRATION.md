# AI Backbone and Agent Orchestration

## AI Backbone Layers

| Layer | Responsibility |
| --- | --- |
| Model gateway | Common interface to OpenAI, Claude, Azure OpenAI, Bedrock, Vertex, SAP AI, local/private models |
| Model router | Select model by task, data class, tenant policy, latency, cost, context, tool capability |
| Agent orchestrator | Decompose work, route specialists, collect evidence, enforce approval gates |
| Tool registry | Approved tools and MCP servers with permissions and mode boundaries |
| Prompt registry | Versioned prompts, prompt tests, prompt owners, stage mapping |
| Skill registry | Reusable procedures loaded only when needed |
| RAG layer | Source-grounded retrieval with citations, access checks, and source trust tier |
| Policy engine | Pre/post tool-call policy, controlled-action blocks, prompt-injection defense |
| Eval harness | Golden cases, hallucination checks, safety checks, regression |
| AI audit ledger | Prompt version, model, sources, tool calls, user, timestamp, output, approval |
| Human approval queue | Controlled AI action packages awaiting review |

## Agent Matrix

| Agent | Scope | Inputs | Outputs | Forbidden actions |
| --- | --- | --- | --- | --- |
| Orchestrator | Task decomposition and quality gate | user request, policies, repo state | plan, assignments, final package | direct ERP writes |
| Domain Research Agent | Market and process research | domain, industry, competitor systems | capability/pain-point report | unsupported claims |
| Fit-To-Standard Agent | Native capability benchmark | use case, ERP target | standard capability and gap report | custom design before benchmark |
| SAP Integration Agent | SAP APIs and BTP architecture | object/action matrix | SAP mapping and risks | direct frontend SAP calls |
| Oracle Integration Agent | Fusion REST/OIC/VB mapping | object/action matrix | Oracle mapping and risks | unsupported writes |
| Non-SAP Integration Agent | Maximo, ServiceNow, historian, OT, WMS | object/action matrix | connector mapping and risks | OT writes by default |
| Data Model Agent | Canonical and physical data model | domain objects | schemas and migrations | mixing master and transactions |
| Workflow Agent | States, approvals, SoD | process model | workflow state model | weakening approvals |
| UI/UX Agent | Transactional screens | screen contracts | route/component specs | fake actions |
| Backend Agent | APIs/services/workers | contracts | code and tests | bypass outbox |
| Security Agent | Threat model and controls | architecture | controls/tests | weakening SoD/RBAC |
| QA Agent | Tests and evidence | workflows/code | validation pack | shallow snapshot-only tests |
| DevOps/SRE Agent | CI/CD/infra/ops | repo/deployment target | pipelines/IaC/runbooks | deploying without gates |

## AI Action Classes

| Class | Examples | Allowed autonomy |
| --- | --- | --- |
| Informational | summarize, explain, search docs, classify low-risk text | AI may answer with citations |
| Advisory | recommend, draft, compare, identify gaps | AI may prepare recommendation with confidence |
| Controlled side effect | create approval package, prepare payload, request replay | Human approval required before execution |
| Blocked autonomous action | approve, post, reverse, payroll, finance, permit, master-data mutation | AI must refuse autonomous execution |

## Evidence Requirements

Every AI-generated recommendation must include:

- Source references.
- Confidence and uncertainty.
- Data classification.
- Model profile and prompt version.
- Tools used.
- Human approval requirement if action class is controlled.
- Audit event ID when persisted.

## Swarm Operating Rules

- Main thread owns stage gates and user decisions.
- Use read-only subagents for research and review.
- Use bounded implementation agents only after stage approval.
- Do not run competing agents against the same files.
- Do not allow tool calls against live ERP systems unless the stage and release gate explicitly allow it.
