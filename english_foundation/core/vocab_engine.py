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

    def load_vocabulary(self, lexical_level: float, topic_hint: str | None = None) -> list[VocabItem]:
        max_difficulty = self._difficulty_from_level(lexical_level)
        if topic_hint:
            rows = self._query_vocabulary(max_difficulty=max_difficulty, topic_hint=topic_hint)
            widened = max_difficulty
            while len(rows) < 3 and widened < 5:
                widened += 1
                rows = self._query_vocabulary(max_difficulty=widened, topic_hint=topic_hint)

            # Keep topic integrity if we have any topic rows at all.
            if rows:
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

        rows = self._query_vocabulary(max_difficulty=max_difficulty, topic_hint=None)

        # Avoid early-stage stagnation by widening difficulty if pool is too small.
        widened = max_difficulty
        while len(rows) < 6 and widened < 5:
            widened += 1
            rows = self._query_vocabulary(max_difficulty=widened, topic_hint=None)

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

    def _query_vocabulary(self, max_difficulty: int, topic_hint: str | None) -> list[sqlite3.Row]:
        if topic_hint:
            return self.conn.execute(
                """
                SELECT id, word, ipa, meaning_vi, collocation, example_sentence, difficulty
                FROM vocabulary
                WHERE difficulty <= ?
                  AND LOWER(COALESCE(topic_ielts, '')) = LOWER(?)
                                    AND COALESCE(source_standard, '') = 'open-triangulated'
                ORDER BY difficulty ASC, id ASC
                """,
                (max_difficulty, str(topic_hint).strip()),
            ).fetchall()

        return self.conn.execute(
            """
            SELECT id, word, ipa, meaning_vi, collocation, example_sentence, difficulty
            FROM vocabulary
            WHERE difficulty <= ?
                            AND COALESCE(source_standard, '') = 'open-triangulated'
            ORDER BY difficulty ASC, id ASC
            """,
            (max_difficulty,),
        ).fetchall()

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
        offset = self._default_offset(vocab_pool)
        words = self._slice_wrap(vocab_pool, offset, 3)
        phrases = self.load_phrase_for_vocab([w.id for w in words], lexical_level)
        return words, phrases

    def _default_offset(self, vocab_pool: list[VocabItem]) -> int:
        if not vocab_pool:
            return 0
        row = self.conn.execute(
            "SELECT COUNT(*) FROM progress WHERE memory_strength >= 0.7",
        ).fetchone()
        learned = int(row[0]) if row else 0
        return learned % len(vocab_pool)

    @staticmethod
    def _slice_wrap(items: list[VocabItem], start: int, size: int) -> list[VocabItem]:
        if not items or size <= 0:
            return []
        result: list[VocabItem] = []
        idx = max(0, start)
        for _ in range(size):
            result.append(items[idx % len(items)])
            idx += 1
        return result

    @staticmethod
    def _difficulty_from_level(level: float) -> int:
        if level < 0.35:
            return 1
        if level < 0.7:
            return 2
        return 3
