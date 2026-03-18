"""Tests for VocabEngine."""
from english_foundation.core.vocab_engine import VocabEngine


class TestLoadVocabulary:
    def test_returns_items_at_low_level(self, conn):
        engine = VocabEngine(conn)
        items = engine.load_vocabulary(lexical_level=0.1)
        assert len(items) > 0
        assert all(item.difficulty <= 1 for item in items)

    def test_returns_more_at_mid_level(self, conn):
        engine = VocabEngine(conn)
        low = engine.load_vocabulary(lexical_level=0.1)
        mid = engine.load_vocabulary(lexical_level=0.5)
        assert len(mid) >= len(low)

    def test_topic_hint_filters(self, conn):
        engine = VocabEngine(conn)
        items = engine.load_vocabulary(lexical_level=0.5, topic_hint="Daily Routine")
        assert len(items) > 0

    def test_unknown_topic_returns_empty_then_fallback(self, conn):
        engine = VocabEngine(conn)
        items = engine.load_vocabulary(lexical_level=0.1, topic_hint="Nonexistent Topic XYZ")
        # Falls back to general pool
        assert len(items) > 0

    def test_topic_alias_resolution(self, conn):
        engine = VocabEngine(conn)
        items = engine.load_vocabulary(lexical_level=0.5, topic_hint="places in town")
        # Should try aliases: "home and accommodation", "travel and transport"
        assert isinstance(items, list)


class TestLoadPhrases:
    def test_returns_phrases_for_known_vocab(self, conn):
        engine = VocabEngine(conn)
        items = engine.load_vocabulary(lexical_level=0.5)
        if items:
            phrases = engine.load_phrase_for_vocab([items[0].id], lexical_level=0.5)
            assert isinstance(phrases, list)

    def test_empty_ids_returns_empty(self, conn):
        engine = VocabEngine(conn)
        assert engine.load_phrase_for_vocab([], lexical_level=0.5) == []


class TestProduceLessonItems:
    def test_returns_words_and_phrases(self, conn):
        engine = VocabEngine(conn)
        words, phrases = engine.produce_lesson_items(lexical_level=0.3)
        assert len(words) == 3
        assert isinstance(phrases, list)
