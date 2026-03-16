"""
tests/test_v1_core_preservation.py

STEP 6 guard tests:
- ensure V1 core learning contracts remain stable while V2 orchestration is added
- no direct validation of V2 UI/orchestration behavior here
"""

import pytest

from app.core import memory_engine, quiz_engine
from app.core.pronunciation_scoring import score_pronunciation
from app.db.repository import get_all_words, get_progress, insert_word


def _seed_words_for_quiz() -> None:
    sample = [
        ("trust", "/trʌst/", "tin tưởng", "A2"),
        ("hope", "/hoʊp/", "hy vọng", "A2"),
        ("care", "/keər/", "quan tâm", "A2"),
        ("family", "/ˈfæməli/", "gia đình", "A2"),
        ("focus", "/ˈfoʊkəs/", "tập trung", "B1"),
    ]
    for word, ipa, meaning_vi, cefr in sample:
        insert_word(
            word=word,
            ipa=ipa,
            meaning_vi=meaning_vi,
            cefr_level=cefr,
            difficulty_score=0.4,
            pronunciation_difficulty=0.4,
            emotion_tag="supportive",
            topic_tag="daily",
        )


def test_quiz_submit_answer_contract_preserved() -> None:
    _seed_words_for_quiz()
    word_id = get_all_words()[0]["id"]

    # Correct answer keeps original V1 delta behavior.
    after_correct = quiz_engine.submit_answer(word_id, is_correct=True)
    assert after_correct == pytest.approx(quiz_engine.CORRECT_MEMORY_DELTA, abs=1e-6)

    # Wrong answer applies original V1 penalty and clamp behavior.
    after_wrong = quiz_engine.submit_answer(word_id, is_correct=False)
    assert after_wrong == pytest.approx(0.0, abs=1e-6)

    progress = get_progress(word_id)
    assert progress is not None
    assert progress["correct_count"] == 1
    assert progress["wrong_count"] == 1


def test_memory_engine_state_transition_contract_preserved() -> None:
    # Correct from interval=1 must still jump to SECOND_INTERVAL.
    interval, ease = memory_engine.compute_next_state(
        interval_days=memory_engine.FIRST_INTERVAL,
        ease_factor=memory_engine.DEFAULT_EASE,
        is_correct=True,
    )
    assert interval == memory_engine.SECOND_INTERVAL
    assert ease == pytest.approx(memory_engine.DEFAULT_EASE + 0.05, abs=1e-6)

    # Wrong must reset interval and never drop below MIN_EASE.
    interval2, ease2 = memory_engine.compute_next_state(
        interval_days=30,
        ease_factor=memory_engine.MIN_EASE,
        is_correct=False,
    )
    assert interval2 == memory_engine.FIRST_INTERVAL
    assert ease2 == memory_engine.MIN_EASE


def test_pronunciation_scoring_baseline_contract_preserved() -> None:
    exact = score_pronunciation("trust", "trust")
    weak = score_pronunciation("trust", "banana")

    # V1 baseline: exact should remain strongly above weak mismatch.
    assert exact.score >= 90
    assert weak.score < exact.score
    assert exact.ending_score >= weak.ending_score
