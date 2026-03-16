"""Tests for V2 report integrity checker behavior."""

from __future__ import annotations

import json
from pathlib import Path

from scripts.check_v2_report_integrity import validate_reports


def _write_report(path: Path, previous: str | None = None) -> None:
    payload = {
        "run_id": path.stem,
        "generated_at_utc": "2026-03-16T00:00:00Z",
        "report_version": "2.0",
        "pipeline_version": "v2-seed-pipeline-2026-03-16",
        "mode": "DRY-RUN",
        "previous_report": previous,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")


def test_validate_reports_pass_with_prefix_scoped_chain(tmp_path: Path) -> None:
    report_dir = tmp_path / "data" / "reports" / "v2_seed_import"

    first = report_dir / "audit_20260316T000001Z.json"
    second = report_dir / "audit_20260316T000002Z.json"

    _write_report(first, None)
    _write_report(second, "data/reports/v2_seed_import/audit_20260316T000001Z.json")

    result = validate_reports(report_dir=report_dir, prefix="audit_")
    assert result["status"] == "pass"
    assert result["invalid_reports"] == 0


def test_validate_reports_fails_on_previous_prefix_mismatch(tmp_path: Path) -> None:
    report_dir = tmp_path / "data" / "reports" / "v2_seed_import"

    staging = report_dir / "staging_20260316T000001Z.json"
    audit = report_dir / "audit_20260316T000002Z.json"

    _write_report(staging, None)
    _write_report(audit, "data/reports/v2_seed_import/staging_20260316T000001Z.json")

    result = validate_reports(report_dir=report_dir, prefix="audit_")

    assert result["status"] == "fail"
    assert result["invalid_reports"] == 1
    assert result["issues"][0]["issue"] == "previous_prefix_mismatch"
