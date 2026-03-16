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
