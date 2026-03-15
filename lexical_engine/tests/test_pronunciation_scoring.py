"""
tests/test_pronunciation_scoring.py - Unit tests for pronunciation scoring.
"""

from app.core.pronunciation_scoring import normalize_text, score_pronunciation


class TestNormalizeText:
    def test_normalize_text_basic(self):
        assert normalize_text("  Break-Up! ") == "break up"


class TestScorePronunciation:
    def test_empty_recognition_scores_zero(self):
        result = score_pronunciation("trust", "")
        assert result.score == 0

    def test_exact_match_scores_high(self):
        result = score_pronunciation("trust", "trust")
        assert result.score >= 95
        assert result.ending_score >= 95
        assert result.stress_score >= 95

    def test_partial_match_scores_mid(self):
        result = score_pronunciation("trust", "trus")
        assert 50 <= result.score < 95

    def test_bad_match_scores_low(self):
        result = score_pronunciation("trust", "banana")
        assert result.score < 50

    def test_multi_word_phrase_uses_phrase_component(self):
        result = score_pronunciation("break up", "breakup")
        assert result.phrase_score > 50
        assert result.score > 50
