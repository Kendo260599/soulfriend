"""Tests for importer report lineage and runner args parsing helpers."""

from __future__ import annotations

import json
import os
from pathlib import Path

from scripts.import_lesson_units_seed import _compute_lineage, _find_previous_report, _parse_runner_command_args


def _write_report(path: Path, previous: str | None) -> None:
    payload = {
        "run_id": path.stem,
        "previous_report": previous,
    }
    path.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")


def test_find_previous_report_scopes_by_prefix(tmp_path: Path) -> None:
    older = tmp_path / "audit_20260316T000000Z.json"
    newer = tmp_path / "audit_20260316T000010Z.json"
    other = tmp_path / "staging_20260316T000020Z.json"

    _write_report(older, None)
    _write_report(newer, str(older))
    _write_report(other, None)

    target = tmp_path / "audit_20260316T000030Z.json"
    result = _find_previous_report(target, "audit_")

    assert result is not None
    assert Path(result).name == newer.name


def test_compute_lineage_depth_and_head(tmp_path: Path) -> None:
    first = tmp_path / "audit_01.json"
    second = tmp_path / "audit_02.json"
    third = tmp_path / "audit_03.json"

    _write_report(first, None)
    _write_report(second, str(first))
    _write_report(third, str(second))

    depth, head = _compute_lineage(str(third), tmp_path)

    assert depth == 3
    assert head == str(first)


def test_find_previous_report_prefers_newer_timestamp_in_name(tmp_path: Path) -> None:
    older_name = tmp_path / "audit_20260316T000010Z.json"
    newer_name = tmp_path / "audit_20260316T000020Z.json"

    _write_report(older_name, None)
    _write_report(newer_name, None)

    # Force mtime order opposite to filename timestamp order.
    os.utime(older_name, (2000000000, 2000000000))
    os.utime(newer_name, (1000000000, 1000000000))

    target = tmp_path / "audit_20260316T000030Z.json"
    result = _find_previous_report(target, "audit_")

    assert result is not None
    assert Path(result).name == newer_name.name


def test_parse_runner_command_args_json_list() -> None:
    raw = json.dumps(["--ensure-seed", "--apply"])
    parsed = _parse_runner_command_args(raw)
    assert parsed == ["--ensure-seed", "--apply"]
