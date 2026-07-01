# Migration & Sync — how v2 relates to your original pack

Your original pack is **untouched**. The enhancements and the new automation
engine live in this sibling folder:

```
Enterprise Ready Apps/
├─ enterprise_ai_erp_prompt_pack/       ← your original (unchanged)
└─ enterprise_ai_erp_prompt_pack_v2/    ← this pack: enhancements + engine
```

## What v2 contains right now

v2 ships the **new** and **enhanced** files directly:

- The automation engine — `orchestrator/` (pipeline, runner, gates, adapters, CI).
- The enhancement meta-engine — `tools/enhance/` + `tools/sync_from_v1.py` + `tools/lint_pack.py`.
- Rewritten spine — `MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md`, `EXECUTION_SEQUENCE_00_TO_20.md`, `AI_DEVELOPMENT_COMPANY_PATTERN_RESEARCH.md`, `README.md`.
- Rewritten governance/AI docs — `docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md`, `docs/governance/STAGE_GATE_SCORECARDS.md`, `docs/ai/CODEX_CLAUDE_AGENT_SWARM_RUNBOOK.md`.
- `Makefile`, `.github/workflows/erp-build.yml`, `VALIDATION_REPORT.md`, this file.

The **unchanged** files from the original (prompts 00–20, the Claude/Codex
skills, `docs/domain/*`, `docs/screens/*`, `docs/integration/*`, `config/*`,
`schemas/*`, `api/*`, `templates/*`, `plugins/*`) are brought over by a one-time
sync so v2 becomes a complete, self-contained pack.

## Complete the pack (one command)

```bash
cd enterprise_ai_erp_prompt_pack_v2
python tools/sync_from_v1.py         # copies every original file NOT already in v2
```

`sync_from_v1.py` never overwrites a file that already exists in v2, so the
enhanced versions always win. It is idempotent — safe to run repeatedly.

You don't have to run it manually: the engine calls it automatically on the first
`run.py` invocation (`bootstrap_sync_from_v1: true` in `pipeline.yaml`), writing a
`orchestrator/state/.synced` marker so it only happens once.

If your original pack is not the default sibling name, point the sync at it:

```bash
ERP_V1_PACK="/full/path/to/enterprise_ai_erp_prompt_pack" python tools/sync_from_v1.py
```

## After you've reviewed v2

- To adopt v2 as your working pack, simply use this folder going forward.
- To fold v2 back into the original, copy the new/enhanced files over — or keep
  both and diff them. OneDrive retains version history on the original either way.

## Enhance the remaining files further (optional)

The rewritten spine is done. To push research-grounded depth into the rest
(prompts, skills, integration/security/testing/operations docs), run the
enhancement meta-engine:

```bash
python tools/enhance/enhance.py --list          # see the ordered program
python tools/enhance/enhance.py --dry-run       # plan only, no changes
python tools/enhance/enhance.py --driver claude # execute (needs ANTHROPIC_API_KEY)
```

It walks `tools/enhance/enhancement-plan.yaml` in order, enhancing each file
against a research-grounded brief and verifying acceptance before moving on.
