"""
core/difficulty_engine.py — Session word selection authority.

Selects appropriate words for learning sessions based on difficulty score
and current memory state.  No UI, no DB schema creation, no quiz logic.
"""
from __future__ import annotations

import sqlite3
from app.core import review_scheduler


def get_learn_words(n: int = 10) -> list[sqlite3.Row]:
    """Return n new (unseen) words ordered by difficulty_score ascending."""
    return review_scheduler.get_new_words(limit=n)


def get_review_words(n: int = 20) -> list[sqlite3.Row]:
    """Return n words currently due for review, oldest-due first."""
    return review_scheduler.get_due_words(limit=n)


def get_session_words(n: int = 10) -> list[sqlite3.Row]:
    """
    Build a mixed session:
      Step 1 — fill with due review words (most urgent)
      Step 2 — fill remaining slots with new unseen words
    """
    due = get_review_words(n=n)
    remainder = n - len(due)
    if remainder > 0:
        new_words = get_learn_words(n=remainder)
        return list(due) + new_words
    return list(due)
