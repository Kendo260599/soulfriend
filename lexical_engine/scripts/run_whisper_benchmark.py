"""
run_whisper_benchmark.py - Phase E end-to-end Whisper benchmark runner.

Usage:
    python scripts/run_whisper_benchmark.py
    python scripts/run_whisper_benchmark.py --model base --pass-score 70 --min-avg-score 60 --min-pass-rate 0.6

Exit codes:
    0 -> benchmark passes configured thresholds
    1 -> benchmark data missing or thresholds not met
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.pronunciation_scoring import score_pronunciation
from app.speech.whisper_engine import WhisperEngine


BENCH_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "assets", "whisper_benchmark")
)
MANIFEST_PATH = os.path.join(BENCH_DIR, "manifest.json")


@dataclass
class BenchmarkItemResult:
    word: str
    audio: str
    ok: bool
    recognized: str
    score: int
    error: str = ""


def _load_manifest(path: str) -> list[dict]:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Benchmark manifest not found: {path}. Copy manifest.template.json to manifest.json and add audio files."
        )

    with open(path, "r", encoding="utf-8-sig") as f:
        data = json.load(f)

    if isinstance(data, dict):
        if "items" not in data:
            raise ValueError("manifest object must contain an 'items' array")
        data = data.get("items", [])

    if not isinstance(data, list):
        raise ValueError("manifest.json must be a JSON array or an object with an 'items' array")

    cleaned: list[dict] = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Manifest row {idx} must be an object")
        word = str(item.get("word", "")).strip()
        audio = str(item.get("audio", "")).strip()
        if not word or not audio:
            raise ValueError(f"Manifest row {idx} missing word/audio")
        cleaned.append({"word": word, "audio": audio})
    return cleaned


def _save_report(
    report: dict,
    report_json_path: str | None,
    history_dir: str | None,
) -> tuple[str | None, str | None]:
    latest_path: str | None = None
    history_path: str | None = None

    if report_json_path:
        os.makedirs(os.path.dirname(report_json_path), exist_ok=True)
        with open(report_json_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        latest_path = report_json_path

    if history_dir:
        os.makedirs(history_dir, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        history_path = os.path.join(history_dir, f"benchmark_{stamp}.json")
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

    return latest_path, history_path


def run_benchmark(
    model: str,
    pass_score: int,
    min_avg_score: float,
    min_pass_rate: float,
    report_json_path: str | None = None,
    history_dir: str | None = None,
) -> int:
    manifest = _load_manifest(MANIFEST_PATH)
    if len(manifest) < 20:
        print(f"ERROR: expected at least 20 benchmark items, got {len(manifest)}")
        return 1

    engine = WhisperEngine(model_size=model, language="en")
    if not engine.is_available():
        print(f"ERROR: whisper backend unavailable: {engine.availability_message()}")
        return 1

    results: list[BenchmarkItemResult] = []
    for item in manifest:
        word = item["word"]
        audio_rel = item["audio"]
        audio_abs = os.path.join(BENCH_DIR, audio_rel)

        if not os.path.exists(audio_abs):
            results.append(
                BenchmarkItemResult(
                    word=word,
                    audio=audio_rel,
                    ok=False,
                    recognized="",
                    score=0,
                    error="audio file not found",
                )
            )
            continue

        trans = engine.transcribe(audio_abs)
        if not trans.ok:
            results.append(
                BenchmarkItemResult(
                    word=word,
                    audio=audio_rel,
                    ok=False,
                    recognized="",
                    score=0,
                    error=trans.message,
                )
            )
            continue

        s = score_pronunciation(word, trans.text)
        results.append(
            BenchmarkItemResult(
                word=word,
                audio=audio_rel,
                ok=True,
                recognized=trans.text,
                score=s.score,
                error="",
            )
        )

    total = len(results)
    ok_count = sum(1 for r in results if r.ok)
    pass_count = sum(1 for r in results if r.score >= pass_score)
    avg_score = (sum(r.score for r in results) / total) if total else 0.0
    pass_rate = (pass_count / total) if total else 0.0
    passed = avg_score >= min_avg_score and pass_rate >= min_pass_rate

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "config": {
            "model": model,
            "pass_score": pass_score,
            "min_avg_score": min_avg_score,
            "min_pass_rate": min_pass_rate,
        },
        "summary": {
            "items": total,
            "transcribed_ok": ok_count,
            "pass_count": pass_count,
            "pass_rate": pass_rate,
            "avg_score": avg_score,
            "passed": passed,
        },
        "results": [r.__dict__ for r in results],
    }
    latest_report_path, history_report_path = _save_report(
        report,
        report_json_path=report_json_path,
        history_dir=history_dir,
    )

    print("==== Whisper Benchmark Summary ====")
    print(f"Model: {model}")
    print(f"Items: {total}")
    print(f"Transcribed OK: {ok_count}/{total}")
    print(f"Pass threshold score: {pass_score}")
    print(f"Pass count: {pass_count}/{total}")
    print(f"Pass rate: {pass_rate:.3f}")
    print(f"Average score: {avg_score:.2f}")
    if latest_report_path:
        print(f"Report (latest): {latest_report_path}")
    if history_report_path:
        print(f"Report (history): {history_report_path}")

    print("\n---- Sample Results ----")
    for r in results[:20]:
        if r.ok:
            print(f"{r.word:<12} score={r.score:>3} rec={r.recognized!r}")
        else:
            print(f"{r.word:<12} ERROR: {r.error}")

    if avg_score < min_avg_score:
        print(f"FAIL: average score {avg_score:.2f} < min_avg_score {min_avg_score}")
        return 1
    if pass_rate < min_pass_rate:
        print(f"FAIL: pass rate {pass_rate:.3f} < min_pass_rate {min_pass_rate}")
        return 1

    print("PASS: benchmark thresholds satisfied")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Whisper end-to-end pronunciation benchmark")
    parser.add_argument("--model", default="base", help="Whisper model size (base/small/medium/...)" )
    parser.add_argument("--pass-score", type=int, default=70, help="Score threshold to count as pass")
    parser.add_argument("--min-avg-score", type=float, default=60.0, help="Minimum average score")
    parser.add_argument("--min-pass-rate", type=float, default=0.60, help="Minimum pass rate")
    parser.add_argument(
        "--report-json",
        default=os.path.join(BENCH_DIR, "reports", "latest.json"),
        help="Path to write latest benchmark JSON report",
    )
    parser.add_argument(
        "--report-history-dir",
        default=os.path.join(BENCH_DIR, "reports", "history"),
        help="Folder to append timestamped benchmark JSON reports",
    )
    parser.add_argument(
        "--no-report",
        action="store_true",
        help="Disable writing JSON reports",
    )
    args = parser.parse_args()

    report_json = None if args.no_report else args.report_json
    report_history_dir = None if args.no_report else args.report_history_dir

    return run_benchmark(
        model=args.model,
        pass_score=args.pass_score,
        min_avg_score=args.min_avg_score,
        min_pass_rate=args.min_pass_rate,
        report_json_path=report_json,
        history_dir=report_history_dir,
    )


if __name__ == "__main__":
    raise SystemExit(main())
