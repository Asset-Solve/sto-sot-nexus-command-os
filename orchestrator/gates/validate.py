#!/usr/bin/env python3
"""Programmatic stage-gate validator for the Enterprise AI ERP build engine.

Runs the *automated* portion of a stage gate so the human only has to adjudicate
judgement calls, not mechanics:

  * required artifacts exist and are non-empty
  * JSON-Schema checks (whole-file, frontmatter, list-each, meta-schema)
  * forbidden-pattern scans (hard-coded dropdowns, fake buttons, direct ERP calls)
  * ERP stop-conditions (attestation / scan / test)
  * required build + test suites

Returns a GateResult that ``run.py`` serialises into a Stage NN Gate Report.

Only the standard library is required. ``pyyaml`` and ``jsonschema`` are used when
present and degrade to clear, non-crashing findings when absent.

CLI:
    python orchestrator/gates/validate.py --stage 07 [--run-tests] [--json]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# ---- optional dependencies (guarded) ---------------------------------------
try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None

try:
    import jsonschema  # type: ignore
    from jsonschema.validators import validator_for  # type: ignore
except Exception:  # pragma: no cover
    jsonschema = None
    validator_for = None

PACK_ROOT_DEFAULT = Path(__file__).resolve().parents[2]
STATUS_ORDER = {"pass": 0, "skip": 1, "warn": 2, "fail": 3}


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------
@dataclass
class Check:
    id: str
    kind: str                 # artifact | schema | forbidden | stop | test
    status: str               # pass | fail | warn | skip
    detail: str = ""
    evidence: list[str] = field(default_factory=list)


@dataclass
class GateResult:
    stage_id: str
    stage_name: str
    passed: bool = True
    score: float = 0.0        # 0..100 (informational; hard gates are boolean)
    ran_at: str = ""
    checks: list[Check] = field(default_factory=list)

    def add(self, check: Check) -> None:
        self.checks.append(check)
        if check.status == "fail":
            self.passed = False

    def summary(self) -> dict[str, int]:
        out = {"pass": 0, "fail": 0, "warn": 0, "skip": 0}
        for c in self.checks:
            out[c.status] = out.get(c.status, 0) + 1
        return out

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["summary"] = self.summary()
        return d


# ---------------------------------------------------------------------------
# Context
# ---------------------------------------------------------------------------
@dataclass
class Context:
    pack_root: Path
    workspace: Path
    stack: str = "typescript"
    rules: dict[str, Any] = field(default_factory=dict)
    build_gates: dict[str, Any] = field(default_factory=dict)
    run_tests: bool = False   # when False, test suites are reported as 'skip'
    test_timeout: int = 1800


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    if yaml is None:
        return {}
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def _expand_braces(pattern: str) -> list[str]:
    """Expand a single {a,b,c} group (sufficient for our glob patterns)."""
    m = re.search(r"\{([^{}]*)\}", pattern)
    if not m:
        return [pattern]
    pre, post = pattern[: m.start()], pattern[m.end():]
    out: list[str] = []
    for opt in m.group(1).split(","):
        out.extend(_expand_braces(pre + opt + post))
    return out


def _glob_to_regex(pattern: str) -> re.Pattern[str]:
    """Translate a brace-free glob (with ** and *) to an anchored regex."""
    i, n, out = 0, len(pattern), []
    while i < n:
        c = pattern[i]
        if pattern.startswith("**/", i):
            out.append(r"(?:.*/)?")
            i += 3
        elif pattern.startswith("**", i):
            out.append(r".*")
            i += 2
        elif c == "*":
            out.append(r"[^/]*")
            i += 1
        elif c == "?":
            out.append(r"[^/]")
            i += 1
        else:
            out.append(re.escape(c))
            i += 1
    return re.compile("^" + "".join(out) + "$")


def _compile_globs(patterns: Iterable[str]) -> list[re.Pattern[str]]:
    regexes: list[re.Pattern[str]] = []
    for p in patterns or []:
        for expanded in _expand_braces(p):
            regexes.append(_glob_to_regex(expanded))
    return regexes


def _iter_files(root: Path, includes: list[str], excludes: list[str]) -> Iterable[Path]:
    inc = _compile_globs(includes)
    exc = _compile_globs(excludes)
    if not root.exists():
        return
    for dirpath, dirnames, filenames in os.walk(root):
        # prune noisy dirs early
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", "dist", "build", ".venv"}]
        for name in filenames:
            fp = Path(dirpath) / name
            rel = fp.relative_to(root).as_posix()
            if inc and not any(rx.match(rel) for rx in inc):
                continue
            if exc and any(rx.match(rel) for rx in exc):
                continue
            yield fp


# ---------------------------------------------------------------------------
# Individual check families
# ---------------------------------------------------------------------------
def check_artifacts(stage: dict, ctx: Context, res: GateResult) -> None:
    for rel in stage.get("gate", {}).get("requires_artifacts", []) or []:
        path = ctx.pack_root / rel
        if not path.exists():
            res.add(Check(f"artifact:{rel}", "artifact", "fail", "missing"))
        elif path.stat().st_size < 8:
            res.add(Check(f"artifact:{rel}", "artifact", "fail", "empty"))
        else:
            res.add(Check(f"artifact:{rel}", "artifact", "pass", f"{path.stat().st_size} bytes"))


def _extract_instances(path: Path, mode: str) -> tuple[list[Any], str | None]:
    """Return (instances, error). Mode: json | frontmatter_json | yaml_each:KEY | __meta_schema__ | json_meta."""
    text = _read(path)
    if mode == "json" or mode == "__meta_schema__":
        try:
            return [json.loads(text)], None
        except Exception as exc:
            return [], f"not valid JSON: {exc}"
    if mode == "frontmatter_json":
        # try a ```json fenced block first, then --- yaml frontmatter ---
        fence = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence:
            try:
                return [json.loads(fence.group(1))], None
            except Exception as exc:
                return [], f"fenced json invalid: {exc}"
        fm = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
        if fm and yaml is not None:
            try:
                return [yaml.safe_load(fm.group(1))], None
            except Exception as exc:
                return [], f"frontmatter invalid: {exc}"
        return [], "no ```json block or --- frontmatter --- found"
    if mode.startswith("yaml_each:"):
        key = mode.split(":", 1)[1]
        if yaml is None:
            return [], "pyyaml not installed"
        try:
            data = yaml.safe_load(text) or {}
        except Exception as exc:
            return [], f"yaml invalid: {exc}"
        seq = data.get(key, [])
        if isinstance(seq, dict):
            seq = list(seq.values())
        return list(seq), None
    return [], f"unknown extract mode: {mode}"


def check_schemas(stage: dict, ctx: Context, res: GateResult) -> None:
    for spec in stage.get("gate", {}).get("schema_checks", []) or []:
        rel = spec.get("file")
        schema_rel = spec.get("schema")
        mode = spec.get("extract", "json")
        target = ctx.pack_root / rel
        cid = f"schema:{rel}"
        if not target.exists():
            res.add(Check(cid, "schema", "fail", "instance file missing"))
            continue
        instances, err = _extract_instances(target, mode)
        if err:
            res.add(Check(cid, "schema", "fail", err))
            continue
        if jsonschema is None:
            res.add(Check(cid, "schema", "skip", "jsonschema not installed (pip install jsonschema)"))
            continue
        # meta-schema mode: the target must itself be a valid JSON Schema
        if schema_rel == "__meta_schema__":
            try:
                cls = validator_for(instances[0])
                cls.check_schema(instances[0])
                res.add(Check(cid, "schema", "pass", "valid JSON Schema"))
            except Exception as exc:
                res.add(Check(cid, "schema", "fail", f"invalid JSON Schema: {exc}"))
            continue
        schema_path = ctx.pack_root / schema_rel
        if not schema_path.exists():
            res.add(Check(cid, "schema", "fail", f"schema file missing: {schema_rel}"))
            continue
        try:
            schema = json.loads(_read(schema_path))
        except Exception as exc:
            res.add(Check(cid, "schema", "fail", f"schema not valid JSON: {exc}"))
            continue
        validator = validator_for(schema)(schema)
        errors: list[str] = []
        for idx, inst in enumerate(instances):
            for e in validator.iter_errors(inst):
                loc = "/".join(str(p) for p in e.path)
                errors.append(f"[{idx}] {loc or '<root>'}: {e.message}")
        if errors:
            res.add(Check(cid, "schema", "fail", f"{len(errors)} error(s)", evidence=errors[:20]))
        else:
            res.add(Check(cid, "schema", "pass", f"{len(instances)} instance(s) valid"))


def scan_forbidden(rule_id: str, ctx: Context) -> tuple[list[str], dict | None]:
    rule = (ctx.rules.get("forbidden_patterns", {}) or {}).get(rule_id)
    if not rule:
        return [], None
    includes = rule.get("include", [])
    excludes = rule.get("exclude", [])
    tag = rule.get("justification_tag")
    compiled = [re.compile(p) for p in rule.get("patterns", [])]
    hits: list[str] = []
    for fp in _iter_files(ctx.pack_root, includes, excludes):
        lines = _read(fp).splitlines()
        for lineno, line in enumerate(lines, 1):
            if tag and tag in line:
                continue
            for rx in compiled:
                if rx.search(line):
                    rel = fp.relative_to(ctx.pack_root).as_posix()
                    hits.append(f"{rel}:{lineno}: {line.strip()[:120]}")
                    break
    return hits, rule


def check_forbidden(stage: dict, ctx: Context, res: GateResult) -> None:
    for rule_id in stage.get("gate", {}).get("forbidden_pattern_rules", []) or []:
        hits, rule = scan_forbidden(rule_id, ctx)
        severity = (rule or {}).get("severity", "block")
        cid = f"forbidden:{rule_id}"
        if not hits:
            res.add(Check(cid, "forbidden", "pass", "no matches"))
        elif severity == "warn":
            res.add(Check(cid, "forbidden", "warn", f"{len(hits)} match(es)", evidence=hits[:20]))
        else:
            res.add(Check(cid, "forbidden", "fail", f"{len(hits)} match(es)", evidence=hits[:20]))


def _attestation_present(ctx: Context, artifact: str, token: str) -> bool:
    return token in _read(ctx.pack_root / artifact)


def check_stop_conditions(stage: dict, ctx: Context, res: GateResult) -> None:
    conds = ctx.rules.get("stop_conditions", {}) or {}
    for cond_id in stage.get("gate", {}).get("stop_conditions", []) or []:
        spec = conds.get(cond_id)
        cid = f"stop:{cond_id}"
        if not spec:
            res.add(Check(cid, "stop", "skip", "no rule definition"))
            continue
        detect = spec.get("detect")
        if detect == "attestation":
            ok = _attestation_present(ctx, spec.get("artifact", ""), spec.get("attest_line", ""))
            res.add(Check(cid, "stop", "pass" if ok else "fail",
                          spec["description"] + ("" if ok else f" (missing attestation '{spec.get('attest_line')}' in {spec.get('artifact')})")))
        elif detect == "scan":
            hits, _ = scan_forbidden(spec.get("scan_rule", ""), ctx)
            res.add(Check(cid, "stop", "fail" if hits else "pass",
                          spec["description"] + (f" ({len(hits)} hit(s))" if hits else ""),
                          evidence=hits[:10]))
        elif detect == "test":
            _run_named_test(spec.get("test", ""), ctx, res, prefix="stop", label=cond_id)
        else:
            res.add(Check(cid, "stop", "skip", f"unknown detect '{detect}'"))


def _run_named_test(name: str, ctx: Context, res: GateResult, prefix: str = "test", label: str | None = None) -> None:
    cid = f"{prefix}:{label or name}"
    stack_tests = (ctx.rules.get("tests", {}) or {}).get(ctx.stack, {}) or {}
    if stack_tests.get("_attest_only") == "true":
        res.add(Check(cid, "test", "skip", f"{name}: stack '{ctx.stack}' is attest-only"))
        return
    cmd = stack_tests.get(name)
    if not cmd:
        res.add(Check(cid, "test", "skip", f"no command mapped for '{name}' in stack '{ctx.stack}'"))
        return
    cmd = cmd.replace("{workspace}", str(ctx.workspace))
    if not ctx.run_tests:
        res.add(Check(cid, "test", "skip", f"dry-run (would run: {cmd})"))
        return
    try:
        proc = subprocess.run(cmd, shell=True, cwd=str(ctx.pack_root),
                              capture_output=True, text=True, timeout=ctx.test_timeout)
    except subprocess.TimeoutExpired:
        res.add(Check(cid, "test", "fail", f"timeout after {ctx.test_timeout}s: {cmd}"))
        return
    except Exception as exc:
        res.add(Check(cid, "test", "fail", f"could not launch: {exc}"))
        return
    if proc.returncode == 0:
        res.add(Check(cid, "test", "pass", cmd))
    else:
        tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-8:]
        res.add(Check(cid, "test", "fail", f"exit {proc.returncode}: {cmd}", evidence=tail))


def check_tests(stage: dict, ctx: Context, res: GateResult) -> None:
    gate = stage.get("gate", {})
    wanted: list[str] = []
    wanted += gate.get("requires_build", []) or []
    wanted += gate.get("requires_tests", []) or []
    for name in wanted:
        _run_named_test(name, ctx, res)


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def validate_stage(stage: dict, ctx: Context) -> GateResult:
    res = GateResult(stage_id=stage.get("id", "?"),
                     stage_name=stage.get("name", ""),
                     ran_at=datetime.now(timezone.utc).isoformat())
    check_artifacts(stage, ctx, res)
    check_schemas(stage, ctx, res)
    check_forbidden(stage, ctx, res)
    check_stop_conditions(stage, ctx, res)
    check_tests(stage, ctx, res)
    total = len(res.checks) or 1
    passed = sum(1 for c in res.checks if c.status in ("pass", "skip"))
    res.score = round(100.0 * passed / total, 1)
    return res


def load_pipeline(pack_root: Path, pipeline_rel: str = "orchestrator/pipeline.yaml") -> dict:
    return _load_yaml(pack_root / pipeline_rel)


def build_context(pack_root: Path, workspace: Path, stack: str, run_tests: bool) -> Context:
    return Context(
        pack_root=pack_root,
        workspace=workspace,
        stack=stack,
        rules=_load_yaml(pack_root / "orchestrator/gates/rules.yaml"),
        build_gates=_load_yaml(pack_root / "config/build-gates.yaml"),
        run_tests=run_tests,
    )


def _main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Validate one or all stage gates.")
    ap.add_argument("--stage", help="stage id, e.g. 07. Omit to validate all.")
    ap.add_argument("--pack-root", default=str(PACK_ROOT_DEFAULT))
    ap.add_argument("--workspace", default=None, help="generated app root (default: <pack>/build)")
    ap.add_argument("--stack", default="typescript")
    ap.add_argument("--run-tests", action="store_true", help="actually execute test suites (default dry-run)")
    ap.add_argument("--json", action="store_true", help="emit JSON")
    args = ap.parse_args(argv)

    pack_root = Path(args.pack_root).resolve()
    workspace = Path(args.workspace).resolve() if args.workspace else (pack_root / "build")
    pipeline = load_pipeline(pack_root)
    if not pipeline:
        print("ERROR: could not load orchestrator/pipeline.yaml (is pyyaml installed?)", file=sys.stderr)
        return 2
    ctx = build_context(pack_root, workspace, args.stack, args.run_tests)

    stages = pipeline.get("stages", [])
    if args.stage:
        stages = [s for s in stages if str(s.get("id")) == str(args.stage)]
        if not stages:
            print(f"ERROR: stage {args.stage} not found", file=sys.stderr)
            return 2

    results = [validate_stage(s, ctx) for s in stages]
    overall_ok = all(r.passed for r in results)

    if args.json:
        print(json.dumps({"passed": overall_ok, "stages": [r.to_dict() for r in results]}, indent=2))
    else:
        for r in results:
            s = r.summary()
            flag = "PASS" if r.passed else "FAIL"
            print(f"[{flag}] Stage {r.stage_id} {r.stage_name}  "
                  f"(pass={s['pass']} fail={s['fail']} warn={s['warn']} skip={s['skip']}, score={r.score})")
            for c in r.checks:
                if c.status in ("fail", "warn"):
                    print(f"    - {c.status.upper():4} {c.id}: {c.detail}")
                    for ev in c.evidence[:5]:
                        print(f"        · {ev}")
    return 0 if overall_ok else 1


if __name__ == "__main__":
    raise SystemExit(_main())
