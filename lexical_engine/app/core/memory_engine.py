"""
core/memory_engine.py — SM-2 inspired memory algorithm.

Pure calculation module.  No DB calls, no UI, no side effects.
SM-2 simplified for binary correct / wrong answers:
    correct → quality 4  (original SM-2 scale: 0–5)
    wrong   → quality 1
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

# ------------------------------------------------------------------ #
# Constants                                                            #
# ------------------------------------------------------------------ #

DEFAULT_EASE: float = 2.5   # initial ease factor for every word
MIN_EASE:     float = 1.3   # SM-2 lower bound
MAX_EASE:     float = 3.0   # upper cap to prevent unbounded interval growth

FIRST_INTERVAL:  int = 1    # days — first review interval (or after any wrong answer)
SECOND_INTERVAL: int = 6    # days — after first correct, before scaling kicks in


# ------------------------------------------------------------------ #
# Core algorithm                                                       #
# ------------------------------------------------------------------ #

def compute_next_state(
    interval_days: int,
    ease_factor: float,
    is_correct: bool,
) -> tuple[int, float]:
    """
    Return (new_interval_days, new_ease_factor).

    Wrong answer  → interval resets to FIRST_INTERVAL, ease drops 0.20 (floor: MIN_EASE)
    Correct answer → interval grows × ease_factor,    ease rises 0.05 (cap: MAX_EASE)
    """
    if not is_correct:
        return FIRST_INTERVAL, max(MIN_EASE, ease_factor - 0.20)

    # Correct answer — grow interval
    if interval_days <= 1:
        new_interval = SECOND_INTERVAL
    else:
        new_interval = max(SECOND_INTERVAL, round(interval_days * ease_factor))

    new_ease = min(MAX_EASE, ease_factor + 0.05)
    return new_interval, new_ease


# ------------------------------------------------------------------ #
# Datetime helpers                                                     #
# ------------------------------------------------------------------ #

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _fmt(dt: datetime) -> str:
    """Format to SQLite-compatible string: 'YYYY-MM-DD HH:MM:SS' (UTC, no T separator)."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def next_review_datetime(interval_days: int) -> str:
    """Return UTC datetime string `interval_days` from now in SQLite-compatible format."""
    return _fmt(_utc_now() + timedelta(days=interval_days))


def past_review_datetime(days_ago: int = 1) -> str:
    """Return UTC datetime string `days_ago` in the past. Useful for tests and manual seeding."""
    return _fmt(_utc_now() - timedelta(days=days_ago))
