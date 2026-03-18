"""Shared fixtures for english_foundation tests."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "db" / "schema.sql"
VOCAB_SEED = ROOT / "content" / "vocabulary_seed.json"
GRAMMAR_SEED = ROOT / "content" / "grammar_seed.json"


@pytest.fixture()
def conn():
    """In-memory SQLite connection with schema + seed data."""
    c = sqlite3.connect(":memory:")
    c.row_factory = sqlite3.Row
    c.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

    # Seed vocabulary
    for row in json.loads(VOCAB_SEED.read_text(encoding="utf-8-sig")):
        c.execute(
            """INSERT OR IGNORE INTO vocabulary
            (word, ipa, meaning_vi, difficulty, example_sentence, collocation,
             topic_ielts, cefr_target, coca_frequency_band, source_standard)
            VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (row["word"], row["ipa"], row["meaning_vi"], row["difficulty"],
             row["example_sentence"], row["collocation"],
             row.get("topic_ielts"), row.get("cefr_target"),
             row.get("coca_frequency_band"), row.get("source_standard")),
        )
        vid = c.execute("SELECT id FROM vocabulary WHERE word=?", (row["word"],)).fetchone()
        if vid and row.get("phrase"):
            c.execute(
                "INSERT OR IGNORE INTO phrase_units (vocab_id, phrase, meaning_vi, difficulty) VALUES (?,?,?,?)",
                (vid[0], row["phrase"], row.get("phrase_meaning_vi", ""), row["difficulty"]),
            )

    # Seed grammar
    for row in json.loads(GRAMMAR_SEED.read_text(encoding="utf-8-sig")):
        c.execute(
            "INSERT OR IGNORE INTO grammar_units (pattern, example, difficulty) VALUES (?,?,?)",
            (row["pattern"], row["example"], row["difficulty"]),
        )

    # Default learner profile
    c.execute("INSERT INTO learner_profile (lexical_level, grammar_level) VALUES (0.1, 0.1)")
    c.commit()
    yield c
    c.close()
