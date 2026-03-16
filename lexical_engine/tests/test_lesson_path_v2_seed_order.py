"""Tests for V2 seeded lesson ordering behavior in lesson_path_engine."""

from __future__ import annotations

from app.core import lesson_path_engine
from app.db.repository import insert_word
from app.db.schema import get_connection


def _insert_sample_words() -> None:
    # Intentionally insert in non-unit order to verify seed ordering wins.
    words = [
        ("zeta", 0.1),
        ("alpha", 0.1),
        ("beta", 0.1),
        ("gamma", 0.1),
    ]
    for word, diff in words:
        insert_word(
            word=word,
            ipa=f"/{word}/",
            meaning_vi=f"nghia {word}",
            cefr_level="A1",
            difficulty_score=diff,
            pronunciation_difficulty=0.1,
            emotion_tag="neutral",
            topic_tag="daily",
        )


def _seed_core_units_in_custom_order() -> None:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("INSERT INTO skills(name, description) VALUES (?, ?)", ("core", "Core"))
    skill_id = int(cur.execute("SELECT id FROM skills WHERE name = 'core'").fetchone()["id"])

    vocab = cur.execute("SELECT id, word FROM vocabulary").fetchall()
    word_ids = {str(row["word"]).lower(): int(row["id"]) for row in vocab}

    # Force explicit curriculum order: beta -> zeta -> alpha -> gamma
    lesson_order = [
        (word_ids["beta"], 1),
        (word_ids["zeta"], 2),
        (word_ids["alpha"], 3),
        (word_ids["gamma"], 4),
    ]

    for word_id, unit_order in lesson_order:
        cur.execute(
            "INSERT INTO lesson_units(word_id, skill_id, unit_order) VALUES (?, ?, ?)",
            (word_id, skill_id, unit_order),
        )

    conn.commit()
    conn.close()


def test_lesson_words_follow_seed_unit_order_for_new_words() -> None:
    _insert_sample_words()
    _seed_core_units_in_custom_order()

    words = lesson_path_engine._lesson_words_for_skill(
        skill=lesson_path_engine.SKILL_CORE,
        lesson_size=4,
        strengths={},
        buckets={},
    )

    assert words == ["beta", "zeta", "alpha", "gamma"]
