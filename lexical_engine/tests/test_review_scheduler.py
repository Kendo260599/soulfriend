"""
tests/test_review_scheduler.py — Unit tests for core/review_scheduler.py.
DB isolation is handled by conftest.py (isolated_db autouse fixture).
"""
import pytest
from app.db.repository import insert_word, get_all_words, upsert_progress, get_progress
from app.core import review_scheduler


def _add_word(word: str = "trust") -> int:
    """Insert one word and return its id."""
    insert_word(word, "/trʌst/", "tin tưởng", "A2", 0.3, 0.3, "positive", "relationship")
    return get_all_words()[0]["id"]


# ------------------------------------------------------------------ #
# get_new_words                                                        #
# ------------------------------------------------------------------ #

class TestGetNewWords:
    def test_returns_all_when_none_seen(self):
        _add_word("trust")
        _add_word("hope")
        new = review_scheduler.get_new_words(limit=10)
        assert len(new) == 2

    def test_excludes_seen_words(self):
        word_id = _add_word()
        upsert_progress(word_id, 0.2, 1, 0)
        new = review_scheduler.get_new_words(limit=10)
        assert len(new) == 0

    def test_respects_limit(self):
        for w in ["alpha", "beta", "gamma", "delta", "epsilon"]:
            insert_word(w, "/x/", "nghĩa", "A2", 0.3, 0.3, "neutral", "test")
        new = review_scheduler.get_new_words(limit=3)
        assert len(new) == 3


# ------------------------------------------------------------------ #
# get_due_words                                                        #
# ------------------------------------------------------------------ #

class TestGetDueWords:
    def test_returns_overdue_words(self):
        word_id = _add_word()
        upsert_progress(word_id, 0.5, 1, 0,
                        next_review="2020-01-01 00:00:00", interval_days=1, ease_factor=2.5)
        due = review_scheduler.get_due_words(limit=10)
        assert len(due) == 1
        assert due[0]["word"] == "trust"

    def test_excludes_future_words(self):
        word_id = _add_word()
        upsert_progress(word_id, 0.5, 1, 0,
                        next_review="2099-12-31 23:59:59", interval_days=30, ease_factor=2.5)
        due = review_scheduler.get_due_words(limit=10)
        assert len(due) == 0

    def test_excludes_unscheduled_words(self):
        word_id = _add_word()
        upsert_progress(word_id, 0.5, 1, 0)   # no next_review
        due = review_scheduler.get_due_words(limit=10)
        assert len(due) == 0

    def test_respects_limit(self):
        for i, w in enumerate(["a", "b", "c", "d", "e"]):
            insert_word(w, "/x/", "nghĩa", "A2", 0.3, 0.3, "neutral", "test")
        rows = get_all_words()
        for row in rows:
            upsert_progress(row["id"], 0.5, 1, 0,
                            next_review="2020-01-01 00:00:00", interval_days=1, ease_factor=2.5)
        due = review_scheduler.get_due_words(limit=3)
        assert len(due) == 3


# ------------------------------------------------------------------ #
# schedule_after_answer                                               #
# ------------------------------------------------------------------ #

class TestScheduleAfterAnswer:
    def test_saves_progress_to_db(self):
        word_id = _add_word()
        review_scheduler.schedule_after_answer(word_id, True, 0.2, 1, 0)
        p = get_progress(word_id)
        assert p is not None

    def test_correct_schedules_future_review(self):
        from app.core.memory_engine import past_review_datetime
        word_id = _add_word()
        next_rev = review_scheduler.schedule_after_answer(word_id, True, 0.2, 1, 0)
        # 'now' is approximately past_review_datetime(0); next_rev must be > now
        assert next_rev > past_review_datetime(0)

    def test_wrong_resets_interval_to_1(self):
        word_id = _add_word()
        # Simulate an advanced learner with interval=30
        upsert_progress(word_id, 0.9, 10, 1,
                        next_review="2020-01-01 00:00:00", interval_days=30, ease_factor=2.8)
        review_scheduler.schedule_after_answer(word_id, False, 0.6, 10, 2)
        p = get_progress(word_id)
        assert p["interval_days"] == 1

    def test_correct_stores_next_review(self):
        word_id = _add_word()
        review_scheduler.schedule_after_answer(word_id, True, 0.2, 1, 0)
        p = get_progress(word_id)
        assert p["next_review"] is not None
        assert "2026" in p["next_review"] or "2027" in p["next_review"] or \
               int(p["next_review"][:4]) >= 2026
