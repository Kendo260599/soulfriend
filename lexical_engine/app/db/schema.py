"""
db/schema.py — Database schema creation authority.
Responsible for creating all tables. No UI, no logic, no scoring.
"""

import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "lexical_engine.db")
DB_PATH = os.path.normpath(DB_PATH)


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_tables() -> None:
    """Create and migrate tables for the lexical runtime schema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Central lexical table. SQLite-first and JSON-service friendly.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vocabulary (
            id                       INTEGER PRIMARY KEY,
            word                     TEXT UNIQUE NOT NULL,
            ipa                      TEXT,
            meaning_vi               TEXT,
            cefr_level               TEXT,
            difficulty_score         REAL DEFAULT 0,
            pronunciation_difficulty REAL DEFAULT 0,
            emotion_tag             TEXT,
            topic_tag               TEXT,
            ielts_level             TEXT,
            skill_band              TEXT,
            collocation             TEXT,
            example_sentence        TEXT,
            mini_dialogue           TEXT,
            speaking_weight         REAL DEFAULT 0,
            writing_weight          REAL DEFAULT 0,
            reading_weight          REAL DEFAULT 0,
            listening_weight        REAL DEFAULT 0,
            created_at              TEXT DEFAULT (datetime('now')),
            updated_at              TEXT DEFAULT (datetime('now'))
        )
    """)

    # Canonical retention state.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress (
            id              INTEGER PRIMARY KEY,
            word_id         INTEGER UNIQUE,
            memory_strength REAL DEFAULT 0,
            correct_count   INTEGER DEFAULT 0,
            wrong_count     INTEGER DEFAULT 0,
            last_reviewed   TEXT,
            next_review     TEXT,
            interval_days   REAL DEFAULT 0,
            ease_factor     REAL DEFAULT 2.5,
            created_at      TEXT DEFAULT (datetime('now')),
            updated_at      TEXT DEFAULT (datetime('now'))
        )
    """)

    # Existing speech telemetry.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pronunciation_history (
            id                  INTEGER PRIMARY KEY,
            target_word         TEXT NOT NULL,
            recognized_text     TEXT,
            score               REAL,
            feedback            TEXT,
            rubric_json         TEXT,
            audio_path          TEXT,
            transcription_model TEXT,
            created_at          TEXT DEFAULT (datetime('now')),
            word_id             INTEGER
        )
    """)

    # Phrase learning units.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS phrase_units (
            id                  INTEGER PRIMARY KEY,
            vocab_id            INTEGER NOT NULL,
            phrase              TEXT NOT NULL,
            meaning_vi          TEXT,
            difficulty_score    REAL DEFAULT 0,
            pronunciation_focus TEXT,
            grammar_focus       TEXT,
            created_at          TEXT DEFAULT (datetime('now'))
        )
    """)

    # Grammar micro-units attached to lexical progression.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grammar_micro_units (
            id               INTEGER PRIMARY KEY,
            pattern          TEXT NOT NULL,
            description_vi   TEXT,
            difficulty_score REAL DEFAULT 0,
            example_sentence TEXT,
            unlock_level     TEXT,
            created_at       TEXT DEFAULT (datetime('now'))
        )
    """)

    # Lesson composition. Includes legacy linkage columns for backward compatibility.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson_units (
            id              INTEGER PRIMARY KEY,
            skill_name      TEXT,
            lesson_name     TEXT,
            lesson_order    INTEGER,
            difficulty_band TEXT,
            lesson_type     TEXT,
            created_at      TEXT DEFAULT (datetime('now')),
            skill_id        INTEGER,
            word_id         INTEGER,
            unit_order      INTEGER
        )
    """)

    # Many-to-many lesson/word bridge.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lesson_unit_words (
            id        INTEGER PRIMARY KEY,
            lesson_id INTEGER,
            word_id   INTEGER
        )
    """)

    # Adaptive learner profile snapshots.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learner_profile_history (
            id                        INTEGER PRIMARY KEY,
            lexical_level             REAL,
            grammar_readiness_proxy   REAL,
            pronunciation_level       REAL,
            response_confidence_proxy REAL,
            hesitation_level          REAL,
            created_at                TEXT DEFAULT (datetime('now'))
        )
    """)

    # Repeated weakness tracker.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mistake_log (
            id           INTEGER PRIMARY KEY,
            word_id      INTEGER,
            mistake_type TEXT,
            mistake_count INTEGER DEFAULT 1,
            last_seen    TEXT
        )
    """)

    # Recommendation decision history.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendation_history (
            id                INTEGER PRIMARY KEY,
            recommended_skill TEXT,
            recommended_words TEXT,
            reason            TEXT,
            created_at        TEXT DEFAULT (datetime('now'))
        )
    """)

    # Daily session rhythm log.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_session_log (
            id                INTEGER PRIMARY KEY,
            session_type      TEXT,
            words_completed   INTEGER,
            accuracy          REAL,
            pronunciation_avg REAL,
            duration_seconds  INTEGER,
            created_at        TEXT DEFAULT (datetime('now'))
        )
    """)

    # Legacy V2 tables are kept to avoid breaking existing seed/import scripts.
    _create_v2_learning_tables(cursor)

    # Additive migration for existing DB files.
    _migrate_schema(cursor)

    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_word_id_unique ON progress(word_id)"
    )
    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_unit_words_pair ON lesson_unit_words(lesson_id, word_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_phrase_units_vocab_id ON phrase_units(vocab_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_mistake_log_word_type ON mistake_log(word_id, mistake_type)"
    )

    conn.commit()
    conn.close()
    print(f"[schema] Tables ready at: {DB_PATH}", file=sys.stderr)


def _migrate_schema(cursor: sqlite3.Cursor) -> None:
    """Add newly required columns to existing tables without destructive migration."""
    _ensure_columns(
        cursor,
        "vocabulary",
        [
            ("ielts_level", "TEXT"),
            ("skill_band", "TEXT"),
            ("collocation", "TEXT"),
            ("example_sentence", "TEXT"),
            ("mini_dialogue", "TEXT"),
            ("speaking_weight", "REAL DEFAULT 0"),
            ("writing_weight", "REAL DEFAULT 0"),
            ("reading_weight", "REAL DEFAULT 0"),
            ("listening_weight", "REAL DEFAULT 0"),
        ],
    )

    _ensure_columns(
        cursor,
        "progress",
        [
            ("next_review", "TEXT"),
            ("interval_days", "REAL DEFAULT 0"),
            ("ease_factor", "REAL DEFAULT 2.5"),
            ("created_at", "TEXT"),
            ("updated_at", "TEXT"),
        ],
    )

    _ensure_columns(
        cursor,
        "pronunciation_history",
        [
            ("rubric_json", "TEXT"),
            ("audio_path", "TEXT"),
            ("transcription_model", "TEXT"),
            ("created_at", "TEXT"),
        ],
    )

    _ensure_columns(
        cursor,
        "lesson_units",
        [
            ("id", "INTEGER"),
            ("skill_name", "TEXT"),
            ("lesson_name", "TEXT"),
            ("lesson_order", "INTEGER"),
            ("difficulty_band", "TEXT"),
            ("lesson_type", "TEXT"),
            ("created_at", "TEXT"),
            ("skill_id", "INTEGER"),
            ("word_id", "INTEGER"),
            ("unit_order", "INTEGER"),
        ],
    )


def _ensure_columns(
    cursor: sqlite3.Cursor,
    table_name: str,
    columns: list[tuple[str, str]],
) -> None:
    existing_cols = {
        row[1] for row in cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    for col_name, col_def in columns:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}")


def _create_v2_learning_tables(cursor: sqlite3.Cursor) -> None:
    """Create additive V2 orchestration tables.

    Note: `lesson_units` is created in `create_tables()` as a unified runtime table,
    so this helper must not redefine it.
    """
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS skills (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL UNIQUE,
            description TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS skill_prerequisites (
            skill_id         INTEGER NOT NULL,
            prerequisite_id  INTEGER NOT NULL,
            PRIMARY KEY (skill_id, prerequisite_id),
            FOREIGN KEY (skill_id) REFERENCES skills(id),
            FOREIGN KEY (prerequisite_id) REFERENCES skills(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_skill_mastery (
            skill_id        INTEGER NOT NULL PRIMARY KEY,
            mastery_score   REAL NOT NULL DEFAULT 0.0,
            updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_lesson_units_skill_order
        ON lesson_units(skill_id, unit_order)
        """
    )
