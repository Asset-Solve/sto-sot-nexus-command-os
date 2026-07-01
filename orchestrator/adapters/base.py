#!/usr/bin/env python3
"""Adapter interface between the orchestrator and an agent surface.

An *adapter* knows how to hand a bounded stage task to one agent surface
(Codex CLI, Claude Code, or an offline dry-run simulator) and return a
normalised result. The orchestrator stays surface-agnostic: it builds an
``AgentTask`` from the pipeline stage spec and calls ``adapter.run(task)``.
"""
from __future__ import annotations

import shutil
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class AgentTask:
    """Everything an agent needs to execute one stage (a Handoff Packet)."""
    stage_id: str
    stage_name: str
    agent_id: str                       # which swarm role (see pipeline agents)
    surface: str                        # main | codex | claude
    mode: str                           # guided_gates | full_auto_draft | repair | ...
    use_case: str
    prompt_path: str                    # stage prompt file, relative to pack root
    handoff_text: str                   # rendered instructions for the agent
    pack_root: Path
    workspace: Path
    produces: list[str] = field(default_factory=list)
    inputs: list[str] = field(default_factory=list)
    allowed_write_globs: list[str] = field(default_factory=list)
    forbidden_actions: list[str] = field(default_factory=list)
    context: dict[str, Any] = field(default_factory=dict)   # stage spec, rules, settings (used by dry-run)


@dataclass
class AdapterResult:
    ok: bool
    summary: str = ""
    files_written: list[str] = field(default_factory=list)
    raw_output: str = ""
    error: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


class Adapter(ABC):
    name: str = "base"

    @abstractmethod
    def available(self) -> tuple[bool, str]:
        """Return (is_available, human_reason)."""

    @abstractmethod
    def run(self, task: AgentTask) -> AdapterResult:
        """Execute the task on this surface."""

    # -- shared helpers -----------------------------------------------------
    @staticmethod
    def _which(binary: str) -> str | None:
        return shutil.which(binary)

    @staticmethod
    def render_handoff(task: AgentTask) -> str:
        """Deterministic Handoff Packet (matches CODEX_CLAUDE_AGENT_SWARM_RUNBOOK.md)."""
        lines = [
            "# Agent Handoff",
            "",
            f"Use case:\n{task.use_case}",
            "",
            f"Current stage:\n{task.stage_id} - {task.stage_name}",
            "",
            f"Agent role: {task.agent_id}",
            f"Mode: {task.mode}",
            "",
            "Read first:",
            f"- {task.prompt_path}",
        ]
        for i in task.inputs:
            lines.append(f"- {i}")
        lines += [
            "",
            "Produce (write only these paths / your owned globs):",
        ]
        for p in task.produces:
            lines.append(f"- {p}")
        if task.allowed_write_globs:
            lines += ["", "Allowed write scope:"]
            lines += [f"- {g}" for g in task.allowed_write_globs]
        lines += [
            "",
            "Output format: Findings, Evidence, Risks, Recommendations, Open questions, Files touched.",
            "",
            "Do not:",
            "- Proceed outside scope or hide assumptions",
            "- Make write-heavy edits outside your owned globs",
            "- Trigger live ERP writes",
            "- Let AI autonomously approve or post controlled transactions",
        ]
        for f in task.forbidden_actions:
            lines.append(f"- {f}")
        lines += ["", task.handoff_text]
        return "\n".join(lines)
