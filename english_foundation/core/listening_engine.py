import sqlite3
import re
from dataclasses import dataclass, asdict
from typing import Any

@dataclass
class ListeningQuestion:
    id: int
    question_num: int
    question_type: str
    prompt: str
    timestamp_hint: int | None

@dataclass
class ListeningSection:
    id: int
    part_num: int
    title: str
    context_description: str | None
    audio_url: str | None
    audio_script: str | None
    duration_seconds: int | None
    questions: list[ListeningQuestion]

class ListeningEngine:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn

    def get_sections_by_part(self, part_num: int) -> list[dict[str, Any]]:
        rows = self.conn.execute(
            """
            SELECT id, part_num, title, context_description, audio_url, duration_seconds 
            FROM listening_sections 
            WHERE part_num = ?
            ORDER BY id ASC
            """,
            (part_num,),
        ).fetchall()
        
        return [dict(row) for row in rows]

    def get_section_details(self, section_id: int) -> dict[str, Any] | None:
        row = self.conn.execute(
            """
            SELECT id, part_num, title, context_description, audio_url, audio_script, duration_seconds
            FROM listening_sections
            WHERE id = ?
            """,
            (section_id,),
        ).fetchone()

        if not row:
            return None
            
        questions_rows = self.conn.execute(
            """
            SELECT id, question_num, question_type, prompt, timestamp_hint
            FROM listening_questions
            WHERE section_id = ?
            ORDER BY question_num ASC
            """,
            (section_id,),
        ).fetchall()
        
        qs = [
            ListeningQuestion(
                id=q["id"],
                question_num=q["question_num"],
                question_type=q["question_type"],
                prompt=q["prompt"],
                timestamp_hint=q["timestamp_hint"],
            ) for q in questions_rows
        ]
        
        section = ListeningSection(
            id=row["id"],
            part_num=row["part_num"],
            title=row["title"],
            context_description=row["context_description"],
            audio_url=row["audio_url"],
            audio_script=row["audio_script"],
            duration_seconds=row["duration_seconds"],
            questions=qs
        )
        return asdict(section)

    def verify_answers(self, user_answers: list[dict[str, Any]]) -> dict[str, Any]:
        """
        user_answers format: [{"question_id": 1, "answer": "Dave"}]
        Returns {"score": 1, "results": [{"question_id": 1, "is_correct": true}]}
        """
        results = []
        correct_count = 0
        total = len(user_answers)
        
        for ans in user_answers:
            q_id = int(ans.get("question_id", 0))
            user_text = str(ans.get("answer", "")).strip().lower()
            
            row = self.conn.execute(
                "SELECT correct_answer_regex FROM listening_questions WHERE id = ?",
                (q_id,)
            ).fetchone()
            
            is_correct = False
            if row:
                regex = row["correct_answer_regex"]
                # Match full string against the regex, ignoring case
                if re.match(regex, user_text, re.IGNORECASE):
                    is_correct = True
                    correct_count += 1
                    
            results.append({
                "question_id": q_id,
                "is_correct": is_correct,
            })
            
        return {
            "total": total,
            "correct": correct_count,
            "results": results,
            "band_estimate": self._estimate_band(correct_count, total) if total >= 10 else None
        }

    def _estimate_band(self, correct: int, total: int) -> float:
        ratio = correct / total
        # Rough estimation based on IELTS mapping (mapped to whatever total is provided)
        if ratio >= 0.95: return 9.0
        if ratio >= 0.88: return 8.0
        if ratio >= 0.75: return 7.0
        if ratio >= 0.58: return 6.0
        if ratio >= 0.40: return 5.0
        if ratio >= 0.25: return 4.0
        return 0.0
