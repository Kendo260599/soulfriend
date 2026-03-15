"""
tests/test_audio_player.py — Unit/stress tests for speech/audio_player.py.
"""

from app.db.repository import get_all_words
from app.db.seed_loader import load_seed
from app.speech import audio_player
from app.speech import audio_validator


class TestAudioNaming:
    def test_sanitize_word(self):
        assert audio_player.sanitize_word_for_filename("Self Confidence!") == "self_confidence"

    def test_validate_audio_name_rejects_empty(self):
        assert audio_player.validate_audio_name("   ") is False

    def test_get_audio_path_uses_normal_folder(self):
        p = audio_player.get_audio_path("trust", speed="normal")
        assert "audio" in p and "normal" in p and p.endswith("trust.wav")

    def test_get_audio_path_uses_slow_folder(self):
        p = audio_player.get_audio_path("trust", speed="slow")
        assert "audio" in p and "slow" in p and p.endswith("trust.wav")


class TestAudioPlayback:
    def test_play_missing_audio_returns_fallback(self):
        result = audio_player.play_word("unlikely_word_12345", speed="normal")
        assert result.ok is True
        assert result.mode == "fallback"

    def test_play_invalid_word_returns_fallback(self):
        result = audio_player.play_word("   ", speed="normal")
        assert result.ok is True
        assert result.mode == "fallback"


class TestAudioValidator:
    def test_validate_words_returns_issues_for_missing_files(self):
        issues = audio_validator.validate_words(["trust", "hope"], speed="normal")
        assert len(issues) == 2


class TestAudioStress:
    def test_first_50_words_play_without_crash(self):
        load_seed()
        words = get_all_words()
        sample = [row["word"] for row in words[:50]]
        assert len(sample) == 50

        # Stress requirement (Day 20): 50 words should run without exceptions.
        for word in sample:
            result = audio_player.play_word(word, speed="normal")
            assert result.ok is True
            assert result.mode in {"file", "fallback"}
