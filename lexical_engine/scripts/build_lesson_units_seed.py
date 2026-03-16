"""Build non-destructive V2 lesson-unit seed preview from regroup output.

This script does not write to database tables. It only generates JSON preview files
that can be reviewed before any future migration/import step.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

SKILL_ORDER = ["core", "pronunciation", "emotional", "functional", "relationship"]
SKILL_PREREQUISITES: Dict[str, List[str]] = {
    "core": [],
    "pronunciation": ["core"],
    "emotional": ["core"],
    "functional": ["core"],
    "relationship": ["emotional", "functional"],
}

# Calm lesson pacing: avoid very large units.
DEFAULT_UNIT_SIZE = 12


def _canonical_word(value: str) -> str:
    # Normalize whitespace and casing for stable dedup across seed sources.
    return " ".join((value or "").strip().lower().split())


def _cefr_rank(level: str) -> int:
    rank = {
        "a1": 1,
        "a2": 2,
        "b1": 3,
        "b2": 4,
        "c1": 5,
        "c2": 6,
    }
    return rank.get((level or "").strip().lower(), 99)


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _chunk(items: List[Dict[str, Any]], size: int) -> List[List[Dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _sort_words(words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(
        words,
        key=lambda item: (
            _cefr_rank(str(item.get("cefr_level", ""))),
            float(item.get("difficulty_score", 0) or 0),
            str(item.get("word", "")).lower(),
        ),
    )


def _group_by_primary_skill(words: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for word in words:
        skill = str(word.get("v2_primary_category", "core")).strip().lower() or "core"
        if skill not in SKILL_ORDER:
            skill = "core"
        grouped[skill].append(word)

    for skill in SKILL_ORDER:
        grouped[skill] = _sort_words(grouped.get(skill, []))

    return grouped


def _dedup_words_per_skill(grouped: Dict[str, List[Dict[str, Any]]]) -> tuple[Dict[str, List[Dict[str, Any]]], int]:
    duplicates_removed = 0
    deduped: Dict[str, List[Dict[str, Any]]] = {}

    for skill, items in grouped.items():
        seen: set[str] = set()
        unique_items: List[Dict[str, Any]] = []

        for item in items:
            key = _canonical_word(str(item.get("word", "")))
            if not key:
                duplicates_removed += 1
                continue
            if key in seen:
                duplicates_removed += 1
                continue
            seen.add(key)
            unique_items.append(item)

        deduped[skill] = unique_items

    return deduped, duplicates_removed


def build_seed_payload(words: List[Dict[str, Any]], unit_size: int) -> Dict[str, Any]:
    grouped = _group_by_primary_skill(words)
    grouped, duplicates_removed = _dedup_words_per_skill(grouped)

    skills_payload = []
    lesson_units = []

    for skill in SKILL_ORDER:
        skill_words = grouped[skill]
        skills_payload.append(
            {
                "skill_name": skill,
                "display_name": skill.replace("_", " ").title(),
                "word_count": len(skill_words),
                "prerequisites": SKILL_PREREQUISITES.get(skill, []),
            }
        )

        for idx, unit_words in enumerate(_chunk(skill_words, unit_size), start=1):
            unit_id = f"{skill}_u{idx:02d}"
            lesson_units.append(
                {
                    "unit_id": unit_id,
                    "skill": skill,
                    "unit_order": idx,
                    "title": f"{skill.title()} Unit {idx}",
                    "word_count": len(unit_words),
                    "words": [str(item.get("word", "")).strip() for item in unit_words],
                    "meta": {
                        "cefr_min": min((_cefr_rank(str(item.get("cefr_level", ""))) for item in unit_words), default=99),
                        "cefr_max": max((_cefr_rank(str(item.get("cefr_level", ""))) for item in unit_words), default=99),
                    },
                }
            )

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "input_total_words": len(words),
        "unique_total_words": sum(skill["word_count"] for skill in skills_payload),
        "duplicates_removed": duplicates_removed,
        "unit_size": unit_size,
        "skills": skills_payload,
        "lesson_units": lesson_units,
    }


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    root_dir = Path(__file__).resolve().parents[1]
    default_input = root_dir / "data" / "lexicon_seed" / "words_regroup_preview.json"
    default_seed_output = root_dir / "data" / "lexicon_seed" / "lesson_units_seed_preview.json"
    default_summary_output = root_dir / "data" / "lexicon_seed" / "lesson_units_seed_summary.json"

    parser = argparse.ArgumentParser(
        description="Build lesson-unit seed preview from words_regroup_preview.json"
    )
    parser.add_argument("--input", type=Path, default=default_input, help="Regroup preview JSON path")
    parser.add_argument("--seed-output", type=Path, default=default_seed_output, help="Lesson unit seed preview output")
    parser.add_argument("--summary-output", type=Path, default=default_summary_output, help="Summary output")
    parser.add_argument("--unit-size", type=int, default=DEFAULT_UNIT_SIZE, help="Words per lesson unit")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = _load_json(args.input)

    words = source.get("words", []) if isinstance(source, dict) else []
    if not isinstance(words, list):
        raise ValueError("Input must be regroup preview JSON with a 'words' array")

    unit_size = max(6, min(20, int(args.unit_size)))
    payload = build_seed_payload(words=words, unit_size=unit_size)

    summary = {
        "generated_at_utc": payload["generated_at_utc"],
        "input_file": str(args.input),
        "seed_output_file": str(args.seed_output),
        "input_total_words": payload["input_total_words"],
        "unique_total_words": payload["unique_total_words"],
        "duplicates_removed": payload["duplicates_removed"],
        "unit_size": payload["unit_size"],
        "skills": payload["skills"],
        "total_units": len(payload["lesson_units"]),
        "units_per_skill": {
            skill: len([u for u in payload["lesson_units"] if u["skill"] == skill])
            for skill in SKILL_ORDER
        },
    }

    write_json(args.seed_output, payload)
    write_json(args.summary_output, summary)

    print("Lesson-unit seed preview generated successfully")
    print(f"Input total words: {payload['input_total_words']}")
    print(f"Unique total words: {payload['unique_total_words']}")
    print(f"Duplicates removed: {payload['duplicates_removed']}")
    print(f"Total units: {len(payload['lesson_units'])}")
    print(f"Seed file: {args.seed_output}")
    print(f"Summary file: {args.summary_output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
