"""Contract tests for Phase-2 phrase/grammar/adaptive engines."""

from __future__ import annotations

from app.api import lexical_service
from app.core import adaptive_profile_engine, grammar_micro_engine, phrase_engine
from app.db.repository import (
    get_word_id_by_word,
    insert_pronunciation_history,
    insert_word,
    upsert_progress,
)
from app.db.schema import get_connection


def _seed_base_words() -> None:
    rows = [
        ("trust", "/trʌst/", "tin tuong", "A2", 0.2, 0.2, "positive", "relationship"),
        ("focus", "/foʊkəs/", "tap trung", "A2", 0.3, 0.2, "neutral", "functional"),
        ("light", "/laɪt/", "anh sang", "A1", 0.1, 0.1, "neutral", "daily"),
    ]
    for word, ipa, meaning_vi, cefr, diff, pron_diff, emotion, topic in rows:
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


def test_phrase_engine_prefers_seeded_and_falls_back() -> None:
    _seed_base_words()

    trust_id = int(get_word_id_by_word("trust") or 0)
    assert trust_id > 0

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO phrase_units(vocab_id, phrase, meaning_vi, difficulty_score, pronunciation_focus, grammar_focus)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (trust_id, "build trust", "xay dung niem tin", 0.2, "tr cluster", "verb + noun"),
    )
    conn.commit()
    conn.close()

    payload = phrase_engine.build_phrase_pack(["trust", "focus"], phrases_per_word=2)

    assert set(payload.keys()) == {"items", "summary"}
    assert payload["summary"]["seededItems"] == 1
    assert payload["summary"]["fallbackItems"] == 1
    assert payload["summary"]["coveredWords"] == 2

    by_source = {str(item["sourceWord"]).lower(): item for item in payload["items"]}
    assert by_source["trust"]["seeded"] is True
    assert by_source["focus"]["seeded"] is False


def test_grammar_micro_engine_filters_by_unlock_levels() -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO grammar_micro_units(pattern, description_vi, difficulty_score, example_sentence, unlock_level)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("I can + V", "mau co ban", 0.1, "I can help.", "core"),
    )
    cur.execute(
        """
        INSERT INTO grammar_micro_units(pattern, description_vi, difficulty_score, example_sentence, unlock_level)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("If I were...", "mau nang cao", 0.6, "If I were you...", "relationship"),
    )
    conn.commit()
    conn.close()

    skill_states = [
        {"name": "core", "unlocked": True},
        {"name": "relationship", "unlocked": False},
    ]
    payload = grammar_micro_engine.build_grammar_micro_pack(
        skill_states=skill_states,
        lesson_words=["trust"],
        limit=5,
    )

    assert set(payload.keys()) == {"unlockLevels", "items", "summary"}
    assert "core" in payload["unlockLevels"]
    patterns = [str(item["pattern"]) for item in payload["items"]]
    assert "I can + V" in patterns
    assert "If I were..." not in patterns


def test_adaptive_profile_payload_has_current_previous_and_delta() -> None:
    _seed_base_words()

    trust_id = int(get_word_id_by_word("trust") or 0)
    focus_id = int(get_word_id_by_word("focus") or 0)
    assert trust_id > 0
    assert focus_id > 0

    upsert_progress(word_id=trust_id, memory_strength=0.7, correct_count=4, wrong_count=1)
    upsert_progress(word_id=focus_id, memory_strength=0.6, correct_count=3, wrong_count=1)

    insert_pronunciation_history(
        target_word="trust",
        recognized_text="trust",
        score=85,
        feedback="ok",
        audio_path="a.wav",
        transcription_model="whisper:base",
        rubric={"char_score": 85},
        word_id=trust_id,
    )

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO learner_profile_history(
            lexical_level,
            grammar_readiness_proxy,
            pronunciation_level,
            response_confidence_proxy,
            hesitation_level
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        (0.2, 0.2, 0.2, 0.2, 0.8),
    )
    conn.commit()
    conn.close()

    payload = adaptive_profile_engine.get_profile_payload()

    assert set(payload.keys()) == {"current", "previous", "delta", "meta"}
    assert payload["previous"] is not None
    assert payload["current"]["lexicalLevel"] > 0.2
    assert payload["delta"]["lexicalLevel"] > 0


def test_lexical_service_phase2_home_payload_contract() -> None:
    _seed_base_words()

    payload = lexical_service.get_phase2_home_payload(lesson_size=5)

    assert set(payload.keys()) == {"home", "phrasePack", "grammarPack", "adaptiveProfile"}
    assert set(payload["home"].keys()) == {"lesson", "skills", "summary"}
    assert "items" in payload["phrasePack"]
    assert "items" in payload["grammarPack"]
    assert "current" in payload["adaptiveProfile"]

    flow = payload["adaptiveProfile"]["meta"]["phase2Flow"]
    assert set(flow.keys()) == {
        "stage",
        "phraseUnlocked",
        "grammarUnlocked",
        "thresholds",
        "signals",
    }
    assert flow["stage"] in {"foundation", "phrase", "grammar"}


def test_lexical_service_phase2_locks_phrase_and_grammar_when_profile_low() -> None:
    _seed_base_words()

    payload = lexical_service.get_phase2_home_payload(
        lesson_size=5,
        phrase_limit_per_word=99,
        grammar_limit=99,
    )

    flow = payload["adaptiveProfile"]["meta"]["phase2Flow"]
    assert flow["phraseUnlocked"] is False
    assert flow["grammarUnlocked"] is False
    assert flow["stage"] == "foundation"

    assert payload["phrasePack"]["items"] == []
    assert payload["phrasePack"]["summary"]["locked"] is True

    assert payload["grammarPack"]["items"] == []
    assert payload["grammarPack"]["summary"]["locked"] is True

    applied_limits = payload["adaptiveProfile"]["meta"]["appliedLimits"]
    assert applied_limits["phraseLimitPerWord"] == 3
    assert applied_limits["grammarLimit"] == 8


def test_lexical_service_phase2_unlocks_phrase_and_grammar_when_profile_ready() -> None:
    _seed_base_words()
    insert_word(
        word="plain",
        ipa="/pleɪn/",
        meaning_vi="don gian",
        cefr_level="A1",
        difficulty_score=0.1,
        pronunciation_difficulty=0.1,
        emotion_tag="neutral",
        topic_tag="general",
    )

    trust_id = int(get_word_id_by_word("trust") or 0)
    focus_id = int(get_word_id_by_word("focus") or 0)
    light_id = int(get_word_id_by_word("light") or 0)
    assert trust_id > 0
    assert focus_id > 0
    assert light_id > 0

    upsert_progress(word_id=trust_id, memory_strength=0.9, correct_count=5, wrong_count=0)
    upsert_progress(word_id=focus_id, memory_strength=0.8, correct_count=4, wrong_count=0)
    upsert_progress(word_id=light_id, memory_strength=0.7, correct_count=4, wrong_count=0)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO phrase_units(vocab_id, phrase, meaning_vi, difficulty_score, pronunciation_focus, grammar_focus)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (trust_id, "build trust", "xay dung niem tin", 0.2, "tr cluster", "verb + noun"),
    )
    cur.execute(
        """
        INSERT INTO grammar_micro_units(pattern, description_vi, difficulty_score, example_sentence, unlock_level)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("I can + V", "mau co ban", 0.1, "I can help.", "core"),
    )
    conn.commit()
    conn.close()

    payload = lexical_service.get_phase2_home_payload(lesson_size=5)
    flow = payload["adaptiveProfile"]["meta"]["phase2Flow"]

    assert flow["phraseUnlocked"] is True
    assert flow["grammarUnlocked"] is True
    assert flow["stage"] == "grammar"

    assert isinstance(payload["phrasePack"]["items"], list)
    assert len(payload["phrasePack"]["items"]) > 0
    assert "locked" not in payload["phrasePack"]["summary"]

    assert isinstance(payload["grammarPack"]["items"], list)
    assert len(payload["grammarPack"]["items"]) > 0
    assert "locked" not in payload["grammarPack"]["summary"]
