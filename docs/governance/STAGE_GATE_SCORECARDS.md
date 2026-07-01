# Stage Gate Scorecards

Use this file at the end of every stage in `EXECUTION_SEQUENCE_00_TO_20.md`. In
the automated engine, `orchestrator/gates/validate.py` fills the **Automated**
column for you and writes it into `docs/governance/gate-reports/STAGE_NN_GATE_REPORT.md`;
you adjudicate the **Human judgement** column and then `--approve`.

## Scoring

Score each criterion `0`–`3`:

- `0`: missing or unsafe
- `1`: partially addressed, material risk remains
- `2`: adequate for this stage
- `3`: strong, evidence-backed, low ambiguity

Decision:

- `proceed`: no blocker, all critical criteria score ≥ 2, and **all automated
  hard checks pass**.
- `revise`: fixable gaps remain (or an automated hard check failed).
- `stop`: continuation would create product, ERP, security, compliance, or
  delivery risk (or a `stop_condition` fired).

## Universal criteria (human judgement)

| Criterion | Question |
| --- | --- |
| Objective met | Did the stage produce the required artifact? |
| Evidence | Are claims backed by files, research, source docs, tests, or explicit assumptions? |
| Traceability | Can decisions trace to use case, requirement, risk, data object, process, or control? |
| ERP safety | Are source-of-record, lifecycle, approval, audit, and integration implications visible? |
| Testability | Can the next stage verify the output? |
| Human reviewability | Can a solution designer challenge the artifact quickly? |

## Critical gates by stage

The **Automated** column is what the engine enforces mechanically; the
**Human judgement** column is what you must still confirm.

| Stage | Automated (engine) | Human judgement | Challenges |
| --- | --- | --- | --- |
| 00 | Ack + assumptions artifacts exist; `generic_crud`/`dashboard_only`/`frontend_direct_erp` scans clean | Agent truly accepts the transactional contract | — |
| 01 | Intake validates against `use-case-intake.schema.json` | Outcome, persona, process scope, write-back class are right | — |
| 02 | Fit-to-standard + value-case artifacts exist | Extension is justified vs standard ERP; KPI baselines real | CH-01, CH-02, CH-11 |
| 03 | `hardcoded_dropdown`/`fake_button`/`frontend_direct_erp`/`mock_default` scans | Existing debt is understood and routed | — |
| 04 | Capability model + matrix exist | Capabilities map to personas, KPIs, owners | — |
| 05 | Process decomposition exists | Normal + exception + reversal + closeout paths present | CH-05 |
| 06 | Transactional data-object model exists | Master/transaction/reference/audit/AI-evidence separated | CH-03, CH-06 |
| 07 | SoR register + write-policy exist; `no_source_of_record` attested | Every controlled field has a real owner + policy | CH-03 |
| 08 | Native integration matrix exists; `write_capability_unproven` attested | Each write is proven native or has a fallback ADR | CH-04, CH-07, CH-12 |
| 09 | `connector-registry.yaml` validates against connector schema | Connector claims are testable and mode-specific | CH-07 |
| 10 | Canonical-transaction file is a valid JSON Schema | Idempotency/outbox/target-refs/reconciliation first-class | CH-08 |
| 11 | Workflow + approval artifacts exist; `controlled_action_without_approval_or_audit` attested | SoD, thresholds, delegation, overrides testable | CH-09 |
| 12 | Screen contract catalog exists; `screen_without_backend_action` scan | Every field → lookup+source; every button → backend | — |
| 13 | `install`+`typecheck`+`health_check` build | Skeleton reflects the approved layered architecture | — |
| 14 | `unit`+`integration`+`contract`+`security` tests | Tenant context, RLS, audit, idempotency, outbox enforced | CH-10, CH-13 |
| 15 | `hardcoded_dropdown`/`mock_default` scans; contract tests | No governed lookup uses mock values in production UI | — |
| 16 | `unit`+`integration`+`contract`+`reconciliation` tests | Draft→post→read-back→reconcile→reverse all real | CH-08, CH-14 |
| 17 | `fake_button` scan; `e2e`+`accessibility` tests | UI proves real backend behavior, not visuals | — |
| 18 | `ai_evals`+`security`; autonomous-write + grounding stop-conditions | AI grounded, cited, injection-resistant, non-autonomous | CH-15, CH-16 |
| 19 | `performance`+`security`; `manual_undocumented_release_step` attested | SLOs/error budgets, OTel, FinOps, DR/rollback exist | CH-17, CH-18, CH-19 |
| 20 | Full suite (lint→ai_evals); release-decision + evidence artifacts | Evidence proves Go / Go-with-exceptions / No-go | all |

## Gate report template

The engine emits this automatically; edit the human sections before approving.

```md
# Stage NN Gate Report: <stage name>

Decision: proceed | revise | stop
Confidence: low | medium | high
Automated checks: pass=.. fail=.. warn=.. skip=.. (score 0-100)

## Scores (human)

| Criterion | Score | Evidence | Gap |
| --- | ---: | --- | --- |

## Artifacts Produced
- <artifact>

## Automated Gate Checks
- <pass/fail/warn per check, from validate.py>

## Top Risks
- <risk, impact, mitigation, owner>

## Open Questions
- <question, owner, blocking?>

## Recommendation
<one paragraph; then: python orchestrator/run.py --approve NN && ... --resume>
```
