"""Shared utility functions for the English Foundation core engines."""

from __future__ import annotations

from typing import TypeVar

T = TypeVar("T")


def difficulty_from_level(level: float) -> int:
    """Map a continuous learner level (0.0–1.0) to a discrete difficulty tier.

    Returns 1 (easy), 2 (medium), or 3 (hard).
    """
    if level < 0.35:
        return 1
    if level < 0.7:
        return 2
    return 3


def slice_wrap(items: list[T], start: int, size: int) -> list[T]:
    """Return *size* items from *items* beginning at *start*, wrapping around.

    Returns an empty list when *items* is empty or *size* <= 0.
    """
    if not items or size <= 0:
        return []
    result: list[T] = []
    idx = max(0, start)
    for _ in range(size):
        result.append(items[idx % len(items)])
        idx += 1
    return result
