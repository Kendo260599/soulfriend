/**
 * GameFi Character State — MongoDB Model
 *
 * Stores ALL per-user GameFi state in a single document:
 * character data, skill state, streaks, metadata.
 * Replaces the 3 in-memory Maps: characterMap, skillStateStore, createdAtStore, streakMap.
 */

import mongoose, { Document, Schema } from 'mongoose';

// ── Sub-schemas ──────────────────────────────

const GrowthStatsSchema = new Schema(
  {
    emotionalAwareness: { type: Number, default: 0 },
    psychologicalSafety: { type: Number, default: 0 },
    meaning: { type: Number, default: 0 },
    cognitiveFlexibility: { type: Number, default: 0 },
    relationshipQuality: { type: Number, default: 0 },
  },
  { _id: false }
);

const StreakSchema = new Schema(
  {
    type: { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: String, default: '' },
  },
  { _id: false }
);

// ── Main Document Interface ──────────────────

export interface IGameFiState extends Document {
  userId: string;
  // Character core
  characterId: string;
  archetype: string;
  level: number;
  xp: number;
  growthScore: number;
  growthStats: {
    emotionalAwareness: number;
    psychologicalSafety: number;
    meaning: number;
    cognitiveFlexibility: number;
    relationshipQuality: number;
  };
  soulPoints: number;
  empathyScore: number;
  empathyRank: string;
  badges: string[];
  currentLocation: string;
  completedQuestIds: string[];
  questStates: Record<string, string>;
  // Skill state
  unlockedSkills: string[];
  unlockedSynergies: string[];
  masteredBranches: string[];
  // Streaks
  streaks: Array<{
    type: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  }>;
  // Metadata
  gameCreatedAt: string;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────

const GameFiStateSchema = new Schema<IGameFiState>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 200,
    },
    // Character
    characterId: { type: String, required: true },
    archetype: { type: String, default: 'Người Khám Phá' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    growthScore: { type: Number, default: 0 },
    growthStats: { type: GrowthStatsSchema, default: () => ({}) },
    soulPoints: { type: Number, default: 0 },
    empathyScore: { type: Number, default: 0 },
    empathyRank: { type: String, default: 'Người Lắng Nghe' },
    badges: [{ type: String }],
    currentLocation: { type: String, default: 'thung_lung_cau_hoi' },
    completedQuestIds: [{ type: String }],
    questStates: { type: Schema.Types.Mixed, default: {} },
    // Skill state
    unlockedSkills: [{ type: String }],
    unlockedSynergies: [{ type: String }],
    masteredBranches: [{ type: String }],
    // Streaks
    streaks: [StreakSchema],
    // Metadata
    gameCreatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    collection: 'gamefi_states',
  }
);

export default mongoose.model<IGameFiState>('GameFiState', GameFiStateSchema);
