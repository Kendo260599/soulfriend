"""
transcription_bridge_worker.py

CLI worker used by backend bridge service.
Reads an audio file path, transcribes with WhisperEngine, and prints one JSON object to stdout.
"""

from __future__ import annotations

import argparse
import json
import os
import sys


ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.speech.whisper_engine import WhisperEngine  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Whisper transcription bridge worker")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--model", default="base", help="Whisper model size")
    parser.add_argument("--language", default="en", help="Recognition language")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not os.path.exists(args.audio):
        print(
            json.dumps(
                {
                    "ok": False,
                    "mode": "error",
                    "text": "",
                    "message": f"Audio file not found: {args.audio}",
                },
                ensure_ascii=True,
            )
        )
        return 1

    engine = WhisperEngine(model_size=args.model, language=args.language)
    trans = engine.transcribe(args.audio)

    print(
        json.dumps(
            {
                "ok": trans.ok,
                "mode": trans.mode,
                "text": trans.text,
                "message": trans.message,
            },
            ensure_ascii=False,
        )
    )
    return 0 if trans.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
