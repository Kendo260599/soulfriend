"""Tests for database bootstrap."""
import sqlite3

from english_foundation.db.bootstrap import init_schema, migrate_schema, seed_if_empty


class TestInitSchema:
    def test_creates_all_tables(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_schema(conn)
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
        assert "vocabulary" in tables
        assert "phrase_units" in tables
        assert "grammar_units" in tables
        assert "progress" in tables
        assert "learner_profile" in tables
        conn.close()


class TestMigrateSchema:
    def test_idempotent(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_schema(conn)
        migrate_schema(conn)
        migrate_schema(conn)  # Should not error
        cols = {r[1] for r in conn.execute("PRAGMA table_info(vocabulary)").fetchall()}
        assert "topic_ielts" in cols
        assert "source_standard" in cols
        conn.close()


class TestUpsertSeedData:
    def test_inserts_data(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_schema(conn)
        migrate_schema(conn)
        seed_if_empty(conn)
        vocab_count = conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0]
        grammar_count = conn.execute("SELECT COUNT(*) FROM grammar_units").fetchone()[0]
        assert vocab_count > 0
        assert grammar_count > 0
        conn.close()

    def test_upsert_is_idempotent(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_schema(conn)
        migrate_schema(conn)
        seed_if_empty(conn)
        count1 = conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0]
        seed_if_empty(conn)
        count2 = conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0]
        assert count1 == count2
        conn.close()
