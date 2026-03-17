from dataclasses import asdict
import sqlite3

from .grammar_engine import GrammarEngine
from .vocab_engine import VocabEngine


class LessonEngine:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.vocab_engine = VocabEngine(conn)
        self.grammar_engine = GrammarEngine(conn)

    def compose_lesson(self, lexical_level: float, grammar_level: float) -> dict:
        words, phrases = self.vocab_engine.produce_lesson_items(lexical_level)
        grammar = self.grammar_engine.pick_micro_pattern(grammar_level)

        return {
            "sequence": ["word", "phrase", "grammar"],
            "words": [asdict(item) for item in words],
            "phrases": [asdict(item) for item in phrases],
            "grammar": asdict(grammar) if grammar else {},
        }

    def compose_track_lesson(
        self,
        track: str,
        lesson_index: int,
        lexical_level: float,
        grammar_level: float,
        topic_hint: str | None = None,
    ) -> dict:
        if track == "grammar":
            return self._compose_grammar_lesson(lesson_index, lexical_level, grammar_level)
        return self._compose_vocab_lesson(lesson_index, lexical_level, grammar_level, topic_hint=topic_hint)

    def _compose_vocab_lesson(
        self,
        lesson_index: int,
        lexical_level: float,
        grammar_level: float,
        topic_hint: str | None = None,
    ) -> dict:
        vocab_pool = self.vocab_engine.load_vocabulary(lexical_level, topic_hint=topic_hint)
        words = self._slice_wrap(vocab_pool, lesson_index * 3, 3)
        phrases = self.vocab_engine.load_phrase_for_vocab([w.id for w in words], lexical_level)
        grammar = self.grammar_engine.pick_micro_pattern(grammar_level)

        return {
            "track": "vocab",
            "sequence": ["word", "phrase", "grammar"],
            "words": [asdict(item) for item in words],
            "phrases": [asdict(item) for item in phrases[:2]],
            "grammar": asdict(grammar) if grammar else {},
        }

    def _compose_grammar_lesson(self, lesson_index: int, lexical_level: float, grammar_level: float) -> dict:
        pattern_pool = self.grammar_engine.load_micro_patterns(grammar_level)
        grammar_items = self._slice_wrap(pattern_pool, lesson_index, 1)
        grammar = grammar_items[0] if grammar_items else self.grammar_engine.pick_micro_pattern(grammar_level)

        vocab_pool = self.vocab_engine.load_vocabulary(lexical_level)
        words = self._slice_wrap(vocab_pool, lesson_index * 2, 2)

        return {
            "track": "grammar",
            "sequence": ["grammar", "word"],
            "words": [asdict(item) for item in words],
            "phrases": [],
            "grammar": asdict(grammar) if grammar else {},
        }

    @staticmethod
    def _slice_wrap(items: list, start: int, size: int) -> list:
        if not items or size <= 0:
            return []
        result = []
        idx = max(0, start)
        for _ in range(size):
            result.append(items[idx % len(items)])
            idx += 1
        return result
