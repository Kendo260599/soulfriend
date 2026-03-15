"""
speech/whisper_engine.py - Optional local transcription via Whisper backend.

Phase E scope:
- Transcribe recorded wav to text when whisper backend is installed.
- Never crash UI when backend/model is unavailable.
"""
from __future__ import annotations

import os
import shutil
from dataclasses import dataclass


@dataclass
class TranscriptionResult:
    ok: bool
    mode: str  # "transcribed" | "unavailable" | "error"
    text: str = ""
    message: str = ""


class WhisperEngine:
    """Thin wrapper around optional whisper backend with safe fallback."""

    def __init__(self, model_size: str = "base", language: str = "en"):
        self.model_size = model_size
        self.language = language
        self._backend = None
        self._model = None
        self._ffmpeg_ready = False
        self._ffmpeg_path: str | None = None

    def _ensure_ffmpeg(self) -> None:
        """Make sure ffmpeg binary is discoverable for whisper audio decoding."""
        if self._ffmpeg_ready:
            return
        existing = shutil.which("ffmpeg")
        if existing:
            self._ffmpeg_path = existing
            self._ffmpeg_ready = True
            return

        try:
            import imageio_ffmpeg  # type: ignore

            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            ffmpeg_dir = os.path.dirname(ffmpeg_exe)

            # imageio can return versioned executable names (e.g. ffmpeg-win-*.exe),
            # but Whisper invokes plain "ffmpeg". Create a stable shim name.
            ffmpeg_shim_dir = os.path.join(
                os.path.dirname(__file__), "..", "..", ".cache", "ffmpeg"
            )
            ffmpeg_shim_dir = os.path.normpath(ffmpeg_shim_dir)
            os.makedirs(ffmpeg_shim_dir, exist_ok=True)
            ffmpeg_shim = os.path.join(ffmpeg_shim_dir, "ffmpeg.exe")

            if not os.path.exists(ffmpeg_shim):
                shutil.copy2(ffmpeg_exe, ffmpeg_shim)

            self._ffmpeg_path = ffmpeg_shim
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
            os.environ["PATH"] = ffmpeg_shim_dir + os.pathsep + os.environ.get("PATH", "")
            self._ffmpeg_ready = shutil.which("ffmpeg") is not None
        except Exception:
            self._ffmpeg_ready = False

    def _load_backend(self):
        if self._backend is not None:
            return self._backend

        self._ensure_ffmpeg()

        try:
            import whisper  # type: ignore

            self._backend = whisper
            return whisper
        except Exception:
            self._backend = False
            return False

    def is_available(self) -> bool:
        return bool(self._load_backend())

    def availability_message(self) -> str:
        if self.is_available():
            return f"Whisper backend is ready (model={self.model_size}, ffmpeg={self._ffmpeg_path or 'PATH'})."
        if not self._ffmpeg_ready:
            return "Whisper backend unavailable: ffmpeg not found. Install ffmpeg or imageio-ffmpeg."
        return "Whisper backend is not installed. Install package 'openai-whisper' to enable transcription."

    def _load_model(self):
        backend = self._load_backend()
        if not backend:
            return None
        if self._model is not None:
            return self._model

        self._model = backend.load_model(self.model_size)
        return self._model

    def transcribe(self, audio_path: str) -> TranscriptionResult:
        """Transcribe wav file to text. Returns safe fallback on unavailable backend."""
        if not audio_path or not os.path.exists(audio_path):
            return TranscriptionResult(
                ok=False,
                mode="error",
                message="Recording file not found for transcription.",
            )

        self._ensure_ffmpeg()
        if not self._ffmpeg_ready:
            return TranscriptionResult(
                ok=False,
                mode="unavailable",
                message="ffmpeg executable is not available for Whisper decoding.",
            )

        if not self.is_available():
            return TranscriptionResult(
                ok=False,
                mode="unavailable",
                message=self.availability_message(),
            )

        try:
            model = self._load_model()
            result = model.transcribe(audio_path, language=self.language, fp16=False)
            text = str(result.get("text", "")).strip()
            if not text:
                return TranscriptionResult(
                    ok=False,
                    mode="error",
                    message="Whisper returned empty transcription.",
                )

            return TranscriptionResult(
                ok=True,
                mode="transcribed",
                text=text,
                message="Transcription completed.",
            )
        except Exception as exc:
            return TranscriptionResult(
                ok=False,
                mode="error",
                message=f"Whisper transcription failed: {exc}",
            )
