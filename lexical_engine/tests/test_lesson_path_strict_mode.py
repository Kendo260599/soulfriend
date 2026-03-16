"""Tests for strict seeded mode and fallback parity in lesson path engine."""

from __future__ import annotations

from app.core import lesson_path_engine


def test_lesson_words_fallback_when_not_strict() -> None:
    strengths = {}
    buckets = {
        lesson_path_engine.SKILL_CORE: [
            {"id": 1, "word": "alpha", "difficulty_score": 0.1},
            {"id": 2, "word": "beta", "difficulty_score": 0.2},
        ]
    }

    words = lesson_path_engine._lesson_words_for_skill(
        skill=lesson_path_engine.SKILL_CORE,
        lesson_size=2,
        strengths=strengths,
        buckets=buckets,
        strict_seeded_mode=False,
    )

    assert words == ["alpha", "beta"]


def test_lesson_words_empty_when_strict_and_no_seed() -> None:
    strengths = {}
    buckets = {
        lesson_path_engine.SKILL_CORE: [
            {"id": 1, "word": "alpha", "difficulty_score": 0.1},
        ]
    }

    words = lesson_path_engine._lesson_words_for_skill(
        skill=lesson_path_engine.SKILL_CORE,
        lesson_size=2,
        strengths=strengths,
        buckets=buckets,
        strict_seeded_mode=True,
    )

    assert words == []
