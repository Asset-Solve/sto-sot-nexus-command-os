#!/usr/bin/env python3
"""Enterprise AI ERP build engine - stage runner.

Give it ONE thing (a use case). It drives Codex/Claude/a swarm through the
21 gated stages defined in ``orchestrator/pipeline.yaml``, runs a programmatic
gate after each stage, writes a Stage NN Gate Report, and - in guided mode -
stops for you to validate the layer before it proceeds.

Quick start
-----------
    # offline dry-run of the whole flow (no API keys, no network):
    python orchestrator/run.py --use-case "Plant maintenance work-order cockpit for SAP PM" --driver dryrun --yes

    # real run, guided gates, auto-routing Codex/Claude per stage:
    export CODEX_API_KEY=...   ANTHROPIC_API_KEY=...
    python orchestrator/run.py --use-case-file my_use_case.md

    # resume after approving a gate:
    python orchestrator/run.py --approve 07 && python orchestrator/run.py --resume

    # re-run a single stage (repair mode):
    python orchestrator/run.py --stage 16 --mode repair
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
PACK_ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from adapters import get_adapter, resolve_adapter_name, AgentTask       # noqa: E402
from gates.validate import (                                            # noqa: E402
    load_pipeline, build_context, validate_stage, GateResult, _load_yaml,
)

DEFAULT_FORBIDDEN = [
    "Proceed outside the stage scope",
    "Edit files outside your owned write globs",
    "Trigger live ERP writes without approval, outbox, idempotency and read-back",
    "Let AI autonomously approve or post controlled transactions",
]


# ---------------------------------------------------------------------------
# state
# ---------------------------------------------------------------------------
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state(path: Path) -> dict[str, Any]:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"run_id": None, "use_case": None, "mode": None, "stack": None,
            "driver": None, "created_at": None, "stages": {}}


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def append_ledger(path: Path, entry: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# gate report
# ---------------------------------------------------------------------------
def write_gate_report(pack_root: Path, reports_dir: str, result: GateResult,
                      decision: str, confidence: str, stage: dict, use_case: str) -> Path:
    d = pack_root / reports_dir
    d.mkdir(parents=True, exist_ok=True)
    out = d / f"STAGE_{result.stage_id}_GATE_REPORT.md"
    s = result.summary()
    lines = [
        f"# Stage {result.stage_id} Gate Report: {result.stage_name}",
        "",
        f"Decision: {decision}",
        f"Confidence: {confidence}",
        f"Generated: {result.ran_at}",
        f"Automated checks: pass={s['pass']} fail={s['fail']} warn={s['warn']} skip={s['skip']} (score {result.score})",
        "",
        "## Use Case",
        (use_case or "").strip() or "(not recorded)",
        "",
        "## Artifacts",
    ]
    for p in stage.get("produces", []) or []:
        exists = (pack_root / p).exists()
        lines.append(f"- [{'x' if exists else ' '}] {p}")
    lines += ["", "## Automated Gate Checks"]
    for c in result.checks:
        lines.append(f"- {c.status.upper()} `{c.id}` ({c.kind}): {c.detail}")
        for ev in c.evidence[:8]:
            lines.append(f"    - {ev}")
    lines += ["", "## Risks / Open Findings"]
    fails = [c for c in result.checks if c.status in ("fail", "warn")]
    if fails:
        for c in fails:
            lines.append(f"- {c.status.upper()} {c.id}: {c.detail}")
    else:
        lines.append("- None flagged by automated checks. Human review still required for judgement items.")
    challenge_refs = stage.get("gate", {}).get("challenge_refs", [])
    if challenge_refs:
        lines += ["", "## Challenge Register Coverage",
                  "See docs/governance/ERP_DELIVERY_CHALLENGE_REGISTER.md: " + ", ".join(challenge_refs)]
    lines += ["", "## Recommendation",
              _recommendation(result, decision),
              "", "---",
              "_Human approver: reply `approve`, `revise`, or `stop`. "
              "Approve with:_ `python orchestrator/run.py --approve " + result.stage_id + " && python orchestrator/run.py --resume`",
              ""]
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


def _recommendation(result: GateResult, decision: str) -> str:
    if not result.passed:
        return ("REVISE - one or more hard automated checks failed. Fix the findings above "
                "(or add a justified exemption / ADR) and re-run this stage before proceeding.")
    if decision == "proceed":
        return "PROCEED - automated checks pass. Confirm the judgement items, then continue to the next stage."
    return "Awaiting human validation of the layer before proceeding."


# ---------------------------------------------------------------------------
# task construction
# ---------------------------------------------------------------------------
def agent_write_scope(pipeline: dict, agent_id: str) -> list[str]:
    for a in pipeline.get("agents", []) or []:
        if a.get("id") == agent_id:
            return a.get("write_scope", []) or []
    return []


def build_task(stage: dict, agent_id: str, adapter_name: str, args, use_case: str,
               pack_root: Path, workspace: Path, pipeline: dict) -> AgentTask:
    handoff = (
        f"Execute stage {stage['id']} ({stage['name']}). Read the stage prompt and every listed input, "
        f"reuse approved prior-stage artifacts, and write ONLY the declared produce paths within your owned "
        f"write scope. Target stack: {args.stack}. End with a gate report (Decision/Confidence/Artifacts/"
        f"Evidence/Risks/Open Questions/Recommendation). Respect all Non-Negotiable Rules and ERP no-go "
        f"stop conditions in MASTER_ENTERPRISE_AI_ERP_BUILD_PROMPT.md."
    )
    return AgentTask(
        stage_id=stage["id"],
        stage_name=stage["name"],
        agent_id=agent_id,
        surface=adapter_name,
        mode=args.mode,
        use_case=use_case,
        prompt_path=stage.get("prompt", ""),
        handoff_text=handoff,
        pack_root=pack_root,
        workspace=workspace,
        produces=stage.get("produces", []) or [],
        inputs=stage.get("inputs", []) or [],
        allowed_write_globs=agent_write_scope(pipeline, agent_id),
        forbidden_actions=DEFAULT_FORBIDDEN,
        context={"stage": stage, "rules": _load_yaml(pack_root / "orchestrator/gates/rules.yaml"),
                 "agent_can_write": True},
    )


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def stage_int(sid: str) -> int:
    try:
        return int(sid)
    except Exception:
        return 999


def deps_satisfied(stage: dict, state: dict) -> tuple[bool, list[str]]:
    missing = []
    for dep in stage.get("depends_on", []) or []:
        st = state["stages"].get(dep, {}).get("status")
        if st != "approved":
            missing.append(dep)
    return (not missing), missing


def bootstrap_sync(pack_root: Path) -> None:
    """Materialise unchanged files from the original pack, if the sync tool exists."""
    sync = pack_root / "tools" / "sync_from_v1.py"
    if not sync.exists():
        return
    marker = pack_root / "orchestrator" / "state" / ".synced"
    if marker.exists():
        return
    try:
        sys.path.insert(0, str(pack_root / "tools"))
        import sync_from_v1  # type: ignore
        n = sync_from_v1.sync(quiet=True)
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(f"synced {n} files at {_now()}\n", encoding="utf-8")
        print(f"[bootstrap] synced {n} unchanged file(s) from the original pack into v2")
    except Exception as exc:
        print(f"[bootstrap] sync skipped: {exc}")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--use-case", help="the ONE input: a one-paragraph use case")
    ap.add_argument("--use-case-file", help="path to a file containing the use case")
    ap.add_argument("--mode", default=None, choices=["guided_gates", "full_auto_draft", "repair", "implementation_only"])
    ap.add_argument("--driver", default=None, choices=["auto", "codex", "claude", "dryrun"])
    ap.add_argument("--stack", default=None, choices=["typescript", "java", "agnostic"])
    ap.add_argument("--workspace", default=None, help="generated app root (default <pack>/build)")
    ap.add_argument("--pack-root", default=str(PACK_ROOT))
    ap.add_argument("--from-stage", default=None, help="start at this stage id")
    ap.add_argument("--to-stage", default=None, help="stop after this stage id")
    ap.add_argument("--stage", default=None, help="run exactly one stage (repair)")
    ap.add_argument("--resume", action="store_true", help="continue from the last approved stage")
    ap.add_argument("--approve", default=None, help="record human approval for a stage gate, then exit")
    ap.add_argument("--yes", action="store_true", help="auto-approve any gate that passes (full-auto style)")
    ap.add_argument("--non-interactive", action="store_true", help="never prompt; stop at each gate for external approval")
    ap.add_argument("--allow-writes", action="store_true", help="permit live agents to write code (Codex/Claude)")
    ap.add_argument("--run-tests", action="store_true", help="actually execute test suites at gates")
    ap.add_argument("--status", action="store_true", help="print run state and exit")
    ap.add_argument("--reset", action="store_true", help="clear run state and exit")
    args = ap.parse_args(argv)

    pack_root = Path(args.pack_root).resolve()
    pipeline = load_pipeline(pack_root)
    if not pipeline:
        print("ERROR: cannot load orchestrator/pipeline.yaml (need pyyaml: pip install pyyaml).", file=sys.stderr)
        return 2
    settings = pipeline.get("settings", {})
    defaults = pipeline.get("defaults", {})
    state_path = pack_root / settings.get("run_state", "orchestrator/state/run-state.json")
    ledger_path = pack_root / settings.get("approvals_ledger", "orchestrator/state/approvals.jsonl")
    reports_dir = settings.get("gate_reports_dir", "docs/governance/gate-reports")

    state = load_state(state_path)

    if args.reset:
        save_state(state_path, {"run_id": None, "use_case": None, "mode": None, "stack": None,
                                "driver": None, "created_at": None, "stages": {}})
        print("Run state cleared.")
        return 0

    if args.status:
        print(json.dumps(state, indent=2))
        return 0

    if args.approve:
        sid = args.approve
        st = state["stages"].setdefault(sid, {})
        st["status"] = "approved"
        st["approved_at"] = _now()
        save_state(state_path, state)
        append_ledger(ledger_path, {"ts": _now(), "event": "human_approval", "stage": sid})
        print(f"Recorded approval for stage {sid}. Continue with: python orchestrator/run.py --resume")
        return 0

    # resolve run config (CLI > existing state > pipeline defaults)
    mode = args.mode or state.get("mode") or defaults.get("mode", "guided_gates")
    driver = args.driver or state.get("driver") or defaults.get("driver", "auto")
    stack = args.stack or state.get("stack") or defaults.get("stack", "typescript")
    workspace = Path(args.workspace).resolve() if args.workspace else (pack_root / defaults.get("workspace", "build")).resolve()
    args.mode, args.stack = mode, stack

    use_case = None
    if args.use_case_file:
        use_case = Path(args.use_case_file).read_text(encoding="utf-8").strip()
    elif args.use_case:
        use_case = args.use_case.strip()
    elif state.get("use_case"):
        use_case = state["use_case"]

    if not use_case and not (args.resume or args.stage):
        print("ERROR: provide the use case with --use-case or --use-case-file (that is the only input needed).",
              file=sys.stderr)
        return 2

    # (re)initialise run
    if not state.get("run_id"):
        state.update({
            "run_id": datetime.now().strftime("run-%Y%m%d-%H%M%S"),
            "use_case": use_case, "mode": mode, "stack": stack, "driver": driver,
            "created_at": _now(), "stages": {},
        })
    else:
        state["use_case"] = use_case or state["use_case"]
        state["mode"], state["driver"], state["stack"] = mode, driver, stack
    save_state(state_path, state)

    if settings.get("bootstrap_sync_from_v1"):
        bootstrap_sync(pack_root)

    stages = sorted(pipeline.get("stages", []), key=lambda s: stage_int(s["id"]))

    # select which stages to run
    def selected(s: dict) -> bool:
        sid = stage_int(s["id"])
        if args.stage is not None:
            return s["id"] == args.stage
        if mode == "implementation_only" and sid < 13 and not args.from_stage:
            return False
        if args.from_stage and sid < stage_int(args.from_stage):
            return False
        if args.to_stage and sid > stage_int(args.to_stage):
            return False
        if args.resume and state["stages"].get(s["id"], {}).get("status") == "approved":
            return False
        return True

    interactive = sys.stdin.isatty() and not args.non_interactive and not args.yes

    print(f"\n=== Enterprise AI ERP Build Engine ===")
    print(f"run_id={state['run_id']}  mode={mode}  driver={driver}  stack={stack}")
    print(f"use case: {(use_case or state.get('use_case') or '')[:140]}\n")

    ran_any = False
    for stage in stages:
        if not selected(stage):
            continue
        sid = stage["id"]
        ok, missing = deps_satisfied(stage, state)
        if not ok and args.stage is None and mode != "repair":
            print(f"[stage {sid}] blocked: needs approved gates for {missing}. Stopping.")
            break

        ran_any = True
        print(f"\n----- Stage {sid}: {stage['name']} -----")
        adapter_name = resolve_adapter_name(stage, pipeline, driver)
        adapter = get_adapter(adapter_name, allow_writes=args.allow_writes)
        avail, reason = adapter.available()
        print(f"driver: {adapter_name} ({reason})")
        if not avail and adapter_name != "dryrun":
            print(f"[stage {sid}] driver '{adapter_name}' unavailable: {reason}")
            print("  Fix the driver, or use --driver dryrun to simulate. Stopping.")
            state["stages"].setdefault(sid, {})["status"] = "blocked"
            save_state(state_path, state)
            return 3

        agent_results = []
        for agent_id in stage.get("agents", ["orchestrator"]):
            task = build_task(stage, agent_id, adapter_name, args, state["use_case"],
                              pack_root, workspace, pipeline)
            res = adapter.run(task)
            agent_results.append((agent_id, res))
            flag = "ok" if res.ok else "ERROR"
            print(f"  agent {agent_id} [{adapter_name}] -> {flag}: {res.summary[:100]}")
            if not res.ok:
                print(f"    {res.error}")

        # programmatic gate
        ctx = build_context(pack_root, workspace, stack, run_tests=args.run_tests)
        gate = validate_stage(stage, ctx)
        decision = "proceed" if gate.passed else "revise"
        confidence = "high" if gate.passed and not any(c.status == "warn" for c in gate.checks) else "medium"
        report = write_gate_report(pack_root, reports_dir, gate, decision, confidence, stage, state["use_case"])
        sm = gate.summary()
        print(f"  gate: {'PASS' if gate.passed else 'FAIL'} "
              f"(pass={sm['pass']} fail={sm['fail']} warn={sm['warn']} skip={sm['skip']}, score={gate.score})")
        print(f"  report: {report.relative_to(pack_root)}")

        st = state["stages"].setdefault(sid, {})
        st.update({"gate_passed": gate.passed, "score": gate.score, "ran_at": _now(),
                   "driver": adapter_name, "report": str(report.relative_to(pack_root))})
        append_ledger(ledger_path, {"ts": _now(), "event": "gate", "stage": sid,
                                    "passed": gate.passed, "score": gate.score,
                                    "summary": sm, "driver": adapter_name})

        if not gate.passed:
            st["status"] = "gate_failed"
            save_state(state_path, state)
            print(f"\n[stage {sid}] HARD GATE FAILED. Fix findings in the report and re-run this stage "
                  f"(--stage {sid}). Stopping.")
            return 1

        # gate passed -> approval handling
        if mode == "full_auto_draft" or args.yes:
            st["status"] = "approved"
            st["approved_at"] = _now()
            st["approval"] = "auto"
            save_state(state_path, state)
            print(f"  gate approved automatically ({'full_auto' if mode=='full_auto_draft' else '--yes'}).")
            continue

        if interactive:
            ans = input(f"  Approve stage {sid} and proceed? [a=approve / r=revise / s=stop]: ").strip().lower()
            if ans.startswith("a"):
                st["status"] = "approved"; st["approved_at"] = _now(); st["approval"] = "human"
                append_ledger(ledger_path, {"ts": _now(), "event": "human_approval", "stage": sid})
                save_state(state_path, state)
                continue
            st["status"] = "awaiting_approval" if ans.startswith("s") else "revise_requested"
            save_state(state_path, state)
            print(f"\nStopped at stage {sid} ({st['status']}). "
                  f"Review {report.relative_to(pack_root)}.")
            return 0

        # non-interactive guided: stop for external approval
        st["status"] = "awaiting_approval"
        save_state(state_path, state)
        print(f"\nStage {sid} gate PASSED and is awaiting your approval.")
        print(f"Review {report.relative_to(pack_root)}, then:")
        print(f"  python orchestrator/run.py --approve {sid} && python orchestrator/run.py --resume")
        return 0

    if not ran_any:
        print("Nothing to run (all selected stages already approved, or selection empty).")
    else:
        print("\n=== Run paused/complete. Current status: ===")
        for stage in stages:
            st = state["stages"].get(stage["id"], {})
            print(f"  {stage['id']}  {stage['name'][:44]:44}  {st.get('status','pending')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
