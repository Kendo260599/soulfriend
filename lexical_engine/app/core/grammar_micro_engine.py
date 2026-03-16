"""Grammar micro-unit selector for Phase-2 progression.

Read-only responsibilities:
- infer unlock levels from current skill states
- return grammar micro patterns from seeded table
- provide deterministic fallback payload when seeds are absent
"""

from __future__ import annotations

from typing import Any, Dict

from app.db import repository


def _safe_float(value: Any) -> float:
    return float(value or 0.0)


def _extract_unlocked_levels(skill_states: list[dict] | None) -> list[str]:
    if not skill_states:
        return ["core", "all"]

    unlocked = {
        str(item.get("name") or "").strip().lower()
        for item in skill_states
        if bool(item.get("unlocked"))
    }
    unlocked.add("all")

    # Core should always be available to keep grammar pack non-empty.
    if "core" not in unlocked:
        unlocked.add("core")

    return sorted(unlocked)


def build_grammar_micro_pack(
    skill_states: list[dict] | None,
    lesson_words: list[str],
    limit: int = 5,
) -> Dict[str, Any]:
    """Return grammar micro units aligned with unlocked skills."""
    unlock_levels = _extract_unlocked_levels(skill_states)
    safe_limit = max(1, int(limit))

    rows = repository.get_grammar_micro_units(unlock_levels=unlock_levels, limit=safe_limit)
    items: list[Dict[str, Any]] = [
        {
            "pattern": str(row["pattern"]),
            "descriptionVi": str(row["description_vi"] or ""),
            "exampleSentence": str(row["example_sentence"] or ""),
            "difficultyScore": _safe_float(row["difficulty_score"]),
            "unlockLevel": str(row["unlock_level"] or "all"),
            "seeded": True,
        }
        for row in rows
    ]

    if not items:
        joined_words = ", ".join([str(word) for word in lesson_words[:3]])
        items = [
            {
                "pattern": "I can + V",
                "descriptionVi": "Mau cau dien ta kha nang hoac thoi quen don gian.",
                "exampleSentence": f"I can use: {joined_words}" if joined_words else "I can practice today.",
                "difficultyScore": 0.1,
                "unlockLevel": "core",
                "seeded": False,
            }
        ]

    return {
        "unlockLevels": unlock_levels,
        "items": items,
        "summary": {
            "count": len(items),
            "seededItems": sum(1 for item in items if bool(item.get("seeded"))),
        },
    }
