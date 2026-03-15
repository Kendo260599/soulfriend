"""
speech/audio_validator.py — Audio naming and availability validation.

Provides batch checks for vocabulary words to support Phase C diagnostics.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.speech import audio_player


@dataclass
class AudioValidationIssue:
    word: str
    speed: str
    reason: str


def validate_word_audio(word: str, speed: str = "normal") -> AudioValidationIssue | None:
    """Return issue details when a word has invalid/missing audio, else None."""
    if not audio_player.validate_audio_name(word):
        return AudioValidationIssue(word=word, speed=speed, reason="invalid_filename")

    if not audio_player.audio_exists(word, speed=speed):
        return AudioValidationIssue(word=word, speed=speed, reason="missing_file")

    return None


def validate_words(words: list[str], speed: str = "normal") -> list[AudioValidationIssue]:
    """Validate a list of words and return only problematic entries."""
    issues: list[AudioValidationIssue] = []
    for word in words:
        issue = validate_word_audio(word, speed=speed)
        if issue is not None:
            issues.append(issue)
    return issues
