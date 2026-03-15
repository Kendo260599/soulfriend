"""
tests/test_quiz_engine.py — Unit tests for core/quiz_engine.py.
Run: python -m pytest tests/ -v
"""

import pytest

# DB isolation is handled by conftest.py (isolated_db autouse fixture)
from app.db.repository import insert_word, get_all_words, get_progress
from app.core.quiz_engine import (
    build_quiz_item,
    get_quiz_batch,
    submit_answer,
    CORRECT_MEMORY_DELTA,
    WRONG_MEMORY_DELTA,
)


def _add_words(n: int = 10) -> None:
    """Insert n test vocabulary words."""
    sample_words = [
        ("trust",     "/trʌst/",   "tin tưởng",      "A2"),
        ("hope",      "/hoʊp/",    "hy vọng",         "A2"),
        ("fear",      "/fɪr/",     "sợ hãi",          "A2"),
        ("care",      "/kɛr/",     "quan tâm",        "A2"),
        ("brave",     "/breɪv/",   "dũng cảm",        "B1"),
        ("calm",      "/kɑːm/",    "bình tĩnh",       "B1"),
        ("grateful",  "/ˈɡreɪtfəl/","biết ơn",        "B1"),
        ("lonely",    "/ˈloʊnli/", "cô đơn",          "A2"),
        ("peace",     "/piːs/",    "bình yên",        "A2"),
        ("joy",       "/dʒɔɪ/",    "niềm vui",        "A2"),
        ("strong",    "/strɒŋ/",   "mạnh mẽ",         "A1"),
        ("wisdom",    "/ˈwɪzdəm/", "sự khôn ngoan",   "B2"),
    ]
    for i, (word, ipa, vi, cefr) in enumerate(sample_words[:n]):
        insert_word(word, ipa, vi, cefr, 0.3, 0.3, "positive", "inner_life")


# ------------------------------------------------------------------ #
# build_quiz_item                                                     #
# ------------------------------------------------------------------ #

class TestBuildQuizItem:
    def test_returns_none_when_too_few_words(self):
        _add_words(2)
        all_words = get_all_words()
        result = build_quiz_item(all_words[0], all_words)
        assert result is None

    def test_returns_quiz_item_with_4_choices(self):
        _add_words(10)
        all_words = get_all_words()
        item = build_quiz_item(all_words[0], all_words)
        assert item is not None
        assert len(item.choices) == 4

    def test_correct_answer_in_choices(self):
        _add_words(10)
        all_words = get_all_words()
        item = build_quiz_item(all_words[0], all_words)
        assert item.correct_answer in item.choices

    def test_correct_answer_matches_word_meaning(self):
        _add_words(10)
        all_words = get_all_words()
        target = all_words[0]
        item = build_quiz_item(target, all_words)
        assert item.correct_answer == target["meaning_vi"]

    def test_no_duplicate_choices(self):
        _add_words(10)
        all_words = get_all_words()
        item = build_quiz_item(all_words[0], all_words)
        assert len(set(item.choices)) == 4

    def test_check_answer_correct(self):
        _add_words(10)
        all_words = get_all_words()
        item = build_quiz_item(all_words[0], all_words)
        assert item.check_answer(item.correct_answer) is True

    def test_check_answer_wrong(self):
        _add_words(10)
        all_words = get_all_words()
        item = build_quiz_item(all_words[0], all_words)
        wrong = next(c for c in item.choices if c != item.correct_answer)
        assert item.check_answer(wrong) is False


# ------------------------------------------------------------------ #
# get_quiz_batch                                                       #
# ------------------------------------------------------------------ #

class TestGetQuizBatch:
    def test_returns_empty_when_no_words(self):
        assert get_quiz_batch(10) == []

    def test_returns_empty_when_too_few_words(self):
        _add_words(3)
        assert get_quiz_batch(10) == []

    def test_batch_size_respects_limit(self):
        _add_words(10)
        batch = get_quiz_batch(batch_size=5)
        assert len(batch) <= 5

    def test_batch_returns_unique_word_ids(self):
        _add_words(10)
        batch = get_quiz_batch(batch_size=10)
        ids = [item.word_id for item in batch]
        assert len(ids) == len(set(ids))


# ------------------------------------------------------------------ #
# submit_answer / memory law                                          #
# ------------------------------------------------------------------ #

class TestSubmitAnswer:
    def _get_word_id(self) -> int:
        _add_words(10)
        return get_all_words()[0]["id"]

    def test_correct_increases_memory(self):
        word_id = self._get_word_id()
        new_strength = submit_answer(word_id, is_correct=True)
        assert new_strength == pytest.approx(CORRECT_MEMORY_DELTA, abs=1e-6)

    def test_wrong_decreases_but_floors_at_zero(self):
        word_id = self._get_word_id()
        new_strength = submit_answer(word_id, is_correct=False)
        # starts at 0.0 → -0.3 → clamped to 0.0
        assert new_strength == pytest.approx(0.0, abs=1e-6)

    def test_memory_caps_at_one(self):
        word_id = self._get_word_id()
        # Answer correctly many times
        for _ in range(10):
            last = submit_answer(word_id, is_correct=True)
        assert last <= 1.0

    def test_memory_never_negative(self):
        word_id = self._get_word_id()
        for _ in range(10):
            val = submit_answer(word_id, is_correct=False)
        assert val >= 0.0

    def test_progress_saved_to_db(self):
        word_id = self._get_word_id()
        submit_answer(word_id, is_correct=True)
        progress = get_progress(word_id)
        assert progress is not None
        assert progress["correct_count"] == 1
        assert progress["wrong_count"] == 0

    def test_progress_counts_accumulate(self):
        word_id = self._get_word_id()
        submit_answer(word_id, is_correct=True)
        submit_answer(word_id, is_correct=False)
        submit_answer(word_id, is_correct=True)
        progress = get_progress(word_id)
        assert progress["correct_count"] == 2
        assert progress["wrong_count"] == 1
