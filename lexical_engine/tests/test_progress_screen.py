"""
tests/test_progress_screen.py - Unit tests for progress screen helpers.
"""

from app.ui.progress_screen import ProgressScreen


class TestProgressScreenHelpers:
    def test_extract_word_from_trend_line(self):
        line = "trust        +12.5  (82.0|69.5)"
        assert ProgressScreen._extract_word_from_trend_line(line) == "trust"

    def test_extract_word_handles_padding(self):
        line = "self_belief   -4.0  (61.0|65.0)"
        assert ProgressScreen._extract_word_from_trend_line(line) == "self_belief"
