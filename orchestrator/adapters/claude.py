#!/usr/bin/env python3
"""Claude Code adapter - drives ``claude -p`` headless mode.

Headless mode (``-p/--print``) accepts a prompt and runs without interaction,
suitable for automation and multi-agent workflows. Guardrails for unattended
runs: restrict tools (``--allowedTools`` / ``--disallowedTools``), a
non-interactive permission mode, and hooks that can veto a call.
Ref: https://code.claude.com/docs/en/sub-agents

Base command configurable via ``CLAUDE_CMD``. Deep reasoning / research stages
route here (see pipeline `routing`); code-writing stages route to Codex.
"""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from .base import Adapter, AgentTask, AdapterResult

DEFAULT_CMD = ["claude", "-p", "--output-format", "json"]
# read-only-ish default toolset for research/review agents
READONLY_TOOLS = "Read,Grep,Glob,WebSearch,WebFetch"


class ClaudeAdapter(Adapter):
    name = "claude"

    def __init__(self, timeout: int = 3600, allow_writes: bool = False) -> None:
        self.timeout = timeout
        self.allow_writes = allow_writes or os.getenv("ERP_ALLOW_WRITES") == "1"

    def available(self) -> tuple[bool, str]:
        if self._which("claude") is None:
            return False, "`claude` CLI not found on PATH (npm i -g @anthropic-ai/claude-code)"
        return True, "claude -p available"

    def _cmd(self, task: AgentTask) -> list[str]:
        env_cmd = os.getenv("CLAUDE_CMD")
        cmd = env_cmd.split() if env_cmd else list(DEFAULT_CMD)
        writes_allowed = self.allow_writes and task.context.get("agent_can_write", True)
        if writes_allowed:
            cmd += ["--permission-mode", os.getenv("CLAUDE_PERMISSION_MODE", "acceptEdits")]
            tools = os.getenv("CLAUDE_ALLOWED_TOOLS", "Read,Grep,Glob,Edit,Write,Bash,WebSearch,WebFetch")
        else:
            cmd += ["--permission-mode", "plan"]
            tools = os.getenv("CLAUDE_READONLY_TOOLS", READONLY_TOOLS)
        cmd += ["--allowedTools", tools]
        return cmd

    def run(self, task: AgentTask) -> AdapterResult:
        prompt = self.render_handoff(task)
        cmd = self._cmd(task) + [prompt]
        try:
            proc = subprocess.run(cmd, cwd=str(task.pack_root),
                                  capture_output=True, text=True, timeout=self.timeout)
        except FileNotFoundError:
            return AdapterResult(ok=False, error="claude binary not found")
        except subprocess.TimeoutExpired:
            return AdapterResult(ok=False, error=f"claude timed out after {self.timeout}s")
        final = self._parse(proc.stdout)
        ok = proc.returncode == 0
        return AdapterResult(
            ok=ok,
            summary=final[:800] if final else f"claude exit {proc.returncode}",
            raw_output=proc.stdout,
            error=None if ok else (proc.stderr[-1200:] if proc.stderr else "non-zero exit"),
            meta={"returncode": proc.returncode},
        )

    @staticmethod
    def _parse(stdout: str) -> str:
        """``--output-format json`` prints a single JSON object with a `result`."""
        stdout = stdout.strip()
        if not stdout:
            return ""
        try:
            obj = json.loads(stdout)
            if isinstance(obj, dict):
                return obj.get("result") or obj.get("text") or json.dumps(obj)[:800]
        except Exception:
            pass
        # stream-json fallback: last line with a result field
        last = ""
        for line in stdout.splitlines():
            try:
                evt = json.loads(line)
                if isinstance(evt, dict) and (evt.get("result") or evt.get("text")):
                    last = evt.get("result") or evt.get("text")
            except Exception:
                continue
        return last or stdout[-800:]
