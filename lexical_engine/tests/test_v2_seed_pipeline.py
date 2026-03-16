"""Tests for V2 non-destructive seed pipeline.

Scope:
- regroup preview consistency
- lesson-unit seed consistency
- no dependence on database state
"""

from __future__ import annotations

import json
from pathlib import Path
from collections import defaultdict

from scripts.build_lesson_units_seed import SKILL_PREREQUISITES, build_seed_payload
from scripts.regroup_381_words import V2_CATEGORIES, build_preview


def _load_words_seed() -> list[dict]:
    root_dir = Path(__file__).resolve().parents[1]
    words_path = root_dir / "data" / "lexicon_seed" / "words.json"
    return json.loads(words_path.read_text(encoding="utf-8"))


def test_regroup_preview_counts_are_consistent() -> None:
    words = _load_words_seed()
    preview = build_preview(words)

    assert preview["total_words"] == len(words)
    assert set(preview["category_counts"].keys()) == set(V2_CATEGORIES)

    primary_total = sum(preview["primary_category_counts"].values())
    assert primary_total == preview["total_words"]


def test_lesson_units_seed_preserves_word_volume() -> None:
    words = _load_words_seed()
    preview = build_preview(words)

    payload = build_seed_payload(words=preview["words"], unit_size=12)

    total_words_in_units = sum(unit["word_count"] for unit in payload["lesson_units"])
    assert total_words_in_units == payload["unique_total_words"]
    assert payload["input_total_words"] == len(preview["words"])
    assert payload["duplicates_removed"] >= 0

    seen_skills = {skill["skill_name"] for skill in payload["skills"]}
    assert seen_skills == set(SKILL_PREREQUISITES.keys())

    relationship = next(s for s in payload["skills"] if s["skill_name"] == "relationship")
    assert set(relationship["prerequisites"]) == {"emotional", "functional"}

    # Dedup normalization guarantees no repeated words within each skill payload.
    words_by_skill: dict[str, list[str]] = defaultdict(list)
    for unit in payload["lesson_units"]:
        skill = str(unit["skill"]).lower()
        words_by_skill[skill].extend([w.lower() for w in unit["words"]])

    for skill_words in words_by_skill.values():
        assert len(skill_words) == len(set(skill_words))
