"""Import V2 skills and lesson units from seed preview JSON.

Safety model:
- Default mode is dry-run (no DB writes persisted).
- Use --apply to commit changes.
- V1 tables/logic are not modified.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

from app.db import schema


REPORT_VERSION = "2.0"
PIPELINE_VERSION = "v2-seed-pipeline-2026-03-16"
MAX_LINEAGE_DEPTH = 200
_STAMP_PATTERN = re.compile(r"(\d{8}T\d{6}Z)")


def _normalize_report_prefix(prefix: str) -> str:
    trimmed = (prefix or "").strip()
    if not trimmed:
        return "import_"
    safe = "".join(ch if ch.isalnum() or ch in {"_", "-"} else "_" for ch in trimmed)
    return safe


def _default_report_path(prefix: str = "import_") -> Path:
    root_dir = Path(__file__).resolve().parents[1]
    report_dir = root_dir / "data" / "reports" / "v2_seed_import"
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_prefix = _normalize_report_prefix(prefix)
    return report_dir / f"{safe_prefix}{stamp}.json"


def _report_path_for_dir(report_dir: Path, prefix: str = "import_") -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_prefix = _normalize_report_prefix(prefix)
    return report_dir / f"{safe_prefix}{stamp}.json"


def _resolve_report_path(report: Path | None, report_dir: Path | None, report_prefix: str) -> Path:
    if report is not None:
        return report
    if report_dir is not None:
        return _report_path_for_dir(report_dir, report_prefix)
    return _default_report_path(report_prefix)


def _seed_file_metadata(seed_path: Path) -> dict:
    raw = seed_path.read_bytes()
    stat = seed_path.stat()
    return {
        "path": str(seed_path),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size_bytes": int(stat.st_size),
        "modified_at_utc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def _find_previous_report(report_path: Path, report_prefix: str) -> str | None:
    """Return the most recent sibling JSON report with the same prefix."""
    report_dir = report_path.parent
    if not report_dir.exists():
        return None

    safe_prefix = _normalize_report_prefix(report_prefix)
    candidates = [
        path for path in report_dir.glob("*.json")
        if (
            path.is_file()
            and path.resolve() != report_path.resolve()
            and path.name.startswith(safe_prefix)
        )
    ]
    if not candidates:
        return None

    def _key(path: Path) -> tuple[str, int, str]:
        match = _STAMP_PATTERN.search(path.name)
        stamp = match.group(1) if match else ""
        return (stamp, path.stat().st_mtime_ns, path.name)

    latest = max(candidates, key=_key)
    return str(latest)


def _resolve_report_ref(raw_path: str, report_dir: Path) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate

    lexical_root = report_dir.parent.parent.parent
    return (lexical_root / candidate).resolve()


def _load_report_json(path: Path) -> dict | None:
    try:
        if not path.exists():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, dict) else None
    except Exception:
        return None


def _compute_lineage(previous_report: str | None, report_dir: Path) -> tuple[int, str | None]:
    """Return lineage depth and chain head path from previous_report links."""
    if not previous_report:
        return 0, None

    depth = 0
    seen: set[str] = set()
    current = previous_report
    chain_head = previous_report

    while current and depth < MAX_LINEAGE_DEPTH:
        if current in seen:
            # Cycle detected: stop at the latest safe known head.
            break
        seen.add(current)
        depth += 1
        chain_head = current

        payload = _load_report_json(_resolve_report_ref(current, report_dir))
        if not payload:
            break

        next_prev = payload.get("previous_report")
        if isinstance(next_prev, str) and next_prev.strip():
            current = next_prev
        else:
            break

    return depth, chain_head


def _load_seed(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Seed file must be a JSON object")
    if not isinstance(payload.get("skills"), list):
        raise ValueError("Seed file missing 'skills' list")
    if not isinstance(payload.get("lesson_units"), list):
        raise ValueError("Seed file missing 'lesson_units' list")
    return payload


def _get_or_create_skill_id(cursor, name: str, description: str) -> int:
    cursor.execute(
        """
        INSERT INTO skills(name, description)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET description = excluded.description
        """,
        (name, description),
    )
    row = cursor.execute("SELECT id FROM skills WHERE name = ?", (name,)).fetchone()
    if row is None:
        raise RuntimeError(f"Failed to resolve skill id for: {name}")
    return int(row["id"])


def _load_vocabulary_map(cursor) -> Dict[str, int]:
    rows = cursor.execute("SELECT id, lower(word) AS key_word FROM vocabulary").fetchall()
    return {str(row["key_word"]): int(row["id"]) for row in rows}


def _insert_prerequisites(cursor, skill_ids: Dict[str, int], skills: List[dict]) -> Dict[str, int]:
    created = 0
    duplicates = 0
    ignored_invalid = 0

    for skill in skills:
        name = str(skill.get("skill_name", "")).strip().lower()
        for prereq in skill.get("prerequisites", []):
            prereq_name = str(prereq).strip().lower()
            if (
                not name
                or not prereq_name
                or name not in skill_ids
                or prereq_name not in skill_ids
            ):
                ignored_invalid += 1
                continue

            existing = cursor.execute(
                """
                SELECT 1
                FROM skill_prerequisites
                WHERE skill_id = ? AND prerequisite_id = ?
                LIMIT 1
                """,
                (skill_ids[name], skill_ids[prereq_name]),
            ).fetchone()
            if existing is not None:
                duplicates += 1
                continue

            cursor.execute(
                """
                INSERT OR IGNORE INTO skill_prerequisites(skill_id, prerequisite_id)
                VALUES (?, ?)
                """,
                (skill_ids[name], skill_ids[prereq_name]),
            )
            created += cursor.rowcount

    return {
        "created": created,
        "duplicates": duplicates,
        "ignored_invalid": ignored_invalid,
    }


def _insert_lesson_units(
    cursor,
    lesson_units: List[dict],
    vocab_map: Dict[str, int],
    skill_ids: Dict[str, int],
) -> Dict[str, int]:
    created = 0
    duplicates = 0
    ignored_invalid = 0
    missing_words = 0
    candidates = 0
    duplicate_by_skill: Dict[str, int] = {}
    duplicate_samples: list[dict] = []

    for unit in lesson_units:
        skill = str(unit.get("skill", "")).strip().lower()
        unit_order = int(unit.get("unit_order", 0) or 0)
        words = unit.get("words", [])

        if not isinstance(words, list):
            ignored_invalid += 1
            continue

        if skill not in skill_ids or unit_order <= 0:
            ignored_invalid += len(words)
            continue

        for word in words:
            candidates += 1
            token = str(word or "").strip().lower()
            if not token:
                ignored_invalid += 1
                continue

            word_id = vocab_map.get(token)
            if word_id is None:
                missing_words += 1
                continue

            existing = cursor.execute(
                """
                SELECT 1
                FROM lesson_units
                WHERE word_id = ? AND skill_id = ? AND unit_order = ?
                LIMIT 1
                """,
                (word_id, skill_ids[skill], unit_order),
            ).fetchone()
            if existing is not None:
                duplicates += 1
                duplicate_by_skill[skill] = duplicate_by_skill.get(skill, 0) + 1
                if len(duplicate_samples) < 20:
                    duplicate_samples.append(
                        {
                            "skill": skill,
                            "unit_order": unit_order,
                            "word": token,
                        }
                    )
                continue

            cursor.execute(
                """
                INSERT OR IGNORE INTO lesson_units(word_id, skill_id, unit_order)
                VALUES (?, ?, ?)
                """,
                (word_id, skill_ids[skill], unit_order),
            )
            created += cursor.rowcount

    return {
        "created": created,
        "duplicates": duplicates,
        "ignored_invalid": ignored_invalid,
        "missing_words": missing_words,
        "candidates": candidates,
        "duplicate_by_skill": duplicate_by_skill,
        "duplicate_samples": duplicate_samples,
    }


def _replace_v2_seed_tables(cursor) -> Dict[str, int]:
    """
    Reset V2 seed tables only: lesson_units, skill_prerequisites, skills.

    Safety guard: if user_skill_mastery has rows, abort to avoid orphaned references
    while honoring the constraint of only mutating the three requested tables.
    """
    mastery_count = int(
        cursor.execute("SELECT COUNT(*) AS c FROM user_skill_mastery").fetchone()["c"] or 0
    )
    if mastery_count > 0:
        raise RuntimeError(
            "Cannot use --replace-v2 while user_skill_mastery has rows. "
            "Clear mastery data first or run without --replace-v2."
        )

    lesson_units_deleted = int(cursor.execute("DELETE FROM lesson_units").rowcount)
    prerequisites_deleted = int(cursor.execute("DELETE FROM skill_prerequisites").rowcount)
    skills_deleted = int(cursor.execute("DELETE FROM skills").rowcount)

    return {
        "lesson_units_deleted": lesson_units_deleted,
        "skill_prerequisites_deleted": prerequisites_deleted,
        "skills_deleted": skills_deleted,
    }


def _write_report(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    root_dir = Path(__file__).resolve().parents[1]
    default_seed = root_dir / "data" / "lexicon_seed" / "lesson_units_seed_preview.json"

    parser = argparse.ArgumentParser(
        description="Import V2 lesson-unit seed into SQLite (dry-run by default)."
    )
    parser.add_argument("--seed", type=Path, default=default_seed, help="Path to lesson_units_seed_preview.json")
    parser.add_argument(
        "--ensure-seed",
        action="store_true",
        help="Load vocabulary seed first when DB may be empty.",
    )
    parser.add_argument(
        "--replace-v2",
        action="store_true",
        help="Reset V2 seed tables (skills, skill_prerequisites, lesson_units) before import.",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=None,
        help="Directory to store generated import report JSON history.",
    )
    parser.add_argument(
        "--report-prefix",
        type=str,
        default="import_",
        help="Filename prefix for auto-generated report files.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        help="Path to write JSON import report history.",
    )
    parser.add_argument(
        "--runner-command-args",
        type=str,
        default=None,
        help="JSON-encoded args from pipeline runner for audit tracing.",
    )
    parser.add_argument("--apply", action="store_true", help="Commit changes. Without this flag: dry-run only.")
    return parser.parse_args()


def _parse_runner_command_args(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return [raw]

    if isinstance(parsed, list):
        return [str(item) for item in parsed]
    return [str(parsed)]


def main() -> int:
    args = parse_args()
    report_path = _resolve_report_path(args.report, args.report_dir, args.report_prefix)
    run_id = str(uuid.uuid4())
    previous_report = _find_previous_report(report_path, args.report_prefix)
    lineage_depth, lineage_chain_head = _compute_lineage(previous_report, report_path.parent)

    # Ensure schema exists before import.
    schema.create_tables()

    if args.ensure_seed:
        # Optional guard for fresh runtime DBs.
        from app.db.seed_loader import load_seed

        load_seed()

    seed_metadata = _seed_file_metadata(args.seed)
    seed = _load_seed(args.seed)
    skills = seed.get("skills", [])
    lesson_units = seed.get("lesson_units", [])

    conn = schema.get_connection()
    cursor = conn.cursor()

    replace_report = {
        "requested": bool(args.replace_v2),
        "lesson_units_deleted": 0,
        "skill_prerequisites_deleted": 0,
        "skills_deleted": 0,
    }

    if args.replace_v2:
        deleted = _replace_v2_seed_tables(cursor)
        replace_report.update(deleted)

    skill_ids: Dict[str, int] = {}
    for skill in skills:
        skill_name = str(skill.get("skill_name", "")).strip().lower()
        if not skill_name:
            continue
        display_name = str(skill.get("display_name", skill_name)).strip()
        description = f"V2 skill seed: {display_name}"
        skill_ids[skill_name] = _get_or_create_skill_id(cursor, skill_name, description)

    prereq_report = _insert_prerequisites(cursor, skill_ids=skill_ids, skills=skills)
    vocab_map = _load_vocabulary_map(cursor)
    unit_report = _insert_lesson_units(
        cursor,
        lesson_units=lesson_units,
        vocab_map=vocab_map,
        skill_ids=skill_ids,
    )

    if args.apply:
        conn.commit()
        mode = "APPLY"
    else:
        conn.rollback()
        mode = "DRY-RUN"

    conn.close()

    print(f"Import mode: {mode}")
    print(f"Run id: {run_id}")
    print(f"Seed file: {args.seed}")
    print(f"Report file: {report_path}")
    print(f"Previous report: {previous_report}")
    print(f"Lineage depth: {lineage_depth}")
    print(f"Lineage chain head: {lineage_chain_head}")
    print(f"Report prefix: {_normalize_report_prefix(args.report_prefix)}")
    print(f"Ensure vocabulary seed: {bool(args.ensure_seed)}")
    print(f"Replace V2 tables: {bool(args.replace_v2)}")
    print(f"Skills resolved: {len(skill_ids)}")
    if args.replace_v2:
        print(
            "Replace summary: "
            f"skills_deleted={replace_report['skills_deleted']}, "
            f"skill_prerequisites_deleted={replace_report['skill_prerequisites_deleted']}, "
            f"lesson_units_deleted={replace_report['lesson_units_deleted']}"
        )
    print(
        "Prerequisites: "
        f"created={prereq_report['created']}, "
        f"duplicates={prereq_report['duplicates']}, "
        f"ignored_invalid={prereq_report['ignored_invalid']}"
    )
    print(
        "Lesson units: "
        f"candidates={unit_report['candidates']}, "
        f"created={unit_report['created']}, "
        f"duplicates={unit_report['duplicates']}, "
        f"missing_words={unit_report['missing_words']}, "
        f"ignored_invalid={unit_report['ignored_invalid']}"
    )
    if unit_report.get("duplicate_by_skill"):
        print(f"Lesson unit duplicates by skill: {unit_report['duplicate_by_skill']}")

    report_payload = {
        "run_id": run_id,
        "previous_report": previous_report,
        "lineage_depth": lineage_depth,
        "lineage_chain_head": lineage_chain_head,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "report_version": REPORT_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "command_args": sys.argv[1:],
        "runner_command_args": _parse_runner_command_args(args.runner_command_args),
        "mode": mode,
        "seed_file": str(args.seed),
        "seed_metadata": seed_metadata,
        "db_path": str(schema.DB_PATH),
        "flags": {
            "ensure_seed": bool(args.ensure_seed),
            "replace_v2": bool(args.replace_v2),
            "apply": bool(args.apply),
        },
        "skills_resolved": len(skill_ids),
        "replace_report": replace_report,
        "prerequisites_report": prereq_report,
        "lesson_units_report": unit_report,
    }
    _write_report(report_path, report_payload)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
