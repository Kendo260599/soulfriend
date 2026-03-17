from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "db" / "english_foundation.db"


class MigrationError(RuntimeError):
    pass


def cleanup_legacy_vocab() -> dict[str, int]:
    if not DB_PATH.exists():
        raise MigrationError(f"Database not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.row_factory = sqlite3.Row

        total_before = int(conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0])
        curated_before = int(
            conn.execute(
                "SELECT COUNT(*) FROM vocabulary WHERE COALESCE(source_standard, '') = 'open-triangulated'"
            ).fetchone()[0]
        )

        if curated_before <= 0:
            raise MigrationError("No curated vocabulary rows found. Aborting cleanup for safety.")

        legacy_ids = [
            int(row["id"])
            for row in conn.execute(
                "SELECT id FROM vocabulary WHERE COALESCE(source_standard, '') <> 'open-triangulated'"
            ).fetchall()
        ]

        if not legacy_ids:
            return {
                "total_before": total_before,
                "curated_before": curated_before,
                "legacy_removed": 0,
                "total_after": total_before,
                "curated_after": curated_before,
            }

        placeholders = ",".join("?" for _ in legacy_ids)

        with conn:
            conn.execute(
                f"DELETE FROM progress WHERE item_id IN ({placeholders})",
                legacy_ids,
            )
            conn.execute(
                f"DELETE FROM vocabulary WHERE id IN ({placeholders})",
                legacy_ids,
            )

        total_after = int(conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0])
        curated_after = int(
            conn.execute(
                "SELECT COUNT(*) FROM vocabulary WHERE COALESCE(source_standard, '') = 'open-triangulated'"
            ).fetchone()[0]
        )

        if curated_after <= 0:
            raise MigrationError("Cleanup removed all curated rows unexpectedly.")

        return {
            "total_before": total_before,
            "curated_before": curated_before,
            "legacy_removed": len(legacy_ids),
            "total_after": total_after,
            "curated_after": curated_after,
        }
    finally:
        conn.close()


if __name__ == "__main__":
    summary = cleanup_legacy_vocab()
    print(summary)
