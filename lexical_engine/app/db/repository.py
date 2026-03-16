"""
db/repository.py — Single database access authority.
All queries live here. No UI, no scoring logic, no schema creation.
"""

import sqlite3
import json
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.db.schema import get_connection


def get_all_words() -> list[sqlite3.Row]:
    """Return all vocabulary rows."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM vocabulary ORDER BY difficulty_score ASC"
    ).fetchall()
    conn.close()
    return rows


def get_word_by_id(word_id: int) -> Optional[sqlite3.Row]:
    """Return a single vocabulary row by id."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM vocabulary WHERE id = ?", (word_id,)
    ).fetchone()
    conn.close()
    return row


def get_words_by_cefr(cefr_level: str) -> list[sqlite3.Row]:
    """Return vocabulary rows filtered by CEFR level."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM vocabulary WHERE cefr_level = ? ORDER BY difficulty_score ASC",
        (cefr_level,)
    ).fetchall()
    conn.close()
    return rows


def get_progress(word_id: int) -> Optional[sqlite3.Row]:
    """Return progress row for a word. Returns None if not yet tracked."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM progress WHERE word_id = ?", (word_id,)
    ).fetchone()
    conn.close()
    return row


def upsert_progress(
    word_id: int,
    memory_strength: float,
    correct_count: int,
    wrong_count: int,
    next_review: Optional[str] = None,
    interval_days: int = 1,
    ease_factor: float = 2.5,
) -> None:
    """Insert or update progress for a word. Clamps memory_strength to [0.0, 1.0]."""
    clamped = max(0.0, min(1.0, memory_strength))
    conn = get_connection()
    existing = conn.execute(
        "SELECT id FROM progress WHERE word_id = ?", (word_id,)
    ).fetchone()

    if existing:
        conn.execute("""
            UPDATE progress
            SET memory_strength = ?,
                correct_count   = ?,
                wrong_count     = ?,
                last_reviewed   = datetime('now'),
                updated_at      = datetime('now'),
                next_review     = ?,
                interval_days   = ?,
                ease_factor     = ?
            WHERE word_id = ?
        """, (clamped, correct_count, wrong_count,
               next_review, interval_days, ease_factor, word_id))
    else:
        conn.execute("""
            INSERT INTO progress
                (word_id, memory_strength, correct_count, wrong_count, last_reviewed,
                 next_review, interval_days, ease_factor)
            VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)
        """, (word_id, clamped, correct_count, wrong_count,
               next_review, interval_days, ease_factor))

    conn.commit()
    conn.close()


def get_all_progress() -> list[sqlite3.Row]:
    """Return all progress rows."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM progress").fetchall()
    conn.close()
    return rows


def get_due_words(limit: int = 20) -> list[sqlite3.Row]:
    """Return vocabulary rows due for review (next_review <= now UTC), oldest first."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT v.* FROM vocabulary v
        JOIN progress p ON p.word_id = v.id
        WHERE p.next_review IS NOT NULL
          AND p.next_review <= datetime('now')
        ORDER BY p.next_review ASC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return rows


def word_exists(word: str) -> bool:
    """Check if a word is already in vocabulary table."""
    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM vocabulary WHERE word = ?", (word,)
    ).fetchone()
    conn.close()
    return row is not None


def insert_word(
    word: str, ipa: str, meaning_vi: str, cefr_level: str,
    difficulty_score: float, pronunciation_difficulty: float,
    emotion_tag: str, topic_tag: str
) -> None:
    """Insert one vocabulary word. Skips if word already exists."""
    if word_exists(word):
        return
    conn = get_connection()
    conn.execute("""
        INSERT INTO vocabulary
            (word, ipa, meaning_vi, cefr_level, difficulty_score,
             pronunciation_difficulty, emotion_tag, topic_tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (word, ipa, meaning_vi, cefr_level, difficulty_score,
          pronunciation_difficulty, emotion_tag, topic_tag))
    conn.commit()
    conn.close()


def get_word_id_by_word(word: str) -> Optional[int]:
    """Return vocabulary id for a normalized word token when present."""
    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM vocabulary WHERE lower(word) = lower(?) LIMIT 1",
        (word,)
    ).fetchone()
    conn.close()
    return row["id"] if row is not None else None


def insert_pronunciation_history(
    target_word: str,
    recognized_text: Optional[str],
    score: Optional[int],
    feedback: str,
    audio_path: Optional[str],
    transcription_model: str,
    rubric: Optional[dict] = None,
    word_id: Optional[int] = None,
) -> None:
    """Persist one pronunciation scoring attempt for progress tracking."""
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO pronunciation_history
            (word_id, target_word, recognized_text, score, feedback,
             rubric_json, audio_path, transcription_model)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            word_id,
            target_word,
            recognized_text,
            score,
            feedback,
            json.dumps(rubric, ensure_ascii=True) if rubric is not None else None,
            audio_path,
            transcription_model,
        ),
    )
    conn.commit()
    conn.close()


def get_pronunciation_history(limit: int = 50, target_word: Optional[str] = None) -> list[sqlite3.Row]:
    """Return recent pronunciation attempts, optionally filtered by target word."""
    conn = get_connection()
    if target_word:
        rows = conn.execute(
            """
            SELECT * FROM pronunciation_history
            WHERE lower(target_word) = lower(?)
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (target_word, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT * FROM pronunciation_history
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    conn.close()
    return rows


def get_pronunciation_words() -> list[str]:
    """Return distinct target words that have pronunciation history."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT DISTINCT target_word
        FROM pronunciation_history
        WHERE target_word IS NOT NULL AND trim(target_word) <> ''
        ORDER BY target_word ASC
        """
    ).fetchall()
    conn.close()
    return [str(row["target_word"]) for row in rows]


def get_pronunciation_progress_metrics(target_word: Optional[str] = None) -> dict:
    """
    Return pronunciation progress metrics:
    - attempts_total
    - attempts_7d
    - active_days_7d
    - avg_score_all
    - avg_score_7d
    - avg_score_prev_7d
    - best_score
    - last_score
    - streak_days
    - trend_delta_7d
    - trend_direction ('up'|'down'|'flat')
    """
    conn = get_connection()

    where_sql = ""
    params: tuple = tuple()
    if target_word:
        where_sql = "WHERE lower(target_word) = lower(?)"
        params = (target_word,)

    row = conn.execute(
        f"""
        SELECT
            COUNT(*) AS attempts_total,
            SUM(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS attempts_7d,
            COUNT(DISTINCT CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN date(created_at) END) AS active_days_7d,
            AVG(score) AS avg_score_all,
            MAX(score) AS best_score,
            AVG(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN score END) AS avg_score_7d,
            AVG(CASE
                    WHEN datetime(created_at) < datetime('now', '-7 day')
                     AND datetime(created_at) >= datetime('now', '-14 day')
                    THEN score
                END) AS avg_score_prev_7d
        FROM pronunciation_history
        {where_sql}
        """,
        params,
    ).fetchone()

    if target_word:
        last_row = conn.execute(
            """
            SELECT score
            FROM pronunciation_history
            WHERE lower(target_word) = lower(?)
            ORDER BY datetime(created_at) DESC
            LIMIT 1
            """,
            (target_word,),
        ).fetchone()
        day_rows = conn.execute(
            """
            SELECT DISTINCT date(created_at) AS day
            FROM pronunciation_history
            WHERE lower(target_word) = lower(?)
            ORDER BY day DESC
            """,
            (target_word,),
        ).fetchall()
    else:
        last_row = conn.execute(
            """
            SELECT score
            FROM pronunciation_history
            ORDER BY datetime(created_at) DESC
            LIMIT 1
            """
        ).fetchone()
        day_rows = conn.execute(
            """
            SELECT DISTINCT date(created_at) AS day
            FROM pronunciation_history
            ORDER BY day DESC
            """
        ).fetchall()

    conn.close()

    attempts_total = int(row["attempts_total"] or 0)
    attempts_7d = int(row["attempts_7d"] or 0)
    active_days_7d = int(row["active_days_7d"] or 0)
    avg_score_all = float(row["avg_score_all"] or 0.0)
    avg_score_7d = float(row["avg_score_7d"] or 0.0)
    avg_score_prev_7d = float(row["avg_score_prev_7d"] or 0.0)
    best_score = int(row["best_score"] or 0) if row["best_score"] is not None else None
    last_score = int(last_row["score"]) if last_row is not None and last_row["score"] is not None else None
    trend_delta_7d = avg_score_7d - avg_score_prev_7d

    # Compute consecutive active-day streak up to current UTC day.
    day_set = {str(item["day"]) for item in day_rows}
    current_day = datetime.now(timezone.utc).date()
    streak_days = 0
    cursor_day = current_day
    while cursor_day.isoformat() in day_set:
        streak_days += 1
        cursor_day -= timedelta(days=1)

    if attempts_total == 0:
        trend_direction = "flat"
    elif abs(trend_delta_7d) < 0.5:
        trend_direction = "flat"
    elif trend_delta_7d > 0:
        trend_direction = "up"
    else:
        trend_direction = "down"

    return {
        "attempts_total": attempts_total,
        "attempts_7d": attempts_7d,
        "active_days_7d": active_days_7d,
        "avg_score_all": round(avg_score_all, 2),
        "avg_score_7d": round(avg_score_7d, 2),
        "avg_score_prev_7d": round(avg_score_prev_7d, 2),
        "best_score": best_score,
        "last_score": last_score,
        "streak_days": streak_days,
        "trend_delta_7d": round(trend_delta_7d, 2),
        "trend_direction": trend_direction,
    }


def get_pronunciation_daily_averages(target_word: Optional[str] = None, days: int = 14) -> list[dict]:
    """Return daily average scores for charting (fills missing days with 0.0)."""
    days = max(1, int(days))
    conn = get_connection()

    where_sql = "WHERE datetime(created_at) >= datetime('now', ?)"
    params: list = [f"-{days - 1} day"]
    if target_word:
        where_sql += " AND lower(target_word) = lower(?)"
        params.append(target_word)

    rows = conn.execute(
        f"""
        SELECT
            date(created_at) AS day,
            AVG(score) AS avg_score,
            COUNT(*) AS attempts
        FROM pronunciation_history
        {where_sql}
        GROUP BY date(created_at)
        ORDER BY day ASC
        """,
        tuple(params),
    ).fetchall()
    conn.close()

    by_day = {
        str(row["day"]): {
            "day": str(row["day"]),
            "avg_score": float(row["avg_score"] or 0.0),
            "attempts": int(row["attempts"] or 0),
        }
        for row in rows
    }

    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)
    result: list[dict] = []
    cursor = start_date
    while cursor <= end_date:
        key = cursor.isoformat()
        result.append(by_day.get(key, {"day": key, "avg_score": 0.0, "attempts": 0}))
        cursor += timedelta(days=1)
    return result


def get_pronunciation_word_trends(limit: int = 5) -> dict:
    """
    Return top rising and falling words based on 7-day average delta.

    Shape:
    {
      "top_up": [{"word": str, "delta": float, "avg_7d": float, "avg_prev_7d": float}],
      "top_down": [...]
    }
    """
    limit = max(1, int(limit))
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            target_word,
            AVG(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN score END) AS avg_7d,
            AVG(CASE
                    WHEN datetime(created_at) < datetime('now', '-7 day')
                     AND datetime(created_at) >= datetime('now', '-14 day')
                    THEN score
                END) AS avg_prev_7d,
            COUNT(*) AS attempts_total,
            SUM(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS attempts_7d
        FROM pronunciation_history
        WHERE target_word IS NOT NULL AND trim(target_word) <> ''
        GROUP BY lower(target_word)
        """
    ).fetchall()
    conn.close()

    items: list[dict] = []
    for row in rows:
        attempts_7d = int(row["attempts_7d"] or 0)
        if attempts_7d <= 0:
            continue

        avg_7d = float(row["avg_7d"] or 0.0)
        avg_prev_7d = float(row["avg_prev_7d"] or 0.0)
        delta = avg_7d - avg_prev_7d
        items.append(
            {
                "word": str(row["target_word"]),
                "delta": round(delta, 2),
                "avg_7d": round(avg_7d, 2),
                "avg_prev_7d": round(avg_prev_7d, 2),
                "attempts_total": int(row["attempts_total"] or 0),
            }
        )

    top_up = sorted([x for x in items if x["delta"] > 0], key=lambda x: x["delta"], reverse=True)[:limit]
    top_down = sorted([x for x in items if x["delta"] < 0], key=lambda x: x["delta"])[:limit]

    return {
        "top_up": top_up,
        "top_down": top_down,
    }


def get_practice_recommendations(limit: int = 3) -> list[dict]:
    """
    Return recommended words to practice next.

    Ranking strategy focuses on:
    - downward trend in last 7 days vs previous 7 days
    - low recent (7d) average score
    - low last score
    """
    limit = max(1, int(limit))
    conn = get_connection()

    rows = conn.execute(
        """
        SELECT
            target_word,
            AVG(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN score END) AS avg_7d,
            AVG(CASE
                    WHEN datetime(created_at) < datetime('now', '-7 day')
                     AND datetime(created_at) >= datetime('now', '-14 day')
                    THEN score
                END) AS avg_prev_7d,
            SUM(CASE WHEN datetime(created_at) >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS attempts_7d,
            COUNT(*) AS attempts_total
        FROM pronunciation_history
        WHERE target_word IS NOT NULL AND trim(target_word) <> ''
        GROUP BY lower(target_word)
        """
    ).fetchall()

    recommendations: list[dict] = []
    for row in rows:
        word = str(row["target_word"])
        avg_7d = float(row["avg_7d"] or 0.0)
        avg_prev_7d = float(row["avg_prev_7d"] or 0.0)
        attempts_7d = int(row["attempts_7d"] or 0)
        attempts_total = int(row["attempts_total"] or 0)
        delta = avg_7d - avg_prev_7d

        last_row = conn.execute(
            """
            SELECT score
            FROM pronunciation_history
            WHERE lower(target_word) = lower(?)
            ORDER BY datetime(created_at) DESC
            LIMIT 1
            """,
            (word,),
        ).fetchone()
        last_score = int(last_row["score"]) if last_row is not None and last_row["score"] is not None else 0

        # Ignore items with no useful signal.
        if attempts_total <= 0:
            continue

        penalty = 0.0
        reasons: list[str] = []

        if delta < 0:
            penalty += abs(delta) * 1.5
            reasons.append(f"trend giam {delta:.1f}")

        if attempts_7d > 0 and avg_7d < 75:
            penalty += (75 - avg_7d) * 1.2
            reasons.append(f"avg7d thap {avg_7d:.1f}")

        if last_score < 70:
            penalty += (70 - last_score) * 1.1
            reasons.append(f"last thap {last_score}")

        if attempts_7d == 0:
            # Not practiced recently: medium priority reminder.
            penalty += 8.0
            reasons.append("chua luyen 7 ngay")

        if penalty <= 0:
            continue

        recommendations.append(
            {
                "word": word,
                "priority": round(penalty, 2),
                "avg_7d": round(avg_7d, 2),
                "avg_prev_7d": round(avg_prev_7d, 2),
                "last_score": last_score,
                "attempts_7d": attempts_7d,
                "reason": "; ".join(reasons),
            }
        )

    conn.close()

    recommendations.sort(key=lambda x: x["priority"], reverse=True)
    return recommendations[:limit]


def has_v2_lesson_seed() -> bool:
    """Return True when V2 lesson seed tables contain usable data."""
    conn = get_connection()
    row = conn.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM skills) AS skills_count,
            (SELECT COUNT(*) FROM lesson_units) AS lesson_units_count
        """
    ).fetchone()
    conn.close()

    skills_count = int(row["skills_count"] or 0)
    lesson_units_count = int(row["lesson_units_count"] or 0)
    return skills_count > 0 and lesson_units_count > 0


def get_lesson_words_by_skill(skill_name: str, limit: int = 60) -> list[sqlite3.Row]:
    """
    Return vocabulary rows for a skill from V2 lesson_units seed ordering.

    Rows include `lesson_unit_order` to preserve curriculum sequence when available.
    """
    safe_limit = max(1, int(limit))
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            v.*,
            lu.unit_order AS lesson_unit_order
        FROM lesson_units lu
        JOIN skills s ON s.id = lu.skill_id
        JOIN vocabulary v ON v.id = lu.word_id
        WHERE lower(s.name) = lower(?)
        ORDER BY lu.unit_order ASC, v.difficulty_score ASC, v.word ASC
        LIMIT ?
        """,
        (skill_name, safe_limit),
    ).fetchall()
    conn.close()
    return rows


def get_words_by_tokens(tokens: list[str]) -> list[sqlite3.Row]:
    """Return vocabulary rows for a list of word tokens (case-insensitive)."""
    normalized = [str(token).strip().lower() for token in tokens if str(token).strip()]
    if not normalized:
        return []

    placeholders = ",".join("?" for _ in normalized)
    conn = get_connection()
    rows = conn.execute(
        f"""
        SELECT *
        FROM vocabulary
        WHERE lower(word) IN ({placeholders})
        """,
        tuple(normalized),
    ).fetchall()
    conn.close()
    return rows


def get_phrase_units_for_vocab_ids(vocab_ids: list[int], limit_per_vocab: int = 3) -> list[sqlite3.Row]:
    """Return phrase units for vocabulary ids with stable ordering."""
    safe_ids = sorted({int(vocab_id) for vocab_id in vocab_ids if int(vocab_id) > 0})
    safe_limit = max(1, int(limit_per_vocab))
    if not safe_ids:
        return []

    placeholders = ",".join("?" for _ in safe_ids)
    conn = get_connection()
    rows = conn.execute(
        f"""
        SELECT
            pu.*,
            v.word AS source_word,
            v.ipa AS source_ipa
        FROM phrase_units pu
        JOIN vocabulary v ON v.id = pu.vocab_id
        WHERE pu.vocab_id IN ({placeholders})
        ORDER BY pu.vocab_id ASC, pu.difficulty_score ASC, pu.id ASC
        """,
        tuple(safe_ids),
    ).fetchall()
    conn.close()

    # Keep only first N items per vocab id while preserving SQL order.
    per_vocab_count: dict[int, int] = {}
    filtered: list[sqlite3.Row] = []
    for row in rows:
        vocab_id = int(row["vocab_id"])
        used = per_vocab_count.get(vocab_id, 0)
        if used >= safe_limit:
            continue
        filtered.append(row)
        per_vocab_count[vocab_id] = used + 1
    return filtered


def get_grammar_micro_units(unlock_levels: list[str] | None = None, limit: int = 20) -> list[sqlite3.Row]:
    """Return grammar micro units filtered by unlock levels when provided."""
    safe_limit = max(1, int(limit))

    if unlock_levels:
        normalized_levels = sorted(
            {
                str(level).strip().lower()
                for level in unlock_levels
                if str(level).strip()
            }
        )
    else:
        normalized_levels = []

    conn = get_connection()
    if normalized_levels:
        placeholders = ",".join("?" for _ in normalized_levels)
        rows = conn.execute(
            f"""
            SELECT *
            FROM grammar_micro_units
            WHERE lower(coalesce(unlock_level, 'all')) IN ({placeholders})
            ORDER BY difficulty_score ASC, id ASC
            LIMIT ?
            """,
            tuple(normalized_levels + [safe_limit]),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM grammar_micro_units
            ORDER BY difficulty_score ASC, id ASC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    conn.close()
    return rows


def get_learner_profile_history(limit: int = 30) -> list[sqlite3.Row]:
    """Return latest learner profile snapshots for adaptive progression reads."""
    safe_limit = max(1, int(limit))
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT *
        FROM learner_profile_history
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT ?
        """,
        (safe_limit,),
    ).fetchall()
    conn.close()
    return rows
