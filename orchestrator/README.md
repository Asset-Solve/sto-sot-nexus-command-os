# Enterprise AI ERP Build Engine

This is the automation engine that turns **one input — a use case** — into an
enterprise-grade, SAP/Oracle-integration-ready transactional web application by
driving Codex and Claude through the 21 gated stages (00 → 20) defined in the
prompt pack. You validate each layer at its gate before it proceeds to the next.

```
you: a use case  ──▶  run.py  ──▶  per stage: [ swarm agent(s) ] ─▶ [ programmatic gate ] ─▶ [ your approval ]  ──▶ next stage
```

## What's here

| File | Role |
| --- | --- |
| `pipeline.yaml` | Declarative 00→20 DAG: stages, agent swarm, driver routing, inputs, produced artifacts, and machine-checkable gate criteria. **Single source of truth.** |
| `run.py` | The stage runner CLI. Sequences stages, spawns the driver + agents, runs gates, writes gate reports, pauses for approval, persists state, resumes/repairs. |
| `gates/validate.py` | Programmatic gate validator: artifact presence, JSON-Schema checks, forbidden-pattern scans, ERP stop-conditions, and test/build suites. |
| `gates/rules.yaml` | Data-driven checks: forbidden patterns (hard-coded dropdowns, fake buttons, direct ERP calls), stop-conditions, per-stack test commands, challenge cross-refs. |
| `adapters/` | Pluggable drivers: `codex` (`codex exec`), `claude` (`claude -p`), and `dryrun` (offline simulator). Routing per work type comes from `pipeline.yaml`. |
| `schemas/run-state.schema.json` | Shape of the persisted run state. |
| `state/` | Runtime: `run-state.json`, `approvals.jsonl` (append-only approval ledger). Delete to reset. |

## Install

```bash
pip install -r orchestrator/requirements.txt   # pyyaml, jsonschema
```

For live (non-dry-run) builds, install the agent CLIs and set keys:

```bash
npm i -g @openai/codex @anthropic-ai/claude-code
export CODEX_API_KEY=...        # or OPENAI_API_KEY
export ANTHROPIC_API_KEY=...
```

## The only command you need

```bash
python orchestrator/run.py --use-case "Plant maintenance work-order cockpit integrated with SAP PM"
```

That starts a **guided-gate** run. The engine executes Stage 00, runs the gate,
writes `docs/governance/gate-reports/STAGE_00_GATE_REPORT.md`, and stops for your
approval. Approve and continue:

```bash
python orchestrator/run.py --approve 00 && python orchestrator/run.py --resume
```

### Try it with zero setup (offline)

```bash
python orchestrator/run.py --use-case "Purchase-requisition approval cockpit for SAP MM" \
  --driver dryrun --mode full_auto_draft --yes
python orchestrator/gates/validate.py         # inspect every gate
```

The `dryrun` driver simulates each agent by materialising schema-valid stub
artifacts and the attestation tokens the gates look for, so you can watch the
whole 00→20 flow and the gate machinery without any API keys or network.

## Modes

| Mode | Behaviour |
| --- | --- |
| `guided_gates` *(default)* | Stop after every gate for your validation. This is how you "check each layer before proceeding." |
| `full_auto_draft` | Generate all stages without pausing, but still **hard-stop on any failed gate**. Marks assumptions for review. |
| `repair` | Re-run a single stage: `--stage 16 --mode repair`. |
| `implementation_only` | Skip discovery/design (start at Stage 13). Allowed only when you assert the design gates are already approved. |

## Drivers & routing

`--driver auto` (default) routes each stage to the best surface using
`pipeline.yaml → routing`: long-form product/process/architecture reasoning and
independent review go to **Claude**; repo inspection, code, and tests go to
**Codex**; orchestration/synthesis stays on the main thread. Override globally
with `--driver codex|claude|dryrun`, or per stage via the `driver:` field.

Agents have a **write scope** (path globs). The runner never lets two
write-heavy agents own the same files, honoring the master prompt's concurrency
rule. Live writes require the explicit `--allow-writes` flag (and, for Codex, a
write sandbox flag) so a mis-run can never touch a real ERP.

## What a gate actually checks (automatically)

For the stage's `gate:` block in `pipeline.yaml`:

- **requires_artifacts** — declared docs/specs exist and are non-empty.
- **schema_checks** — e.g. Stage 01 intake validates against
  `schemas/use-case-intake.schema.json`; Stage 09 validates every connector
  against `schemas/connector-definition.schema.json`; Stage 10 asserts the
  canonical-transaction file is itself a valid JSON Schema.
- **forbidden_pattern_rules** — scans the generated app for hard-coded
  dropdowns, fake buttons, and direct-to-ERP frontend calls.
- **stop_conditions** — the ERP no-go rules (no source of record, unproven
  write path, controlled action without approval/audit, autonomous AI writes,
  manual undocumented release steps). Detected by attestation, scan, or test.
- **requires_tests / requires_build** — named suites (`lint`, `unit`,
  `integration`, `contract`, `e2e`, `accessibility`, `security`,
  `reconciliation`, `performance`, `ai_evals`) run with `--run-tests`.

Anything the machine can't decide is surfaced in the gate report for your
judgement. The gate report ends with the exact approve/resume commands.

## Resume, approve, inspect

```bash
python orchestrator/run.py --status              # where am I?
python orchestrator/run.py --approve 07           # record human approval of a gate
python orchestrator/run.py --resume               # continue from last approved
python orchestrator/run.py --stage 16 --mode repair   # redo one stage
python orchestrator/run.py --reset                # clear state, start over
```

## CI

`.github/workflows/erp-build.yml` parses the pipeline/rules/schemas, dry-runs
the whole flow, asserts every gate passes offline, and scans for leftover
markers — no secrets required. A guarded job runs a real Codex stage when
`CODEX_API_KEY` is present.

## Extending

- **New stage / artifact / gate** → edit `pipeline.yaml` only.
- **New forbidden pattern or stop-condition** → edit `gates/rules.yaml` only.
- **New agent surface** → add an adapter in `adapters/` implementing
  `available()` + `run()`, and register it in `adapters/__init__.py`.
