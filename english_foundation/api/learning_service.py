from __future__ import annotations

import sqlite3
from typing import Any

from ..core.lesson_engine import LessonEngine
from ..db.bootstrap import bootstrap_database, get_connection


class LearningService:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.lesson_engine = LessonEngine(conn)

    def get_lesson_payload(self, learner_id: int = 1) -> dict[str, Any]:
        profile = self._get_learner_profile(learner_id)
        lesson = self.lesson_engine.compose_lesson(
            lexical_level=profile["lexical_level"],
            grammar_level=profile["grammar_level"],
        )
        return {
            "words": lesson["words"],
            "phrases": lesson["phrases"],
            "grammar": lesson["grammar"],
        }

    def get_progress_payload(self) -> dict[str, Any]:
        learned_words = self.conn.execute(
            "SELECT COUNT(*) FROM progress WHERE memory_strength >= 0.7"
        ).fetchone()[0]

        weak_words = self.conn.execute(
            "SELECT COUNT(*) FROM progress WHERE memory_strength < 0.4"
        ).fetchone()[0]

        grammar_completed = self.conn.execute(
            "SELECT ROUND(grammar_level * 100, 0) FROM learner_profile WHERE id = 1"
        ).fetchone()

        return {
            "learned_words": int(learned_words),
            "weak_words": int(weak_words),
            "grammar_completed": int(grammar_completed[0]) if grammar_completed else 0,
        }

    def _get_learner_profile(self, learner_id: int) -> dict[str, float]:
        row = self.conn.execute(
            "SELECT lexical_level, grammar_level FROM learner_profile WHERE id = ?",
            (learner_id,),
        ).fetchone()
        if row:
            return {
                "lexical_level": float(row["lexical_level"]),
                "grammar_level": float(row["grammar_level"]),
            }

        self.conn.execute(
            "INSERT INTO learner_profile (id, lexical_level, grammar_level) VALUES (?, ?, ?)",
            (learner_id, 0.1, 0.1),
        )
        self.conn.commit()
        return {"lexical_level": 0.1, "grammar_level": 0.1}


def create_learning_service() -> LearningService:
    bootstrap_database()
    conn = get_connection()
    return LearningService(conn)
