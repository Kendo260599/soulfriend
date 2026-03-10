// ============================================
// SoulFriend GameFi — Backend API Types
// ============================================
// Types for the API response format (frontend-friendly).
// Core engine types (PsychEventType, PsychEvent, EventResult,
// GrowthStats, Character) live in the original gamefi/core/types.ts
// and gamefi/core/eventHandler.ts — re-exported via index.ts barrel.

import type { GrowthStats } from '../../../../gamefi/core/types';

// ── Frontend Character ───────────────────────
// Maps the original Character (name, empathyScore, empathyRank, currentLocation)
// to what the frontend expects (userId, empathyPoints, streak, lastActiveDate).

export interface Character {
  id: string;
  userId: string;
  archetype: string;
  level: number;
  xp: number;
  growthScore: number;
  growthStats: GrowthStats;
  soulPoints: number;
  empathyPoints: number;
  streak: number;
  lastActiveDate: string;
  completedQuestIds: string[];
  badges: string[];
  createdAt: string;
}

// ── Quest ────────────────────────────────────

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  eventType: string;
  completed: boolean;
}

// ── Badge ────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

// ── Game Profile ─────────────────────────────

export interface GameProfile {
  character: Character;
  quests: DailyQuest[];
  badges: Badge[];
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
}
