from dataclasses import dataclass
import sqlite3


@dataclass
class VocabItem:
    id: int
    word: str
    ipa: str
    meaning_vi: str
    collocation: str
    example_sentence: str
    difficulty: int


@dataclass
class PhraseItem:
    id: int
    vocab_id: int
    phrase: str
    meaning_vi: str
    difficulty: int


class VocabEngine:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def load_vocabulary(self, lexical_level: float) -> list[VocabItem]:
        max_difficulty = self._difficulty_from_level(lexical_level)
        rows = self.conn.execute(
            """
            SELECT id, word, ipa, meaning_vi, collocation, example_sentence, difficulty
            FROM vocabulary
            WHERE difficulty <= ?
            ORDER BY difficulty ASC, id ASC
            """,
            (max_difficulty,),
        ).fetchall()

        return [
            VocabItem(
                id=row["id"],
                word=row["word"],
                ipa=row["ipa"],
                meaning_vi=row["meaning_vi"],
                collocation=row["collocation"],
                example_sentence=row["example_sentence"],
                difficulty=row["difficulty"],
            )
            for row in rows
        ]

    def load_phrase_for_vocab(self, vocab_ids: list[int], lexical_level: float) -> list[PhraseItem]:
        if not vocab_ids:
            return []

        max_difficulty = self._difficulty_from_level(lexical_level)
        placeholders = ",".join("?" for _ in vocab_ids)
        query = f"""
            SELECT id, vocab_id, phrase, meaning_vi, difficulty
            FROM phrase_units
            WHERE vocab_id IN ({placeholders})
              AND difficulty <= ?
            ORDER BY difficulty ASC, id ASC
            LIMIT 2
        """
        params = [*vocab_ids, max_difficulty]
        rows = self.conn.execute(query, params).fetchall()

        return [
            PhraseItem(
                id=row["id"],
                vocab_id=row["vocab_id"],
                phrase=row["phrase"],
                meaning_vi=row["meaning_vi"],
                difficulty=row["difficulty"],
            )
            for row in rows
        ]

    def produce_lesson_items(self, lexical_level: float) -> tuple[list[VocabItem], list[PhraseItem]]:
        vocab_pool = self.load_vocabulary(lexical_level)
        words = vocab_pool[:3]
        phrases = self.load_phrase_for_vocab([w.id for w in words], lexical_level)
        return words, phrases

    @staticmethod
    def _difficulty_from_level(level: float) -> int:
        if level < 0.35:
            return 1
        if level < 0.7:
            return 2
        return 3
