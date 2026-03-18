"""Tests for LearningService."""
import pytest
from english_foundation.api.learning_service import LearningService


class TestLessonPayload:
    def test_returns_words(self, conn):
        svc = LearningService(conn)
        payload = svc.get_lesson_payload(learner_id=1)
        assert "words" in payload
        assert len(payload["words"]) > 0


class TestSubmitVocabCheck:
    def test_score_all_correct(self, conn):
        svc = LearningService(conn)
        payload = svc.get_lesson_payload()
        answers = [{"wordId": w["id"], "correct": True} for w in payload["words"]]
        result = svc.submit_vocab_check(learner_id=1, lesson_id="test-1", answers=answers)
        assert result["score"] == 100
        assert result["correct"] == result["total"]

    def test_score_all_wrong(self, conn):
        svc = LearningService(conn)
        payload = svc.get_lesson_payload()
        answers = [{"wordId": w["id"], "correct": False} for w in payload["words"]]
        result = svc.submit_vocab_check(learner_id=1, lesson_id="test-1", answers=answers)
        assert result["score"] == 0
        assert len(result["weak_items"]) == result["total"]

    def test_empty_answers_raises(self, conn):
        svc = LearningService(conn)
        with pytest.raises(ValueError):
            svc.submit_vocab_check(learner_id=1, lesson_id="x", answers=[])


class TestSubmitGrammarCheck:
    def test_correct_raises_level(self, conn):
        svc = LearningService(conn)
        patterns = conn.execute("SELECT id FROM grammar_units LIMIT 1").fetchone()
        gid = int(patterns[0])
        result = svc.submit_grammar_check(learner_id=1, lesson_id="g1", grammar_id=gid, correct=True)
        assert result["grammar_level_after"] > result["grammar_level_before"]

    def test_wrong_lowers_level(self, conn):
        svc = LearningService(conn)
        patterns = conn.execute("SELECT id FROM grammar_units LIMIT 1").fetchone()
        gid = int(patterns[0])
        # First bump it up
        svc.submit_grammar_check(learner_id=1, lesson_id="g1", grammar_id=gid, correct=True)
        result = svc.submit_grammar_check(learner_id=1, lesson_id="g1", grammar_id=gid, correct=False)
        assert result["grammar_level_after"] < result["grammar_level_before"]

    def test_invalid_grammar_id(self, conn):
        svc = LearningService(conn)
        with pytest.raises(ValueError):
            svc.submit_grammar_check(learner_id=1, lesson_id="g1", grammar_id=0, correct=True)


class TestReviewPayload:
    def test_fresh_mode_when_no_progress(self, conn):
        svc = LearningService(conn)
        payload = svc.get_review_payload(learner_id=1, limit=5)
        assert payload["mode"] == "fresh"
        assert len(payload["items"]) > 0

    def test_review_after_learning(self, conn):
        svc = LearningService(conn)
        lesson = svc.get_lesson_payload()
        answers = [{"wordId": w["id"], "correct": False} for w in lesson["words"]]
        svc.submit_vocab_check(learner_id=1, lesson_id="r1", answers=answers)
        payload = svc.get_review_payload(learner_id=1, limit=5)
        assert payload["mode"] in ("due", "weak")


class TestCalcReviewDue:
    def test_correct_streak_1(self):
        due = LearningService._calc_review_due("2026-01-01T00:00:00+00:00", True, 1)
        assert "2026-01-02" in due

    def test_wrong_answer(self):
        due = LearningService._calc_review_due("2026-01-01T00:00:00+00:00", False, 0)
        assert "2026-01-01T12" in due


class TestVietnameseDiacritics:
    def test_detects_diacritics(self):
        assert LearningService._contains_vietnamese_diacritics("Từ vựng cơ bản")

    def test_rejects_plain_ascii(self):
        assert not LearningService._contains_vietnamese_diacritics("basic words only")


class TestProgressPayload:
    def test_initial_progress(self, conn):
        svc = LearningService(conn)
        payload = svc.get_progress_payload(learner_id=1)
        assert payload["learned_words"] == 0
        assert payload["grammar_completed"] >= 0
