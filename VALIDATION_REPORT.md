# Validation Report - v2 Enhancement & Automation Engine

Validation date: 2026-07-01.

## Scope Reviewed

- `orchestrator/`: pipeline manifest, runner CLI, gate validator, rules, adapters, state schema, requirements.
- `tools/enhance/`: enhancement meta-engine and plan.
- `tools/sync_from_v1.py`: one-time materialization of unchanged v1 files.
- `.github/workflows/erp-build.yml`: CI validation flow.
- Spine docs: master prompt, execution sequence, research doc, README.
- Governance and AI docs: challenge register, scorecards, swarm runbook.
- Structured files: schemas, build gates, connector registry.

## Runtime Validation Actually Executed

Executed on Windows using a local `.venv` created from the bundled Codex Python runtime.

Commands run:

```powershell
.\.venv\Scripts\python.exe tools\sync_from_v1.py
.\.venv\Scripts\python.exe tools\lint_pack.py
.\.venv\Scripts\python.exe tools\enhance\enhance.py --list
.\.venv\Scripts\python.exe orchestrator\run.py --reset
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "Plant maintenance work-order cockpit integrated with SAP PM" --driver dryrun --mode full_auto_draft --yes --workspace .\build
.\.venv\Scripts\python.exe orchestrator\gates\validate.py --json
.\.venv\Scripts\python.exe tools\lint_pack.py
```

Results:

- Sync copied 56 unchanged source files from the original pack into v2, making v2 self-contained.
- Lint passed: all YAML and JSON parsed, no leftover authoring markers.
- Enhancement engine listed its ordered target set successfully.
- Offline dry-run completed all stages 00 through 20.
- All 21 stage gates passed after dry-run.
- Stage 09 connector registry schema check passed with 9 connector entries.
- Generated sample-run artifacts were cleaned before repository creation.

## Defects Found And Fixed During Review

1. `orchestrator/adapters/dryrun.py` referenced `_PLACEHOLDER_STR`, but only `_STUB_STR` existed.
   - Impact: dry-run could fail while generating schema skeletons.
   - Fix: changed fallback return to `_STUB_STR`.

2. `orchestrator/gates/rules.yaml` had invalid YAML for the `reconciliation` test key in both TypeScript and Java mappings.
   - Impact: lint, gate validation, and orchestrator runs failed before any gate could execute.
   - Fix: added the required key/value spacing.

3. Dry-run skipped existing non-empty artifacts, so attestation-based gates could fail when synced source docs already existed.
   - Impact: Stage 18 failed because `docs/ai/AI_BACKBONE_AGENT_ORCHESTRATION.md` existed but lacked the dry-run gate attestation token.
   - Fix: dry-run now preserves existing files and appends missing dry-run attestation tokens only when needed.

4. Runtime-generated dry-run artifacts would have polluted the repository if committed.
   - Impact: the repo would start with sample SAP PM gate artifacts instead of a clean first-run state.
   - Fix: generated artifacts were cleaned and `.gitignore` now excludes runtime state, build output, virtualenvs, and generated gate reports.

## Structural Validation

- `EXECUTION_SEQUENCE_00_TO_20.md` and `orchestrator/pipeline.yaml` are aligned to stages 00 through 20.
- Pipeline dependencies force domain, process, data, source-of-record, integration, workflow, and screen-contract gates before implementation stages.
- Codex and Claude routing is declared in `pipeline.yaml` and supported by adapters.
- The challenge register CH-01 through CH-19 is referenced by stage gates.
- `config/connector-registry.yaml` conforms to `schemas/connector-definition.schema.json` through the Stage 09 gate.

## How To Reconfirm

```powershell
cd enterprise_ai_erp_prompt_pack_v2
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r orchestrator\requirements.txt
.\.venv\Scripts\python.exe tools\lint_pack.py
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "Purchase-requisition approval cockpit for SAP MM" --driver dryrun --mode full_auto_draft --yes
.\.venv\Scripts\python.exe orchestrator\gates\validate.py
```

Expected:

- lint OK
- dry-run walks stages 00 to 20
- all stage gates pass

## Known Limitations

- Live `codex` and `claude` drivers still depend on the respective CLIs, authentication, and vendor flag compatibility.
- Real build/test gates for a generated application require a generated workspace with matching `package.json` scripts or stack-specific commands.
- Dry-run proves orchestration mechanics, schemas, and gate wiring; it does not prove production ERP integration.

