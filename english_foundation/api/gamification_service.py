"""Gamification Service - Manages streaks, XP, achievements, and challenges."""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, date, timezone
from pathlib import Path
from typing import Any

import sqlite3

# CRITICAL: Setup sys.path BEFORE any imports
# This ensures imports work in both development and production (Render)
_current_file = Path(__file__).resolve()
_english_foundation_root = _current_file.parent.parent
_repo_root = _english_foundation_root.parent

paths_to_add = [str(_repo_root), str(_english_foundation_root)]
for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import from english_foundation package (works in all environments)
from english_foundation.db.bootstrap import bootstrap_database, get_connection


@dataclass
class StreakData:
    currentStreak: int
    bestStreak: int
    lastActiveDate: str | None
    missedDays: int
    startDate: str


@dataclass
class XPData:
    xp: int
    currentLevel: int
    xpToNextLevel: int
    totalXP: int
    levelTier: str


@dataclass
class Achievement:
    id: str
    name: str
    description: str
    icon: str
    rarity: str
    unlocked: bool
    unlockedAt: str | None


@dataclass
class Challenge:
    id: str
    title: str
    description: str
    icon: str
    target: int
    current: int
    reward: int
    completed: bool
    claimed: bool
    resetDate: str


@dataclass
class GamificationResult:
    success: bool
    message: str = ""
    data: Any = None


# XP and Level Configuration
XP_PER_LESSON = 20
XP_PER_REVIEW = 10
XP_PERFECT_BONUS = 10

LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 800,
    6: 1200,
    7: 1700,
    8: 2300,
    9: 3000,
    10: 3800,
}

LEVEL_TIERS = {
    (1, 4): "bronze",
    (5, 7): "silver",
    (8, 9): "gold",
    (10, 99): "platinum",
}


class GamificationService:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self._init_gamification_tables()
        self._seed_achievements()
        self._seed_challenges()

    # ==================== Table Initialization ====================

    def _init_gamification_tables(self) -> None:
        """Initialize gamification tables if they don't exist."""
        schema_path = Path(__file__).resolve().parent.parent / "db" / "gamification_schema.sql"
        if schema_path.exists():
            self.conn.executescript(schema_path.read_text(encoding="utf-8"))
            self.conn.commit()

    def _seed_achievements(self) -> None:
        """Seed predefined achievements."""
        seed_path = Path(__file__).resolve().parent.parent / "content" / "achievements_seed.json"
        if not seed_path.exists():
            return

        achievements = json.loads(seed_path.read_text(encoding="utf-8-sig"))
        for ach in achievements:
            self.conn.execute(
                """
                INSERT OR IGNORE INTO gamification_achievements
                (achievement_id, name, description, icon, rarity, xp_reward)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    ach["achievement_id"],
                    ach["name"],
                    ach["description"],
                    ach["icon"],
                    ach["rarity"],
                    ach["xp_reward"],
                ),
            )
        self.conn.commit()

    def _seed_challenges(self) -> None:
        """Seed predefined daily challenges."""
        seed_path = Path(__file__).resolve().parent.parent / "content" / "challenges_seed.json"
        if not seed_path.exists():
            return

        challenges = json.loads(seed_path.read_text(encoding="utf-8-sig"))
        for ch in challenges:
            self.conn.execute(
                """
                INSERT OR IGNORE INTO gamification_challenges
                (challenge_id, title, description, icon, target, reward, challenge_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ch["challenge_id"],
                    ch["title"],
                    ch["description"],
                    ch["icon"],
                    ch["target"],
                    ch["reward"],
                    ch["challenge_type"],
                ),
            )
        self.conn.commit()

    # ==================== Utility Methods ====================

    @staticmethod
    def _today() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _get_or_create_streak(self, learner_id: int) -> StreakData:
        """Get or create streak record for learner."""
        row = self.conn.execute(
            "SELECT * FROM gamification_streaks WHERE learner_id = ?", (learner_id,)
        ).fetchone()

        if row:
            return StreakData(
                currentStreak=row["current_streak"],
                bestStreak=row["best_streak"],
                lastActiveDate=row["last_active_date"],
                missedDays=row["missed_days"],
                startDate=row["start_date"],
            )

        # Create new streak
        today = self._today()
        self.conn.execute(
            """
            INSERT INTO gamification_streaks (learner_id, current_streak, best_streak, missed_days, start_date, last_active_date)
            VALUES (?, 0, 0, 0, ?, ?)
            """,
            (learner_id, today, today),
        )
        self.conn.commit()

        return StreakData(
            currentStreak=0, bestStreak=0, lastActiveDate=today, missedDays=0, startDate=today
        )

    def _update_streak(self, learner_id: int, is_active_today: bool) -> StreakData:
        """Update streak based on activity."""
        streak = self._get_or_create_streak(learner_id)
        today = self._today()

        if is_active_today:
            if streak.lastActiveDate != today:
                yesterday = (datetime.strptime(streak.lastActiveDate or today, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
                date_before_yesterday = (datetime.strptime(streak.lastActiveDate or today, "%Y-%m-%d") - timedelta(days=2)).strftime("%Y-%m-%d")

                if streak.lastActiveDate == yesterday:
                    # Consecutive day - increment streak
                    new_streak = streak.currentStreak + 1
                elif streak.lastActiveDate == date_before_yesterday and streak.missedDays == 1:
                    # Missed one day but was active before - continue with 1 streak
                    new_streak = 1
                    self.conn.execute(
                        "UPDATE gamification_streaks SET missed_days = 0 WHERE learner_id = ?",
                        (learner_id,),
                    )
                else:
                    # First day or gap > 1 - reset to 1
                    new_streak = 1

                new_best = max(streak.bestStreak, new_streak)
                self.conn.execute(
                    """
                    UPDATE gamification_streaks
                    SET current_streak = ?, best_streak = ?, last_active_date = ?, missed_days = 0, updated_at = ?
                    WHERE learner_id = ?
                    """,
                    (new_streak, new_best, today, self._now_iso(), learner_id),
                )
                self.conn.commit()

                streak.currentStreak = new_streak
                streak.bestStreak = new_best
                streak.lastActiveDate = today
                streak.missedDays = 0
        else:
            # Check if streak needs to be updated for missed day
            if streak.lastActiveDate and streak.lastActiveDate != today:
                yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
                if streak.lastActiveDate == yesterday:
                    self.conn.execute(
                        """
                        UPDATE gamification_streaks
                        SET missed_days = missed_days + 1, updated_at = ?
                        WHERE learner_id = ?
                        """,
                        (self._now_iso(), learner_id),
                    )
                    self.conn.commit()
                    streak.missedDays += 1

        return streak

    def _get_or_create_xp(self, learner_id: int) -> XPData:
        """Get or create XP record for learner."""
        row = self.conn.execute(
            "SELECT * FROM gamification_xp WHERE learner_id = ?", (learner_id,)
        ).fetchone()

        if row:
            return XPData(
                xp=row["xp"],
                currentLevel=row["current_level"],
                xpToNextLevel=row["xp_to_next_level"],
                totalXP=row["total_xp"],
                levelTier=row["level_tier"],
            )

        # Create new XP record
        self.conn.execute(
            """
            INSERT INTO gamification_xp (learner_id, xp, total_xp, current_level, xp_to_next_level, level_tier)
            VALUES (?, 0, 0, 1, 100, 'bronze')
            """,
            (learner_id,),
        )
        self.conn.commit()

        return XPData(xp=0, currentLevel=1, xpToNextLevel=100, totalXP=0, levelTier="bronze")

    def _calculate_level(self, total_xp: int) -> tuple[int, int, str]:
        """Calculate level, XP needed for next level, and tier from total XP."""
        level = 1
        xp_to_next = 100

        for lvl, threshold in sorted(LEVEL_THRESHOLDS.items(), key=lambda x: x[1]):
            if total_xp >= threshold:
                level = lvl
            else:
                xp_to_next = threshold - total_xp
                break

        # Determine tier
        tier = "bronze"
        for (min_lvl, max_lvl), tier_name in LEVEL_TIERS.items():
            if min_lvl <= level <= max_lvl:
                tier = tier_name
                break

        return level, xp_to_next, tier

    def _add_xp(self, learner_id: int, amount: int) -> XPData:
        """Add XP to learner and check for level ups."""
        xp_data = self._get_or_create_xp(learner_id)

        new_total = xp_data.totalXP + amount
        new_session = xp_data.xp + amount

        new_level, new_xp_to_next, new_tier = self._calculate_level(new_total)

        self.conn.execute(
            """
            UPDATE gamification_xp
            SET xp = ?, total_xp = ?, current_level = ?, xp_to_next_level = ?, level_tier = ?, updated_at = ?
            WHERE learner_id = ?
            """,
            (new_session, new_total, new_level, new_xp_to_next, new_tier, self._now_iso(), learner_id),
        )
        self.conn.commit()

        return XPData(
            xp=new_session, currentLevel=new_level, xpToNextLevel=new_xp_to_next, totalXP=new_total, levelTier=new_tier
        )

    def _get_achievements(self, learner_id: int) -> list[Achievement]:
        """Get all achievements with unlock status for learner."""
        all_achievements = self.conn.execute(
            "SELECT * FROM gamification_achievements ORDER BY xp_reward ASC"
        ).fetchall()

        unlocked = self.conn.execute(
            "SELECT achievement_id, unlocked_at FROM learner_achievements WHERE learner_id = ?",
            (learner_id,),
        ).fetchall()
        unlocked_map = {row["achievement_id"]: row["unlocked_at"] for row in unlocked}

        return [
            Achievement(
                id=row["achievement_id"],
                name=row["name"],
                description=row["description"],
                icon=row["icon"],
                rarity=row["rarity"],
                unlocked=bool(unlocked_map.get(row["achievement_id"])),
                unlockedAt=unlocked_map.get(row["achievement_id"]),
            )
            for row in all_achievements
        ]

    def _check_and_unlock_achievement(
        self, learner_id: int, achievement_id: str
    ) -> Achievement | None:
        """Check if achievement can be unlocked and unlock it."""
        # Check if already unlocked
        existing = self.conn.execute(
            "SELECT * FROM learner_achievements WHERE learner_id = ? AND achievement_id = ?",
            (learner_id, achievement_id),
        ).fetchone()

        if existing:
            return None

        # Check if achievement exists
        achievement = self.conn.execute(
            "SELECT * FROM gamification_achievements WHERE achievement_id = ?", (achievement_id,)
        ).fetchone()

        if not achievement:
            return None

        # Unlock the achievement
        self.conn.execute(
            """
            INSERT INTO learner_achievements (learner_id, achievement_id, unlocked_at)
            VALUES (?, ?, ?)
            """,
            (learner_id, achievement_id, self._now_iso()),
        )
        self.conn.commit()

        return Achievement(
            id=achievement["achievement_id"],
            name=achievement["name"],
            description=achievement["description"],
            icon=achievement["icon"],
            rarity=achievement["rarity"],
            unlocked=True,
            unlockedAt=self._now_iso(),
        )

    def _get_daily_challenges(self, learner_id: int) -> list[Challenge]:
        """Get today's challenges with progress for learner."""
        today = self._today()

        # Get all available challenges
        all_challenges = self.conn.execute(
            "SELECT * FROM gamification_challenges"
        ).fetchall()

        challenges = []
        for ch in all_challenges:
            # Get or create progress for this learner/challenge/date
            progress_row = self.conn.execute(
                """
                SELECT * FROM learner_challenge_progress
                WHERE learner_id = ? AND challenge_id = ? AND reset_date = ?
                """,
                (learner_id, ch["challenge_id"], today),
            ).fetchone()

            if not progress_row:
                # Create new progress entry for today
                self.conn.execute(
                    """
                    INSERT INTO learner_challenge_progress
                    (learner_id, challenge_id, current_progress, completed, claimed, reset_date)
                    VALUES (?, ?, 0, 0, 0, ?)
                    """,
                    (learner_id, ch["challenge_id"], today),
                )
                self.conn.commit()

                progress_row = self.conn.execute(
                    """
                    SELECT * FROM learner_challenge_progress
                    WHERE learner_id = ? AND challenge_id = ? AND reset_date = ?
                    """,
                    (learner_id, ch["challenge_id"], today),
                ).fetchone()

            challenges.append(
                Challenge(
                    id=ch["challenge_id"],
                    title=ch["title"],
                    description=ch["description"],
                    icon=ch["icon"],
                    target=ch["target"],
                    current=progress_row["current_progress"],
                    reward=ch["reward"],
                    completed=bool(progress_row["completed"]),
                    claimed=bool(progress_row["claimed"]),
                    resetDate=today,
                )
            )

        return challenges

    def _progress_challenge(
        self, learner_id: int, challenge_id: str, progress: int
    ) -> Challenge | None:
        """Add progress to a challenge."""
        today = self._today()

        # Get challenge info
        challenge = self.conn.execute(
            "SELECT * FROM gamification_challenges WHERE challenge_id = ?", (challenge_id,)
        ).fetchone()

        if not challenge:
            return None

        # Get or create progress
        progress_row = self.conn.execute(
            """
            SELECT * FROM learner_challenge_progress
            WHERE learner_id = ? AND challenge_id = ? AND reset_date = ?
            """,
            (learner_id, challenge_id, today),
        ).fetchone()

        if not progress_row:
            self.conn.execute(
                """
                INSERT INTO learner_challenge_progress
                (learner_id, challenge_id, current_progress, completed, claimed, reset_date)
                VALUES (?, ?, 0, 0, 0, ?)
                """,
                (learner_id, challenge_id, today),
            )
            self.conn.commit()
            progress_row = self.conn.execute(
                """
                SELECT * FROM learner_challenge_progress
                WHERE learner_id = ? AND challenge_id = ? AND reset_date = ?
                """,
                (learner_id, challenge_id, today),
            ).fetchone()

        new_progress = min(progress_row["current_progress"] + progress, challenge["target"])
        completed = 1 if new_progress >= challenge["target"] else 0

        self.conn.execute(
            """
            UPDATE learner_challenge_progress
            SET current_progress = ?, completed = ?, updated_at = ?
            WHERE id = ?
            """,
            (new_progress, completed, self._now_iso(), progress_row["id"]),
        )
        self.conn.commit()

        return Challenge(
            id=challenge["challenge_id"],
            title=challenge["title"],
            description=challenge["description"],
            icon=challenge["icon"],
            target=challenge["target"],
            current=new_progress,
            reward=challenge["reward"],
            completed=bool(completed),
            claimed=bool(progress_row["claimed"]),
            resetDate=today,
        )

    def _claim_challenge_reward(self, learner_id: int, challenge_id: str) -> Challenge | None:
        """Claim reward for a completed challenge."""
        today = self._today()

        progress_row = self.conn.execute(
            """
            SELECT * FROM learner_challenge_progress
            WHERE learner_id = ? AND challenge_id = ? AND reset_date = ?
            """,
            (learner_id, challenge_id, today),
        ).fetchone()

        if not progress_row or not progress_row["completed"] or progress_row["claimed"]:
            return None

        challenge = self.conn.execute(
            "SELECT * FROM gamification_challenges WHERE challenge_id = ?", (challenge_id,)
        ).fetchone()

        if not challenge:
            return None

        # Mark as claimed
        self.conn.execute(
            """
            UPDATE learner_challenge_progress
            SET claimed = 1, updated_at = ?
            WHERE id = ?
            """,
            (self._now_iso(), progress_row["id"]),
        )
        self.conn.commit()

        # Award XP
        self._add_xp(learner_id, challenge["reward"])

        return Challenge(
            id=challenge["challenge_id"],
            title=challenge["title"],
            description=challenge["description"],
            icon=challenge["icon"],
            target=challenge["target"],
            current=progress_row["current_progress"],
            reward=challenge["reward"],
            completed=True,
            claimed=True,
            resetDate=today,
        )

    def _log_activity(
        self, learner_id: int, activity_type: str, activity_data: dict | None, xp_earned: int
    ) -> None:
        """Log a learning activity."""
        self.conn.execute(
            """
            INSERT INTO gamification_activity_log (learner_id, activity_type, activity_data, xp_earned)
            VALUES (?, ?, ?, ?)
            """,
            (learner_id, activity_type, json.dumps(activity_data) if activity_data else None, xp_earned),
        )
        self.conn.commit()

    # ==================== Public API Methods ====================

    def get_gamification_data(self, learner_id: int = 1) -> GamificationResult:
        """Get complete gamification data for learner."""
        try:
            streak = self._get_or_create_streak(learner_id)
            xp = self._get_or_create_xp(learner_id)
            achievements = self._get_achievements(learner_id)
            challenges = self._get_daily_challenges(learner_id)

            # Check and update streak for missed days
            self._update_streak(learner_id, is_active_today=False)
            streak = self._get_or_create_streak(learner_id)

            data = {
                "userId": str(learner_id),
                "streak": asdict(streak),
                "xp": xp.xp,
                "currentLevel": xp.currentLevel,
                "xpToNextLevel": xp.xpToNextLevel,
                "totalXP": xp.totalXP,
                "levelTier": xp.levelTier,
                "achievements": [asdict(a) for a in achievements],
                "unlockedAchievementCount": sum(1 for a in achievements if a.unlocked),
                "dailyChallenges": [asdict(c) for c in challenges],
                "createdAt": self._now_iso(),
                "updatedAt": self._now_iso(),
            }

            return GamificationResult(success=True, data=data)
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def get_achievements(self, learner_id: int = 1) -> GamificationResult:
        """Get achievements for learner."""
        try:
            achievements = self._get_achievements(learner_id)
            return GamificationResult(success=True, data=achievements)
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def get_challenges(self, learner_id: int = 1) -> GamificationResult:
        """Get daily challenges for learner."""
        try:
            challenges = self._get_daily_challenges(learner_id)
            return GamificationResult(success=True, data=challenges)
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def track_activity(
        self, learner_id: int = 1, activity_type: str = "lesson_complete", activity_data: dict | None = None
    ) -> GamificationResult:
        """Track a learning activity."""
        try:
            # Update streak if activity today
            self._update_streak(learner_id, is_active_today=True)

            # Track activity type specific actions
            xp_earned = 0
            achievements_unlocked = []

            if activity_type == "lesson_complete":
                xp_earned = XP_PER_LESSON
                if activity_data and activity_data.get("is_perfect"):
                    xp_earned += XP_PERFECT_BONUS

                # Progress daily challenges
                self._progress_challenge(learner_id, "daily_1_lesson", 1)
                self._progress_challenge(learner_id, "daily_3_lessons", 1)
                self._progress_challenge(learner_id, "daily_streak", 1)
                if activity_data and activity_data.get("is_perfect"):
                    self._progress_challenge(learner_id, "daily_perfect", 1)

            elif activity_type == "review_complete":
                xp_earned = XP_PER_REVIEW
                self._progress_challenge(learner_id, "daily_review", 1)

            # Add XP
            if xp_earned > 0:
                self._add_xp(learner_id, xp_earned)
                self._progress_challenge(learner_id, "daily_xp_50", xp_earned)

            # Log activity
            self._log_activity(learner_id, activity_type, activity_data, xp_earned)

            # Check achievements
            xp_data = self._get_or_create_xp(learner_id)
            streak = self._get_or_create_streak(learner_id)

            # Activity-based achievements
            activity_count = self.conn.execute(
                "SELECT COUNT(*) FROM gamification_activity_log WHERE learner_id = ? AND activity_type = ?",
                (learner_id, activity_type),
            ).fetchone()[0]

            if activity_type == "lesson_complete":
                if activity_count >= 1:
                    ach = self._check_and_unlock_achievement(learner_id, "first_lesson")
                    if ach:
                        achievements_unlocked.append(ach)
                        self._add_xp(learner_id, 10)

                if activity_count >= 5:
                    ach = self._check_and_unlock_achievement(learner_id, "five_lessons")
                    if ach:
                        achievements_unlocked.append(ach)

                if activity_count >= 10:
                    ach = self._check_and_unlock_achievement(learner_id, "ten_lessons")
                    if ach:
                        achievements_unlocked.append(ach)

                if activity_count >= 50:
                    ach = self._check_and_unlock_achievement(learner_id, "fifty_lessons")
                    if ach:
                        achievements_unlocked.append(ach)

                if activity_count >= 100:
                    ach = self._check_and_unlock_achievement(learner_id, "hundred_lessons")
                    if ach:
                        achievements_unlocked.append(ach)

                if activity_data and activity_data.get("is_perfect"):
                    ach = self._check_and_unlock_achievement(learner_id, "perfect_lesson")
                    if ach:
                        achievements_unlocked.append(ach)

                # Three lessons in one day check (if we have enough today)
                today = self._today()
                today_lessons = self.conn.execute(
                    """
                    SELECT COUNT(*) FROM gamification_activity_log
                    WHERE learner_id = ? AND activity_type = 'lesson_complete'
                    AND date(created_at) = ?
                    """,
                    (learner_id, today),
                ).fetchone()[0]
                if today_lessons >= 3:
                    ach = self._check_and_unlock_achievement(learner_id, "three_daily")
                    if ach:
                        achievements_unlocked.append(ach)

            elif activity_type == "review_complete":
                if activity_count >= 1:
                    ach = self._check_and_unlock_achievement(learner_id, "first_review")
                    if ach:
                        achievements_unlocked.append(ach)
                if activity_count >= 10:
                    ach = self._check_and_unlock_achievement(learner_id, "ten_reviews")
                    if ach:
                        achievements_unlocked.append(ach)

            # Streak achievements
            if streak.currentStreak >= 7:
                ach = self._check_and_unlock_achievement(learner_id, "week_streak")
                if ach:
                    achievements_unlocked.append(ach)

            if streak.currentStreak >= 30:
                ach = self._check_and_unlock_achievement(learner_id, "month_streak")
                if ach:
                    achievements_unlocked.append(ach)

            # XP achievements
            if xp_data.totalXP >= 100:
                ach = self._check_and_unlock_achievement(learner_id, "xp_100")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.totalXP >= 500:
                ach = self._check_and_unlock_achievement(learner_id, "xp_500")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.totalXP >= 1000:
                ach = self._check_and_unlock_achievement(learner_id, "xp_1000")
                if ach:
                    achievements_unlocked.append(ach)

            # Level achievements
            if xp_data.currentLevel >= 5:
                ach = self._check_and_unlock_achievement(learner_id, "level_5")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.currentLevel >= 10:
                ach = self._check_and_unlock_achievement(learner_id, "level_10")
                if ach:
                    achievements_unlocked.append(ach)

            return GamificationResult(
                success=True,
                data={
                    "activity_type": activity_type,
                    "xp_earned": xp_earned,
                    "achievements_unlocked": [asdict(a) for a in achievements_unlocked],
                },
            )
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def award_xp(self, learner_id: int = 1, xp_amount: int = 0) -> GamificationResult:
        """Award XP to learner."""
        try:
            xp_data = self._add_xp(learner_id, xp_amount)
            self._progress_challenge(learner_id, "daily_xp_50", xp_amount)

            # Check XP achievements
            achievements_unlocked = []
            if xp_data.totalXP >= 100:
                ach = self._check_and_unlock_achievement(learner_id, "xp_100")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.totalXP >= 500:
                ach = self._check_and_unlock_achievement(learner_id, "xp_500")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.totalXP >= 1000:
                ach = self._check_and_unlock_achievement(learner_id, "xp_1000")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.currentLevel >= 5:
                ach = self._check_and_unlock_achievement(learner_id, "level_5")
                if ach:
                    achievements_unlocked.append(ach)
            if xp_data.currentLevel >= 10:
                ach = self._check_and_unlock_achievement(learner_id, "level_10")
                if ach:
                    achievements_unlocked.append(ach)

            return GamificationResult(
                success=True,
                data={
                    "xp": xp_data.xp,
                    "total_xp": xp_data.totalXP,
                    "level": xp_data.currentLevel,
                    "xp_to_next_level": xp_data.xpToNextLevel,
                    "level_tier": xp_data.levelTier,
                    "achievements_unlocked": [asdict(a) for a in achievements_unlocked],
                },
            )
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def progress_challenge(self, learner_id: int = 1, challenge_id: str = "", progress: int = 1) -> GamificationResult:
        """Add progress to a challenge."""
        try:
            challenge = self._progress_challenge(learner_id, challenge_id, progress)
            if not challenge:
                return GamificationResult(success=False, message="Challenge not found")

            return GamificationResult(success=True, data=asdict(challenge))
        except Exception as e:
            return GamificationResult(success=False, message=str(e))

    def claim_challenge_reward(self, learner_id: int = 1, challenge_id: str = "") -> GamificationResult:
        """Claim reward for a completed challenge."""
        try:
            challenge = self._claim_challenge_reward(learner_id, challenge_id)
            if not challenge:
                return GamificationResult(
                    success=False,
                    message="Challenge not completed or already claimed",
                )

            xp_data = self._get_or_create_xp(learner_id)

            return GamificationResult(
                success=True,
                data={
                    "challenge": asdict(challenge),
                    "xp": xp_data.xp,
                    "total_xp": xp_data.totalXP,
                    "level": xp_data.currentLevel,
                },
            )
        except Exception as e:
            return GamificationResult(success=False, message=str(e))


def create_gamification_service(conn: sqlite3.Connection | None = None) -> GamificationService:
    """Create and return a GamificationService instance."""
    if conn is None:
        # bootstrap_database and get_connection are imported at module level
        bootstrap_database()
        conn = get_connection()

    return GamificationService(conn)
