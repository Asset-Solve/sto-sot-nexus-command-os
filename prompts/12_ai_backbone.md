# Prompt 12 — AI Backbone and Agent Orchestration

Implement model-neutral AI backbone: model gateway, model router, agent orchestrator, prompt registry, skill registry, tool registry, RAG, vector index, policy engine, eval harness, AI audit ledger, and human approval queue.

Agents: solution architect, domain expert, SAP integration, Oracle integration, non-SAP integration, data model, UI/UX, backend, security, testing, DevOps, value case, documentation.

AI cannot post or approve controlled transactions. It can prepare evidence packages and recommendations.

SAP alignment: where the tenant runs SAP Business AI, check first whether Joule agents/skills already cover the job (fit-to-standard applies to AI too). Custom agents built for SAP data should route through the generative AI hub (BTP AI Foundation) and register with SAP's agent governance (AI Agent Hub) rather than calling models around it; this platform's model router, prompt registry, and approval queue remain the control plane for non-SAP scopes.
