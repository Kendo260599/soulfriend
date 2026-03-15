"""
tests/test_whisper_benchmark.py - Optional E2E benchmark test harness.

This test is intentionally opt-in to avoid flaky CI on machines without
benchmark dataset and/or heavy Whisper runtime setup.

Run manually:
    $env:RUN_WHISPER_E2E='1'
    python -m pytest tests/test_whisper_benchmark.py -q
"""

from __future__ import annotations

import os

import pytest

from scripts.run_whisper_benchmark import BENCH_DIR, MANIFEST_PATH, run_benchmark


@pytest.mark.skipif(
    os.getenv("RUN_WHISPER_E2E") != "1",
    reason="Set RUN_WHISPER_E2E=1 to run Whisper benchmark integration test.",
)
def test_whisper_benchmark_phase_e_20_words() -> None:
    if not os.path.exists(MANIFEST_PATH):
        pytest.skip(
            f"Benchmark manifest missing at {MANIFEST_PATH}. Prepare dataset in {BENCH_DIR}."
        )

    exit_code = run_benchmark(
        model="base",
        pass_score=70,
        min_avg_score=60.0,
        min_pass_rate=0.60,
    )
    assert exit_code == 0
