-- Gamification Database Schema
-- Tables for streaks, XP, achievements, and challenges

-- Streaks table: Track daily learning streaks
CREATE TABLE IF NOT EXISTS gamification_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,  -- ISO date format: YYYY-MM-DD
    missed_days INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,  -- ISO date format: YYYY-MM-DD
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(learner_id)
);

-- XP Data table: Track experience points and levels
CREATE TABLE IF NOT EXISTS gamification_xp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,  -- Current session/available XP
    total_xp INTEGER NOT NULL DEFAULT 0,  -- Lifetime XP
    current_level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    level_tier TEXT NOT NULL DEFAULT 'bronze',  -- bronze, silver, gold, platinum
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(learner_id)
);

-- Achievements table: Predefined achievements available
CREATE TABLE IF NOT EXISTS gamification_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_id TEXT NOT NULL UNIQUE,  -- e.g., 'first_lesson', 'week_streak'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    rarity TEXT NOT NULL DEFAULT 'common',  -- common, uncommon, rare, legendary
    xp_reward INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Learner Achievements: Which achievements a learner has unlocked
CREATE TABLE IF NOT EXISTS learner_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL DEFAULT 1,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (achievement_id) REFERENCES gamification_achievements(achievement_id) ON DELETE CASCADE,
    UNIQUE(learner_id, achievement_id)
);

-- Daily Challenges table
CREATE TABLE IF NOT EXISTS gamification_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id TEXT NOT NULL UNIQUE,  -- e.g., 'daily_3_lessons', 'earn_50_xp'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '⭐',
    target INTEGER NOT NULL DEFAULT 1,
    reward INTEGER NOT NULL DEFAULT 10,
    challenge_type TEXT NOT NULL DEFAULT 'general',  -- lessons, xp, review, streak
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Learner Challenge Progress: Daily challenge progress per learner
CREATE TABLE IF NOT EXISTS learner_challenge_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL DEFAULT 1,
    challenge_id TEXT NOT NULL,
    current_progress INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,  -- 0 = not completed, 1 = completed
    claimed INTEGER NOT NULL DEFAULT 0,  -- 0 = not claimed, 1 = claimed
    reset_date TEXT NOT NULL,  -- Date when this challenge set resets (YYYY-MM-DD)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (challenge_id) REFERENCES gamification_challenges(challenge_id) ON DELETE CASCADE,
    UNIQUE(learner_id, challenge_id, reset_date)
);

-- Activity Log: Track learning activities for achievements
CREATE TABLE IF NOT EXISTS gamification_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL DEFAULT 1,
    activity_type TEXT NOT NULL,  -- lesson_complete, review_complete, xp_earned, etc.
    activity_data TEXT,  -- JSON data about the activity
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
