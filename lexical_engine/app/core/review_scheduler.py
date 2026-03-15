"""
core/review_scheduler.py — Review scheduling authority.

Decides which words are due for review and persists SM-2 scheduling data.
No UI, no quiz logic — only scheduling decisions and DB writes.
"""
from __future__ import annotations

import sqlite3
from app.db import repository
from app.core import memory_engine


def get_due_words(limit: int = 20) -> list[sqlite3.Row]:
    """Return vocabulary rows whose next_review is <= now UTC, oldest first."""
    return repository.get_due_words(limit=limit)


def get_new_words(limit: int = 10) -> list[sqlite3.Row]:
    """Return vocabulary rows that have never been reviewed (no progress row)."""
    all_words = repository.get_all_words()
    all_progress = repository.get_all_progress()
    seen_ids = {p["word_id"] for p in all_progress}
    return [w for w in all_words if w["id"] not in seen_ids][:limit]


def schedule_after_answer(
    word_id: int,
    is_correct: bool,
    new_strength: float,
    correct_count: int,
    wrong_count: int,
) -> str:
    """
    Compute SM-2 next state and persist the full progress record.
    Returns the next_review datetime string.
    Called by quiz_engine.submit_answer after every answer.
    """
    progress = repository.get_progress(word_id)
    if progress is not None:
        interval = progress["interval_days"] or memory_engine.FIRST_INTERVAL
        ease = progress["ease_factor"] or memory_engine.DEFAULT_EASE
    else:
        interval = memory_engine.FIRST_INTERVAL
        ease = memory_engine.DEFAULT_EASE

    new_interval, new_ease = memory_engine.compute_next_state(interval, ease, is_correct)
    next_review = memory_engine.next_review_datetime(new_interval)

    repository.upsert_progress(
        word_id, new_strength, correct_count, wrong_count,
        next_review=next_review,
        interval_days=new_interval,
        ease_factor=new_ease,
    )
    return next_review
