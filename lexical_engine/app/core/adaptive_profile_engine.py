"""Adaptive learner profile snapshot for Phase-2 orchestration.

Read-only responsibilities:
- compute profile signals from existing lexical/progress/pronunciation data
- expose stable JSON-safe payload for recommendation layers
- compare current snapshot with latest historical profile snapshot
"""

from __future__ import annotations

from typing import Any, Dict

from app.db import repository


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _safe_float(value: Any) -> float:
    return float(value or 0.0)


def _safe_int(value: Any) -> int:
    return int(value or 0)


def _compute_signals() -> Dict[str, float]:
    progress_rows = repository.get_all_progress()
    pronunciation = repository.get_pronunciation_progress_metrics()

    tracked_words = len(progress_rows)
    avg_memory = (
        sum(_safe_float(row["memory_strength"]) for row in progress_rows) / tracked_words
        if tracked_words > 0
        else 0.0
    )

    lexical_level = _clamp01(avg_memory)

    # Proxy grows with memory stability and amount of tracked vocabulary.
    tracked_ratio = _clamp01(tracked_words / 80.0)
    grammar_readiness_proxy = _clamp01((avg_memory * 0.7) + (tracked_ratio * 0.3))

    pronunciation_level = _clamp01(_safe_float(pronunciation.get("avg_score_all")) / 100.0)

    response_confidence_proxy = _clamp01((lexical_level * 0.6) + (pronunciation_level * 0.4))
    hesitation_level = _clamp01(1.0 - response_confidence_proxy)

    return {
        "lexicalLevel": round(lexical_level, 4),
        "grammarReadinessProxy": round(grammar_readiness_proxy, 4),
        "pronunciationLevel": round(pronunciation_level, 4),
        "responseConfidenceProxy": round(response_confidence_proxy, 4),
        "hesitationLevel": round(hesitation_level, 4),
    }


def _latest_history_snapshot() -> Dict[str, Any] | None:
    history = repository.get_learner_profile_history(limit=1)
    if not history:
        return None

    row = history[0]
    return {
        "lexicalLevel": round(_safe_float(row["lexical_level"]), 4),
        "grammarReadinessProxy": round(_safe_float(row["grammar_readiness_proxy"]), 4),
        "pronunciationLevel": round(_safe_float(row["pronunciation_level"]), 4),
        "responseConfidenceProxy": round(_safe_float(row["response_confidence_proxy"]), 4),
        "hesitationLevel": round(_safe_float(row["hesitation_level"]), 4),
        "createdAt": str(row["created_at"] or ""),
    }


def get_profile_payload() -> Dict[str, Any]:
    """Return current adaptive profile and historical delta if available."""
    current = _compute_signals()
    previous = _latest_history_snapshot()

    if previous is None:
        delta = {
            "lexicalLevel": 0.0,
            "grammarReadinessProxy": 0.0,
            "pronunciationLevel": 0.0,
            "responseConfidenceProxy": 0.0,
            "hesitationLevel": 0.0,
        }
    else:
        delta = {
            "lexicalLevel": round(current["lexicalLevel"] - _safe_float(previous.get("lexicalLevel")), 4),
            "grammarReadinessProxy": round(current["grammarReadinessProxy"] - _safe_float(previous.get("grammarReadinessProxy")), 4),
            "pronunciationLevel": round(current["pronunciationLevel"] - _safe_float(previous.get("pronunciationLevel")), 4),
            "responseConfidenceProxy": round(current["responseConfidenceProxy"] - _safe_float(previous.get("responseConfidenceProxy")), 4),
            "hesitationLevel": round(current["hesitationLevel"] - _safe_float(previous.get("hesitationLevel")), 4),
        }

    return {
        "current": current,
        "previous": previous,
        "delta": delta,
        "meta": {
            "trackedWords": _safe_int(len(repository.get_all_progress())),
            "historyCount": _safe_int(len(repository.get_learner_profile_history(limit=30))),
        },
    }
