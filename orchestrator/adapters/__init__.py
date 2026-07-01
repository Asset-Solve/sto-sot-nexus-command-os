"""Adapter registry + driver routing for the Enterprise AI ERP build engine."""
from __future__ import annotations

from typing import Any

from .base import Adapter, AgentTask, AdapterResult
from .dryrun import DryRunAdapter
from .codex import CodexAdapter
from .claude import ClaudeAdapter

_SURFACE_TO_ADAPTER = {"main": "claude", "codex": "codex", "claude": "claude"}


def get_adapter(name: str, *, allow_writes: bool = False, timeout: int = 3600) -> Adapter:
    name = (name or "dryrun").lower()
    if name == "dryrun":
        return DryRunAdapter()
    if name == "codex":
        return CodexAdapter(timeout=timeout, allow_writes=allow_writes)
    if name == "claude":
        return ClaudeAdapter(timeout=timeout, allow_writes=allow_writes)
    raise ValueError(f"unknown adapter: {name}")


def resolve_adapter_name(stage: dict[str, Any], pipeline: dict[str, Any], cli_driver: str) -> str:
    """Resolve which concrete adapter runs a stage.

    Precedence: explicit CLI --driver (except 'auto') > stage.driver > stage.route.
    'main' surfaces map to the reasoning driver so fully-automated runs still
    produce artifacts.
    """
    if cli_driver and cli_driver != "auto":
        return cli_driver
    drv = str(stage.get("driver", "auto")).lower()
    if drv in ("codex", "claude", "dryrun"):
        return drv
    if drv == "main":
        return _SURFACE_TO_ADAPTER["main"]
    # driver == auto -> use route table
    route = stage.get("route")
    routing = pipeline.get("routing", {}) or {}
    surface = routing.get(route, "claude") if route else "claude"
    return _SURFACE_TO_ADAPTER.get(surface, "claude")


__all__ = [
    "Adapter", "AgentTask", "AdapterResult",
    "DryRunAdapter", "CodexAdapter", "ClaudeAdapter",
    "get_adapter", "resolve_adapter_name",
]
