"""
speech/audio_player.py — local audio playback + naming validation.

Phase C scope:
- Resolve audio file path by naming convention: <word>.wav
- Validate file presence in assets/audio/{normal,slow}
- Play safely on Windows via winsound
- Never crash UI when audio file is missing
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass

try:
    import winsound
except ImportError:  # pragma: no cover
    winsound = None


VALID_SPEEDS = {"normal", "slow"}

BASE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "assets", "audio")
)
NORMAL_DIR = os.path.join(BASE_DIR, "normal")
SLOW_DIR = os.path.join(BASE_DIR, "slow")


@dataclass
class AudioPlayResult:
    ok: bool
    mode: str                # "file" | "fallback" | "error"
    path: str | None = None
    message: str = ""


def sanitize_word_for_filename(word: str) -> str:
    """Convert word to lowercase-safe filename token used by the audio convention."""
    token = word.strip().lower()
    token = re.sub(r"\s+", "_", token)
    token = re.sub(r"[^a-z0-9_\-]", "", token)
    return token


def validate_audio_name(word: str) -> bool:
    """Ensure sanitized audio name has content and is filesystem-safe."""
    token = sanitize_word_for_filename(word)
    return bool(token)


def get_audio_path(word: str, speed: str = "normal") -> str:
    """Return normalized .wav path for a given word/speed naming convention."""
    speed = speed.lower().strip()
    if speed not in VALID_SPEEDS:
        speed = "normal"

    folder = NORMAL_DIR if speed == "normal" else SLOW_DIR
    token = sanitize_word_for_filename(word)
    return os.path.join(folder, f"{token}.wav")


def audio_exists(word: str, speed: str = "normal") -> bool:
    """True when expected local audio file exists."""
    if not validate_audio_name(word):
        return False
    return os.path.exists(get_audio_path(word, speed=speed))


def play_word(word: str, speed: str = "normal") -> AudioPlayResult:
    """
    Try to play word audio file. If missing, fallback silently with non-fatal result.

    Result contract:
    - ok=True, mode="file" when wav is successfully sent to system audio
    - ok=True, mode="fallback" when file missing or playback backend unavailable
    - ok=False, mode="error" only on unexpected runtime errors
    """
    if not validate_audio_name(word):
        return AudioPlayResult(
            ok=True,
            mode="fallback",
            message="Invalid word token for audio filename.",
        )

    path = get_audio_path(word, speed=speed)
    if not os.path.exists(path):
        return AudioPlayResult(
            ok=True,
            mode="fallback",
            path=path,
            message="Audio file not found; skip playback.",
        )

    if winsound is None:
        return AudioPlayResult(
            ok=True,
            mode="fallback",
            path=path,
            message="winsound unavailable; skip playback.",
        )

    try:
        winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC)
        return AudioPlayResult(ok=True, mode="file", path=path, message="Playing")
    except Exception as exc:  # pragma: no cover
        return AudioPlayResult(
            ok=False,
            mode="error",
            path=path,
            message=f"Playback error: {exc}",
        )
