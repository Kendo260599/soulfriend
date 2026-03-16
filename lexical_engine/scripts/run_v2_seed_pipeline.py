"""Run the full V2 seed pipeline in one command.

Pipeline steps:
1) regroup_381_words.py
2) build_lesson_units_seed.py
3) import_lesson_units_seed.py (dry-run by default)
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def _run_step(step_name: str, args: list[str]) -> None:
    print(f"\n[run_v2_seed_pipeline] STEP: {step_name}")
    print(f"[run_v2_seed_pipeline] CMD: {' '.join(args)}")

    result = subprocess.run(args, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Step failed: {step_name} (exit={result.returncode})")



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run V2 seed pipeline: regroup -> build lesson units -> import (dry-run default)."
    )
    parser.add_argument(
        "--ensure-seed",
        action="store_true",
        help="Load vocabulary seed before import when DB may be empty.",
    )
    parser.add_argument(
        "--replace-v2",
        action="store_true",
        help="Reset V2 seed tables before import (skills, skill_prerequisites, lesson_units).",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=None,
        help="Directory to store import report JSON history from importer.",
    )
    parser.add_argument(
        "--report-prefix",
        type=str,
        default=None,
        help="Filename prefix for auto-generated importer reports.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply lesson-unit import to DB. Without this flag, import stays dry-run.",
    )
    return parser.parse_args()



def main() -> int:
    args = parse_args()
    runner_args_json = json.dumps(sys.argv[1:], ensure_ascii=True)

    root = Path(__file__).resolve().parent
    py = sys.executable

    regroup_script = root / "regroup_381_words.py"
    build_script = root / "build_lesson_units_seed.py"
    import_script = root / "import_lesson_units_seed.py"

    _run_step("Regroup words", [py, str(regroup_script)])
    _run_step("Build lesson units seed", [py, str(build_script)])

    import_cmd = [py, str(import_script)]
    import_cmd.extend(["--runner-command-args", runner_args_json])
    if args.ensure_seed:
        import_cmd.append("--ensure-seed")
    if args.replace_v2:
        import_cmd.append("--replace-v2")
    if args.report_dir is not None:
        import_cmd.extend(["--report-dir", str(args.report_dir)])
    if args.report_prefix is not None:
        import_cmd.extend(["--report-prefix", args.report_prefix])
    if args.apply:
        import_cmd.append("--apply")
    _run_step("Import lesson units seed", import_cmd)

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"\n[run_v2_seed_pipeline] DONE ({mode})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
