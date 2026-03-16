"""Canonical lexical read API.

Day 1 boundary goals:
- expose lesson_path_engine data as JSON-safe payloads
- expose skill states and recommendation snapshots
- keep core as canonical source of truth

Rules:
- no UI imports
- no tkinter imports
- no DB mutations
"""

from __future__ import annotations

from typing import Any, Dict

from app.core import (
    adaptive_profile_engine,
    grammar_micro_engine,
    lesson_path_engine,
    phrase_engine,
    quiz_engine,
)
from app.db import repository


PHASE2_PHRASE_UNLOCK_MIN = 0.45
PHASE2_GRAMMAR_UNLOCK_MIN = 0.50
PHASE2_MIN_PHRASE_PER_WORD = 1
PHASE2_MAX_PHRASE_PER_WORD = 3
PHASE2_MIN_GRAMMAR_ITEMS = 1
PHASE2_MAX_GRAMMAR_ITEMS = 8


def _skill_state_payload(state: lesson_path_engine.SkillState) -> Dict[str, Any]:
    return {
        "name": state.name,
        "masteryScore": float(state.mastery_score),
        "wordCount": int(state.word_count),
        "dueCount": int(state.due_count),
        "unlocked": bool(state.unlocked),
        "state": state.state,
    }


def _recommendation_payload(recommendation: lesson_path_engine.LessonRecommendation) -> Dict[str, Any]:
    return {
        "skill": recommendation.skill,
        "reason": recommendation.reason,
        "masteryScore": float(recommendation.mastery_score),
        "lessonWords": list(recommendation.lesson_words),
        "nextUnlocks": list(recommendation.next_unlocks),
    }


def _quiz_item_payload(item: quiz_engine.QuizItem) -> Dict[str, Any]:
    # Keep this mapping explicit so API fields are always traceable to QuizItem.
    return {
        "wordId": int(item.word_id),
        "word": item.word,
        "ipa": item.ipa,
        "choices": list(item.choices),
        "correctAnswer": item.correct_answer,
    }


def _summary_payload(skills: list[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(skills)
    unlocked = sum(1 for item in skills if bool(item.get("unlocked")))
    mastered = sum(1 for item in skills if str(item.get("state", "")) == "mastered")
    return {
        "totalSkills": total,
        "unlockedSkills": unlocked,
        "masteredSkills": mastered,
    }


def _clamp_int(value: int, low: int, high: int) -> int:
    return min(high, max(low, int(value)))


def _phase2_flow_payload(home: Dict[str, Any], adaptive_profile: Dict[str, Any]) -> Dict[str, Any]:
    current = dict(adaptive_profile.get("current", {}))
    lexical_level = float(current.get("lexicalLevel") or 0.0)
    grammar_readiness = float(current.get("grammarReadinessProxy") or 0.0)

    phrase_unlocked = lexical_level >= PHASE2_PHRASE_UNLOCK_MIN
    grammar_unlocked = phrase_unlocked and (grammar_readiness >= PHASE2_GRAMMAR_UNLOCK_MIN)

    stage = "foundation"
    if phrase_unlocked:
        stage = "phrase"
    if grammar_unlocked:
        stage = "grammar"

    return {
        "stage": stage,
        "phraseUnlocked": phrase_unlocked,
        "grammarUnlocked": grammar_unlocked,
        "thresholds": {
            "phraseUnlockMin": PHASE2_PHRASE_UNLOCK_MIN,
            "grammarUnlockMin": PHASE2_GRAMMAR_UNLOCK_MIN,
        },
        "signals": {
            "lexicalLevel": round(lexical_level, 4),
            "grammarReadinessProxy": round(grammar_readiness, 4),
            "unlockedSkills": int(home.get("summary", {}).get("unlockedSkills") or 0),
        },
    }


def _phase2_unlock_levels_from_home(home: Dict[str, Any]) -> list[str]:
    levels = {
        str(item.get("name") or "").strip().lower()
        for item in list(home.get("skills", []))
        if bool(item.get("unlocked"))
    }
    levels.add("all")
    levels.add("core")
    return sorted(level for level in levels if level)


def get_skill_states_payload() -> Dict[str, Any]:
    """Expose lesson_path_engine.get_skill_states() as JSON-safe payload."""
    states = lesson_path_engine.get_skill_states()
    return {
        "skills": [_skill_state_payload(item) for item in states],
        "totalSkills": len(states),
    }


def get_lesson_recommendation_payload(
    lesson_size: int = 10,
    strict_seeded_mode: bool | None = None,
) -> Dict[str, Any]:
    """Expose lesson_path_engine.recommend_next_lesson() as JSON-safe payload."""
    recommendation = lesson_path_engine.recommend_next_lesson(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    return {
        "recommendation": _recommendation_payload(recommendation),
        "requestedLessonSize": int(lesson_size),
        "strictSeededMode": strict_seeded_mode,
    }


def get_lesson_path_snapshot_payload(
    lesson_size: int = 10,
    strict_seeded_mode: bool | None = None,
) -> Dict[str, Any]:
    """Expose lesson_path_engine.get_lesson_path_snapshot() and distribution payload."""
    snapshot = lesson_path_engine.get_lesson_path_snapshot(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    return {
        "recommendation": _recommendation_payload(snapshot.recommendation),
        "skills": [_skill_state_payload(item) for item in snapshot.skills],
        "skillDistribution": lesson_path_engine.get_skill_distribution(),
    }


def get_home_payload(
    lesson_size: int = 10,
    strict_seeded_mode: bool | None = None,
) -> Dict[str, Any]:
    """Canonical home contract for React consumers.

    Returns a stable aggregate payload:
    {
      "lesson": {...},
      "skills": [...],
      "summary": {...}
    }
    """
    snapshot = get_lesson_path_snapshot_payload(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    skills = list(snapshot["skills"])
    return {
        "lesson": dict(snapshot["recommendation"]),
        "skills": skills,
        "summary": _summary_payload(skills),
    }


def get_phase2_home_payload(
    lesson_size: int = 10,
    strict_seeded_mode: bool | None = None,
    phrase_limit_per_word: int = 2,
    grammar_limit: int = 5,
) -> Dict[str, Any]:
    """Phase-2 aggregate contract based on canonical home payload."""
    home = get_home_payload(
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    lesson_words = list(home["lesson"].get("lessonWords", []))

    safe_phrase_limit = _clamp_int(
        phrase_limit_per_word,
        PHASE2_MIN_PHRASE_PER_WORD,
        PHASE2_MAX_PHRASE_PER_WORD,
    )
    safe_grammar_limit = _clamp_int(
        grammar_limit,
        PHASE2_MIN_GRAMMAR_ITEMS,
        PHASE2_MAX_GRAMMAR_ITEMS,
    )

    adaptive_profile = adaptive_profile_engine.get_profile_payload()
    phase2_flow = _phase2_flow_payload(home=home, adaptive_profile=adaptive_profile)

    phrase_unlocked = bool(phase2_flow.get("phraseUnlocked"))
    grammar_unlocked = bool(phase2_flow.get("grammarUnlocked"))

    if phrase_unlocked:
        phrase_pack = phrase_engine.build_phrase_pack(
            lesson_words=lesson_words,
            phrases_per_word=safe_phrase_limit,
        )
    else:
        phrase_pack = {
            "items": [],
            "summary": {
                "requestedWords": len(lesson_words),
                "coveredWords": 0,
                "seededItems": 0,
                "fallbackItems": 0,
                "locked": True,
                "lockReason": "Phrase drill unlocks when lexicalLevel reaches 0.45.",
            },
        }

    if grammar_unlocked:
        grammar_pack = grammar_micro_engine.build_grammar_micro_pack(
            skill_states=list(home["skills"]),
            lesson_words=lesson_words,
            limit=safe_grammar_limit,
        )
    else:
        grammar_pack = {
            "unlockLevels": _phase2_unlock_levels_from_home(home),
            "items": [],
            "summary": {
                "count": 0,
                "seededItems": 0,
                "locked": True,
                "lockReason": "Grammar micro unlocks after phrase stage and grammar readiness >= 0.50.",
            },
        }

    adaptive_meta = dict(adaptive_profile.get("meta", {}))
    adaptive_profile = {
        **adaptive_profile,
        "meta": {
            **adaptive_meta,
            "phase2Flow": phase2_flow,
            "appliedLimits": {
                "phraseLimitPerWord": safe_phrase_limit,
                "grammarLimit": safe_grammar_limit,
            },
        },
    }

    return {
        "home": home,
        "phrasePack": phrase_pack,
        "grammarPack": grammar_pack,
        "adaptiveProfile": adaptive_profile,
    }


def get_quiz_batch_payload(batch_size: int = 10, mode: str = "learn") -> Dict[str, Any]:
    """Read-only quiz payload for UI/API clients.

    mode:
    - "learn": weakest-memory-first batch
    - "review": due-word review batch
    """
    if str(mode).lower().strip() == "review":
        items = quiz_engine.get_review_batch(batch_size=batch_size)
        resolved_mode = "review"
    else:
        items = quiz_engine.get_quiz_batch(batch_size=batch_size)
        resolved_mode = "learn"

    return {
        "mode": resolved_mode,
        "batchSize": int(batch_size),
        "items": [_quiz_item_payload(item) for item in items],
        "total": len(items),
    }


def submit_quiz_answer_payload(word_id: int, is_correct: bool) -> Dict[str, Any]:
    """Compatibility write helper that delegates to canonical quiz_engine submit flow."""
    safe_word_id = int(word_id)
    new_strength = float(quiz_engine.submit_answer(safe_word_id, bool(is_correct)))
    progress = repository.get_progress(safe_word_id)

    return {
        "wordId": safe_word_id,
        "isCorrect": bool(is_correct),
        "memoryStrength": round(new_strength, 4),
        "intervalDays": int(progress["interval_days"] or 0) if progress else 0,
    }


def example_payload() -> Dict[str, Any]:
    """Small sample payload for docs/debugging."""
    return get_lesson_path_snapshot_payload(lesson_size=8)
