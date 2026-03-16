"""Phrase drill composer for Phase-2 lexical progression.

Read-only responsibilities:
- compose phrase drill items from current lesson words
- prioritize seeded phrase_units when available
- provide deterministic fallback from vocabulary metadata
"""

from __future__ import annotations

from typing import Any, Dict

from app.db import repository


MAX_PHRASES_PER_WORD = 3


def _safe_float(value: Any) -> float:
    return float(value or 0.0)


def _normalize_word(value: str | None) -> str:
    return str(value or "").strip().lower()


def _fallback_phrase_from_vocab(vocab_row) -> Dict[str, Any]:
    source_word = str(vocab_row["word"])
    collocation = str(vocab_row["collocation"] or "").strip()
    phrase = collocation if collocation else f"use {source_word} in context"

    return {
        "sourceWord": source_word,
        "phrase": phrase,
        "meaningVi": str(vocab_row["meaning_vi"] or ""),
        "difficultyScore": _safe_float(vocab_row["difficulty_score"]),
        "pronunciationFocus": "",
        "grammarFocus": "",
        "seeded": False,
    }


def build_phrase_pack(
    lesson_words: list[str],
    phrases_per_word: int = 2,
) -> Dict[str, Any]:
    """Build phrase drill payload from lesson words.

    Returns a stable payload shape for API/UI clients even when phrase seeds are absent.
    """
    safe_words = [_normalize_word(word) for word in lesson_words if _normalize_word(word)]
    if not safe_words:
        return {
            "items": [],
            "summary": {
                "requestedWords": 0,
                "coveredWords": 0,
                "seededItems": 0,
                "fallbackItems": 0,
            },
        }

    vocab_rows = repository.get_words_by_tokens(safe_words)
    vocab_by_word = {_normalize_word(row["word"]): row for row in vocab_rows}
    vocab_ids = [int(row["id"]) for row in vocab_rows]

    phrase_rows = repository.get_phrase_units_for_vocab_ids(
        vocab_ids=vocab_ids,
        limit_per_vocab=max(1, min(MAX_PHRASES_PER_WORD, int(phrases_per_word))),
    )

    seeded_items: list[Dict[str, Any]] = []
    covered_words: set[str] = set()
    for row in phrase_rows:
        source_word = _normalize_word(row["source_word"])
        covered_words.add(source_word)
        seeded_items.append(
            {
                "sourceWord": str(row["source_word"]),
                "phrase": str(row["phrase"]),
                "meaningVi": str(row["meaning_vi"] or ""),
                "difficultyScore": _safe_float(row["difficulty_score"]),
                "pronunciationFocus": str(row["pronunciation_focus"] or ""),
                "grammarFocus": str(row["grammar_focus"] or ""),
                "seeded": True,
            }
        )

    fallback_items: list[Dict[str, Any]] = []
    for word in safe_words:
        if word in covered_words:
            continue
        vocab_row = vocab_by_word.get(word)
        if vocab_row is None:
            continue
        fallback_items.append(_fallback_phrase_from_vocab(vocab_row))

    items = seeded_items + fallback_items
    return {
        "items": items,
        "summary": {
            "requestedWords": len(safe_words),
            "coveredWords": len({item["sourceWord"].lower() for item in items}),
            "seededItems": len(seeded_items),
            "fallbackItems": len(fallback_items),
        },
    }
