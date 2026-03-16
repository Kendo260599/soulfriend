"""Canonical lexical API worker for backend bridge.

This worker exposes stable JSON outputs derived from Python canonical logic.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.api import lexical_service, progress_service, recommendation_service  # noqa: E402
from app.core import pronunciation_scoring, quiz_engine  # noqa: E402
from app.db import repository, schema  # noqa: E402


def _success(data: Dict[str, Any]) -> int:
    print(json.dumps({"ok": True, "data": data}, ensure_ascii=False))
    return 0


def _error(message: str, mode: str = "error") -> int:
    print(json.dumps({"ok": False, "mode": mode, "message": message}, ensure_ascii=False))
    return 1


def _progress_shape() -> Dict[str, Any]:
    summary = progress_service.get_progress_summary_payload()
    pronunciation = summary.get("pronunciation", {})
    return {
        "learned": int(summary.get("learnedWords", 0) or 0),
        "avgMemoryPercent": float(summary.get("avgMemoryPercent", 0.0) or 0.0),
        "attempts": int(pronunciation.get("attempts_total", 0) or 0),
        "avgPronunciationScore": float(pronunciation.get("avg_score_all", 0.0) or 0.0),
    }


def _history_shape(limit: int = 20) -> List[Dict[str, Any]]:
    rows = repository.get_pronunciation_history(limit=max(1, int(limit)))
    output: List[Dict[str, Any]] = []
    for row in rows:
        output.append(
            {
                "at": str(row["created_at"] or ""),
                "word": str(row["target_word"] or ""),
                "score": int(row["score"] or 0) if row["score"] is not None else 0,
                "recognized": str(row["recognized_text"] or ""),
                "feedback": str(row["feedback"] or ""),
            }
        )
    return output


def action_words() -> int:
    words = repository.get_all_words()
    payload = [
        {
            "word": str(row["word"]),
            "meaningVi": str(row["meaning_vi"]),
            "cefrLevel": str(row["cefr_level"]),
        }
        for row in words
    ]
    return _success({"words": payload, "total": len(payload)})


def action_quiz_next(batch_size: int, mode: str) -> int:
    payload = lexical_service.get_quiz_batch_payload(batch_size=batch_size, mode=mode)
    items = payload.get("items", [])
    if not items:
        return _success(
            {
                "quiz": None,
                "progress": _progress_shape(),
            }
        )

    item = items[0]
    progress_row = repository.get_progress(int(item["wordId"]))
    memory_strength = float(progress_row["memory_strength"] or 0.0) if progress_row else 0.0

    return _success(
        {
            "quiz": {
                "item": {
                    "word": item["word"],
                    "meaningVi": item["correctAnswer"],
                    "wordId": item["wordId"],
                    "ipa": item["ipa"],
                },
                "choices": item["choices"],
                "mode": payload["mode"],
            },
            "memoryStrength": memory_strength,
            "progress": _progress_shape(),
        }
    )


def action_quiz_answer(word: str, selected_meaning: str) -> int:
    token = str(word or "").strip()
    selected = str(selected_meaning or "").strip()
    if not token or not selected:
        return _error("word and selectedMeaning are required", mode="validation")

    word_id = repository.get_word_id_by_word(token)
    if word_id is None:
        return _error(f"Word not found: {token}", mode="not_found")

    row = repository.get_word_by_id(word_id)
    if row is None:
        return _error(f"Word row missing for id: {word_id}", mode="not_found")

    expected = str(row["meaning_vi"] or "")
    is_correct = expected == selected
    new_strength = float(quiz_engine.submit_answer(word_id, is_correct))

    return _success(
        {
            "word": token,
            "wordId": int(word_id),
            "isCorrect": is_correct,
            "memoryStrength": round(new_strength, 4),
            "expectedMeaning": expected,
            "message": "Đúng rồi. + memory strength" if is_correct else "Chưa đúng. - memory strength",
            "progress": _progress_shape(),
        }
    )


def action_pronunciation_score(target_word: str, recognized_text: str, transcription_model: str = "manual") -> int:
    target = str(target_word or "").strip()
    recognized = str(recognized_text or "")
    if not target:
        return _error("targetWord is required", mode="validation")

    scoring = pronunciation_scoring.score_pronunciation(target, recognized)
    rubric = {
        "char_score": scoring.char_score,
        "ending_score": scoring.ending_score,
        "stress_score": scoring.stress_score,
        "phrase_score": scoring.phrase_score,
    }
    word_id = repository.get_word_id_by_word(target)
    repository.insert_pronunciation_history(
        target_word=target,
        recognized_text=recognized,
        score=scoring.score,
        feedback=scoring.feedback,
        audio_path=None,
        transcription_model=transcription_model,
        rubric=rubric,
        word_id=word_id,
    )

    return _success(
        {
            "result": {
                "target": scoring.target_normalized,
                "recognized": scoring.recognized_normalized,
                "score": scoring.score,
                "feedback": scoring.feedback,
            },
            "history": _history_shape(limit=20),
            "progress": _progress_shape(),
        }
    )


def action_progress() -> int:
    rows = repository.get_all_progress()
    words = {int(row["id"]): str(row["word"]) for row in repository.get_all_words()}
    memory: Dict[str, float] = {}
    for row in rows:
        word_id = int(row["word_id"])
        token = words.get(word_id)
        if token:
            memory[token] = float(row["memory_strength"] or 0.0)

    return _success(
        {
            "progress": _progress_shape(),
            "memory": memory,
            "analytics": progress_service.get_learning_analytics_payload(),
            "recommendation": recommendation_service.recommend_next_payload(lesson_size=8),
        }
    )


def action_history(limit: int) -> int:
    return _success({"history": _history_shape(limit=limit)})


def action_phase2_status(lesson_size: int, phrase_limit_per_word: int, grammar_limit: int) -> int:
    payload = lexical_service.get_phase2_home_payload(
        lesson_size=lesson_size,
        phrase_limit_per_word=phrase_limit_per_word,
        grammar_limit=grammar_limit,
    )
    adaptive_profile = dict(payload.get("adaptiveProfile", {}))
    adaptive_meta = dict(adaptive_profile.get("meta", {}))
    phase2_flow = dict(adaptive_meta.get("phase2Flow", {}))

    return _success(
        {
            "phase2Flow": phase2_flow,
            "appliedLimits": dict(adaptive_meta.get("appliedLimits", {})),
            "homeSummary": dict(payload.get("home", {}).get("summary", {})),
        }
    )


def action_phase2_home(lesson_size: int, phrase_limit_per_word: int, grammar_limit: int) -> int:
    payload = lexical_service.get_phase2_home_payload(
        lesson_size=lesson_size,
        phrase_limit_per_word=phrase_limit_per_word,
        grammar_limit=grammar_limit,
    )
    return _success({"phase2Home": payload})


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Canonical lexical API worker")
    parser.add_argument("action", choices=[
        "words",
        "quiz-next",
        "quiz-answer",
        "pronunciation-score",
        "progress",
        "history",
        "phase2-status",
        "phase2-home",
    ])
    parser.add_argument("--mode", default="learn")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--word", default="")
    parser.add_argument("--selected-meaning", default="")
    parser.add_argument("--target-word", default="")
    parser.add_argument("--recognized-text", default="")
    parser.add_argument("--transcription-model", default="manual")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--lesson-size", type=int, default=10)
    parser.add_argument("--phrase-limit-per-word", type=int, default=2)
    parser.add_argument("--grammar-limit", type=int, default=5)
    return parser.parse_args()


def main() -> int:
    schema.create_tables()
    args = parse_args()

    if args.action == "words":
        return action_words()
    if args.action == "quiz-next":
        return action_quiz_next(batch_size=args.batch_size, mode=args.mode)
    if args.action == "quiz-answer":
        return action_quiz_answer(word=args.word, selected_meaning=args.selected_meaning)
    if args.action == "pronunciation-score":
        return action_pronunciation_score(
            target_word=args.target_word,
            recognized_text=args.recognized_text,
            transcription_model=args.transcription_model,
        )
    if args.action == "progress":
        return action_progress()
    if args.action == "history":
        return action_history(limit=args.limit)
    if args.action == "phase2-status":
        return action_phase2_status(
            lesson_size=args.lesson_size,
            phrase_limit_per_word=args.phrase_limit_per_word,
            grammar_limit=args.grammar_limit,
        )
    if args.action == "phase2-home":
        return action_phase2_home(
            lesson_size=args.lesson_size,
            phrase_limit_per_word=args.phrase_limit_per_word,
            grammar_limit=args.grammar_limit,
        )

    return _error("Unsupported action", mode="validation")


if __name__ == "__main__":
    raise SystemExit(main())
