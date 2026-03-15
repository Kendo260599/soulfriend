"""
check_whisper_backend.py - Verify Whisper runtime setup on this machine.

Usage:
    python scripts/check_whisper_backend.py

Exit codes:
    0 -> Whisper backend ready
    1 -> Whisper backend unavailable
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.speech.whisper_engine import WhisperEngine


def main() -> int:
    engine = WhisperEngine(model_size="base", language="en")
    if engine.is_available():
        print(engine.availability_message())
        return 0

    print(engine.availability_message())
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
