#!/usr/bin/env python3
"""Enhancement engine - sequentially execute the enhancement of the pack.

This is the meta-engine you asked for: it walks `enhancement-plan.yaml` in order
and, for each target file, hands an agent (Codex/Claude) the current file plus a
research-grounded brief and acceptance criteria, rewrites the file in place, and
verifies acceptance before moving on. It records progress so a run is resumable
and never re-touches items already marked done.

    python tools/enhance/enhance.py --list                 # show the program
    python tools/enhance/enhance.py --dry-run              # plan only, no changes
    python tools/enhance/enhance.py --driver claude        # execute enhancements
    python tools/enhance/enhance.py --only integration     # just matching items
    python tools/enhance/enhance.py --resume               # continue where it stopped

It reuses the orchestrator's driver adapters, so the same Codex/Claude routing,
guardrails, and dry-run simulator apply here too.
"""
from __future__ import annotations

import argparse
import glob as globmod
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
PACK_ROOT = HERE.parents[1]
sys.path.insert(0, str(PACK_ROOT / "orchestrator"))

try:
    import yaml  # type: ignore
except Exception:
    yaml = None

MARKER = re.compile(r"\b(TODO|FIXME|TBD|XXX|PLACEHOLDER)\b")
STATE_PATH = HERE / "enhance-state.json"
PLAN_PATH = HERE / "enhancement-plan.yaml"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_plan() -> dict[str, Any]:
    if yaml is None:
        raise SystemExit("pyyaml required: pip install pyyaml")
    return yaml.safe_load(PLAN_PATH.read_text(encoding="utf-8")) or {}


def _load_state() -> dict[str, Any]:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"items": {}}


def _save_state(state: dict[str, Any]) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def resolve_targets(item: dict[str, Any]) -> list[str]:
    if item.get("path"):
        return [item["path"]]
    if item.get("glob"):
        matches = globmod.glob(str(PACK_ROOT / item["glob"]))
        return sorted(Path(m).relative_to(PACK_ROOT).as_posix() for m in matches)
    return []


# ---- acceptance -----------------------------------------------------------
def check_acceptance(path: Path, specs: list[Any]) -> tuple[bool, list[str]]:
    fails: list[str] = []
    text = path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""
    low = text.lower()
    for spec in specs:
        if isinstance(spec, str):
            key, val = spec, None
        elif isinstance(spec, dict):
            key, val = next(iter(spec.items()))
        else:
            continue
        if key == "no_leftover_markers":
            if MARKER.search(text):
                fails.append("leftover marker present")
        elif key == "min_bytes":
            if len(text.encode("utf-8")) < int(val):
                fails.append(f"under {val} bytes")
        elif key == "parses_if_structured":
            suf = path.suffix.lower()
            try:
                if suf in (".yaml", ".yml") and yaml is not None:
                    yaml.safe_load(text)
                elif suf == ".json":
                    json.loads(text)
            except Exception as e:
                fails.append(f"parse error: {e}")
        elif key == "valid_json_schema":
            try:
                from jsonschema.validators import validator_for  # type: ignore
                schema = json.loads(text)
                validator_for(schema).check_schema(schema)
            except Exception as e:
                fails.append(f"invalid JSON Schema: {e}")
        elif key == "contains_any":
            if not any(str(v).lower() in low for v in (val or [])):
                fails.append(f"missing any of {val}")
        elif key == "contains_all":
            missing = [v for v in (val or []) if str(v).lower() not in low]
            if missing:
                fails.append(f"missing all-of {missing}")
    return (not fails), fails


# ---- enhancement task -----------------------------------------------------
def build_handoff(rel: str, item: dict[str, Any], plan: dict[str, Any]) -> str:
    refs = plan.get("references", {})
    ref_lines = [f"- {r}: {refs.get(r, r)}" for r in item.get("research_refs", [])]
    accept = (plan.get("global_acceptance", []) or []) + (item.get("acceptance", []) or [])
    return "\n".join([
        f"Enhance the file `{rel}` in place. Preserve its intent and structure; do NOT shorten it "
        f"below its current depth. Weave in the research below with concrete, source-grounded detail.",
        "",
        "Brief:",
        item.get("brief", "(no brief)"),
        "",
        "Research to apply:" if ref_lines else "",
        *ref_lines,
        "",
        "Acceptance (the enhancement engine will verify these automatically):",
        *[f"- {a}" for a in accept],
        "",
        "Output the complete rewritten file content. Do not add TODO/FIXME/TBD markers.",
    ])


def run_driver(rel: str, item: dict[str, Any], plan: dict[str, Any], driver: str) -> tuple[bool, str]:
    try:
        from adapters import get_adapter, AgentTask  # type: ignore
    except Exception as e:
        return False, f"cannot import adapters ({e}); install deps or use --dry-run"
    adapter = get_adapter(driver, allow_writes=True)
    ok, reason = adapter.available()
    if not ok and driver != "dryrun":
        return False, f"driver '{driver}' unavailable: {reason}"
    task = AgentTask(
        stage_id="ENH", stage_name=item.get("id", rel), agent_id="doc_enhancer",
        surface=driver, mode="enhance", use_case="(pack enhancement pass)",
        prompt_path=rel, handoff_text=build_handoff(rel, item, plan),
        pack_root=PACK_ROOT, workspace=PACK_ROOT,
        produces=[rel], inputs=[rel], allowed_write_globs=[rel],
        context={"stage": {}, "rules": {}, "agent_can_write": True},
    )
    res = adapter.run(task)
    return res.ok, res.summary or (res.error or "")


# ---- main -----------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--driver", default="dryrun", choices=["dryrun", "claude", "codex"])
    ap.add_argument("--only", default=None, help="only items/targets whose id or path contains this substring")
    ap.add_argument("--dry-run", action="store_true", help="print the program, change nothing")
    ap.add_argument("--list", action="store_true", help="list resolved targets and exit")
    ap.add_argument("--resume", action="store_true", help="skip targets already passed")
    args = ap.parse_args(argv)

    plan = _load_plan()
    state = _load_state()
    items = plan.get("items", [])

    # build the ordered work list
    work: list[tuple[dict, str]] = []
    for item in items:
        if item.get("status") == "done":
            continue
        if args.only and args.only not in (item.get("id", "") + " " + (item.get("path") or item.get("glob") or "")):
            continue
        for rel in resolve_targets(item):
            work.append((item, rel))

    if args.list or args.dry_run:
        print(f"Enhancement program: {len(work)} target(s) (driver={args.driver})\n")
        for item, rel in work:
            done = state["items"].get(rel, {}).get("status") == "passed"
            accept = (plan.get("global_acceptance", []) or []) + (item.get("acceptance", []) or [])
            print(f"  [{'done' if done else '   '}] {rel}   (item: {item.get('id')})")
            if args.dry_run:
                print(f"        acceptance: {accept}")
        print("\n(dry-run/list: no files changed)" if (args.dry_run or args.list) else "")
        return 0

    passed = failed = 0
    for item, rel in work:
        target = PACK_ROOT / rel
        if args.resume and state["items"].get(rel, {}).get("status") == "passed":
            continue
        print(f"\n--- enhancing {rel}  (item {item.get('id')}, driver {args.driver}) ---")
        ok, msg = run_driver(rel, item, plan, args.driver)
        print(f"  driver: {'ok' if ok else 'ERROR'}: {msg[:140]}")
        accept = (plan.get("global_acceptance", []) or []) + (item.get("acceptance", []) or [])
        acc_ok, fails = check_acceptance(target, accept)
        status = "passed" if (ok and acc_ok) else "failed"
        state["items"][rel] = {"status": status, "driver": args.driver, "ts": _now(),
                               "acceptance_ok": acc_ok, "acceptance_fails": fails}
        _save_state(state)
        if acc_ok:
            print("  acceptance: PASS")
            passed += 1
        else:
            print(f"  acceptance: FAIL -> {fails}")
            failed += 1
            if args.driver != "dryrun":
                print("  Stopping so you can inspect. Re-run to continue (idempotent).")
                break

    print(f"\nEnhancement pass: {passed} passed, {failed} failed. State: {STATE_PATH.relative_to(PACK_ROOT)}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
