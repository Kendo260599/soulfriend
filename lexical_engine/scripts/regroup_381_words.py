"""Generate a non-destructive V2 regroup preview for lexicon seed words.

This script reads words.json and produces preview files that map each word into
V2 categories without writing to the application database.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Set

V2_CATEGORIES = ["core", "pronunciation", "emotional", "functional", "relationship"]

# IPA symbols and patterns that often cause pronunciation friction for learners.
PRON_DIFFICULTY_MARKERS = (
    "θ",
    "ð",
    "ʒ",
    "dʒ",
    "tʃ",
    "ŋ",
    "ɜ",
    "ə",
)


def _normalize_text(value: Any) -> str:
    return str(value or "").strip().lower()


def _is_pronunciation_heavy(word: Dict[str, Any]) -> bool:
    pronunciation_difficulty = float(word.get("pronunciation_difficulty", 0) or 0)
    ipa = _normalize_text(word.get("ipa", ""))
    return pronunciation_difficulty >= 0.45 or any(marker in ipa for marker in PRON_DIFFICULTY_MARKERS)


def infer_categories(word: Dict[str, Any]) -> Set[str]:
    categories: Set[str] = {"core"}

    topic_tag = _normalize_text(word.get("topic_tag", ""))
    emotion_tag = _normalize_text(word.get("emotion_tag", ""))

    if topic_tag == "relationship":
        categories.add("relationship")

    if topic_tag == "functional":
        categories.add("functional")

    if topic_tag == "inner_life" or emotion_tag in {"positive", "negative"}:
        categories.add("emotional")

    if _is_pronunciation_heavy(word):
        categories.add("pronunciation")

    return categories


def infer_primary_category(word: Dict[str, Any], categories: Set[str]) -> str:
    topic_tag = _normalize_text(word.get("topic_tag", ""))

    if topic_tag == "relationship" and "relationship" in categories:
        return "relationship"

    if topic_tag == "functional" and "functional" in categories:
        return "functional"

    if topic_tag == "inner_life" and "emotional" in categories:
        return "emotional"

    if "pronunciation" in categories:
        return "pronunciation"

    if "emotional" in categories:
        return "emotional"

    return "core"


def build_preview(words: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    category_word_map: Dict[str, List[str]] = defaultdict(list)
    primary_counts: Counter[str] = Counter()
    enriched_words: List[Dict[str, Any]] = []

    for entry in words:
        categories = infer_categories(entry)
        primary_category = infer_primary_category(entry, categories)
        word_text = str(entry.get("word", "")).strip()

        for category in sorted(categories):
            category_word_map[category].append(word_text)

        primary_counts[primary_category] += 1

        enriched = dict(entry)
        enriched["v2_categories"] = sorted(categories)
        enriched["v2_primary_category"] = primary_category
        enriched_words.append(enriched)

    # Keep category keys stable even if a category has no items in some datasets.
    categories_section = {
        category: sorted(category_word_map.get(category, []), key=lambda item: item.lower())
        for category in V2_CATEGORIES
    }

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_words": len(enriched_words),
        "category_counts": {category: len(categories_section[category]) for category in V2_CATEGORIES},
        "primary_category_counts": {category: int(primary_counts.get(category, 0)) for category in V2_CATEGORIES},
        "categories": categories_section,
        "words": enriched_words,
    }


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    root_dir = Path(__file__).resolve().parents[1]
    default_input = root_dir / "data" / "lexicon_seed" / "words.json"
    default_preview = root_dir / "data" / "lexicon_seed" / "words_regroup_preview.json"
    default_summary = root_dir / "data" / "lexicon_seed" / "words_regroup_summary.json"

    parser = argparse.ArgumentParser(
        description="Regroup lexicon words into V2 categories and output preview JSON files only."
    )
    parser.add_argument("--input", type=Path, default=default_input, help="Path to source words.json")
    parser.add_argument(
        "--preview-output",
        type=Path,
        default=default_preview,
        help="Path to grouped preview JSON",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        default=default_summary,
        help="Path to summary JSON",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    words = json.loads(args.input.read_text(encoding="utf-8"))

    if not isinstance(words, list):
        raise ValueError("Input JSON must be an array of word objects")

    preview = build_preview(words)

    summary = {
        "generated_at_utc": preview["generated_at_utc"],
        "input_file": str(args.input),
        "preview_output_file": str(args.preview_output),
        "total_words": preview["total_words"],
        "category_counts": preview["category_counts"],
        "primary_category_counts": preview["primary_category_counts"],
    }

    write_json(args.preview_output, preview)
    write_json(args.summary_output, summary)

    print("Regroup preview generated successfully")
    print(f"Input words: {preview['total_words']}")
    print(f"Preview file: {args.preview_output}")
    print(f"Summary file: {args.summary_output}")
    print(f"Primary counts: {preview['primary_category_counts']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
