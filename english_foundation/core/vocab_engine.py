from dataclasses import dataclass
import sqlite3

from .utils import difficulty_from_level, slice_wrap


TOPIC_ALIAS_MAP: dict[str, list[str]] = {
    "places in town": ["Home and Accommodation", "Travel and Transport"],
    "time and schedule": ["Daily Routine", "Numbers and Time"],
    "health and body": ["Health and Lifestyle"],
    "education and work": ["Education Plans", "Work Projects"],
    "shopping and services": ["Food and Meals", "Shopping and Money"],
    "hobbies and leisure": ["Sports and Hobbies", "Arts and Entertainment"],
    "communication skills": ["Communication", "Media and Opinion"],
    "problems and solutions": ["Problems and Solutions", "Work Projects"],
    "emotions and relationships": ["Emotions and Feelings", "People and Relationships"],
    "travel experiences": ["Travel and Transport", "Nature and Geography"],
    "workplace communication": ["Work Projects", "Communication"],
    "environment": ["Weather and Environment", "Nature and Geography"],
    "technology": ["Technology and Internet"],
    "public services": ["Society and Community", "Law and Society"],
    "culture and society": ["Society and Community", "Arts and Entertainment"],
    "science": ["Science and Research"],
    "money and finance": ["Shopping and Money", "Work Projects"],
    "feelings": ["Emotions and Feelings", "Health and Lifestyle"],
    "nature": ["Nature and Geography", "Weather and Environment"],
    "law and rights": ["Law and Society"],
    "describing things": ["Descriptive Adjectives", "Abstract Concepts"],
}



@dataclass
class VocabItem:
    id: int
    word: str
    part_of_speech: str
    ipa: str
    meaning_vi: str
    collocation: str
    example_sentence: str
    difficulty: int
    synonyms: str
    collocations_json: str


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

    def load_vocabulary(self, lexical_level: float, topic_hint: str | None = None, unit_id: int = 1) -> list[VocabItem]:
        max_difficulty = difficulty_from_level(lexical_level)
        if topic_hint:
            rows = self._query_vocabulary(max_difficulty=max_difficulty, topic_hint=topic_hint, unit_id=unit_id)
            widened = max_difficulty
            while len(rows) < 3 and widened < 5:
                widened += 1
                rows = self._query_vocabulary(max_difficulty=widened, topic_hint=topic_hint, unit_id=unit_id)

            # Keep topic integrity if we have any topic rows at all.
            if rows:
                return [
                    VocabItem(
                        id=row["id"],
                        word=row["word"],
                        part_of_speech=row["part_of_speech"] or "",
                        ipa=row["ipa"],
                        meaning_vi=row["meaning_vi"],
                        collocation=row["collocation"],
                        example_sentence=row["example_sentence"],
                        difficulty=row["difficulty"],
                        synonyms=row["synonyms"] or "",
                        collocations_json=row["collocations_json"] or "[]",
                    )
                    for row in rows
                ]

        rows = self._query_vocabulary(max_difficulty=max_difficulty, topic_hint=None, unit_id=unit_id)

        # Avoid early-stage stagnation by widening difficulty if pool is too small.
        widened = max_difficulty
        while len(rows) < 6 and widened < 5:
            widened += 1
            rows = self._query_vocabulary(max_difficulty=widened, topic_hint=None, unit_id=unit_id)

        return [
            VocabItem(
                id=row["id"],
                word=row["word"],
                part_of_speech=row["part_of_speech"] or "",
                ipa=row["ipa"],
                meaning_vi=row["meaning_vi"],
                collocation=row["collocation"],
                example_sentence=row["example_sentence"],
                difficulty=row["difficulty"],
                synonyms=row["synonyms"] or "",
                collocations_json=row["collocations_json"] or "[]",
            )
            for row in rows
        ]

    def _query_vocabulary(self, max_difficulty: int, topic_hint: str | None, unit_id: int) -> list[sqlite3.Row]:
        if topic_hint:
            for topic in self._topic_candidates(topic_hint):
                rows = self.conn.execute(
                    """
                    SELECT id, word, part_of_speech, ipa, meaning_vi, collocation, example_sentence, difficulty, synonyms, collocations_json
                    FROM vocabulary
                    WHERE difficulty <= ?
                      AND unit_id = ?
                      AND LOWER(COALESCE(topic_ielts, '')) = LOWER(?)
                      AND COALESCE(source_standard, '') = 'open-triangulated'
                    ORDER BY difficulty ASC, id ASC
                    """,
                    (max_difficulty, unit_id, topic),
                ).fetchall()
                if rows:
                    return rows
            return []

        return self.conn.execute(
            """
            SELECT id, word, part_of_speech, ipa, meaning_vi, collocation, example_sentence, difficulty, synonyms, collocations_json
            FROM vocabulary
            WHERE difficulty <= ?
              AND unit_id = ?
              AND COALESCE(source_standard, '') = 'open-triangulated'
            ORDER BY difficulty ASC, id ASC
            """,
            (max_difficulty, unit_id),
        ).fetchall()

    @staticmethod
    def _topic_candidates(topic_hint: str) -> list[str]:
        normalized = str(topic_hint or "").strip().lower()
        if not normalized:
            return []

        candidates: list[str] = [normalized]
        for alias in TOPIC_ALIAS_MAP.get(normalized, []):
            alias_normalized = str(alias).strip().lower()
            if alias_normalized and alias_normalized not in candidates:
                candidates.append(alias_normalized)
        return candidates

    def load_phrase_for_vocab(self, vocab_ids: list[int], lexical_level: float) -> list[PhraseItem]:
        if not vocab_ids:
            return []

        max_difficulty = difficulty_from_level(lexical_level)
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
        words = slice_wrap(vocab_pool, offset, 3)
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


