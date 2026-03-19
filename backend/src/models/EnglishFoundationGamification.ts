/**
 * English Foundation Gamification State
 * Tracks: Daily streaks, XP/Level, Achievements, Daily Challenges
 * Used by frontend components: StreakWidget, XPProgressBar, AchievementBadges, DailyChallenge
 */

import mongoose, { Document, Schema } from 'mongoose';

// ── Achievement Sub-schema ──────────────────

const AchievementSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'legendary'], default: 'common' },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Daily Challenge Sub-schema ─────────────

const DailyChallengeSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    reward: { type: Number, default: 50 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    resetDate: { type: Date, required: true }, // UTC midnight for next reset
  },
  { _id: false }
);

// ── Streak Sub-schema ──────────────────────

const StreakSchema = new Schema(
  {
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    missedDays: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
  },
  { _id: false }
);

// ── Main Interface ─────────────────────────

export interface IEnglishFoundationGamification extends Document {
  userId: string;

  // Streak System
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastActiveDate: Date | null;
    missedDays: number;
    startDate: Date | null;
  };

  // XP & Level System
  xp: number;
  currentLevel: number;
  xpToNextLevel: number;
  totalXP: number;
  levelTier: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Achievements
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    unlocked: boolean;
    unlockedAt: Date | null;
  }>;
  unlockedAchievementCount: number;

  // Daily Challenges
  dailyChallenges: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    current: number;
    reward: number;
    completed: boolean;
    completedAt: Date | null;
    resetDate: Date;
  }>;
  lastChallengeResetDate: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveSessionDate: Date;
}

// ── Schema Definition ──────────────────────

const EnglishFoundationGamificationSchema = new Schema<IEnglishFoundationGamification>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Streak System
    streak: {
      type: StreakSchema,
      default: {
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        missedDays: 0,
        startDate: null,
      },
    },

    // XP & Level System
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    xpToNextLevel: {
      type: Number,
      default: 100,
      min: 100,
    },
    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    levelTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },

    // Achievements
    achievements: [AchievementSchema],
    unlockedAchievementCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Daily Challenges
    dailyChallenges: [DailyChallengeSchema],
    lastChallengeResetDate: {
      type: Date,
      default: () => new Date(new Date().toDateString()),
    },

    // Metadata
    lastActiveSessionDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    collection: 'english_foundation_gamification',
  }
);

// ── Indexes ────────────────────────────────

EnglishFoundationGamificationSchema.index({ userId: 1 }, { unique: true });
EnglishFoundationGamificationSchema.index({ currentLevel: -1 });
EnglishFoundationGamificationSchema.index({ 'streak.currentStreak': -1 });
EnglishFoundationGamificationSchema.index({ totalXP: -1 });
EnglishFoundationGamificationSchema.index({ updatedAt: -1 });

// ── Model Export ───────────────────────────

export const EnglishFoundationGamification = mongoose.model<IEnglishFoundationGamification>(
  'EnglishFoundationGamification',
  EnglishFoundationGamificationSchema
);
