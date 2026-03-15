"""
tests/test_memory_engine.py — Unit tests for core/memory_engine.py.
DB isolation is handled by conftest.py (isolated_db autouse fixture).
memory_engine is pure logic — no DB needed, but isolation still runs.
"""
import pytest
from app.core.memory_engine import (
    compute_next_state,
    next_review_datetime,
    past_review_datetime,
    DEFAULT_EASE,
    MIN_EASE,
    MAX_EASE,
    FIRST_INTERVAL,
    SECOND_INTERVAL,
)


class TestComputeNextState:
    def test_wrong_resets_interval_to_first(self):
        new_interval, _ = compute_next_state(30, 2.5, False)
        assert new_interval == FIRST_INTERVAL

    def test_wrong_decreases_ease(self):
        _, new_ease = compute_next_state(1, 2.5, False)
        assert new_ease == pytest.approx(2.3, abs=1e-6)

    def test_ease_never_below_min(self):
        _, new_ease = compute_next_state(1, MIN_EASE, False)
        assert new_ease >= MIN_EASE

    def test_correct_from_interval_1_gives_second_interval(self):
        new_interval, _ = compute_next_state(1, DEFAULT_EASE, True)
        assert new_interval == SECOND_INTERVAL

    def test_correct_grows_interval_by_ease(self):
        # interval=6, ease=2.5 → round(6 × 2.5) = 15
        new_interval, _ = compute_next_state(6, 2.5, True)
        assert new_interval == 15

    def test_correct_increases_ease(self):
        _, new_ease = compute_next_state(6, DEFAULT_EASE, True)
        assert new_ease == pytest.approx(DEFAULT_EASE + 0.05, abs=1e-6)

    def test_ease_capped_at_max(self):
        _, new_ease = compute_next_state(6, MAX_EASE, True)
        assert new_ease <= MAX_EASE

    def test_correct_interval_never_below_second_interval(self):
        # ease=1.3 (minimum), interval=6 → round(6×1.3)=8, max(6,8)=8 ≥ SECOND_INTERVAL
        new_interval, _ = compute_next_state(6, MIN_EASE, True)
        assert new_interval >= SECOND_INTERVAL

    def test_multiple_corrections_grow_interval(self):
        interval, ease = FIRST_INTERVAL, DEFAULT_EASE
        for _ in range(5):
            interval, ease = compute_next_state(interval, ease, True)
        assert interval > SECOND_INTERVAL


class TestDatetimeHelpers:
    def test_next_review_is_in_future(self):
        past = past_review_datetime(1)    # 1 day ago
        future = next_review_datetime(1)  # 1 day from now
        assert future > past

    def test_past_review_is_in_past(self):
        future = next_review_datetime(1)
        past = past_review_datetime(1)
        assert past < future

    def test_format_is_sqlite_compatible(self):
        # Must be 'YYYY-MM-DD HH:MM:SS' (no T, no timezone suffix)
        dt = next_review_datetime(1)
        assert "T" not in dt
        assert " " in dt
        assert len(dt) >= 19
