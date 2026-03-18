"""Tests for GrammarEngine."""
from english_foundation.core.grammar_engine import GrammarEngine


class TestLoadMicroPatterns:
    def test_returns_patterns_at_low_level(self, conn):
        engine = GrammarEngine(conn)
        items = engine.load_micro_patterns(grammar_level=0.1)
        assert len(items) > 0
        assert all(item.difficulty <= 1 for item in items)

    def test_returns_more_at_high_level(self, conn):
        engine = GrammarEngine(conn)
        low = engine.load_micro_patterns(grammar_level=0.1)
        high = engine.load_micro_patterns(grammar_level=0.8)
        assert len(high) >= len(low)


class TestPickMicroPattern:
    def test_returns_one_pattern(self, conn):
        engine = GrammarEngine(conn)
        pattern = engine.pick_micro_pattern(grammar_level=0.5)
        assert pattern is not None
        assert pattern.pattern != ""

    def test_returns_none_for_empty_db(self, conn):
        conn.execute("DELETE FROM grammar_units")
        conn.commit()
        engine = GrammarEngine(conn)
        assert engine.pick_micro_pattern(grammar_level=0.5) is None
