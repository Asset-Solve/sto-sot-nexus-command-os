#!/usr/bin/env python3
"""Offline dry-run adapter.

Simulates an agent completing a stage by materialising the stage's declared
``produces`` artifacts with content that satisfies the automated gate:

  * required artifacts are created (non-empty)
  * schema-checked files get a *schema-valid* skeleton instance
  * attestation tokens the stop-conditions look for are injected

Existing, already-valid files are never clobbered. Use ``--driver dryrun`` to
walk the full 00->20 pipeline with no API keys and no network, e.g. to demo the
gate flow or to smoke-test the engine in CI.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None

from .base import Adapter, AgentTask, AdapterResult

_STUB_STR = "example-value"   # deliberately avoids leftover-marker keywords


def _skeleton(schema: dict[str, Any]) -> Any:
    """Generate a minimal instance that validates against ``schema`` (best effort)."""
    if not isinstance(schema, dict):
        return _STUB_STR
    if "const" in schema:
        return schema["const"]
    if "enum" in schema and schema["enum"]:
        return schema["enum"][0]
    if "default" in schema:
        return schema["default"]
    t = schema.get("type")
    if isinstance(t, list):
        t = next((x for x in t if x != "null"), t[0])
    if t == "object" or ("properties" in schema and t is None):
        obj: dict[str, Any] = {}
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            obj[key] = _skeleton(props.get(key, {}))
        return obj
    if t == "array":
        items = schema.get("items", {})
        return [_skeleton(items)] if items else []
    if t == "integer" or t == "number":
        return 0
    if t == "boolean":
        return False
    if t == "null":
        return None
    return _STUB_STR


class DryRunAdapter(Adapter):
    name = "dryrun"

    def available(self) -> tuple[bool, str]:
        return True, "offline simulator (always available)"

    def run(self, task: AgentTask) -> AdapterResult:
        written: list[str] = []
        stage = task.context.get("stage", {})
        rules = task.context.get("rules", {})
        gate = stage.get("gate", {})
        schema_checks = {c.get("file"): c for c in gate.get("schema_checks", []) or []}
        attest_tokens = self._attest_tokens_for(rules)

        for rel in task.produces:
            path = task.pack_root / rel
            attest = attest_tokens.get(rel, [])
            if path.exists() and path.stat().st_size > 8:
                if self._ensure_attestations(path, attest):
                    written.append(rel)
                continue  # keep valid originals intact
            path.parent.mkdir(parents=True, exist_ok=True)
            content = self._content_for(rel, schema_checks.get(rel), attest, task)
            path.write_text(content, encoding="utf-8")
            written.append(rel)

        summary = (f"[dryrun] stage {task.stage_id} '{task.stage_name}' as {task.agent_id}: "
                   f"materialised {len(written)} artifact(s)")
        return AdapterResult(ok=True, summary=summary, files_written=written,
                             raw_output=summary, meta={"simulated": True})

    # -- helpers ------------------------------------------------------------
    @staticmethod
    def _attest_tokens_for(rules: dict[str, Any]) -> dict[str, list[str]]:
        """Map artifact path -> [attestation tokens] from stop_conditions."""
        out: dict[str, list[str]] = {}
        for spec in (rules.get("stop_conditions", {}) or {}).values():
            if spec.get("detect") == "attestation":
                art = spec.get("artifact")
                tok = spec.get("attest_line")
                if art and tok:
                    out.setdefault(art, []).append(tok)
        return out

    def _content_for(self, rel: str, schema_check: dict | None,
                     attest: list[str], task: AgentTask) -> str:
        title = Path(rel).stem.replace("_", " ").replace("-", " ").title()

        # 1) schema-checked artifact -> emit a valid instance
        if schema_check:
            schema_rel = schema_check.get("schema")
            mode = schema_check.get("extract", "json")
            instance: Any = {}
            if schema_rel and schema_rel != "__meta_schema__":
                spath = task.pack_root / schema_rel
                if spath.exists():
                    try:
                        instance = _skeleton(json.loads(spath.read_text(encoding="utf-8")))
                    except Exception:
                        instance = {}
            if rel.endswith(".json"):
                return json.dumps(instance, indent=2) + "\n"
            if mode.startswith("yaml_each:") and yaml is not None:
                key = mode.split(":", 1)[1]
                return yaml.safe_dump({key: [instance]}, sort_keys=False)
            # frontmatter_json inside a markdown doc
            block = json.dumps(instance, indent=2)
            body = [f"# {title}", "",
                    "> Simulated stage artifact (dry-run). Replace with real agent output.",
                    "", "```json", block, "```", ""]
            body += [f"<!-- {t} -->" for t in attest]
            return "\n".join(body) + "\n"

        # 2) plain markdown artifact with any required attestation tokens
        body = [f"# {title}", "",
                f"> Simulated artifact for stage {task.stage_id} - {task.stage_name} (dry-run).",
                "> Replace with real agent output before a live gate.", ""]
        if attest:
            body += ["## Attestations", ""]
            body += [f"- {t}: confirmed (dry-run simulation)" for t in attest]
            body += [""]
        return "\n".join(body) + "\n"

    @staticmethod
    def _ensure_attestations(path: Path, attest: list[str]) -> bool:
        """Append missing dry-run attestation tokens without replacing existing content."""
        if not attest:
            return False
        text = path.read_text(encoding="utf-8", errors="replace")
        missing = [token for token in attest if token not in text]
        if not missing:
            return False
        addition = ["", "## Dry-Run Gate Attestations", ""]
        addition += [f"- {token}: confirmed (dry-run simulation)" for token in missing]
        addition += [""]
        path.write_text(text.rstrip() + "\n" + "\n".join(addition), encoding="utf-8")
        return True
