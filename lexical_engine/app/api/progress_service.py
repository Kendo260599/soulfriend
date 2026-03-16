"""Canonical progress read API.

Day 2 boundary goals:
- expose progress summary and pronunciation trends
- expose due-word summary and lightweight learning analytics
- output JSON-safe dictionaries for cross-platform clients
"""

from __future__ import annotations

from typing import Any, Dict, List

from app.core.pronunciation_scoring import score_pronunciation
from app.db import repository


def _safe_float(value: Any) -> float:
    return float(value or 0.0)


def _safe_int(value: Any) -> int:
    return int(value or 0)


def _safe_ratio(numerator: Any, denominator: Any) -> float:
    num = _safe_float(numerator)
    den = _safe_float(denominator)
    if den <= 0.0:
        return 0.0
    return max(0.0, min(1.0, num / den))


def get_due_words_summary(limit: int = 20) -> Dict[str, Any]:
    safe_limit = max(1, int(limit))
    rows = repository.get_due_words(limit=safe_limit)

    return {
        "dueCount": len(rows),
        "limit": safe_limit,
        "dueWords": [
            {
                "id": _safe_int(row["id"]),
                "word": str(row["word"]),
                "cefrLevel": str(row["cefr_level"]),
                "difficultyScore": _safe_float(row["difficulty_score"]),
            }
            for row in rows
        ],
    }


def get_weak_words_payload(limit: int = 10) -> Dict[str, Any]:
    """Return weakest tracked words by memory strength for targeted review."""
    safe_limit = max(1, int(limit))
    words = {int(row["id"]): row for row in repository.get_all_words()}

    candidates: List[Dict[str, Any]] = []
    for row in repository.get_all_progress():
        word_id = _safe_int(row["word_id"])
        vocab = words.get(word_id)
        if vocab is None:
            continue

        candidates.append(
            {
                "id": word_id,
                "word": str(vocab["word"]),
                "cefrLevel": str(vocab["cefr_level"]),
                "memoryStrength": _safe_float(row["memory_strength"]),
                "correctCount": _safe_int(row["correct_count"]),
                "wrongCount": _safe_int(row["wrong_count"]),
            }
        )

    candidates.sort(
        key=lambda item: (
            item["memoryStrength"],
            -item["wrongCount"],
            item["word"],
        )
    )

    return {
        "limit": safe_limit,
        "weakWords": candidates[:safe_limit],
    }


def get_progress_summary_payload(target_word: str | None = None) -> Dict[str, Any]:
    words = repository.get_all_words()
    progress_rows = repository.get_all_progress()
    due_rows = repository.get_due_words(limit=1000)
    pronunciation_metrics = repository.get_pronunciation_progress_metrics(target_word=target_word)

    tracked_word_ids = {int(row["word_id"]) for row in progress_rows}
    learned_words = sum(
        1
        for row in progress_rows
        if _safe_float(row["memory_strength"]) >= 0.60
    )

    avg_memory_strength = 0.0
    if progress_rows:
        avg_memory_strength = sum(_safe_float(row["memory_strength"]) for row in progress_rows) / len(progress_rows)

    return {
        "targetWord": target_word,
        "vocabularyTotal": len(words),
        "trackedWords": len(tracked_word_ids),
        "learnedWords": learned_words,
        "dueWords": len(due_rows),
        "avgMemoryStrength": round(avg_memory_strength, 4),
        "avgMemoryPercent": round(avg_memory_strength * 100, 2),
        "pronunciation": dict(pronunciation_metrics),
    }


def get_word_progress_payload(word_id: int) -> Dict[str, Any]:
    row = repository.get_progress(int(word_id))
    if row is None:
        return {
            "wordId": int(word_id),
            "exists": False,
            "memoryStrength": 0.0,
            "intervalDays": 0,
            "correctCount": 0,
            "wrongCount": 0,
        }

    return {
        "wordId": int(word_id),
        "exists": True,
        "memoryStrength": _safe_float(row["memory_strength"]),
        "intervalDays": _safe_int(row["interval_days"]),
        "correctCount": _safe_int(row["correct_count"]),
        "wrongCount": _safe_int(row["wrong_count"]),
    }


def get_pronunciation_trend_payload(target_word: str | None = None, days: int = 14) -> Dict[str, Any]:
    safe_days = max(1, int(days))
    return {
        "targetWord": target_word,
        "days": safe_days,
        "metrics": repository.get_pronunciation_progress_metrics(target_word=target_word),
        "dailyAverages": repository.get_pronunciation_daily_averages(target_word=target_word, days=safe_days),
        "wordTrends": repository.get_pronunciation_word_trends(limit=5),
        "practiceRecommendations": repository.get_practice_recommendations(limit=3),
    }


def get_pronunciation_history_payload(target_word: str | None = None, limit: int = 120) -> Dict[str, Any]:
    rows = repository.get_pronunciation_history(limit=max(1, int(limit)), target_word=target_word)
    return {
        "targetWord": target_word,
        "history": [
            {
                "createdAt": str(row["created_at"] or ""),
                "targetWord": str(row["target_word"] or ""),
                "score": int(row["score"] or 0) if row["score"] is not None else None,
                "recognizedText": str(row["recognized_text"] or ""),
            }
            for row in rows
        ],
    }


def get_pronunciation_words_payload() -> Dict[str, Any]:
    return {
        "words": repository.get_pronunciation_words(),
    }


def get_learning_analytics_payload(target_word: str | None = None) -> Dict[str, Any]:
    summary = get_progress_summary_payload(target_word=target_word)
    trend = get_pronunciation_trend_payload(target_word=target_word, days=14)
    due = get_due_words_summary(limit=20)

    return {
        "summary": summary,
        "pronunciationTrend": trend,
        "dueWords": due,
    }


def get_dashboard_payload(
    target_word: str | None = None,
    days: int = 14,
    due_limit: int = 20,
    weak_limit: int = 10,
) -> Dict[str, Any]:
    """Canonical progress contract for API/UI consumers.

    Returns stable aggregate payload for screen-level rendering:
    - due review count
    - weak words
    - pronunciation trend
    - recent progress summary
    """
    summary = get_progress_summary_payload(target_word=target_word)
    due = get_due_words_summary(limit=due_limit)
    weak = get_weak_words_payload(limit=weak_limit)
    trend = get_pronunciation_trend_payload(target_word=target_word, days=days)

    pronunciation_metrics = dict(trend.get("metrics", {}))
    total_correct = sum(_safe_int(row["correct_count"]) for row in repository.get_all_progress())
    total_wrong = sum(_safe_int(row["wrong_count"]) for row in repository.get_all_progress())
    recent_accuracy = _safe_ratio(total_correct, total_correct + total_wrong)
    recent = {
        "attempts7d": _safe_int(pronunciation_metrics.get("attempts_7d")),
        "activeDays7d": _safe_int(pronunciation_metrics.get("active_days_7d")),
        "avgScore7d": _safe_float(pronunciation_metrics.get("avg_score_7d")),
        "recentAccuracy": round(recent_accuracy, 4),
        "trendDirection": str(pronunciation_metrics.get("trend_direction") or "flat"),
    }

    return {
        "summary": summary,
        "dueReview": {
            "count": _safe_int(due.get("dueCount")),
            "words": list(due.get("dueWords", [])),
        },
        "weakWords": list(weak.get("weakWords", [])),
        "pronunciationTrend": trend,
        "recent": recent,
    }


def score_and_record_pronunciation_payload(
    target_word: str,
    recognized_text: str | None,
    audio_path: str | None,
    transcription_model: str,
) -> Dict[str, Any]:
    target = str(target_word or "").strip()
    recognized = str(recognized_text or "")

    scoring = score_pronunciation(target, recognized)
    rubric = {
        "char_score": scoring.char_score,
        "ending_score": scoring.ending_score,
        "stress_score": scoring.stress_score,
        "phrase_score": scoring.phrase_score,
    }
    word_id = repository.get_word_id_by_word(target)

    repository.insert_pronunciation_history(
        target_word=target,
        recognized_text=recognized,
        score=scoring.score,
        feedback=scoring.feedback,
        audio_path=audio_path,
        transcription_model=transcription_model,
        rubric=rubric,
        word_id=word_id,
    )

    return {
        "result": {
            "target": scoring.target_normalized,
            "recognized": scoring.recognized_normalized,
            "score": scoring.score,
            "feedback": scoring.feedback,
            "rubric": rubric,
        },
        "progress": get_progress_summary_payload(),
        "history": get_pronunciation_trend_payload(days=14),
    }


def example_payload() -> Dict[str, Any]:
    """Small sample payload for docs/debugging."""
    return get_learning_analytics_payload()
