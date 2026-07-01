#!/usr/bin/env python3
"""Static lint for the whole pack (no build required).

Checks:
  1. every *.yaml/*.yml parses
  2. every *.json parses
  3. no leftover authoring markers (TODO/FIXME/TBD/XXX/PLACEHOLDER) in shipped files
Exit non-zero if any check fails. Used by `make lint` and CI.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except Exception:
    yaml = None

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "dist", "build", "state"}
MARKER = re.compile(r"\b(TODO|FIXME|TBD|XXX|PLACEHOLDER)\b")
# files allowed to mention the markers because they *define* the scan
MARKER_ALLOW = {"orchestrator/gates/rules.yaml", "tools/lint_pack.py",
                "tools/enhance/enhance.py", ".github/workflows/erp-build.yml"}


def _iter(root: Path):
    for p in root.rglob("*"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.is_file():
            yield p


def main() -> int:
    problems: list[str] = []
    yaml_n = json_n = 0
    for p in _iter(ROOT):
        rel = p.relative_to(ROOT).as_posix()
        suf = p.suffix.lower()
        if suf in (".yaml", ".yml"):
            yaml_n += 1
            if yaml is None:
                continue
            try:
                yaml.safe_load(p.read_text(encoding="utf-8"))
            except Exception as e:
                problems.append(f"YAML parse error: {rel}: {e}")
        elif suf == ".json":
            json_n += 1
            try:
                json.loads(p.read_text(encoding="utf-8"))
            except Exception as e:
                problems.append(f"JSON parse error: {rel}: {e}")
        if suf in (".md", ".py", ".yaml", ".yml", ".json", ".ts", ".tsx", ".js") and rel not in MARKER_ALLOW:
            for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                if MARKER.search(line):
                    problems.append(f"leftover marker: {rel}:{i}: {line.strip()[:80]}")

    print(f"lint: parsed {yaml_n} yaml + {json_n} json file(s)")
    if problems:
        print(f"lint: {len(problems)} problem(s):")
        for pr in problems:
            print(f"  - {pr}")
        return 1
    print("lint: OK - all parse, no leftover markers")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
