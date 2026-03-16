"""
db/seed_loader.py — Loads lexicon seed data into database.
Reads from data/lexicon_seed/words.json and inserts into vocabulary table.
"""

import json
import os
import sys
from app.db.repository import insert_word

SEED_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "lexicon_seed", "words.json"
)
SEED_PATH = os.path.normpath(SEED_PATH)


def load_seed() -> None:
    """Load seed words from JSON file into vocabulary table."""
    if not os.path.exists(SEED_PATH):
        print(f"[seed_loader] Seed file not found: {SEED_PATH}", file=sys.stderr)
        return

    with open(SEED_PATH, encoding="utf-8") as f:
        words = json.load(f)

    inserted = 0
    skipped = 0
    for entry in words:
        # Validate all required fields exist before insert
        required = ["word", "ipa", "meaning_vi", "cefr_level",
                    "difficulty_score", "pronunciation_difficulty",
                    "emotion_tag", "topic_tag"]
        if not all(k in entry for k in required):
            print(f"[seed_loader] SKIP malformed entry: {entry.get('word', '?')}", file=sys.stderr)
            skipped += 1
            continue

        insert_word(
            word=entry["word"],
            ipa=entry["ipa"],
            meaning_vi=entry["meaning_vi"],
            cefr_level=entry["cefr_level"],
            difficulty_score=float(entry["difficulty_score"]),
            pronunciation_difficulty=float(entry["pronunciation_difficulty"]),
            emotion_tag=entry["emotion_tag"],
            topic_tag=entry["topic_tag"],
        )
        inserted += 1

    print(f"[seed_loader] Done - inserted: {inserted}, skipped: {skipped}", file=sys.stderr)
