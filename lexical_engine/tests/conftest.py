"""
tests/conftest.py — Shared pytest fixtures for lexical_engine tests.
Each test gets a fresh, isolated SQLite database via the `isolated_db` fixture.
"""
import os
import sys
import pytest

# Ensure project root is always on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(autouse=True)
def isolated_db(tmp_path):
    """
    Before each test: point app.db.schema.DB_PATH at a brand-new temp file,
    create tables, yield, then clean up. Reloading the schema/repository
    modules ensures all functions see the patched path.
    """
    import importlib
    import app.db.schema as schema_mod

    test_db = str(tmp_path / "test_lexical.db")
    schema_mod.DB_PATH = test_db

    # Reload dependent modules so they pick up the new DB_PATH
    import app.db.repository
    import app.db.seed_loader
    importlib.reload(app.db.repository)
    importlib.reload(app.db.seed_loader)

    schema_mod.create_tables()
    yield test_db
    # tmp_path is cleaned up automatically by pytest
