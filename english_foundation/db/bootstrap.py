import json
import sqlite3
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "db" / "english_foundation.db"
SCHEMA_PATH = ROOT_DIR / "db" / "schema.sql"
VOCAB_SEED_PATH = ROOT_DIR / "content" / "vocabulary_seed.json"
GRAMMAR_SEED_PATH = ROOT_DIR / "content" / "grammar_seed.json"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn.executescript(schema_sql)
    conn.commit()


def _load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8-sig"))


def seed_if_empty(conn: sqlite3.Connection) -> None:
    vocab_count = conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0]
    grammar_count = conn.execute("SELECT COUNT(*) FROM grammar_units").fetchone()[0]

    if vocab_count == 0:
        vocab_rows = _load_json(VOCAB_SEED_PATH)
        for row in vocab_rows:
            cursor = conn.execute(
                """
                INSERT INTO vocabulary (word, ipa, meaning_vi, difficulty, example_sentence, collocation)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    row["word"],
                    row["ipa"],
                    row["meaning_vi"],
                    row["difficulty"],
                    row["example_sentence"],
                    row["collocation"],
                ),
            )
            vocab_id = cursor.lastrowid
            conn.execute(
                """
                INSERT INTO phrase_units (vocab_id, phrase, meaning_vi, difficulty)
                VALUES (?, ?, ?, ?)
                """,
                (
                    vocab_id,
                    row["phrase"],
                    row["phrase_meaning_vi"],
                    row["difficulty"],
                ),
            )

    if grammar_count == 0:
        grammar_rows = _load_json(GRAMMAR_SEED_PATH)
        for row in grammar_rows:
            conn.execute(
                """
                INSERT INTO grammar_units (pattern, example, difficulty)
                VALUES (?, ?, ?)
                """,
                (row["pattern"], row["example"], row["difficulty"]),
            )

    profile_count = conn.execute("SELECT COUNT(*) FROM learner_profile").fetchone()[0]
    if profile_count == 0:
        conn.execute(
            "INSERT INTO learner_profile (lexical_level, grammar_level) VALUES (?, ?)",
            (0.1, 0.1),
        )

    conn.commit()


def bootstrap_database() -> None:
    conn = get_connection()
    try:
        init_schema(conn)
        seed_if_empty(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    bootstrap_database()
