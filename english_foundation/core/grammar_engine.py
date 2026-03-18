from dataclasses import dataclass
import sqlite3

from .utils import difficulty_from_level


@dataclass
class GrammarItem:
    id: int
    pattern: str
    example: str
    difficulty: int


class GrammarEngine:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def load_micro_patterns(self, grammar_level: float) -> list[GrammarItem]:
        max_difficulty = difficulty_from_level(grammar_level)
        rows = self.conn.execute(
            """
            SELECT id, pattern, example, difficulty
            FROM grammar_units
            WHERE difficulty <= ?
            ORDER BY difficulty ASC, id ASC
            """,
            (max_difficulty,),
        ).fetchall()

        return [
            GrammarItem(
                id=row["id"],
                pattern=row["pattern"],
                example=row["example"],
                difficulty=row["difficulty"],
            )
            for row in rows
        ]

    def pick_micro_pattern(self, grammar_level: float) -> GrammarItem | None:
        patterns = self.load_micro_patterns(grammar_level)
        return patterns[0] if patterns else None


