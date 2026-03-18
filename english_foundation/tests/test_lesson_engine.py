"""Tests for LessonEngine."""
from english_foundation.core.lesson_engine import LessonEngine


class TestComposeLesson:
    def test_returns_expected_keys(self, conn):
        engine = LessonEngine(conn)
        lesson = engine.compose_lesson(lexical_level=0.3, grammar_level=0.3)
        assert "words" in lesson
        assert "phrases" in lesson
        assert "grammar" in lesson
        assert "sequence" in lesson
        assert len(lesson["words"]) > 0

    def test_grammar_has_pattern(self, conn):
        engine = LessonEngine(conn)
        lesson = engine.compose_lesson(lexical_level=0.3, grammar_level=0.3)
        assert lesson["grammar"].get("pattern")


class TestComposeTrackLesson:
    def test_vocab_track(self, conn):
        engine = LessonEngine(conn)
        lesson = engine.compose_track_lesson(
            track="vocab", lesson_index=0, lesson_id=None,
            lexical_level=0.3, grammar_level=0.3,
        )
        assert lesson["track"] == "vocab"
        assert len(lesson["words"]) > 0

    def test_grammar_track(self, conn):
        engine = LessonEngine(conn)
        lesson = engine.compose_track_lesson(
            track="grammar", lesson_index=0, lesson_id=None,
            lexical_level=0.3, grammar_level=0.3,
        )
        assert lesson["track"] == "grammar"

    def test_deterministic_offset(self, conn):
        engine = LessonEngine(conn)
        a = engine.compose_track_lesson(
            track="vocab", lesson_index=2, lesson_id="lesson-42",
            lexical_level=0.5, grammar_level=0.5,
        )
        b = engine.compose_track_lesson(
            track="vocab", lesson_index=2, lesson_id="lesson-42",
            lexical_level=0.5, grammar_level=0.5,
        )
        assert a["words"] == b["words"]
