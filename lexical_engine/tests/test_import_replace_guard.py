"""Tests for --replace-v2 guard behavior in importer helpers."""

from __future__ import annotations

import pytest

from app.db import schema
from scripts.import_lesson_units_seed import _replace_v2_seed_tables


def test_replace_v2_raises_when_user_skill_mastery_exists() -> None:
    conn = schema.get_connection()
    cur = conn.cursor()

    cur.execute("INSERT INTO skills(name, description) VALUES (?, ?)", ("core", "Core"))
    skill_id = int(cur.execute("SELECT id FROM skills WHERE name = ?", ("core",)).fetchone()["id"])
    cur.execute(
        "INSERT INTO user_skill_mastery(skill_id, mastery_score) VALUES (?, ?)",
        (skill_id, 0.7),
    )
    conn.commit()

    with pytest.raises(RuntimeError, match="user_skill_mastery"):
        _replace_v2_seed_tables(cur)

    conn.close()
