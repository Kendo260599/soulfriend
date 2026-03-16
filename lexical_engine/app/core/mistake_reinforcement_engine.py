"""
core/mistake_reinforcement_engine.py - V2 recovery loop orchestration.

Responsibilities:
- detect repeated mistakes
- cluster recurring wrong patterns
- generate reinforcement mini-lesson suggestions

Design constraints:
- no UI logic
- no schema creation
- does not rewrite V1 answer checking or memory scheduling
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from app.db import repository


REPEATED_MISTAKE_THRESHOLD = 3
LOW_PRONUNCIATION_SCORE = 60


@dataclass(frozen=True)
class MistakeItem:
    word_id: int
    word: str
    mistake_type: str
    count: int
    severity: str


@dataclass(frozen=True)
class ReinforcementPlan:
    session_id: str
    words: List[str]
    source: str
    summary: str


def _severity_from_count(count: int) -> str:
    if count >= 8:
        return "high"
    if count >= 4:
        return "medium"
    return "low"


def _word_index() -> Dict[int, str]:
    return {int(row["id"]): str(row["word"]) for row in repository.get_all_words()}


def _wrong_count_mistakes(threshold: int) -> Dict[int, int]:
    result: Dict[int, int] = {}
    for row in repository.get_all_progress():
        wrong_count = int(row["wrong_count"] or 0)
        word_id = int(row["word_id"])
        if wrong_count >= threshold:
            result[word_id] = wrong_count
    return result


def _pronunciation_mistakes() -> Dict[int, int]:
    """
    Aggregate low-score pronunciation attempts by word_id from V1 history.

    This keeps V2 read-compatible with existing telemetry while dedicated
    mistake_log table is populated in later orchestration flows.
    """
    result: Dict[int, int] = {}
    for row in repository.get_pronunciation_history(limit=500):
        word_id = row["word_id"]
        score = row["score"]
        if word_id is None or score is None:
            continue
        if int(score) < LOW_PRONUNCIATION_SCORE:
            key = int(word_id)
            result[key] = result.get(key, 0) + 1
    return result


def detect_repeated_mistakes(threshold: int = REPEATED_MISTAKE_THRESHOLD) -> List[MistakeItem]:
    """
    Return repeated mistake items across quiz and pronunciation channels.

    - quiz mistakes are derived from progress.wrong_count
    - pronunciation mistakes are derived from low-score history
    """
    threshold = max(1, int(threshold))
    words = _word_index()

    quiz_mistakes = _wrong_count_mistakes(threshold)
    pron_mistakes = _pronunciation_mistakes()

    items: List[MistakeItem] = []

    for word_id, count in quiz_mistakes.items():
        items.append(
            MistakeItem(
                word_id=word_id,
                word=words.get(word_id, f"word_{word_id}"),
                mistake_type="quiz_recall",
                count=count,
                severity=_severity_from_count(count),
            )
        )

    for word_id, count in pron_mistakes.items():
        if count < threshold:
            continue
        items.append(
            MistakeItem(
                word_id=word_id,
                word=words.get(word_id, f"word_{word_id}"),
                mistake_type="pronunciation",
                count=count,
                severity=_severity_from_count(count),
            )
        )

    items.sort(key=lambda item: (-item.count, item.word))
    return items


def cluster_recurring_mistakes(threshold: int = REPEATED_MISTAKE_THRESHOLD) -> Dict[str, List[MistakeItem]]:
    """Group repeated mistakes into stable clusters for recovery planning."""
    items = detect_repeated_mistakes(threshold=threshold)

    clusters: Dict[str, List[MistakeItem]] = {
        "quiz_recall": [],
        "pronunciation": [],
    }
    for item in items:
        clusters.setdefault(item.mistake_type, []).append(item)

    return clusters


def _ordered_reinforcement_candidates(limit: int) -> List[MistakeItem]:
    clusters = cluster_recurring_mistakes()
    combined = clusters.get("quiz_recall", []) + clusters.get("pronunciation", [])

    # Merge same word across channels and keep highest pressure first.
    merged: Dict[int, MistakeItem] = {}
    for item in combined:
        existing = merged.get(item.word_id)
        if existing is None:
            merged[item.word_id] = item
            continue

        merged[item.word_id] = MistakeItem(
            word_id=item.word_id,
            word=item.word,
            mistake_type="mixed" if existing.mistake_type != item.mistake_type else item.mistake_type,
            count=existing.count + item.count,
            severity=_severity_from_count(existing.count + item.count),
        )

    ranked = sorted(merged.values(), key=lambda x: (-x.count, x.word))
    return ranked[: max(1, int(limit))]


def build_reinforcement_mini_lesson(limit: int = 8) -> ReinforcementPlan:
    """
    Build a lightweight recovery mini-lesson suggestion.

    Rule: words with repeated failures are moved to reinforcement queue first.
    """
    candidates = _ordered_reinforcement_candidates(limit=limit)
    words = [item.word for item in candidates]

    if words:
        summary = "Next lesson is ready: focused recovery words selected from repeated mistakes."
    else:
        summary = "No repeated mistakes detected. Continue with regular lesson path."

    return ReinforcementPlan(
        session_id=f"reinforce-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        words=words,
        source="mistake_reinforcement_engine",
        summary=summary,
    )
