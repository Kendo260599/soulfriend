"""
tests/test_recorder.py — Unit tests for speech/recorder.py.
"""

import os
import time
from pathlib import Path
import wave

from app.speech.recorder import LocalRecorder


class TestLocalRecorder:
    def test_check_input_device_returns_structured_result(self):
        recorder = LocalRecorder()
        result = recorder.check_input_device()

        assert isinstance(result.available, bool)
        assert result.mode in {"ready", "missing-dependency", "no-device", "error"}
        assert isinstance(result.message, str)

    def test_stop_recording_rejects_when_no_frames_captured(self):
        recorder = LocalRecorder(sample_rate=16000, channels=1)
        recorder._is_recording = True
        recorder._record_start = time.time() - 0.4

        stop = recorder.stop_recording()
        assert stop.ok is False
        assert stop.mode == "error"
        assert "silence gate" in stop.message.lower()
        assert recorder.is_recording is False

    def test_stop_recording_rejects_silent_audio(self, tmp_path: Path):
        recorder = LocalRecorder(sample_rate=16000, channels=1, silence_peak_threshold=200)
        recorder._is_recording = True
        recorder._record_start = time.time() - 0.6
        recorder._record_path = str(tmp_path / "silent.wav")
        recorder._frames = [b"\x00\x00" * (16000 // 2)]

        stop = recorder.stop_recording()
        assert stop.ok is False
        assert stop.mode == "error"
        assert stop.path is None
        assert not os.path.exists(str(tmp_path / "silent.wav"))

    def test_stop_recording_saves_non_silent_audio(self, tmp_path: Path):
        recorder = LocalRecorder(sample_rate=16000, channels=1, silence_peak_threshold=200)
        recorder._is_recording = True
        recorder._record_start = time.time() - 0.8
        out = str(tmp_path / "voice.wav")
        recorder._record_path = out
        recorder._frames = [b"\xe8\x03" * (16000 // 2)]  # int16 value 1000

        stop = recorder.stop_recording()
        assert stop.ok is True
        assert stop.mode == "recorded"
        assert stop.path == out
        assert os.path.exists(out)

        with wave.open(out, "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getframerate() == 16000

    def test_replay_without_file_returns_error(self):
        recorder = LocalRecorder()
        result = recorder.replay(None)
        assert result.ok is False

    def test_stop_without_start_returns_error(self):
        recorder = LocalRecorder()
        result = recorder.stop_recording()
        assert result.ok is False
        assert result.mode == "error"
