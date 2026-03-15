"""
tests/test_whisper_engine.py - Unit tests for optional whisper wrapper.
"""

from app.speech.whisper_engine import WhisperEngine


class TestWhisperEngine:
    def test_missing_file_returns_error(self):
        engine = WhisperEngine()
        result = engine.transcribe("nonexistent_audio.wav")
        assert result.ok is False
        assert result.mode == "error"

    def test_unavailable_backend_returns_unavailable(self):
        engine = WhisperEngine()
        engine._backend = False  # force unavailable backend path
        result = engine.transcribe(__file__)  # existing path, not wav but enough for backend check
        assert result.ok is False
        assert result.mode == "unavailable"
