from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
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

    def get_track_lesson_payload(
        self,
        track: str,
        lesson_id: str | None,
        learner_id: int = 1,
    ) -> dict[str, Any]:
        profile = self._get_learner_profile(learner_id)
        curriculum = self.get_curriculum_payload()
        raw_track = str(track).strip().lower()
        if raw_track not in {"grammar", "vocab"}:
            raise ValueError("Track must be 'grammar' or 'vocab'.")
        track_key = raw_track
        lessons = curriculum.get("tracks", {}).get(track_key, [])

        lesson_index = 0
        selected_lesson = lessons[0] if lessons else None
        if lesson_id and lessons:
            for idx, item in enumerate(lessons):
                if str(item.get("id")) == lesson_id:
                    lesson_index = idx
                    selected_lesson = item
                    break

        lesson = self.lesson_engine.compose_track_lesson(
            track=track_key,
            lesson_index=lesson_index,
            lexical_level=profile["lexical_level"],
            grammar_level=profile["grammar_level"],
        )

        return {
            "track": track_key,
            "lesson_meta": selected_lesson or {},
            "words": lesson["words"],
            "phrases": lesson["phrases"],
            "grammar": lesson["grammar"],
            "sequence": lesson.get("sequence", []),
        }

    def get_curriculum_payload(self) -> dict[str, Any]:
        root = Path(__file__).resolve().parents[1]
        path = root / "content" / "cambridge_curriculum.json"
        if not path.exists():
            return {
                "framework": "IELTS-aligned Grammar and Vocabulary path for Vietnamese learners",
                "tracks": {"vocab": [], "grammar": []},
            }
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        tracks = payload.get("tracks", {})
        for key in ("vocab", "grammar"):
            lessons = tracks.get(key, [])
            if isinstance(lessons, list):
                self._validate_track_lessons(key, lessons)
                tracks[key] = sorted(
                    lessons,
                    key=lambda item: (
                        self._safe_int(item.get("order"), 9999),
                        str(item.get("id", "")),
                    ),
                )
        payload["tracks"] = tracks
        return payload

    def _validate_track_lessons(self, track: str, lessons: list[dict[str, Any]]) -> None:
        required = {"id", "order", "level", "title", "focus", "objective"}
        if track == "vocab":
            required = required.union({
                "topic_ielts",
                "focus_en",
                "focus_vi",
                "objective_en",
                "objective_vi",
                "cefr_target",
                "coca_frequency_band",
                "source_standard",
                "source_refs",
            })
        seen_orders: set[int] = set()

        for idx, lesson in enumerate(lessons):
            if not isinstance(lesson, dict):
                raise ValueError(f"Invalid lesson format in track '{track}' at index {idx}.")

            missing = [field for field in required if field not in lesson or str(lesson.get(field, "")).strip() == ""]
            if missing:
                raise ValueError(
                    f"Lesson in track '{track}' is missing required fields: {', '.join(missing)}."
                )

            if track == "vocab":
                self._validate_vocab_bilingual_fields(lesson)

            order_value = self._safe_int(lesson.get("order"), None)
            if order_value is None or order_value <= 0:
                raise ValueError(f"Lesson '{lesson.get('id', '?')}' in track '{track}' has invalid order value.")

            if order_value in seen_orders:
                raise ValueError(f"Duplicate order '{order_value}' found in track '{track}'.")
            seen_orders.add(order_value)

    def _validate_vocab_bilingual_fields(self, lesson: dict[str, Any]) -> None:
        lesson_id = str(lesson.get("id", "?"))
        topic = str(lesson.get("topic_ielts", "")).strip()
        if not topic:
            raise ValueError(f"Vocab lesson '{lesson_id}' must define non-empty topic_ielts.")

        focus_en = str(lesson.get("focus_en", "")).strip()
        focus_vi = str(lesson.get("focus_vi", "")).strip()
        objective_en = str(lesson.get("objective_en", "")).strip()
        objective_vi = str(lesson.get("objective_vi", "")).strip()

        if not all([focus_en, focus_vi, objective_en, objective_vi]):
            raise ValueError(
                f"Vocab lesson '{lesson_id}' must include focus_en, focus_vi, objective_en, objective_vi."
            )

        cefr_target = str(lesson.get("cefr_target", "")).strip().upper()
        if cefr_target not in {"A1", "A2", "B1"}:
            raise ValueError(f"Vocab lesson '{lesson_id}' must define cefr_target in A1/A2/B1.")

        coca_band = str(lesson.get("coca_frequency_band", "")).strip()
        if not coca_band:
            raise ValueError(f"Vocab lesson '{lesson_id}' must define non-empty coca_frequency_band.")

        source_standard = str(lesson.get("source_standard", "")).strip()
        if source_standard != "open-triangulated":
            raise ValueError(
                f"Vocab lesson '{lesson_id}' must use source_standard='open-triangulated'."
            )

        source_refs = lesson.get("source_refs", [])
        if not isinstance(source_refs, list) or len(source_refs) < 2:
            raise ValueError(
                f"Vocab lesson '{lesson_id}' must include at least 2 source_refs entries."
            )

        if not self._contains_vietnamese_diacritics(focus_vi):
            raise ValueError(f"Vocab lesson '{lesson_id}' has focus_vi without Vietnamese diacritics.")
        if not self._contains_vietnamese_diacritics(objective_vi):
            raise ValueError(f"Vocab lesson '{lesson_id}' has objective_vi without Vietnamese diacritics.")

    @staticmethod
    def _contains_vietnamese_diacritics(text: str) -> bool:
        return bool(re.search(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", text.lower()))

    @staticmethod
    def _safe_int(value: Any, fallback: int | None) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return fallback

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
