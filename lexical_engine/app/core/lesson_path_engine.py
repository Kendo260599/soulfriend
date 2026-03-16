"""
core/lesson_path_engine.py - V2 orchestration layer for structured lessons.

Read-only phase responsibilities:
- group vocabulary into skill clusters
- compute skill states and mastery from existing progress data
- recommend next lesson without mutating DB

This module intentionally does not create schema and does not contain UI logic.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Dict, Iterable, List, Tuple

from app.db import repository


SKILL_CORE = "core"
SKILL_PRONUNCIATION = "pronunciation"
SKILL_EMOTIONAL = "emotional"
SKILL_FUNCTIONAL = "functional"
SKILL_RELATIONSHIP = "relationship"

SKILL_ORDER: List[str] = [
    SKILL_CORE,
    SKILL_PRONUNCIATION,
    SKILL_EMOTIONAL,
    SKILL_FUNCTIONAL,
    SKILL_RELATIONSHIP,
]

# Future-ready unlock graph. Current phase uses soft locks only.
SKILL_PREREQUISITES: Dict[str, List[str]] = {
    SKILL_CORE: [],
    SKILL_PRONUNCIATION: [SKILL_CORE],
    SKILL_EMOTIONAL: [SKILL_CORE],
    SKILL_FUNCTIONAL: [SKILL_CORE],
    SKILL_RELATIONSHIP: [SKILL_EMOTIONAL, SKILL_FUNCTIONAL],
}

# Gentle thresholds for SoulFriend style progression.
LEARNING_THRESHOLD = 0.60
MASTERED_THRESHOLD = 0.80
STRICT_SEEDED_MODE_ENV = "LEXICAL_STRICT_SEEDED_MODE"


@dataclass(frozen=True)
class SkillState:
    name: str
    mastery_score: float
    word_count: int
    due_count: int
    unlocked: bool
    state: str  # locked | learning | mastered


@dataclass(frozen=True)
class LessonRecommendation:
    skill: str
    reason: str
    mastery_score: float
    lesson_words: List[str]
    next_unlocks: List[str]


@dataclass(frozen=True)
class LessonPathSnapshot:
    recommendation: LessonRecommendation
    skills: List[SkillState]


def _normalize_token(value: str | None) -> str:
    return (value or "").strip().lower()


def _contains_any(token: str, needles: Iterable[str]) -> bool:
    return any(needle in token for needle in needles)


def _skill_for_word(row) -> str:
    """
    Infer initial skill bucket from existing V1 vocabulary metadata.

    Priority is tuned to keep mapping deterministic and future-migration friendly.
    """
    word = _normalize_token(row["word"])
    emotion_tag = _normalize_token(row["emotion_tag"])
    topic_tag = _normalize_token(row["topic_tag"])
    cefr = _normalize_token(row["cefr_level"])
    pronunciation_difficulty = float(row["pronunciation_difficulty"] or 0.0)

    # Priority rule:
    # 1) explicit relationship metadata
    # 2) explicit emotional metadata
    # 3) pronunciation difficulty / CEFR signal
    # 4) lexical-form fallback
    # This keeps clustering aligned with semantic tags before surface-form heuristics.
    if _contains_any(topic_tag, ["family", "friend", "social", "relationship", "partner"]):
        # Relationship takes precedence when social metadata is explicit.
        return SKILL_RELATIONSHIP

    if _contains_any(emotion_tag, ["emotion", "feel", "care", "fear", "hope", "stress", "calm"]):
        return SKILL_EMOTIONAL

    if pronunciation_difficulty >= 0.72:
        return SKILL_PRONUNCIATION

    if _contains_any(topic_tag, ["daily", "function", "work", "task", "routine", "school"]):
        return SKILL_FUNCTIONAL

    if cefr in {"c1", "c2"} and pronunciation_difficulty >= 0.60:
        return SKILL_PRONUNCIATION

    if _contains_any(word, ["th", "tion", "sion"]):
        return SKILL_PRONUNCIATION

    return SKILL_CORE


def _progress_strength_map() -> Dict[int, float]:
    strength_by_word: Dict[int, float] = {}
    for row in repository.get_all_progress():
        word_id = int(row["word_id"])
        strength_by_word[word_id] = float(row["memory_strength"] or 0.0)
    # Intentionally partial map: unseen/new words are treated as strength=0.0.
    return strength_by_word


def _bucket_words_by_skill() -> Dict[str, list]:
    buckets: Dict[str, list] = {skill: [] for skill in SKILL_ORDER}
    words = repository.get_all_words()

    for row in words:
        skill = _skill_for_word(row)
        buckets.setdefault(skill, []).append(row)

    # Stable order improves reproducibility of recommendations.
    for skill in buckets:
        buckets[skill].sort(key=lambda item: (float(item["difficulty_score"] or 0.0), str(item["word"])))

    return buckets


def _skill_mastery(rows: list, strengths: Dict[int, float]) -> tuple[float, int]:
    if not rows:
        return 0.0, 0

    values: List[float] = []
    due = 0
    for row in rows:
        word_id = int(row["id"])
        score = float(strengths.get(word_id, 0.0))
        values.append(score)
        if score < LEARNING_THRESHOLD:
            due += 1

    avg = sum(values) / len(values)
    return round(avg, 3), due


def _compute_skill_states(
    strengths: Dict[int, float],
    buckets: Dict[str, list],
) -> List[SkillState]:
    """Compute skill states from preloaded context (no extra repository queries)."""

    mastery_index: Dict[str, float] = {}
    due_index: Dict[str, int] = {}
    count_index: Dict[str, int] = {}

    for skill in SKILL_ORDER:
        rows = buckets.get(skill, [])
        mastery, due_count = _skill_mastery(rows, strengths)
        mastery_index[skill] = mastery
        due_index[skill] = due_count
        count_index[skill] = len(rows)

    states: List[SkillState] = []
    for skill in SKILL_ORDER:
        prereqs = SKILL_PREREQUISITES.get(skill, [])
        unlocked = all(mastery_index.get(pre, 0.0) >= LEARNING_THRESHOLD for pre in prereqs)

        if not unlocked:
            state = "locked"
        elif mastery_index[skill] >= MASTERED_THRESHOLD:
            state = "mastered"
        else:
            state = "learning"

        states.append(
            SkillState(
                name=skill,
                mastery_score=mastery_index[skill],
                word_count=count_index[skill],
                due_count=due_index[skill],
                unlocked=unlocked,
                state=state,
            )
        )

    return states


def _build_path_context() -> Tuple[Dict[int, float], Dict[str, list], List[SkillState]]:
    """Single-query pipeline context for recommendation and analytics."""
    strengths = _progress_strength_map()
    buckets = _bucket_words_by_skill()
    states = _compute_skill_states(strengths=strengths, buckets=buckets)
    return strengths, buckets, states


def get_skill_states() -> List[SkillState]:
    """Return read-only skill states computed from V1 vocabulary + progress."""
    _, _, states = _build_path_context()
    return states


def _next_skill(states: List[SkillState]) -> SkillState:
    candidates = [s for s in states if s.unlocked and s.word_count > 0]
    if not candidates:
        # Hard fallback to core if everything is locked.
        return SkillState(
            name=SKILL_CORE,
            mastery_score=0.0,
            word_count=0,
            due_count=0,
            unlocked=True,
            state="learning",
        )

    # Prefer learning skills first, then the weakest mastered one.
    learning = [s for s in candidates if s.state == "learning"]
    target_pool = learning if learning else candidates

    return sorted(
        target_pool,
        key=lambda s: (
            s.mastery_score,
            -s.due_count,
            SKILL_ORDER.index(s.name) if s.name in SKILL_ORDER else 999,
        ),
    )[0]


def _is_strict_seeded_mode(strict_seeded_mode: bool | None) -> bool:
    if strict_seeded_mode is not None:
        return bool(strict_seeded_mode)
    value = str(os.getenv(STRICT_SEEDED_MODE_ENV, "")).strip().lower()
    return value in {"1", "true", "yes", "on"}


def _lesson_words_for_skill(
    skill: str,
    lesson_size: int,
    strengths: Dict[int, float],
    buckets: Dict[str, list],
    strict_seeded_mode: bool | None = None,
) -> List[str]:
    strict_mode = _is_strict_seeded_mode(strict_seeded_mode)
    seeded_rows = repository.get_lesson_words_by_skill(skill, limit=max(lesson_size * 4, 20))
    if seeded_rows:
        rows = seeded_rows
    elif strict_mode:
        rows = []
    else:
        rows = buckets.get(skill, [])

    def _rank_key(row):
        word_id = int(row["id"])
        has_progress = word_id in strengths
        strength = float(strengths.get(word_id, 0.0))
        difficulty = float(row["difficulty_score"] or 0.0)
        unit_order = int(row["lesson_unit_order"] or 9999) if "lesson_unit_order" in row.keys() else 9999

        # Category priority:
        # 0 -> due/weak reviewed words
        # 1 -> new words (no progress yet)
        # 2 -> already stable words
        if has_progress and strength < LEARNING_THRESHOLD:
            category = 0
        elif not has_progress:
            category = 1
        else:
            category = 2

        return (category, unit_order, strength, difficulty, str(row["word"]))

    ranked = sorted(rows, key=_rank_key)
    chosen = ranked[: max(1, lesson_size)]
    return [str(row["word"]) for row in chosen]


def _recommend_next_lesson_from_context(
    strengths: Dict[int, float],
    buckets: Dict[str, list],
    states: List[SkillState],
    lesson_size: int,
    strict_seeded_mode: bool | None = None,
) -> LessonRecommendation:
    """Recommend next lesson from prebuilt context (no extra repository reads)."""
    safe_size = min(15, max(5, int(lesson_size)))
    target = _next_skill(states)

    strict_mode = _is_strict_seeded_mode(strict_seeded_mode)
    words = _lesson_words_for_skill(
        target.name,
        safe_size,
        strengths,
        buckets,
        strict_seeded_mode=strict_mode,
    )
    next_unlocks = [
        s.name for s in states
        if (not s.unlocked) and (target.name in SKILL_PREREQUISITES.get(s.name, []))
    ]

    if not words and strict_mode:
        reason = "Seeded lesson mode is strict and no seeded words found for this skill."
    elif not words:
        reason = "No lesson words found in current path."
    elif target.state == "mastered":
        reason = "Current skill is stable. Continue with gentle reinforcement."
    else:
        reason = "This skill still benefits from light repetition."

    return LessonRecommendation(
        skill=target.name,
        reason=reason,
        mastery_score=target.mastery_score,
        lesson_words=words,
        next_unlocks=sorted(set(next_unlocks), key=lambda s: SKILL_ORDER.index(s) if s in SKILL_ORDER else 999),
    )


def recommend_next_lesson(lesson_size: int = 10, strict_seeded_mode: bool | None = None) -> LessonRecommendation:
    """
    Recommend next lesson from current read-only path state.

    lesson_size is clamped to a gentle range for calm learning rhythm.
    """
    strengths, buckets, states = _build_path_context()
    # Reserved for STEP 2+ persistence: lesson_state_history can store each recommendation snapshot.
    return _recommend_next_lesson_from_context(
        strengths=strengths,
        buckets=buckets,
        states=states,
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )


def get_lesson_path_snapshot(lesson_size: int = 10, strict_seeded_mode: bool | None = None) -> LessonPathSnapshot:
    """Return full read-only lesson path state for orchestration/UI consumption."""
    strengths, buckets, skills = _build_path_context()
    recommendation = _recommend_next_lesson_from_context(
        strengths=strengths,
        buckets=buckets,
        states=skills,
        lesson_size=lesson_size,
        strict_seeded_mode=strict_seeded_mode,
    )
    return LessonPathSnapshot(recommendation=recommendation, skills=skills)


def get_skill_distribution() -> Dict[str, int]:
    """Return skill-to-word-count distribution for UI and analytics layers."""
    buckets = _bucket_words_by_skill()
    return {skill: len(buckets.get(skill, [])) for skill in SKILL_ORDER}
