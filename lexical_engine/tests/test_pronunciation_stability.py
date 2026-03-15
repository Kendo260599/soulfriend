"""
tests/test_pronunciation_stability.py - Phase E Day 30 stabilization checks.

Verifies scoring behavior stays stable for a representative 20-word set.
"""

from app.core.pronunciation_scoring import score_pronunciation


class TestPronunciationStability:
    def test_20_words_exact_match_scores_high(self):
        words = [
            "trust", "hope", "fear", "care", "love",
            "friend", "family", "support", "respect", "listen",
            "speak", "understand", "practice", "review", "focus",
            "balance", "growth", "progress", "healing", "calm",
        ]

        scores = [score_pronunciation(word, word).score for word in words]
        assert len(scores) == 20
        assert min(scores) >= 95
