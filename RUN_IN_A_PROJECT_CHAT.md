# Run In A Project Chat Or Folder (no Python engine)

This is **Track B**: instead of running the Python engine, you drop the use case
and the relevant pack files into a per-project AI chat or folder (Claude Project,
a Cowork folder, ChatGPT/Codex project, or Claude Code) and have the assistant
extract the inputs and walk the 21 gated stages conversationally. Same stages,
same gates, same artifacts — just driven by chat and your approvals instead of a
CLI.

> Track A (the deterministic Python engine) is in `HOW_TO_RUN_A_USE_CASE.md`.
> You can use both: run Track B to produce the artifacts, then optionally run the
> engine's `orchestrator/gates/validate.py` over them for a machine gate-check.

---

## Which variant are you in?

**Variant 1 — folder / file-access** (Cowork folder, Claude Code, Codex on the
repo, or a Claude Project with the whole pack in its knowledge). The assistant can
read every pack file itself, so you attach nothing per stage — you just point it
at the pack and paste the use case. **Recommended.**

**Variant 2 — paste-only chat** (a plain chat with no file access, limited
context). You paste the governing files up front and then paste each stage's
prompt/template when you reach that stage.

---

## Step 1 — Create the project and give it the pack

- **Variant 1:** open the project on the pack folder
  (`enterprise_ai_erp_prompt_pack_v2`) or add the whole folder to the project's
  knowledge. Nothing else to attach.
- **Variant 2:** attach the **governing spine** to the project so it's always in
  context:
  - `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`  (rules, lifecycle, gate format)
  - `EXECUTION_SEQUENCE_00_TO_20.md`  (the 21 stages + what each produces)
  - `docs/governance/STAGE_GATE_SCORECARDS.md`
  - `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md`
  - `KICKOFF_PROMPT.md`

Keep **one project per use case** — the chat history *is* the run state, so
mixing use cases in one chat causes cross-contamination.

## Step 2 — Kick it off

Paste the block from `KICKOFF_PROMPT.md`, fill in the two blanks (your use case,
and how the assistant can see the pack), and send. The assistant starts at Stage
00.

Your **one input** is the same as Track A: a one-paragraph use case naming the
capability, personas, process scope, the systems of record (e.g. SAP S/4HANA PM /
Oracle Fusion), the expected write-backs, and the risk class. (Full input
template is in `HOW_TO_RUN_A_USE_CASE.md` §1.)

## Step 3 — Work the stage loop

For each stage the assistant will: state the objective → produce the stage's
artifacts → emit a **Gate Report** → **stop**. Then you:

1. **Read the gate report** (Decision, Risks, Open Questions, Recommendation).
2. **Save the artifacts.** In Variant 1 the assistant writes them to the pack
   paths itself; in Variant 2 copy each artifact into the folder at the path the
   sequence names (e.g. `docs/domain/USE_CASE_INTAKE.md`).
3. **Answer any blocking question** the report lists.
4. **Reply with one word/action:**
   - `approve` → it proceeds to the next stage.
   - `revise <your notes>` → it redoes this stage and re-issues the gate.
   - `stop` → it halts and summarizes.

Scrutinize (don't rubber-stamp) the same high-stakes gates as Track A: **02**
fit-to-standard, **07** source-of-record, **08** write-back proof, **11**
SoD/approvals, **18** AI-can't-post-autonomously, **20** release Go/No-go.

## Step 4 (Variant 2 only) — feed each stage's prompt when you reach it

Because a paste-only chat has limited context, attach the current stage's prompt
(and its template) as you go. Map:

| Stage(s) | Attach this prompt | Plus template / spec |
| --- | --- | --- |
| 00 | `prompts/00_permanent_rules.md` | — |
| 01–02 | `prompts/01_use_case_ideation_research.md` | `docs/domain/USE_CASE_RESEARCH_WORKFLOW.md` |
| 03 | `templates/SCREEN_GAP_AUDIT_TEMPLATE.md` | — |
| 04–05 | `prompts/02_domain_process_model.md` | `docs/domain/PROCESS_DECOMPOSITION_TEMPLATE.md`, `FUNCTIONAL_CAPABILITY_MATRIX_TEMPLATE.md` |
| 06–07 | `prompts/03_data_object_model.md` | `docs/domain/DATA_MODEL_CANONICAL_ERP_TEMPLATE.md` |
| 08 | `prompts/04_native_integration_matrix.md` | `docs/integration/SAP_ORACLE_NATIVE_INTEGRATION_MATRIX.md` |
| 09 | `prompts/06_connector_registry.md` | `config/connector-registry.yaml`, `schemas/connector-definition.schema.json` |
| 10 | `prompts/08_canonical_transaction_model.md` | `schemas/canonical-transaction.schema.json` |
| 11 | `prompts/09_workflow_approval_audit.md` | `config/rbac-matrix.yaml` |
| 12 | `prompts/11_uiux_transactional_workbenches.md` | `docs/screens/TRANSACTIONAL_SCREEN_CONTRACT_TEMPLATE.md`, `UI_UX_SCREEN_BLUEPRINTS.md` |
| 13 | `prompts/05_repo_architecture_skeleton.md` | `docs/architecture/ENTERPRISE_LAYERED_ARCHITECTURE.md` |
| 14–16 | `prompts/16_transaction_service_implementation.md` | `prompts/10_outbox_readback_reconciliation.md`, `prompts/07_lookup_services.md` (Stage 15) |
| 17 | `prompts/17_ui_implementation_and_verification.md` | — |
| 18 | `prompts/18_ai_backbone_governance.md` | `docs/ai/AI_BACKBONE_AGENT_ORCHESTRATION.md`, `config/model-router.yaml` |
| 19 | `prompts/19_production_readiness_operating_model.md` | `docs/security/PRODUCTION_READINESS_CHECKLIST.md`, `docs/operations/OPERATING_MODEL_AND_RUNBOOKS.md` |
| 20 | `prompts/20_acceptance_release_evidence.md` | — |

(In Variant 1 you skip this table entirely — the assistant reads these itself.)

## Step 5 — Continuing later or in a fresh chat

If the chat gets long or you resume the next day, use the **Re-entry prompt** at
the bottom of `KICKOFF_PROMPT.md`: state the last approved stage, re-share (or
point to) the approved artifacts, and tell it to resume at the next stage.

## Optional — machine-check the artifacts with the engine

Track B produces the same artifacts Track A does. Once you've saved them into the
pack folder, you can run the engine's validator over them for an objective gate
check (no AI calls needed):

```powershell
.\.venv\Scripts\python.exe orchestrator\gates\validate.py
```

It reports, per stage, whether the required artifacts exist, schemas validate,
and no forbidden patterns / stop-conditions are present — a useful second opinion
on the chat's self-assessment.

---

## Track A vs Track B — which to use

| | Track A — Python engine | Track B — project chat |
| --- | --- | --- |
| You run | `orchestrator/run.py` | a paste-in chat |
| Gates | enforced programmatically | assistant self-reports; validate.py optional |
| Best for | repeatable, auditable, CI, teams | quick starts, exploration, no-CLI users |
| Your input | the use case (+ `a` at each gate) | the use case (+ `approve` at each gate) |
| Artifacts | written to `docs/` + `./build` | written by the assistant or saved by you |

Same use case, same stages, same gate discipline — pick whichever fits how you
like to work, and you can switch mid-build.
