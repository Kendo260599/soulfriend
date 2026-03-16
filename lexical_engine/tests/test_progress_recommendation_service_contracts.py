"""Contract tests for progress/recommendation API services."""

from __future__ import annotations

from app.api import progress_service, recommendation_service
from app.db.repository import get_word_id_by_word, insert_word, upsert_progress


def _seed_words_and_progress() -> None:
    words = [
        ("trust", "/trʌst/", "tin tuong", "A2", 0.30, 0.30, "positive", "relationship"),
        ("focus", "/foʊkəs/", "tap trung", "B1", 0.40, 0.35, "neutral", "functional"),
        ("light", "/laɪt/", "anh sang", "A1", 0.10, 0.10, "neutral", "daily"),
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

    trust_id = int(get_word_id_by_word("trust") or 0)
    focus_id = int(get_word_id_by_word("focus") or 0)

    assert trust_id > 0
    assert focus_id > 0

    upsert_progress(
        word_id=trust_id,
        memory_strength=0.2,
        correct_count=1,
        wrong_count=3,
    )
    upsert_progress(
        word_id=focus_id,
        memory_strength=0.8,
        correct_count=4,
        wrong_count=0,
    )


def test_progress_dashboard_payload_contract() -> None:
    _seed_words_and_progress()

    payload = progress_service.get_dashboard_payload(days=7, due_limit=5, weak_limit=5)

    assert set(payload.keys()) == {
        "summary",
        "dueReview",
        "weakWords",
        "pronunciationTrend",
        "recent",
    }

    assert "count" in payload["dueReview"]
    assert "words" in payload["dueReview"]
    assert isinstance(payload["weakWords"], list)
    assert "metrics" in payload["pronunciationTrend"]
    assert set(payload["recent"].keys()) == {
        "attempts7d",
        "activeDays7d",
        "avgScore7d",
        "recentAccuracy",
        "trendDirection",
    }
    assert 0.0 <= float(payload["recent"]["recentAccuracy"]) <= 1.0


def test_home_recommendation_payload_contract() -> None:
    _seed_words_and_progress()

    payload = recommendation_service.get_home_recommendation_payload(lesson_size=6)

    assert set(payload.keys()) == {"recommendation", "mode", "summary"}
    recommendation = payload["recommendation"]

    assert set(recommendation.keys()) == {
        "focus",
        "dueCount",
        "nextLesson",
        "skillStates",
        "summary",
        "progress",
        "reason",
    }
    assert recommendation["summary"]["totalSkills"] >= recommendation["summary"]["unlockedSkills"]
