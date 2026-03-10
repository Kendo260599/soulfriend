// ============================================
// SoulFriend GameFi — Backend API Types
// ============================================
// Types for the API response format (frontend-friendly).
// Core engine types (PsychEventType, PsychEvent, EventResult,
// GrowthStats, Character) live in the original gamefi/core/types.ts
// and gamefi/core/eventHandler.ts — re-exported via index.ts barrel.

import type { GrowthStats } from '../../../../gamefi/core/types';

// ── Frontend Character ───────────────────────

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

// ── Skill Tree ───────────────────────────────

export interface SkillInfo {
  id: string;
  branch: string;
  tier: number;
  ten: string;
  moTa: string;
  linkedLocation: string;
  unlocked: boolean;
  canUnlock: boolean;
}

export interface SynergyInfo {
  id: string;
  ten: string;
  moTa: string;
  requiredSkills: string[];
  unlocked: boolean;
}

export interface BranchMasteryInfo {
  branch: string;
  ten: string;
  danhHieu: string;
  mastered: boolean;
}

export interface SkillTreeData {
  skills: SkillInfo[];
  synergies: SynergyInfo[];
  masteries: BranchMasteryInfo[];
  unlockedCount: number;
  totalCount: number;
}

// ── World Map ────────────────────────────────

export interface LocationInfo {
  id: string;
  ten: string;
  moTa: string;
  levelRequired: number;
  growthScoreRequired: number;
  unlocked: boolean;
  isCurrent: boolean;
}

export interface WorldMapData {
  locations: LocationInfo[];
  currentLocation: string;
  unlockedCount: number;
  totalCount: number;
}

// ── Quest Database (full 200) ────────────────

export interface QuestInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  xpReward: number;
  loai: string;
  completed: boolean;
}

export interface QuestDatabaseData {
  quests: QuestInfo[];
  totalCount: number;
  completedCount: number;
  categories: string[];
}

// ── Adaptive Quest AI ────────────────────────

export interface RecommendedQuest {
  questId: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  totalScore: number;
  reason: string;
}

export interface QuestChainInfo {
  id: string;
  theme: string;
  title: string;
  steps: { order: number; title: string; description: string; xpReward: number }[];
  totalXp: number;
}

export interface AdaptiveQuestData {
  playerPhase: string;
  userType: string;
  recommendations: RecommendedQuest[];
  questChain: QuestChainInfo | null;
  difficulty: {
    current: string;
    suggested: string;
    completionRate: number;
    shouldAdjust: boolean;
    reason: string;
  };
}

// ── State & Behavior ─────────────────────────

export interface StateData {
  zone: string;
  growthScore: number;
  trajectory: { timestamp: number; zone: string; growthScore: number; stats: GrowthStats }[];
  empathyRank: string;
  empathyScore: number;
}

export interface DailyRitualInfo {
  date: string;
  checkinDone: boolean;
  reflectionDone: boolean;
  communityDone: boolean;
  completed: boolean;
}

export interface WeeklyChallengeInfo {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

export interface SeasonalGoalInfo {
  id: string;
  title: string;
  rewardTitle: string;
  xpReward: number;
  progress: { questsCompleted: number; reflections: number; empathyActions: number };
  requirements: { questsCompleted: number; reflections: number; empathyActions: number };
  completed: boolean;
}

export interface BehaviorData {
  dailyRitual: DailyRitualInfo;
  weeklyChallenges: WeeklyChallengeInfo[];
  seasonalGoals: SeasonalGoalInfo[];
  meaningShifts: { from: string; to: string; detectedAt: number }[];
}

// ── Lore ─────────────────────────────────────

export interface LoreData {
  worldName: string;
  playerRole: string;
  communityName: string;
  philosophies: { id: string; noiDung: string }[];
  legends: { id: string; ten: string; moTa: string; becomeCondition: string }[];
  locationLores: { locationId: string; ten: string; truyenThuyet: string; trieuLy: string }[];
}

// ── Full Game Data ───────────────────────────

export interface FullGameData {
  profile: GameProfile;
  skillTree: SkillTreeData;
  worldMap: WorldMapData;
  state: StateData;
  behavior: BehaviorData;
  lore: LoreData;
}
