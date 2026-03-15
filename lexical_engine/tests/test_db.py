"""
tests/test_db.py — Unit tests for db/schema.py, db/repository.py, db/seed_loader.py.
Run: python -m pytest tests/ -v
"""

import json
import pytest

# DB isolation is handled by conftest.py (isolated_db autouse fixture)
from app.db.schema import create_tables, get_connection
from app.db.repository import (
    insert_word,
    get_all_words,
    get_word_by_id,
    get_words_by_cefr,
    get_progress,
    upsert_progress,
    word_exists,
    get_word_id_by_word,
    insert_pronunciation_history,
    get_pronunciation_history,
    get_pronunciation_progress_metrics,
    get_pronunciation_words,
    get_pronunciation_daily_averages,
    get_pronunciation_word_trends,
    get_practice_recommendations,
)
from app.db.seed_loader import load_seed


def _sample_word(word="trust"):
    return dict(
        word=word, ipa="/trʌst/", meaning_vi="tin tưởng",
        cefr_level="A2", difficulty_score=0.3,
        pronunciation_difficulty=0.3, emotion_tag="positive",
        topic_tag="relationship"
    )


# ------------------------------------------------------------------ #
# Schema                                                               #
# ------------------------------------------------------------------ #

class TestSchema:
    def test_vocabulary_table_exists(self):
        conn = get_connection()
        row = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='vocabulary'"
        ).fetchone()
        conn.close()
        assert row is not None

    def test_progress_table_exists(self):
        conn = get_connection()
        row = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='progress'"
        ).fetchone()
        conn.close()
        assert row is not None

    def test_vocabulary_has_ipa_column(self):
        conn = get_connection()
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(vocabulary)").fetchall()]
        conn.close()
        assert "ipa" in cols

    def test_vocabulary_required_columns(self):
        required = [
            "word", "ipa", "meaning_vi", "cefr_level",
            "difficulty_score", "pronunciation_difficulty",
            "emotion_tag", "topic_tag", "created_at", "updated_at"
        ]
        conn = get_connection()
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(vocabulary)").fetchall()]
        conn.close()
        for col in required:
            assert col in cols, f"Missing column: {col}"


# ------------------------------------------------------------------ #
# Repository                                                           #
# ------------------------------------------------------------------ #

class TestRepository:
    def test_insert_and_retrieve(self):
        w = _sample_word()
        insert_word(**w)
        rows = get_all_words()
        assert len(rows) == 1
        assert rows[0]["word"] == "trust"

    def test_insert_duplicate_skipped(self):
        w = _sample_word()
        insert_word(**w)
        insert_word(**w)  # second insert should be silently skipped
        assert len(get_all_words()) == 1

    def test_word_exists_true(self):
        insert_word(**_sample_word())
        assert word_exists("trust") is True

    def test_word_exists_false(self):
        assert word_exists("nonexistent_xyz") is False

    def test_get_word_by_id(self):
        insert_word(**_sample_word())
        rows = get_all_words()
        word_id = rows[0]["id"]
        fetched = get_word_by_id(word_id)
        assert fetched["word"] == "trust"

    def test_get_words_by_cefr(self):
        insert_word(**_sample_word("trust"))
        insert_word(**{**_sample_word("brave"), "word": "brave", "cefr_level": "B1"})
        a2_words = get_words_by_cefr("A2")
        assert len(a2_words) == 1
        assert a2_words[0]["word"] == "trust"

    def test_upsert_progress_insert(self):
        insert_word(**_sample_word())
        word_id = get_all_words()[0]["id"]
        upsert_progress(word_id, 0.4, 2, 1)
        p = get_progress(word_id)
        assert p is not None
        assert p["memory_strength"] == pytest.approx(0.4)
        assert p["correct_count"] == 2
        assert p["wrong_count"] == 1

    def test_upsert_progress_update(self):
        insert_word(**_sample_word())
        word_id = get_all_words()[0]["id"]
        upsert_progress(word_id, 0.4, 2, 1)
        upsert_progress(word_id, 0.6, 3, 1)
        p = get_progress(word_id)
        assert p["memory_strength"] == pytest.approx(0.6)
        assert p["correct_count"] == 3

    def test_memory_strength_clamped_above(self):
        insert_word(**_sample_word())
        word_id = get_all_words()[0]["id"]
        upsert_progress(word_id, 2.0, 0, 0)  # above 1.0 — should clamp
        p = get_progress(word_id)
        assert p["memory_strength"] <= 1.0

    def test_memory_strength_clamped_below(self):
        insert_word(**_sample_word())
        word_id = get_all_words()[0]["id"]
        upsert_progress(word_id, -0.5, 0, 0)  # below 0.0 — should clamp
        p = get_progress(word_id)
        assert p["memory_strength"] >= 0.0

    def test_get_progress_none_when_not_tracked(self):
        insert_word(**_sample_word())
        word_id = get_all_words()[0]["id"]
        assert get_progress(word_id) is None

    def test_get_word_id_by_word(self):
        insert_word(**_sample_word("trust"))
        found_id = get_word_id_by_word("trust")
        assert found_id is not None

    def test_insert_and_query_pronunciation_history(self):
        insert_word(**_sample_word("trust"))
        word_id = get_word_id_by_word("trust")

        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trus",
            score=78,
            feedback="Gan dung",
            audio_path="assets/recordings/a.wav",
            transcription_model="whisper:base",
            rubric={"ending_score": 70, "stress_score": 80},
            word_id=word_id,
        )

        rows = get_pronunciation_history(limit=10, target_word="trust")
        assert len(rows) == 1
        assert rows[0]["target_word"] == "trust"
        assert rows[0]["score"] == 78


# ------------------------------------------------------------------ #
# Seed loader                                                          #
# ------------------------------------------------------------------ #

class TestSeedLoader:
    def test_load_seed_inserts_words(self, tmp_path, monkeypatch):
        seed_data = [_sample_word("trust"), _sample_word("hope")]
        seed_data[1]["word"] = "hope"
        seed_data[1]["meaning_vi"] = "hy vọng"
        seed_file = tmp_path / "words.json"
        seed_file.write_text(json.dumps(seed_data), encoding="utf-8")

        import app.db.seed_loader as sl
        monkeypatch.setattr(sl, "SEED_PATH", str(seed_file))
        load_seed()

        rows = get_all_words()
        assert len(rows) == 2

    def test_load_seed_skips_malformed(self, tmp_path, monkeypatch):
        malformed = [{"word": "bad_entry"}]  # missing required fields
        seed_file = tmp_path / "words.json"
        seed_file.write_text(json.dumps(malformed), encoding="utf-8")

        import app.db.seed_loader as sl
        monkeypatch.setattr(sl, "SEED_PATH", str(seed_file))
        load_seed()

        assert len(get_all_words()) == 0

    def test_load_seed_idempotent(self, tmp_path, monkeypatch):
        seed_data = [_sample_word("trust")]
        seed_file = tmp_path / "words.json"
        seed_file.write_text(json.dumps(seed_data), encoding="utf-8")

        import app.db.seed_loader as sl
        monkeypatch.setattr(sl, "SEED_PATH", str(seed_file))
        load_seed()
        load_seed()  # second call should not duplicate

        assert len(get_all_words()) == 1


class TestPronunciationMetrics:
    def test_pronunciation_word_list(self):
        insert_word(**_sample_word("trust"))
        insert_word(**_sample_word("hope"))

        word_id_1 = get_word_id_by_word("trust")
        word_id_2 = get_word_id_by_word("hope")

        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=90,
            feedback="ok",
            audio_path="a.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 90},
            word_id=word_id_1,
        )
        insert_pronunciation_history(
            target_word="hope",
            recognized_text="hope",
            score=88,
            feedback="ok",
            audio_path="b.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 88},
            word_id=word_id_2,
        )

        words = get_pronunciation_words()
        assert "trust" in words
        assert "hope" in words

    def test_pronunciation_metrics_with_trend(self):
        insert_word(**_sample_word("trust"))
        word_id = get_word_id_by_word("trust")

        # Previous 7 days bucket
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=40,
            feedback="old",
            audio_path="old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 40},
            word_id=word_id,
        )

        # Move first row to 10 days ago to force previous-week bucket
        from app.db.schema import get_connection

        conn = get_connection()
        conn.execute(
            "UPDATE pronunciation_history SET created_at = datetime('now', '-10 day') WHERE id = 1"
        )
        conn.commit()
        conn.close()

        # Current 7 days bucket
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=80,
            feedback="new",
            audio_path="new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 80},
            word_id=word_id,
        )

        metrics = get_pronunciation_progress_metrics(target_word="trust")
        assert metrics["attempts_total"] == 2
        assert metrics["attempts_7d"] == 1
        assert metrics["active_days_7d"] == 1
        assert metrics["avg_score_7d"] == pytest.approx(80.0)
        assert metrics["avg_score_prev_7d"] == pytest.approx(40.0)
        assert metrics["best_score"] == 80
        assert metrics["last_score"] == 80
        assert metrics["streak_days"] >= 1
        assert metrics["trend_direction"] == "up"

    def test_pronunciation_daily_averages_fill_days(self):
        insert_word(**_sample_word("trust"))
        word_id = get_word_id_by_word("trust")

        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=70,
            feedback="ok",
            audio_path="c.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 70},
            word_id=word_id,
        )

        points = get_pronunciation_daily_averages(target_word="trust", days=7)
        assert len(points) == 7
        assert any(p["avg_score"] > 0 for p in points)

    def test_pronunciation_word_trends_top_up_down(self):
        insert_word(**_sample_word("trust"))
        insert_word(**_sample_word("hope"))

        trust_id = get_word_id_by_word("trust")
        hope_id = get_word_id_by_word("hope")

        # trust: previous low, current high -> up
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=30,
            feedback="old",
            audio_path="t_old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 30},
            word_id=trust_id,
        )
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=80,
            feedback="new",
            audio_path="t_new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 80},
            word_id=trust_id,
        )

        # hope: previous high, current low -> down
        insert_pronunciation_history(
            target_word="hope",
            recognized_text="hope",
            score=90,
            feedback="old",
            audio_path="h_old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 90},
            word_id=hope_id,
        )
        insert_pronunciation_history(
            target_word="hope",
            recognized_text="hope",
            score=50,
            feedback="new",
            audio_path="h_new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 50},
            word_id=hope_id,
        )

        # Move "old" rows to previous-week window
        from app.db.schema import get_connection

        conn = get_connection()
        conn.execute(
            "UPDATE pronunciation_history SET created_at = datetime('now', '-10 day') WHERE audio_path IN ('t_old.wav', 'h_old.wav')"
        )
        conn.commit()
        conn.close()

        trends = get_pronunciation_word_trends(limit=5)
        up_words = [item["word"] for item in trends["top_up"]]
        down_words = [item["word"] for item in trends["top_down"]]

        assert "trust" in up_words
        assert "hope" in down_words

    def test_practice_recommendations_prioritize_downtrend_and_low_scores(self):
        insert_word(**_sample_word("trust"))
        insert_word(**_sample_word("hope"))
        insert_word(**_sample_word("calm"))

        trust_id = get_word_id_by_word("trust")
        hope_id = get_word_id_by_word("hope")
        calm_id = get_word_id_by_word("calm")

        # trust: strong downtrend and low recent score -> should be high priority
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=90,
            feedback="old",
            audio_path="rec_t_old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 90},
            word_id=trust_id,
        )
        insert_pronunciation_history(
            target_word="trust",
            recognized_text="trust",
            score=45,
            feedback="new",
            audio_path="rec_t_new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 45},
            word_id=trust_id,
        )

        # hope: mild downtrend, medium score
        insert_pronunciation_history(
            target_word="hope",
            recognized_text="hope",
            score=80,
            feedback="old",
            audio_path="rec_h_old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 80},
            word_id=hope_id,
        )
        insert_pronunciation_history(
            target_word="hope",
            recognized_text="hope",
            score=70,
            feedback="new",
            audio_path="rec_h_new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 70},
            word_id=hope_id,
        )

        # calm: improving, should not outrank trust/hope for recommendation
        insert_pronunciation_history(
            target_word="calm",
            recognized_text="calm",
            score=50,
            feedback="old",
            audio_path="rec_c_old.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 50},
            word_id=calm_id,
        )
        insert_pronunciation_history(
            target_word="calm",
            recognized_text="calm",
            score=85,
            feedback="new",
            audio_path="rec_c_new.wav",
            transcription_model="whisper:base",
            rubric={"char_score": 85},
            word_id=calm_id,
        )

        from app.db.schema import get_connection

        conn = get_connection()
        conn.execute(
            "UPDATE pronunciation_history SET created_at = datetime('now', '-10 day') WHERE audio_path IN ('rec_t_old.wav','rec_h_old.wav','rec_c_old.wav')"
        )
        conn.commit()
        conn.close()

        recommendations = get_practice_recommendations(limit=3)
        assert len(recommendations) >= 2

        words = [item["word"] for item in recommendations]
        assert "trust" in words
        assert "hope" in words

        trust_item = next(item for item in recommendations if item["word"] == "trust")
        hope_item = next(item for item in recommendations if item["word"] == "hope")
        assert trust_item["priority"] >= hope_item["priority"]
