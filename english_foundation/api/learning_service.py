from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from core.lesson_engine import LessonEngine
from db.bootstrap import bootstrap_database, get_connection


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

        # Check for progression lock
        progress = self.get_progress_payload(learner_id)
        weak_words = progress.get("weak_words", 0)
        WEAK_WORD_LOCK_THRESHOLD = 15
        if weak_words > WEAK_WORD_LOCK_THRESHOLD:
            return {
                "track": track_key,
                "lesson_meta": selected_lesson or {},
                "words": [],
                "phrases": [],
                "grammar": {},
                "sequence": [],
                "is_locked": True,
                "lock_reason": f"Too many weak words ({weak_words}). Please review before continuing.",
            }

        lesson = self.lesson_engine.compose_track_lesson(
            track=track_key,
            lesson_index=lesson_index,
            lesson_id=str((selected_lesson or {}).get("id", "")) or None,
            lexical_level=profile["lexical_level"],
            grammar_level=profile["grammar_level"],
            topic_hint=str((selected_lesson or {}).get("topic_ielts", "")).strip() or None,
        )

        return {
            "track": track_key,
            "lesson_meta": selected_lesson or {},
            "words": lesson["words"],
            "phrases": lesson["phrases"],
            "grammar": lesson["grammar"],
            "sequence": lesson.get("sequence", []),
            "is_locked": False,
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

    def get_progress_payload(self, learner_id: int = 1) -> dict[str, Any]:
        now_iso = self._now_iso()
        learned_words = self.conn.execute(
            "SELECT COUNT(*) FROM progress WHERE learner_id = ? AND memory_strength >= 0.7",
            (learner_id,),
        ).fetchone()[0]

        weak_words = self.conn.execute(
            "SELECT COUNT(*) FROM progress WHERE learner_id = ? AND memory_strength < 0.4",
            (learner_id,),
        ).fetchone()[0]

        due_today = self.conn.execute(
            """
            SELECT COUNT(*)
            FROM progress
            WHERE learner_id = ?
              AND review_due_at IS NOT NULL
              AND review_due_at <= ?
            """,
            (learner_id, now_iso),
        ).fetchone()[0]

        grammar_completed = self.conn.execute(
            "SELECT ROUND(grammar_level * 100, 0) FROM learner_profile WHERE id = ?",
            (learner_id,),
        ).fetchone()

        return {
            "learned_words": int(learned_words),
            "weak_words": int(weak_words),
            "grammar_completed": int(grammar_completed[0]) if grammar_completed else 0,
            "due_today": int(due_today),
        }

    def submit_vocab_check(
        self,
        learner_id: int,
        lesson_id: str | None,
        answers: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not isinstance(answers, list) or len(answers) == 0:
            raise ValueError("Answers must be a non-empty list.")

        total = 0
        correct_count = 0
        weak_items: list[int] = []

        for idx, item in enumerate(answers):
            if not isinstance(item, dict):
                raise ValueError(f"Invalid answer format at index {idx}.")

            word_id = self._safe_int(item.get("wordId"), None)
            if word_id is None or word_id <= 0:
                raise ValueError(f"Answer at index {idx} has invalid wordId.")

            is_correct = bool(item.get("correct", False))
            self._apply_answer_update(learner_id=learner_id, word_id=word_id, is_correct=is_correct)

            total += 1
            if is_correct:
                correct_count += 1
            else:
                weak_items.append(word_id)

        self.conn.commit()

        score = round((correct_count / max(1, total)) * 100)
        return {
            "learner_id": learner_id,
            "lesson_id": lesson_id,
            "total": total,
            "correct": correct_count,
            "score": int(score),
            "weak_items": weak_items,
            "recommended_review": "review_weak_words" if weak_items else "next_vocab_lesson",
        }

    def submit_grammar_check(
        self,
        learner_id: int,
        lesson_id: str | None,
        grammar_id: int,
        correct: bool,
    ) -> dict[str, Any]:
        if grammar_id <= 0:
            raise ValueError("grammarId must be a positive integer.")

        grammar_exists = self.conn.execute(
            "SELECT id FROM grammar_units WHERE id = ? LIMIT 1",
            (grammar_id,),
        ).fetchone()
        if not grammar_exists:
            raise ValueError(f"Grammar item '{grammar_id}' not found.")

        profile = self._get_learner_profile(learner_id)
        previous_level = float(profile["grammar_level"])
        updated_level = self._next_grammar_level(previous_level, correct)

        self.conn.execute(
            "UPDATE learner_profile SET grammar_level = ? WHERE id = ?",
            (updated_level, learner_id),
        )
        self.conn.commit()

        return {
            "learner_id": learner_id,
            "lesson_id": lesson_id,
            "grammar_id": grammar_id,
            "correct": bool(correct),
            "grammar_level_before": round(previous_level, 3),
            "grammar_level_after": round(updated_level, 3),
            "grammar_level_percent": int(round(updated_level * 100)),
            "recommended_next": "next_grammar_lesson" if correct else "repeat_grammar_lesson",
        }

    def get_review_payload(self, learner_id: int = 1, limit: int = 20) -> dict[str, Any]:
        safe_limit = max(1, min(50, int(limit)))
        now_iso = self._now_iso()

        due_rows = self.conn.execute(
            """
            SELECT
                v.id,
                v.word,
                v.ipa,
                v.meaning_vi,
                v.collocation,
                v.example_sentence,
                COALESCE(v.topic_ielts, '') AS topic_ielts,
                COALESCE(p.memory_strength, 0) AS memory_strength,
                p.review_due_at
            FROM progress p
            JOIN vocabulary v ON v.id = p.item_id
            WHERE p.learner_id = ?
              AND p.review_due_at IS NOT NULL
              AND p.review_due_at <= ?
              AND COALESCE(v.source_standard, '') = 'open-triangulated'
            ORDER BY p.review_due_at ASC, p.memory_strength ASC, v.id ASC
            LIMIT ?
            """,
            (learner_id, now_iso, safe_limit),
        ).fetchall()

        if due_rows:
            return {
                "learner_id": learner_id,
                "mode": "due",
                "items": [dict(row) for row in due_rows],
            }

        weak_rows = self.conn.execute(
            """
            SELECT
                v.id,
                v.word,
                v.ipa,
                v.meaning_vi,
                v.collocation,
                v.example_sentence,
                COALESCE(v.topic_ielts, '') AS topic_ielts,
                COALESCE(p.memory_strength, 0) AS memory_strength,
                p.review_due_at
            FROM progress p
            JOIN vocabulary v ON v.id = p.item_id
            WHERE p.learner_id = ?
              AND COALESCE(p.memory_strength, 0) < 0.6
              AND COALESCE(v.source_standard, '') = 'open-triangulated'
            ORDER BY p.memory_strength ASC, v.id ASC
            LIMIT ?
            """,
            (learner_id, safe_limit),
        ).fetchall()

        if weak_rows:
            return {
                "learner_id": learner_id,
                "mode": "weak",
                "items": [dict(row) for row in weak_rows],
            }

        fresh_rows = self.conn.execute(
            """
            SELECT
                v.id,
                v.word,
                v.ipa,
                v.meaning_vi,
                v.collocation,
                v.example_sentence,
                COALESCE(v.topic_ielts, '') AS topic_ielts,
                0 AS memory_strength,
                NULL AS review_due_at
            FROM vocabulary v
            WHERE COALESCE(v.source_standard, '') = 'open-triangulated'
              AND NOT EXISTS (
                SELECT 1 FROM progress p
                WHERE p.item_id = v.id AND p.learner_id = ?
              )
            ORDER BY v.difficulty ASC, v.id ASC
            LIMIT ?
            """,
            (learner_id, safe_limit),
        ).fetchall()

        return {
            "learner_id": learner_id,
            "mode": "fresh",
            "items": [dict(row) for row in fresh_rows],
        }

    def submit_review_payload(self, learner_id: int, answers: list[dict[str, Any]]) -> dict[str, Any]:
        if not isinstance(answers, list) or len(answers) == 0:
            raise ValueError("Answers must be a non-empty list.")

        total = 0
        correct_count = 0
        weak_items: list[int] = []

        for idx, item in enumerate(answers):
            if not isinstance(item, dict):
                raise ValueError(f"Invalid answer format at index {idx}.")

            word_id = self._safe_int(item.get("wordId"), None)
            if word_id is None or word_id <= 0:
                raise ValueError(f"Answer at index {idx} has invalid wordId.")

            is_correct = bool(item.get("correct", False))
            self._apply_answer_update(learner_id=learner_id, word_id=word_id, is_correct=is_correct)

            total += 1
            if is_correct:
                correct_count += 1
            else:
                weak_items.append(word_id)

        self.conn.commit()
        score = round((correct_count / max(1, total)) * 100)
        return {
            "learner_id": learner_id,
            "total": total,
            "correct": correct_count,
            "score": int(score),
            "weak_items": weak_items,
            "recommended_next": "continue_review" if weak_items else "new_lesson",
        }

    def _apply_answer_update(self, learner_id: int, word_id: int, is_correct: bool) -> None:
        row = self.conn.execute(
            """
            SELECT id, correct_count, wrong_count, memory_strength, streak_correct
            FROM progress
            WHERE learner_id = ? AND item_id = ?
            ORDER BY id ASC
            LIMIT 1
            """,
            (learner_id, word_id),
        ).fetchone()

        now_iso = self._now_iso()

        if row:
            next_correct = int(row["correct_count"]) + (1 if is_correct else 0)
            next_wrong = int(row["wrong_count"]) + (0 if is_correct else 1)
            prev_strength = float(row["memory_strength"])
            prev_streak = int(row["streak_correct"])

            if is_correct:
                next_streak = prev_streak + 1
                memory_strength = min(0.98, round(prev_strength + 0.12, 3))
            else:
                next_streak = 0
                memory_strength = max(0.05, round(prev_strength * 0.6, 3))

            due_iso = self._calc_review_due(now_iso=now_iso, is_correct=is_correct, streak=next_streak)

            self.conn.execute(
                """
                UPDATE progress
                SET correct_count = ?,
                    wrong_count = ?,
                    memory_strength = ?,
                    streak_correct = ?,
                    last_result = ?,
                    last_reviewed_at = ?,
                    review_due_at = ?
                WHERE id = ?
                """,
                (
                    next_correct,
                    next_wrong,
                    memory_strength,
                    next_streak,
                    1 if is_correct else 0,
                    now_iso,
                    due_iso,
                    int(row["id"]),
                ),
            )
            return

        next_correct = 1 if is_correct else 0
        next_wrong = 0 if is_correct else 1
        next_streak = 1 if is_correct else 0
        memory_strength = 0.72 if is_correct else 0.25
        due_iso = self._calc_review_due(now_iso=now_iso, is_correct=is_correct, streak=next_streak)
        self.conn.execute(
            """
            INSERT INTO progress (
                learner_id,
                item_id,
                correct_count,
                wrong_count,
                memory_strength,
                streak_correct,
                last_result,
                last_reviewed_at,
                review_due_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                learner_id,
                word_id,
                next_correct,
                next_wrong,
                memory_strength,
                next_streak,
                1 if is_correct else 0,
                now_iso,
                due_iso,
            ),
        )

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _calc_review_due(now_iso: str, is_correct: bool, streak: int) -> str:
        now_dt = datetime.fromisoformat(now_iso)
        if is_correct:
            if streak <= 1:
                delta = timedelta(days=1)
            elif streak == 2:
                delta = timedelta(days=3)
            elif streak == 3:
                delta = timedelta(days=7)
            else:
                delta = timedelta(days=14)
        else:
            delta = timedelta(hours=12)
        return (now_dt + delta).isoformat()

    @staticmethod
    def _next_grammar_level(current_level: float, correct: bool) -> float:
        if correct:
            return min(0.98, round(current_level + 0.06, 3))
        return max(0.05, round(current_level - 0.03, 3))

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
