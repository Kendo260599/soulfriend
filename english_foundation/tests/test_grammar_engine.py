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

    def test_explanation_vi_field_present(self, conn):
        engine = GrammarEngine(conn)
        items = engine.load_micro_patterns(grammar_level=0.5)
        assert len(items) > 0
        # explanation_vi should be a string (may be empty for legacy data)
        assert all(isinstance(item.explanation_vi, str) for item in items)

    def test_usage_note_field_present(self, conn):
        engine = GrammarEngine(conn)
        items = engine.load_micro_patterns(grammar_level=0.5)
        assert all(isinstance(item.usage_note, str) for item in items)

    def test_enriched_patterns_have_explanations(self, conn):
        """Patterns seeded with explanation_vi should have non-empty values."""
        engine = GrammarEngine(conn)
        items = engine.load_micro_patterns(grammar_level=0.8)
        # At least some should have explanation_vi populated
        has_explanation = [i for i in items if i.explanation_vi]
        assert len(has_explanation) > 0, "Expected at least some patterns with explanation_vi"


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
