# ERP / Enterprise-SaaS Delivery Challenge Register

Every challenge here is a real, documented failure mode from enterprise ERP/SaaS
delivery. Each has a stable ID (`CH-01` … `CH-19`) that the automation engine
references from `orchestrator/pipeline.yaml` (`gate.challenge_refs`) and
`orchestrator/gates/rules.yaml` (`challenge_index`). When a stage names a
challenge, its gate is the control that must be demonstrably in place before the
layer is approved.

## Why this register exists (the numbers)

Enterprise ERP delivery fails far more often than it succeeds, and it fails for
predictable, addressable reasons:

- Only about **23%** of ERP implementations are considered successful, and
  **~74%** of organizations report at least one failed ERP project.
- The **top three causes — inadequate change management, poor data migration,
  and inexperienced teams — account for over 75%** of failures.
- Around **49%** of organizations struggle specifically with data migration;
  programs with strong organizational change management are **~6× more likely**
  to hit their goals.
- **67%** of ERP projects run over schedule and **52%** conclude the project did
  not meet its business objectives; discrete-manufacturing cost overruns average
  **215%**.

The engine's job is to convert these lessons into gates a use case cannot slip
past silently. Sources are listed at the end and in
`AI_DEVELOPMENT_COMPANY_PATTERN_RESEARCH.md`.

## Register

| ID | Challenge | Symptom | Impact | Required control | Stage | Gate / engine check |
| --- | --- | --- | --- | --- | --- | --- |
| CH-01 | Duplicating standard ERP capability | New app rebuilds what SAP/Oracle already do | Cost, upgrade pain, user confusion | Fit-to-standard analysis before build (SAP Activate *Explore*) | 02 | `challenge_refs: CH-01`; FIT_TO_STANDARD artifact required |
| CH-02 | Clean-core violation | Custom code mutates ERP core / uses unreleased objects | Broken upgrades, unsupported system | Side-by-side extension, **released APIs only**, clean-core level A/B, ADR for anything lower | 02, 08 | `generic_connector_without_adr` stop-condition |
| CH-03 | ERP objects treated as local tables | App directly edits ERP-owned master/transaction fields | Data conflicts, reconciliation failure | Object classification (master/transaction/reference) + source-of-record | 06, 07 | `no_source_of_record` stop-condition |
| CH-04 | Write-back assumed, never proven | "We'll POST to SAP later" with no proven API | Late integration collapse | Native write proof per object/action or fallback ADR | 08 | `write_capability_unproven` stop-condition |
| CH-05 | Missing exception / reversal paths | Only the happy path is modeled | Cannot correct, cancel, or close out | Decompose normal + exception + correction + cancellation + reversal + closeout | 05 | PROCESS_DECOMPOSITION artifact required |
| CH-06 | Poor data quality & migration | Unclear ownership, inconsistent standards | #2 cause of ERP failure | Data-quality rules, ownership, migration readiness in the data model | 06 | TRANSACTIONAL_DATA_OBJECT_MODEL required |
| CH-07 | Generic connector misuse | One "SAP/Oracle REST" call bypasses object rules | Unsupported writes, silent corruption | Object-specific released API / OData / event; Integration Suite / OIC route | 08, 09 | connector schema check (Stage 09) |
| CH-08 | Idempotency/outbox/read-back missing | Duplicate or lost postings under failure | Financial/operational errors | Outbox + idempotency key + retry + DLQ + read-back + reconciliation | 10, 16 | `requires_tests: reconciliation` |
| CH-09 | SoD / four-eyes gaps | User self-approves a controlled action | Segregation-of-duties violation | Approval thresholds, four-eyes, delegation, audit | 11 | `controlled_action_without_approval_or_audit` |
| CH-10 | Multi-tenant isolation weakness | Cross-tenant data exposure | SaaS trust failure | Tenant context, RLS, ABAC, isolation tests | 14 | `requires_tests: security`, RLS in build-gates |
| CH-11 | Weak value case / KPI baseline | No measurable baseline or target | Benefits never realized; "did not meet objectives" | Value case + KPI model with baselines | 02 | VALUE_CASE_AND_KPI_MODEL required |
| CH-12 | Brittle point-to-point integration | Tightly coupled sync calls everywhere | Outage cascades on any change | Event-driven decoupling (SAP Event Mesh / async), contract tests | 08, 14 | contract tests; async spec |
| CH-13 | Secrets / auth / classification | Secrets in frontend, broad scopes | Breach, compliance failure | OAuth least-privilege, secret store, data classification | 14, 19 | `frontend_direct_erp` scan; security tests |
| CH-14 | Posted-record immutability | Users edit posted transactions directly | Compliance & audit failure | Correction / reversal / adjustment flows only | 16 | `challenge_refs: CH-14`; reconciliation tests |
| CH-15 | Prompt injection (direct & indirect) | Retrieved/user content hijacks tools | Security breach (OWASP LLM01) | Source-trust policy, tool allow-lists, injection eval tests | 18 | `requires_tests: ai_evals`, security |
| CH-16 | Excessive agency / autonomous writes | AI approves or posts controlled txns | Governance failure (OWASP LLM06) | AI can draft/recommend only; human approves controlled actions | 18 | `ai_autonomous_controlled_write` stop-condition |
| CH-17 | No SLOs / error budgets | Reliability is an opinion, not a number | Unmanaged outages, no priority signal | SLIs/SLOs, error budget = 1 − SLO, OpenTelemetry | 19 | `requires_tests: performance` |
| CH-18 | Runaway AI + cloud cost | Tokens/polling/queues overrun budget | Unsustainable unit economics | FinOps: quotas, budgets, model routing, alerts | 19 | `challenge_refs: CH-18` |
| CH-19 | No backup / DR / rollback | No tested recovery or incident runbooks | Business disruption on incident | Backup, DR, rollback, incident runbooks; DORA reporting | 19, 20 | `manual_undocumented_release_step` stop-condition |

## Designer checklist (run at intake and every architecture review)

- What standard ERP capability already exists (SAP/Oracle/Maximo/ServiceNow)?
- What exact business object is read or written, and who owns each field?
- What action changes business state, and what approval/SoD rule applies?
- What native API / released interface / event proves the action is supported?
- What happens if the target accepts, rejects, times out, duplicates, or
  partially processes the request — and how is status read back and reconciled?
- How is a mismatch corrected or reversed (never edited in place)?
- What must audit prove, and for how long (retention/privacy)?
- What can AI do, and what must it never do autonomously?
- What is the measurable value baseline and target?
- Who owns incidents, reconciliation cases, and cost after go-live?

## How the engine enforces this register

1. Stages declare `challenge_refs` in `pipeline.yaml`.
2. `gates/rules.yaml` maps the hard controls to `stop_conditions`,
   `forbidden_patterns`, and named test suites.
3. `gates/validate.py` runs those checks and writes them into the Stage Gate
   Report, so a challenge cannot be "forgotten" — it is either satisfied,
   explicitly exempted with an ADR, or the gate fails.

## Sources

- ERP failure & data-migration statistics — Godlan; Priority Software; Prosci; ECI; Trax Group; Kanerika (2024–2025).
- SAP clean core / released APIs — SAP Learning, SAP Community ABAP Extensibility Guide, SAP News Center.
- SAP Activate fit-to-standard — SAP; LeanIX; SAP Community.
- SAP Integration Suite (Event Mesh, API Management, iFlows) — SAP Learning; SAP blogs.
- Oracle OIC / Fusion REST patterns — Oracle docs; CloudShine; Apideck.
- OWASP Top 10 for LLM Applications 2025 — OWASP; BSG; Mend; Promptfoo.
- NIST SSDF (SP 800-218) & CISA Secure by Design — NIST CSRC; CISA; Wiz.
- EU DORA — Pentagon Infosec; DVMS Institute.
- Google SRE error budgets; OpenTelemetry — sre.google; OpenTelemetry docs.
