"""Validate V2 seed import report lineage integrity.

Checks:
- file readability and JSON shape
- previous_report reference exists
- no self-reference
- no lineage cycle
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List


REQUIRED_KEYS = {
    "run_id",
    "generated_at_utc",
    "report_version",
    "pipeline_version",
    "mode",
}


def _load_json(path: Path) -> dict | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, dict) else None
    except Exception:
        return None


def _report_files(report_dir: Path, prefix: str | None) -> List[Path]:
    files = sorted([p for p in report_dir.glob("*.json") if p.is_file()])
    if prefix:
        files = [p for p in files if p.name.startswith(prefix)]
    return files


def _normalize_path(raw: str, report_dir: Path) -> Path:
    path = Path(raw)
    if path.is_absolute():
        return path
    # previous_report in this project is stored relative to lexical_engine root.
    candidate = (report_dir.parents[2] / path).resolve() if len(report_dir.parents) >= 3 else path.resolve()
    return candidate


def _walk_chain(start: Path, report_dir: Path, prefix: str | None = None) -> tuple[bool, str | None]:
    seen: set[str] = set()
    current = start

    while True:
        key = str(current.resolve())
        if key in seen:
            return False, "cycle_detected"
        seen.add(key)

        payload = _load_json(current)
        if not payload:
            return False, "invalid_json"

        previous = payload.get("previous_report")
        if not previous:
            return True, None
        if not isinstance(previous, str):
            return False, "previous_report_not_string"

        previous_path = _normalize_path(previous, report_dir)
        if previous_path.resolve() == current.resolve():
            return False, "self_reference"
        if not previous_path.exists():
            return False, "previous_missing"
        if prefix and not previous_path.name.startswith(prefix):
            return False, "previous_prefix_mismatch"

        current = previous_path


def validate_reports(report_dir: Path, prefix: str | None = None) -> Dict[str, object]:
    files = _report_files(report_dir, prefix)

    issues: List[dict] = []
    ok_count = 0

    for path in files:
        payload = _load_json(path)
        if not payload:
            issues.append({"file": str(path), "issue": "invalid_json"})
            continue

        missing_keys = sorted(list(REQUIRED_KEYS - set(payload.keys())))
        if missing_keys:
            issues.append({"file": str(path), "issue": "missing_keys", "detail": missing_keys})
            continue

        valid_chain, reason = _walk_chain(path, report_dir, prefix=prefix)
        if not valid_chain:
            issues.append({"file": str(path), "issue": reason})
            continue

        ok_count += 1

    return {
        "report_dir": str(report_dir),
        "prefix": prefix,
        "total_reports": len(files),
        "ok_reports": ok_count,
        "invalid_reports": len(issues),
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Check V2 report integrity and lineage.")
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=root / "data" / "reports" / "v2_seed_import",
        help="Directory containing import JSON reports.",
    )
    parser.add_argument(
        "--prefix",
        type=str,
        default=None,
        help="Optional filename prefix filter.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output JSON file path for checker summary.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = validate_reports(report_dir=args.report_dir, prefix=args.prefix)

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
