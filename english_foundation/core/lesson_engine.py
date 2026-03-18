from dataclasses import asdict
import hashlib
import sqlite3

from .utils import slice_wrap

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
        lesson_id: str | None,
        lexical_level: float,
        grammar_level: float,
        topic_hint: str | None = None,
    ) -> dict:
        if track == "grammar":
            return self._compose_grammar_lesson(lesson_index, lesson_id, lexical_level, grammar_level)
        return self._compose_vocab_lesson(
            lesson_index,
            lesson_id,
            lexical_level,
            grammar_level,
            topic_hint=topic_hint,
        )

    def _compose_vocab_lesson(
        self,
        lesson_index: int,
        lesson_id: str | None,
        lexical_level: float,
        grammar_level: float,
        topic_hint: str | None = None,
    ) -> dict:
        vocab_pool = self.vocab_engine.load_vocabulary(lexical_level, topic_hint=topic_hint)
        start_index = self._vocab_start_index(
            pool_size=len(vocab_pool),
            lesson_index=lesson_index,
            lesson_id=lesson_id,
            topic_hint=topic_hint,
        )
        words = slice_wrap(vocab_pool, start_index, 3)
        phrases = self.vocab_engine.load_phrase_for_vocab([w.id for w in words], lexical_level)
        grammar = self.grammar_engine.pick_micro_pattern(grammar_level)

        return {
            "track": "vocab",
            "sequence": ["word", "phrase", "grammar"],
            "words": [asdict(item) for item in words],
            "phrases": [asdict(item) for item in phrases[:2]],
            "grammar": asdict(grammar) if grammar else {},
        }

    def _compose_grammar_lesson(
        self,
        lesson_index: int,
        lesson_id: str | None,
        lexical_level: float,
        grammar_level: float,
    ) -> dict:
        pattern_pool = self.grammar_engine.load_micro_patterns(grammar_level)
        grammar_start = self._grammar_start_index(
            pool_size=len(pattern_pool),
            lesson_index=lesson_index,
            lesson_id=lesson_id,
        )
        grammar_items = slice_wrap(pattern_pool, grammar_start, 1)
        grammar = grammar_items[0] if grammar_items else self.grammar_engine.pick_micro_pattern(grammar_level)

        vocab_pool = self.vocab_engine.load_vocabulary(lexical_level)
        words = slice_wrap(vocab_pool, lesson_index * 2, 2)

        return {
            "track": "grammar",
            "sequence": ["grammar", "word"],
            "words": [asdict(item) for item in words],
            "phrases": [],
            "grammar": asdict(grammar) if grammar else {},
        }



    @staticmethod
    def _vocab_start_index(
        pool_size: int,
        lesson_index: int,
        lesson_id: str | None,
        topic_hint: str | None,
    ) -> int:
        if pool_size <= 0:
            return 0

        stable_key = f"{lesson_id or ''}|{topic_hint or ''}".encode("utf-8")
        digest = hashlib.md5(stable_key).digest()
        salt = int.from_bytes(digest[:2], "big")
        return (lesson_index + salt) % pool_size

    @staticmethod
    def _grammar_start_index(
        pool_size: int,
        lesson_index: int,
        lesson_id: str | None,
    ) -> int:
        if pool_size <= 0:
            return 0

        stable_key = f"grammar|{lesson_id or ''}".encode("utf-8")
        digest = hashlib.md5(stable_key).digest()
        salt = int.from_bytes(digest[:2], "big")
        return (lesson_index + salt) % pool_size
