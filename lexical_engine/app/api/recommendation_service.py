"""Canonical recommendation API.

Day 3 boundary goals:
- provide next lesson recommendation payload
- combine lexical and progress context with deterministic rule-based logic
- keep room for adaptive_profile_engine integration later (no AI expansion now)
"""

from __future__ import annotations

from typing import Any, Dict

from app.api import lexical_service, progress_service


def recommend_next_payload(lesson_size: int = 10, strict_seeded_mode: bool | None = None) -> Dict[str, Any]:
    home_payload = lexical_service.get_home_payload(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    progress_summary = progress_service.get_progress_summary_payload()
    due_summary = progress_service.get_due_words_summary(limit=20)

    due_count = int(due_summary.get("dueCount", 0) or 0)
    focus = "review" if due_count > 0 else "learn"

    reason = str(home_payload["lesson"]["reason"])
    if focus == "review":
        reason = f"{reason} Prioritize review first because {due_count} words are due."

    return {
        "focus": focus,
        "dueCount": due_count,
        "nextLesson": home_payload["lesson"],
        "skillStates": home_payload["skills"],
        "summary": home_payload["summary"],
        "progress": {
            "trackedWords": progress_summary["trackedWords"],
            "learnedWords": progress_summary["learnedWords"],
            "avgMemoryPercent": progress_summary["avgMemoryPercent"],
        },
        "reason": reason,
    }


def get_home_recommendation_payload(
    lesson_size: int = 10,
    strict_seeded_mode: bool | None = None,
) -> Dict[str, Any]:
    """Canonical recommendation contract for home/dashboard consumers."""
    recommendation = recommend_next_payload(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    return {
        "recommendation": recommendation,
        "mode": recommendation["focus"],
        "summary": recommendation["summary"],
    }


def example_payload() -> Dict[str, Any]:
    """Small sample payload for docs/debugging."""
    return recommend_next_payload(lesson_size=8)
