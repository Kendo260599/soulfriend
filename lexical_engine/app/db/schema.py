"""
db/schema.py — Database schema creation authority.
Responsible for creating all tables. No UI, no logic, no scoring.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "lexical_engine.db")
DB_PATH = os.path.normpath(DB_PATH)


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_tables() -> None:
    """Create all required tables if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # Vocabulary table — every field from DATABASE LAW (rule #6)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vocabulary (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            word                    TEXT NOT NULL UNIQUE,
            ipa                     TEXT NOT NULL,
            meaning_vi              TEXT NOT NULL,
            cefr_level              TEXT NOT NULL,
            difficulty_score        REAL NOT NULL DEFAULT 0.5,
            pronunciation_difficulty REAL NOT NULL DEFAULT 0.5,
            emotion_tag             TEXT,
            topic_tag               TEXT,
            created_at              TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # Progress table — memory strength per word per user (Phase 1 memory law)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id         INTEGER NOT NULL,
            memory_strength REAL NOT NULL DEFAULT 0.0,
            correct_count   INTEGER NOT NULL DEFAULT 0,
            wrong_count     INTEGER NOT NULL DEFAULT 0,
            last_reviewed   TEXT,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (word_id) REFERENCES vocabulary(id)
        )
    """)

    # Pronunciation history — stores speaking attempts and scoring telemetry
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pronunciation_history (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id             INTEGER,
            target_word         TEXT NOT NULL,
            recognized_text     TEXT,
            score               INTEGER,
            feedback            TEXT,
            rubric_json         TEXT,
            audio_path          TEXT,
            transcription_model TEXT,
            created_at          TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (word_id) REFERENCES vocabulary(id)
        )
    """)

    # Migrate existing DBs (safe — only adds columns that don't exist yet)
    _migrate_progress_table(cursor)

    conn.commit()
    conn.close()
    print(f"[schema] Tables ready at: {DB_PATH}")


def _migrate_progress_table(cursor: sqlite3.Cursor) -> None:
    """Add SM-2 scheduling columns to progress table if not already present."""
    existing_cols = {
        row[1] for row in cursor.execute("PRAGMA table_info(progress)").fetchall()
    }
    new_cols = [
        ("next_review",   "TEXT"),
        ("interval_days", "INTEGER NOT NULL DEFAULT 1"),
        ("ease_factor",   "REAL NOT NULL DEFAULT 2.5"),
    ]
    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE progress ADD COLUMN {col_name} {col_def}")
