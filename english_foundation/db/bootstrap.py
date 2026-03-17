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


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    existing = {
        row[1]
        for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
    }
    if column in existing:
        return
    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def migrate_schema(conn: sqlite3.Connection) -> None:
    _ensure_column(conn, "vocabulary", "topic_ielts", "TEXT")
    _ensure_column(conn, "vocabulary", "cefr_target", "TEXT")
    _ensure_column(conn, "vocabulary", "coca_frequency_band", "TEXT")
    _ensure_column(conn, "vocabulary", "source_standard", "TEXT")

    _ensure_column(conn, "progress", "learner_id", "INTEGER NOT NULL DEFAULT 1")
    _ensure_column(conn, "progress", "streak_correct", "INTEGER NOT NULL DEFAULT 0")
    _ensure_column(conn, "progress", "last_result", "INTEGER")
    _ensure_column(conn, "progress", "last_reviewed_at", "TEXT")
    _ensure_column(conn, "progress", "review_due_at", "TEXT")

    conn.execute("UPDATE progress SET learner_id = 1 WHERE learner_id IS NULL")
    conn.commit()


def _load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8-sig"))


def seed_if_empty(conn: sqlite3.Connection) -> None:
    grammar_count = conn.execute("SELECT COUNT(*) FROM grammar_units").fetchone()[0]

    vocab_rows = _load_json(VOCAB_SEED_PATH)
    for row in vocab_rows:
        conn.execute(
            """
            INSERT INTO vocabulary (
                word, ipa, meaning_vi, difficulty, example_sentence, collocation,
                topic_ielts, cefr_target, coca_frequency_band, source_standard
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(word) DO UPDATE SET
                ipa = excluded.ipa,
                meaning_vi = excluded.meaning_vi,
                difficulty = excluded.difficulty,
                example_sentence = excluded.example_sentence,
                collocation = excluded.collocation,
                topic_ielts = excluded.topic_ielts,
                cefr_target = excluded.cefr_target,
                coca_frequency_band = excluded.coca_frequency_band,
                source_standard = excluded.source_standard
            """,
            (
                row["word"],
                row["ipa"],
                row["meaning_vi"],
                row["difficulty"],
                row["example_sentence"],
                row["collocation"],
                row.get("topic_ielts"),
                row.get("cefr_target"),
                row.get("coca_frequency_band"),
                row.get("source_standard"),
            ),
        )

        vocab_id_row = conn.execute(
            "SELECT id FROM vocabulary WHERE word = ?",
            (row["word"],),
        ).fetchone()
        if not vocab_id_row:
            continue
        vocab_id = int(vocab_id_row[0])

        phrase_row = conn.execute(
            "SELECT id FROM phrase_units WHERE vocab_id = ? ORDER BY id ASC LIMIT 1",
            (vocab_id,),
        ).fetchone()
        if phrase_row:
            conn.execute(
                """
                UPDATE phrase_units
                SET phrase = ?, meaning_vi = ?, difficulty = ?
                WHERE id = ?
                """,
                (
                    row["phrase"],
                    row["phrase_meaning_vi"],
                    row["difficulty"],
                    int(phrase_row[0]),
                ),
            )
        else:
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
        migrate_schema(conn)
        seed_if_empty(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    bootstrap_database()
