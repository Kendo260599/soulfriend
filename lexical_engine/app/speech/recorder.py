"""
speech/recorder.py — Local microphone recorder for Phase D.

Capabilities:
- Start/stop recording state machine
- Save WAV files to assets/recordings
- Replay local WAV file on Windows

Design note:
- Uses sounddevice + numpy if available for real mic capture
- Falls back to writing a short silent WAV so UI/tests never crash on missing deps
"""
from __future__ import annotations

import os
import time
import wave
from dataclasses import dataclass
from datetime import datetime

try:
    import winsound
except ImportError:  # pragma: no cover
    winsound = None

try:
    import sounddevice as sd  # type: ignore
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    sd = None
    np = None


RECORDINGS_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "assets", "recordings")
)


@dataclass
class RecorderResult:
    ok: bool
    mode: str               # "recorded" | "fallback" | "error"
    path: str | None = None
    seconds: float = 0.0
    message: str = ""


@dataclass
class MicrophoneCheckResult:
    available: bool
    mode: str                 # "ready" | "missing-dependency" | "no-device" | "error"
    device_name: str | None = None
    message: str = ""


class LocalRecorder:
    """Simple recorder with explicit idle/recording states."""

    def __init__(
        self,
        sample_rate: int = 16000,
        channels: int = 1,
        silence_peak_threshold: int = 200,
        min_valid_duration: float = 0.25,
    ):
        self.sample_rate = sample_rate
        self.channels = channels
        self.silence_peak_threshold = max(0, int(silence_peak_threshold))
        self.min_valid_duration = max(0.1, float(min_valid_duration))
        self._is_recording = False
        self._record_start = 0.0
        self._record_path: str | None = None
        self._frames: list[bytes] = []
        self._stream = None

        os.makedirs(RECORDINGS_DIR, exist_ok=True)

    @property
    def is_recording(self) -> bool:
        return self._is_recording

    def _next_record_path(self, prefix: str = "pronunciation") -> str:
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        return os.path.join(RECORDINGS_DIR, f"{prefix}_{stamp}.wav")

    def check_input_device(self) -> MicrophoneCheckResult:
        """Check whether a usable microphone input device exists on this machine."""
        if sd is None:
            return MicrophoneCheckResult(
                available=False,
                mode="missing-dependency",
                message="sounddevice is not installed.",
            )

        try:
            devices = sd.query_devices()
            default_input_index = None
            default_setting = getattr(sd.default, "device", None)

            if isinstance(default_setting, (tuple, list)) and len(default_setting) >= 1:
                default_input_index = default_setting[0]
            elif isinstance(default_setting, int):
                default_input_index = default_setting

            if isinstance(default_input_index, int) and default_input_index >= 0:
                default_dev = devices[default_input_index]
                if default_dev.get("max_input_channels", 0) > 0:
                    name = str(default_dev.get("name", "Default input"))
                    return MicrophoneCheckResult(
                        available=True,
                        mode="ready",
                        device_name=name,
                        message=f"Using default input device: {name}",
                    )

            for dev in devices:
                if dev.get("max_input_channels", 0) > 0:
                    name = str(dev.get("name", "Input device"))
                    return MicrophoneCheckResult(
                        available=True,
                        mode="ready",
                        device_name=name,
                        message=f"Found input device: {name}",
                    )

            return MicrophoneCheckResult(
                available=False,
                mode="no-device",
                message="No input audio device was found.",
            )
        except Exception as exc:
            return MicrophoneCheckResult(
                available=False,
                mode="error",
                message=f"Input device check failed: {exc}",
            )

    def start_recording(self, target_word: str = "word") -> RecorderResult:
        """Start recording session. Returns immediate status."""
        if self._is_recording:
            return RecorderResult(False, "error", message="Recorder already running.")

        safe_word = target_word.strip().lower().replace(" ", "_") or "word"
        self._record_path = self._next_record_path(prefix=safe_word)
        self._record_start = time.time()
        self._frames = []

        if sd is not None and np is not None:
            try:
                def _callback(indata, frames, _time_info, status):
                    if status:
                        # ignore transient status and keep collecting
                        pass
                    pcm16 = (indata * 32767).astype(np.int16)
                    self._frames.append(pcm16.tobytes())

                self._stream = sd.InputStream(
                    samplerate=self.sample_rate,
                    channels=self.channels,
                    dtype="float32",
                    callback=_callback,
                )
                self._stream.start()
                self._is_recording = True
                return RecorderResult(True, "recorded", path=self._record_path, message="Recording started")
            except Exception as exc:
                self._stream = None
                self._is_recording = True  # still allow fallback output on stop
                return RecorderResult(True, "fallback", path=self._record_path,
                                      message=f"sounddevice unavailable at runtime: {exc}")

        self._is_recording = True
        return RecorderResult(True, "fallback", path=self._record_path,
                              message="sounddevice not installed; fallback mode")

    def stop_recording(self) -> RecorderResult:
        """Stop recording and write a WAV file to disk."""
        if not self._is_recording:
            return RecorderResult(False, "error", message="Recorder is not running.")

        elapsed = max(0.1, time.time() - self._record_start)
        path = self._record_path or self._next_record_path()

        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception:
                pass
            finally:
                self._stream = None

        try:
            if self._frames:
                pcm16 = b"".join(self._frames)
                peak = self._pcm16_peak(pcm16)
                too_short = elapsed < self.min_valid_duration
                is_silent = peak < self.silence_peak_threshold
                if too_short or is_silent:
                    reason = []
                    if too_short:
                        reason.append(
                            f"duration {elapsed:.2f}s < min {self.min_valid_duration:.2f}s"
                        )
                    if is_silent:
                        reason.append(
                            f"audio peak {peak} < threshold {self.silence_peak_threshold}"
                        )

                    self._is_recording = False
                    self._frames = []
                    self._record_path = None
                    return RecorderResult(
                        False,
                        "error",
                        path=None,
                        seconds=elapsed,
                        message="Recording rejected by silence gate: " + "; ".join(reason),
                    )

                self._write_wav(path, pcm16, elapsed)
                mode = "recorded"
                msg = "Recording saved"
            else:
                self._is_recording = False
                self._frames = []
                self._record_path = None
                return RecorderResult(
                    False,
                    "error",
                    path=None,
                    seconds=elapsed,
                    message="Recording rejected by silence gate: no audio frames captured.",
                )

            self._is_recording = False
            self._frames = []
            self._record_path = path
            return RecorderResult(True, mode, path=path, seconds=elapsed, message=msg)
        except Exception as exc:
            self._is_recording = False
            self._frames = []
            return RecorderResult(False, "error", path=path, seconds=elapsed, message=str(exc))

    def replay(self, path: str | None = None) -> RecorderResult:
        """Replay a local wav file asynchronously."""
        wav_path = path or self._record_path
        if not wav_path:
            return RecorderResult(False, "error", message="No recording to replay.")
        if not os.path.exists(wav_path):
            return RecorderResult(False, "error", path=wav_path, message="Recording file not found.")
        if winsound is None:
            return RecorderResult(True, "fallback", path=wav_path, message="winsound unavailable; skip replay")

        try:
            winsound.PlaySound(wav_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
            return RecorderResult(True, "recorded", path=wav_path, message="Replaying")
        except Exception as exc:
            return RecorderResult(False, "error", path=wav_path, message=f"Replay failed: {exc}")

    def _silence_bytes(self, seconds: float) -> bytes:
        frame_count = int(self.sample_rate * seconds)
        return b"\x00\x00" * frame_count * self.channels

    def _pcm16_peak(self, pcm16_bytes: bytes) -> int:
        if not pcm16_bytes:
            return 0
        peak = 0
        for i in range(0, len(pcm16_bytes) - 1, 2):
            sample = int.from_bytes(pcm16_bytes[i : i + 2], byteorder="little", signed=True)
            if sample < 0:
                sample = -sample
            if sample > peak:
                peak = sample
        return peak

    def _write_wav(self, path: str, pcm16_bytes: bytes, seconds: float) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with wave.open(path, "wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(2)  # int16
            wf.setframerate(self.sample_rate)
            wf.writeframes(pcm16_bytes)
