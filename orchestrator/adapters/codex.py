#!/usr/bin/env python3
"""Codex CLI adapter - drives ``codex exec`` in non-interactive (headless) mode.

Codex ``exec`` runs a single session to completion without human interaction,
streams progress to stderr and prints the final agent message to stdout. With
``--json`` stdout becomes a JSONL event stream. For CI, authenticate with an API
key (``CODEX_API_KEY`` / ``OPENAI_API_KEY``) rather than browser auth.
Ref: https://developers.openai.com/codex/noninteractive

The exact flag set differs across Codex versions, so the base command is
configurable via the ``CODEX_CMD`` environment variable (space-separated).
Live code-writing runs require explicitly enabling Codex's write sandbox; keep
that behind an opt-in flag so a mis-run can never touch a real ERP.
"""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from .base import Adapter, AgentTask, AdapterResult

DEFAULT_CMD = ["codex", "exec", "--json", "--skip-git-repo-check"]


class CodexAdapter(Adapter):
    name = "codex"

    def __init__(self, timeout: int = 3600, allow_writes: bool = False) -> None:
        self.timeout = timeout
        self.allow_writes = allow_writes or os.getenv("ERP_ALLOW_WRITES") == "1"

    def available(self) -> tuple[bool, str]:
        if self._which("codex") is None:
            return False, "`codex` CLI not found on PATH (npm i -g @openai/codex)"
        if not (os.getenv("CODEX_API_KEY") or os.getenv("OPENAI_API_KEY")):
            return False, "set CODEX_API_KEY (or OPENAI_API_KEY) for headless runs"
        return True, "codex exec available"

    def _base_cmd(self) -> list[str]:
        env_cmd = os.getenv("CODEX_CMD")
        cmd = env_cmd.split() if env_cmd else list(DEFAULT_CMD)
        if self.allow_writes:
            # only add a write-enabling flag when the operator opts in
            cmd += os.getenv("CODEX_WRITE_FLAGS", "--sandbox workspace-write").split()
        return cmd

    def run(self, task: AgentTask) -> AdapterResult:
        prompt = self.render_handoff(task)
        cmd = self._base_cmd() + ["--cd", str(task.pack_root), prompt]
        try:
            proc = subprocess.run(cmd, cwd=str(task.pack_root), input=None,
                                  capture_output=True, text=True, timeout=self.timeout)
        except FileNotFoundError:
            return AdapterResult(ok=False, error="codex binary not found")
        except subprocess.TimeoutExpired:
            return AdapterResult(ok=False, error=f"codex timed out after {self.timeout}s")
        final = self._final_message(proc.stdout)
        ok = proc.returncode == 0
        return AdapterResult(
            ok=ok,
            summary=final[:800] if final else f"codex exit {proc.returncode}",
            raw_output=proc.stdout,
            error=None if ok else (proc.stderr[-1200:] if proc.stderr else "non-zero exit"),
            meta={"returncode": proc.returncode, "cmd": " ".join(cmd[:-1])},
        )

    @staticmethod
    def _final_message(stdout: str) -> str:
        """Pull the final agent message out of a JSONL stream (fallback: raw tail)."""
        last = ""
        for line in stdout.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                evt = json.loads(line)
            except Exception:
                continue
            # tolerate several event shapes across Codex versions
            for key in ("message", "content", "text", "final", "output"):
                val = evt.get(key)
                if isinstance(val, str) and val:
                    last = val
            if evt.get("type") in ("message", "agent_message", "final") and isinstance(evt.get("data"), str):
                last = evt["data"]
        return last or stdout.strip()[-800:]
