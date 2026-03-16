"""Day 1 lexical service boundary tests.

These tests ensure lexical_service payloads are mapped from the current core
implementation (lesson_path_engine + quiz_engine), not custom duplicated logic.
"""

from __future__ import annotations

import random

from app.api import lexical_service
from app.core import lesson_path_engine, quiz_engine
from app.db.repository import get_word_id_by_word, insert_word, upsert_progress


def _insert_core_words() -> None:
    words = [
        ("trust", "/trʌst/", "tin tuong", "A2", 0.30, 0.30, "positive", "relationship"),
        ("hope", "/hoʊp/", "hy vong", "A2", 0.20, 0.20, "positive", "inner_life"),
        ("focus", "/foʊkəs/", "tap trung", "B1", 0.40, 0.35, "neutral", "functional"),
        ("light", "/laɪt/", "anh sang", "A1", 0.10, 0.10, "neutral", "daily"),
        ("speak", "/spiːk/", "noi", "A1", 0.10, 0.10, "neutral", "functional"),
        ("care", "/ker/", "quan tam", "A2", 0.20, 0.20, "positive", "relationship"),
    ]
    for word, ipa, meaning_vi, cefr, diff, pron_diff, emotion, topic in words:
        insert_word(
            word=word,
            ipa=ipa,
            meaning_vi=meaning_vi,
            cefr_level=cefr,
            difficulty_score=diff,
            pronunciation_difficulty=pron_diff,
            emotion_tag=emotion,
            topic_tag=topic,
        )


def test_skill_states_payload_matches_core_states() -> None:
    _insert_core_words()

    core_states = lesson_path_engine.get_skill_states()
    payload = lexical_service.get_skill_states_payload()

    assert payload["totalSkills"] == len(core_states)
    assert len(payload["skills"]) == len(core_states)

    for index, state in enumerate(core_states):
        row = payload["skills"][index]
        assert row["name"] == state.name
        assert row["masteryScore"] == float(state.mastery_score)
        assert row["wordCount"] == int(state.word_count)
        assert row["dueCount"] == int(state.due_count)
        assert row["unlocked"] == bool(state.unlocked)
        assert row["state"] == state.state


def test_lesson_recommendation_payload_matches_core_recommendation() -> None:
    _insert_core_words()

    core_recommendation = lesson_path_engine.recommend_next_lesson(lesson_size=8)
    payload = lexical_service.get_lesson_recommendation_payload(lesson_size=8)

    rec = payload["recommendation"]
    assert rec["skill"] == core_recommendation.skill
    assert rec["reason"] == core_recommendation.reason
    assert rec["masteryScore"] == float(core_recommendation.mastery_score)
    assert rec["lessonWords"] == list(core_recommendation.lesson_words)
    assert rec["nextUnlocks"] == list(core_recommendation.next_unlocks)
    assert payload["requestedLessonSize"] == 8


def test_lesson_path_snapshot_payload_matches_core_snapshot_and_distribution() -> None:
    _insert_core_words()

    core_snapshot = lesson_path_engine.get_lesson_path_snapshot(lesson_size=6)
    core_distribution = lesson_path_engine.get_skill_distribution()

    payload = lexical_service.get_lesson_path_snapshot_payload(lesson_size=6)

    assert payload["recommendation"]["skill"] == core_snapshot.recommendation.skill
    assert payload["recommendation"]["lessonWords"] == list(core_snapshot.recommendation.lesson_words)
    assert len(payload["skills"]) == len(core_snapshot.skills)
    assert payload["skillDistribution"] == core_distribution


def test_home_payload_contract_contains_stable_summary() -> None:
    _insert_core_words()

    payload = lexical_service.get_home_payload(lesson_size=6)

    assert set(payload.keys()) == {"lesson", "skills", "summary"}
    assert isinstance(payload["lesson"], dict)
    assert isinstance(payload["skills"], list)
    assert isinstance(payload["summary"], dict)

    summary = payload["summary"]
    assert summary["totalSkills"] == len(payload["skills"])
    assert 0 <= summary["unlockedSkills"] <= summary["totalSkills"]
    assert 0 <= summary["masteredSkills"] <= summary["totalSkills"]


def test_quiz_batch_payload_matches_quiz_engine_with_same_seed() -> None:
    _insert_core_words()

    random.seed(20260316)
    core_items = quiz_engine.get_quiz_batch(batch_size=3)

    random.seed(20260316)
    payload = lexical_service.get_quiz_batch_payload(batch_size=3, mode="learn")

    assert payload["mode"] == "learn"
    assert payload["total"] == len(core_items)

    for idx, item in enumerate(core_items):
        mapped = payload["items"][idx]
        assert mapped["wordId"] == int(item.word_id)
        assert mapped["word"] == item.word
        assert mapped["ipa"] == item.ipa
        assert mapped["correctAnswer"] == item.correct_answer
        assert mapped["choices"] == list(item.choices)


def test_submit_quiz_answer_payload_delegates_to_core_submit_flow() -> None:
    _insert_core_words()
    target_word = "trust"
    word_id = int(get_word_id_by_word(target_word) or 0)
    assert word_id > 0

    # Set known baseline progress before submitting.
    upsert_progress(word_id=word_id, memory_strength=0.0, correct_count=0, wrong_count=0)

    payload = lexical_service.submit_quiz_answer_payload(word_id=word_id, is_correct=True)

    assert payload["wordId"] == word_id
    assert payload["isCorrect"] is True
    assert payload["memoryStrength"] == round(quiz_engine.CORRECT_MEMORY_DELTA, 4)
    assert payload["intervalDays"] >= 1
