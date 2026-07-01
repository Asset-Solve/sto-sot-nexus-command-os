# Enhancement Engine

A meta-engine that **sequentially executes the enhancement of the pack itself**.
Where `orchestrator/` turns a use case into an application, this turns the raw
pack into the enhanced pack — file by file, gated by acceptance checks.

## How it works

1. `enhancement-plan.yaml` is the program: an ordered list of `items`, each
   targeting a file (`path:`) or a set of files (`glob:`) with a
   research-grounded `brief`, `research_refs`, and `acceptance` criteria.
2. `enhance.py` walks the program in order. For each target it hands an agent
   (Codex/Claude, via the orchestrator's adapters) the current file + brief +
   research + acceptance, the agent rewrites the file in place, and the engine
   verifies acceptance before continuing.
3. Progress is recorded in `enhance-state.json` so runs are resumable and items
   already `status: done` are never clobbered.

## Commands

```bash
python tools/enhance/enhance.py --list           # show the ordered program
python tools/enhance/enhance.py --dry-run        # plan + acceptance, change nothing
python tools/enhance/enhance.py --driver claude  # execute (needs ANTHROPIC_API_KEY)
python tools/enhance/enhance.py --only integration   # subset by id/path
python tools/enhance/enhance.py --resume         # continue after a stop
```

## Acceptance checks

`global_acceptance` (applied to every item) plus each item's `acceptance`:

| Check | Meaning |
| --- | --- |
| `no_leftover_markers` | none of the five tracked authoring-marker keywords |
| `min_bytes: N` | file is at least N bytes (guards against shrinkage) |
| `parses_if_structured` | YAML/JSON still parses |
| `valid_json_schema` | file remains a valid JSON Schema |
| `contains_any: [..]` | at least one anchor phrase present (e.g. "clean core") |
| `contains_all: [..]` | all anchor phrases present |

An item that fails acceptance stops the run (except in dry-run) so you can
inspect before continuing. The whole thing is idempotent.

## Why a separate engine

Enhancement and build are different programs over different targets, but they
share drivers, guardrails, and the dry-run simulator. Keeping them separate lets
you re-enhance the pack (e.g. when a standard updates) without running a build,
and vice-versa.
