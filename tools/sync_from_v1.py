#!/usr/bin/env python3
"""Materialise the unchanged files from the original pack into this v2 pack.

The v2 pack ships the *enhanced* spine + the new automation engine. Every other
file (prompts 00-20, skills, configs, schemas, api specs, most docs) is
unchanged and lives only in the original ``enterprise_ai_erp_prompt_pack``.
This script copies those over **without overwriting anything v2 already has**,
so the enhancements always win and v2 becomes a complete, self-contained pack.

It is idempotent and safe to run repeatedly. The engine calls it once on the
first run (see run.py::bootstrap_sync); you can also run it directly:

    python tools/sync_from_v1.py            # copy missing files
    python tools/sync_from_v1.py --dry-run  # show what would be copied
    ERP_V1_PACK=/path/to/original python tools/sync_from_v1.py
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

V2_ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "dist", "build"}


def _default_original() -> Path:
    env = os.getenv("ERP_V1_PACK")
    if env:
        return Path(env)
    name = V2_ROOT.name
    original_name = name[:-3] if name.endswith("_v2") else (name + "_original")
    return V2_ROOT.parent / original_name


def sync(original: Path | None = None, dry_run: bool = False, quiet: bool = False) -> int:
    original = Path(original) if original else _default_original()
    if not original.exists():
        if not quiet:
            print(f"[sync] original pack not found at {original}. "
                  f"Set ERP_V1_PACK to its path. Nothing copied.")
        return 0
    copied = 0
    for dirpath, dirnames, filenames in os.walk(original):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            src = Path(dirpath) / name
            rel = src.relative_to(original)
            dst = V2_ROOT / rel
            if dst.exists():
                continue  # v2 enhancement or engine file wins
            if not dry_run:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
            copied += 1
            if not quiet:
                print(f"[sync] {'would copy' if dry_run else 'copied'}: {rel.as_posix()}")
    if not quiet:
        print(f"[sync] {'would copy' if dry_run else 'copied'} {copied} file(s) from {original.name} -> {V2_ROOT.name}")
    return copied


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--original", help="path to the original pack (default: sibling minus _v2)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    sync(args.original, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
