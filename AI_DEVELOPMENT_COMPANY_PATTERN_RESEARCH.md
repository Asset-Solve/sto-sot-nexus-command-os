# How Industry-Leading Companies Turn Use Cases Into Enterprise-Grade SaaS — Patterns, Challenges, and the Automation This Pack Encodes

This document is the research spine of the pack. It explains, with sources, how
leading enterprise application companies convert a raw use case into a
production-grade, SAP/Oracle-integration-ready SaaS product; where those programs
break; and how the automation engine in `orchestrator/` encodes the counter-
measures as gates. It is deliberately opinionated: every pattern here maps to a
stage in `EXECUTION_SEQUENCE_00_TO_20.md` and a control in
`docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md`.

## 1. The uncomfortable baseline: most enterprise ERP delivery fails

Before choosing patterns, internalize why this is hard. Independent 2024–2025
analyses converge on the same picture: only around **23%** of ERP
implementations are judged successful, and roughly **74%** of organizations have
lived through at least one failed ERP project. The failures are not mysterious.
The **top three causes — inadequate change management, poor data migration, and
inexperienced teams — account for more than 75%** of them. About **49%** of
organizations struggle specifically with data migration, and programs with
strong organizational change management are **~6× more likely** to meet their
goals. Schedule and value outcomes are similarly sobering: **67%** overrun
schedule, **52%** conclude the system did not meet business objectives, and
discrete-manufacturing cost overruns average **215%**.

The lesson the leading firms have absorbed is that **the risk is concentrated
before a line of UI is written** — in framing, fit-to-standard, data ownership,
and integration proof — and that these are exactly the things a "move fast, build
screens" workflow skips. This pack front-loads those decisions into gated stages
00–12 and refuses to build screens (Stage 12+) until they pass.

## 2. The delivery model leading enterprise-app companies actually use

Whether it is a systems integrator delivering S/4HANA or a modern product studio
shipping a vertical SaaS, the mature delivery model is **capability-led and
fit-to-standard-first**, not screen-led. SAP's own methodology, **SAP Activate**,
structures every implementation into **Discover → Prepare → Explore → Realize →
Deploy → Run**, and its center of gravity is the **Explore** phase, where
**fit-to-standard workshops** confirm how much of the need the standard product
already meets and expose the true gaps before anyone commits to building. This is
the single most important cultural difference between programs that succeed and
programs that overrun: successful teams treat "should we build this at all?" as a
gate, not an afterthought.

This pack mirrors that model. Stage 01 frames the use case; Stage 02 runs
market and **fit-to-standard** research and produces a value case with KPI
baselines; Stages 04–12 model capabilities, processes, data, source-of-record,
integration, transactions, workflow, and screen contracts — all before
implementation (Stages 13–17). The engine's `guided_gates` mode makes each of
those a human-validated checkpoint.

## 3. SAP integration reality: clean core, released APIs, and the Integration Suite

The fastest way to destroy an enterprise SaaS product's future is to integrate
with SAP the wrong way. SAP's **clean core** strategy classifies every
customization into levels (broadly **A–D**) by upgrade-safety and API compliance.
Level A/B extensions use **only released public APIs, BAdIs, or ABAP RAP
extension points** governed by stability contracts and discoverable in the **SAP
Business Accelerator Hub**; lower levels touch internal objects and carry upgrade
and support risk. Extensions come in two shapes: **on-stack** (key-user or
developer extensions inside S/4HANA) and **side-by-side** on **SAP BTP**, which
decouples business logic from the core and is generally preferred for public-
cloud compatibility.

Integration itself flows through the **SAP Integration Suite**: **Cloud
Integration** (where **iFlows** implement A2A/B2B patterns with routing, mapping,
and error handling), **API Management** (securing and publishing APIs), **Open
Connectors** (pre-built SaaS connectors), **Integration Advisor**, and **Event
Mesh** for asynchronous, publish/subscribe, event-driven decoupling. The
architectural takeaway the pack enforces: prefer **object-specific released APIs
and event-driven decoupling** over generic REST calls and tight point-to-point
coupling (challenges CH-02, CH-07, CH-12). Stage 08's native integration matrix
must prove a supported write path per object/action, or record a fallback ADR;
the engine blocks on `write_capability_unproven` and `generic_connector_without_adr`.

## 4. Oracle integration reality: OIC, Fusion REST, and disciplined error handling

Oracle Fusion follows the same discipline through different tools. Robust Fusion
integrations pair the **REST APIs** with **Oracle Integration Cloud (OIC)** and a
consistent production loop: **OAuth-based authentication with least-privilege
scopes, careful API versioning, intelligent pagination, and defensive error
handling**. The canonical resilient pattern is **scope-level fault handlers, an
exponential-backoff retry loop, a dead-letter/parking pattern, and idempotency
keys built from business identifiers to prevent duplicates on retry** — with
correlation IDs, timeouts, and observability dashboards around it. Governance
adds **safe promotion (dev → test → prod) gated by automated checks and human
approvals**, snapshots before risky changes, peer review, and monitoring on
business identifiers with alerting on failed instances and SLA breaches.

This is precisely the transaction-safety contract the pack's canonical
transaction model (Stage 10) and transaction service (Stage 16) implement:
**payload preview → outbox → idempotency key → retry → DLQ → target document
capture → read-back → reconciliation → audit** (challenge CH-08). The engine
requires `reconciliation` tests at those gates.

## 5. AI-agent development patterns: what to build, and what to avoid

The pack is explicitly an **AI + Codex/Claude** delivery system, so it adopts the
now-standard vocabulary from Anthropic's **Building Effective Agents**, which
distinguishes composable **workflow patterns** from open-ended agents and argues
for **simplicity, transparency, and a well-crafted agent–computer interface**.
Five patterns matter here:

- **Prompt chaining** — sequential steps where each output feeds the next, *with
  gates between steps to validate intermediate results*. This is the backbone of
  the 00→20 pipeline.
- **Routing** — a classifier directs work to a specialized handler. The engine's
  `routing` table sends reasoning/research to Claude and repo/code/tests to Codex.
- **Parallelization** — independent read-only research/review agents fan out
  (Stage 02 and Stage 08 run integration agents in parallel).
- **Orchestrator–workers** — a central agent decomposes a task, delegates to
  workers, and synthesizes; subtasks are not pre-defined. This is the
  Orchestrator + specialist-swarm model in the master prompt.
- **Evaluator–optimizer** — one agent generates, another critiques in a loop.
  The pack uses independent **challenge/review agents** (Transaction Safety, UI
  Reality, AI Governance reviewers) as evaluators at gates.

The engine treats these as *plumbing with checkpoints*, not autonomy: gates are
deterministic, agents are bounded, and the human approves each layer.

### Codex and Claude as headless, automatable surfaces

Both surfaces now support unattended operation, which is what makes a true
automation engine possible. **Codex** runs headless via `codex exec`, streaming
progress to stderr and the final message to stdout, with `--json` for a parseable
JSONL event stream, and authenticates in CI with `CODEX_API_KEY` (or the official
`openai/codex-action`). **Claude Code** runs headless with `-p/--print`, isolates
subagent context, and is governed by three deterministic controls for unattended
runs: **which tools it may use (`--allowedTools`/`--disallowedTools`), a
non-interactive permission mode, and hooks (`PreToolUse`/`PostToolUse`) that can
veto a call.** The pack's adapters (`orchestrator/adapters/{codex,claude}.py`)
wrap exactly these mechanisms and default risky, write-enabling flags to *off*.

## 6. Securing an AI-integrated enterprise app: OWASP-LLM, SSDF, and DORA

Adding AI widens the attack surface, and the pack encodes the current consensus
controls. The **OWASP Top 10 for LLM Applications (2025)** keeps **Prompt
Injection (LLM01)** at the top — including **indirect** injection where the model
ingests untrusted content from documents, tickets, emails, or repositories — and
adds **Excessive Agency (LLM06)**, where an agent is granted more tools,
permissions, or autonomy than its task needs. The pack's non-negotiable rule that
**AI may draft, classify, summarize, map, and recommend but never autonomously
approve or post controlled ERP/finance/safety transactions** is the direct
counter to LLM06 (challenge CH-16), enforced by the `ai_autonomous_controlled_write`
stop-condition; grounding, citations, and injection-resistance are enforced via
`ai_evals` (CH-15).

Underneath the AI layer sits standard secure-SDLC practice. **NIST SSDF
(SP 800-218)** organizes secure development into **Prepare the Organization (PO),
Protect the Software (PS), Produce Well-Secured Software (PW), and Respond to
Vulnerabilities (RV)**, and is the backbone that **CISA's Secure by Design**
initiative points procurement toward. For regulated (especially EU financial)
deployments, the **Digital Operational Resilience Act (DORA)**, in force since
**10 January 2025**, mandates ICT risk management, third-party risk governance,
and incident reporting on tight timelines (**24 hours** for initial critical
notification, **72 hours** for major-incident detail). Stage 19's production-
readiness checklist maps items to SSDF practice groups, OWASP, and DORA.

## 7. Reliability and cost as first-class gates: SRE and FinOps

Enterprise buyers evaluate reliability numerically. **Google SRE** defines an
**error budget as `1 − SLO`** — a 99.9% SLO permits 0.1% errors — and uses
**error-budget policies** to convert "we should focus on reliability" from an
opinion into an organizational rule: when the budget is exhausted, reliability
work outranks features. Those SLIs are fed by telemetry, and **OpenTelemetry**
(traces, metrics, logs; the Collector's **spanmetrics** connector deriving
metrics from traces) is the vendor-neutral way to produce them. On the economics
side, **FinOps** disciplines (quotas, budgets, model routing, alerting) keep AI
tokens, polling, queues, and connector calls from destroying unit economics
(challenge CH-18). Stage 19 requires SLOs/error budgets, OpenTelemetry
instrumentation, and FinOps controls; the engine gates it with `performance` and
`security` suites.

## 8. Mapping research → stages → engine controls

| Research theme | Pack stage(s) | Engine control |
| --- | --- | --- |
| Fit-to-standard first (SAP Activate) | 02 | fit-to-standard artifact; CH-01/02/11 |
| Clean core, released APIs (SAP) | 02, 08 | `generic_connector_without_adr` stop |
| Native write proof (SAP/Oracle) | 08 | `write_capability_unproven` stop |
| OIC/Fusion resilient loop | 10, 16 | `reconciliation` tests; CH-08 |
| Event-driven decoupling (Event Mesh) | 08, 14 | contract tests; async spec |
| Anthropic agent patterns | all | pipeline `routing`, orchestrator swarm |
| Codex/Claude headless | all | `orchestrator/adapters/*` |
| OWASP LLM01/LLM06 | 18 | `ai_autonomous_controlled_write`; `ai_evals` |
| NIST SSDF / CISA / DORA | 19, 20 | production-readiness + release evidence |
| SRE error budgets / OTel / FinOps | 19 | `performance`; CH-17/18/19 |

## 9. Annotated bibliography

- **ERP failure & data-migration statistics (2024–2025)** — Godlan "ERP
  Implementation Failure Statistics"; Priority Software "12 Reasons"; Prosci "Why
  Do ERP Implementations Fail"; ECI "$2M mistake / 70%"; Trax Group "ERP Data
  Migration Problems"; Kanerika "Top 10 Data Migration Risks."
- **SAP clean core & extensibility** — SAP Learning "Clean Core Extensibility";
  SAP Community "ABAP Extensibility Guide – Clean Core (Aug 2025)"; SAP News
  Center "Extend SAP S/4HANA Cloud the Right Way."
- **SAP Activate / fit-to-standard** — SAP "Activate Methodology"; LeanIX
  Activate wiki (Discover/Explore); SAP Community "Explore Phase: Fit-to-Standard."
- **SAP Integration Suite** — SAP Learning "API Management, Event Mesh, Cloud
  Integration"; SAP blogs "Resilient APIs"; SAP-PRESS "Inside the Architecture."
- **Oracle OIC / Fusion REST** — Oracle "Fusion Cloud Application Integration
  Reference"; CloudShine "OIC in Oracle Fusion"; Apideck / Rollout Fusion API
  guides.
- **Anthropic agent patterns** — Anthropic "Building Effective Agents"
  (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-
  optimizer); Cloudflare "anthropic-patterns."
- **Codex CLI (headless)** — OpenAI Developers "Non-interactive mode / codex
  exec / CLI reference"; `openai/codex-action`.
- **Claude Code (headless, subagents, hooks)** — Claude Code Docs "Create custom
  subagents"; headless/`-p` and hooks guides.
- **OWASP LLM Top 10 (2025)** — OWASP; BSG; Mend; Promptfoo; Aembit summaries.
- **NIST SSDF & CISA Secure by Design** — NIST CSRC SP 800-218 (and 1.2 draft);
  CISA Secure-by-Design; Wiz SSDF academy.
- **EU DORA** — Pentagon Infosec DORA vs NIST; DVMS Institute DORA guidance.
- **Google SRE & OpenTelemetry** — sre.google workbook (error-budget policy,
  implementing SLOs); OpenTelemetry Collector spanmetrics.

Full URLs accompany the summary in the chat thread that generated this pass and
in each source's canonical documentation. Treat every figure above as a directional,
sourced benchmark rather than a guarantee for any single program.
