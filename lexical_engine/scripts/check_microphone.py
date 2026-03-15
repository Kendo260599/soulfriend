"""
check_microphone.py - CLI check for microphone input device availability.

Usage:
    python scripts/check_microphone.py

Exit codes:
    0 -> Microphone input available
    1 -> No usable microphone input (or check failed)
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.speech.recorder import LocalRecorder


def main() -> int:
    recorder = LocalRecorder()
    result = recorder.check_input_device()

    if result.available:
        name = result.device_name or "unknown"
        print(f"OK: microphone input is available ({name})")
        return 0

    print(f"ERROR: microphone input is not available. {result.message}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
