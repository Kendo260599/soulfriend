from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "db" / "english_foundation.db"
GRAMMAR_SEED_PATH = ROOT_DIR / "content" / "grammar_seed.json"


class MigrationError(RuntimeError):
    pass


def _load_seed_patterns() -> set[str]:
    if not GRAMMAR_SEED_PATH.exists():
        raise MigrationError(f"Grammar seed not found: {GRAMMAR_SEED_PATH}")

    payload = json.loads(GRAMMAR_SEED_PATH.read_text(encoding="utf-8-sig"))
    if not isinstance(payload, list) or len(payload) == 0:
        raise MigrationError("Grammar seed is empty. Aborting cleanup for safety.")

    patterns = {
        str(row.get("pattern", "")).strip()
        for row in payload
        if isinstance(row, dict)
    }
    patterns = {pattern for pattern in patterns if pattern}
    if not patterns:
        raise MigrationError("No valid grammar patterns found in seed. Aborting cleanup for safety.")
    return patterns


def cleanup_legacy_grammar() -> dict[str, int]:
    if not DB_PATH.exists():
        raise MigrationError(f"Database not found: {DB_PATH}")

    expected_patterns = _load_seed_patterns()

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.row_factory = sqlite3.Row

        total_before = int(conn.execute("SELECT COUNT(*) FROM grammar_units").fetchone()[0])
        if total_before <= 0:
            raise MigrationError("No grammar rows found in database. Nothing to clean.")

        rows = conn.execute("SELECT id, pattern FROM grammar_units").fetchall()
        legacy_ids = [
            int(row["id"])
            for row in rows
            if str(row["pattern"]).strip() not in expected_patterns
        ]

        if legacy_ids:
            placeholders = ",".join("?" for _ in legacy_ids)
            with conn:
                conn.execute(
                    f"DELETE FROM grammar_units WHERE id IN ({placeholders})",
                    legacy_ids,
                )

        total_after = int(conn.execute("SELECT COUNT(*) FROM grammar_units").fetchone()[0])
        if total_after <= 0:
            raise MigrationError("Cleanup removed all grammar rows unexpectedly.")

        return {
            "total_before": total_before,
            "seed_patterns": len(expected_patterns),
            "legacy_removed": len(legacy_ids),
            "total_after": total_after,
        }
    finally:
        conn.close()


if __name__ == "__main__":
    summary = cleanup_legacy_grammar()
    print(summary)
