"""One-command validation for V2 seed roadmap release readiness."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def _run(label: str, command: list[str], cwd: Path) -> None:
    print(f"\n[validate_v2_release] STEP: {label}")
    print("[validate_v2_release] CMD:", " ".join(command))
    result = subprocess.run(command, cwd=str(cwd), check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Step failed: {label} (exit={result.returncode})")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    py = sys.executable

    _run(
        "Pipeline dry-run",
        [
            py,
            "scripts/run_v2_seed_pipeline.py",
            "--ensure-seed",
            "--report-prefix",
            "releasecheck_",
        ],
        cwd=root,
    )

    _run(
        "Focused regression tests",
        [
            py,
            "-m",
            "pytest",
            "tests/test_v2_seed_pipeline.py",
            "tests/test_lesson_path_v2_seed_order.py",
            "tests/test_lesson_path_strict_mode.py",
            "tests/test_import_report_lineage.py",
            "tests/test_import_replace_guard.py",
            "tests/test_v1_core_preservation.py",
            "-q",
        ],
        cwd=root,
    )

    _run(
        "Report integrity check",
        [
            py,
            "scripts/check_v2_report_integrity.py",
            "--report-dir",
            "data/reports/v2_seed_import",
            "--prefix",
            "releasecheck_",
        ],
        cwd=root,
    )

    print("\n[validate_v2_release] PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
