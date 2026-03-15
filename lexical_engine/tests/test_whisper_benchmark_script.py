from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts.run_whisper_benchmark import _load_manifest, _save_report


def test_load_manifest_accepts_array(tmp_path: Path) -> None:
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps([
            {"word": "trust", "audio": "trust.wav"},
            {"word": "hope", "audio": "hope.wav"},
        ]),
        encoding="utf-8",
    )

    rows = _load_manifest(str(manifest))
    assert len(rows) == 2
    assert rows[0]["word"] == "trust"


def test_load_manifest_accepts_items_object(tmp_path: Path) -> None:
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "items": [
                    {"word": "trust", "audio": "trust.wav"},
                    {"word": "hope", "audio": "hope.wav"},
                ]
            }
        ),
        encoding="utf-8",
    )

    rows = _load_manifest(str(manifest))
    assert len(rows) == 2
    assert rows[1]["audio"] == "hope.wav"


def test_load_manifest_rejects_invalid_shape(tmp_path: Path) -> None:
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps({"bad": 1}), encoding="utf-8")

    with pytest.raises(ValueError):
        _load_manifest(str(manifest))


def test_save_report_writes_latest_and_history(tmp_path: Path) -> None:
    latest = tmp_path / "reports" / "latest.json"
    history_dir = tmp_path / "reports" / "history"
    report = {"summary": {"passed": True}, "results": []}

    latest_path, history_path = _save_report(
        report,
        report_json_path=str(latest),
        history_dir=str(history_dir),
    )

    assert latest_path is not None and Path(latest_path).exists()
    assert history_path is not None and Path(history_path).exists()

    payload = json.loads(latest.read_text(encoding="utf-8"))
    assert payload["summary"]["passed"] is True
