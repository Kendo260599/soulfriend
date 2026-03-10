// ============================================
// SoulFriend GameFi — Backend Types
// ============================================

// ── Event Types ──────────────────────────────

export type PsychEventType =
  | 'journal_entry'
  | 'story_shared'
  | 'emotion_checkin'
  | 'user_helped_user'
  | 'quest_completed';

export interface PsychEvent {
  userId: string;
  eventType: PsychEventType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface EventResult {
  xpGained: number;
  growthImpact: Partial<GrowthStats>;
  newLevel: number;
  levelTitle: string;
  unlockedQuest: string | null;
  milestone: string | null;
  safetyAlert: boolean;
  rewards: {
    soulPoints: number;
    empathyPoints: number;
  };
  feedback: string;
}

// ── Growth Stats ─────────────────────────────

export interface GrowthStats {
  emotionalAwareness: number;
  psychologicalSafety: number;
  meaning: number;
  cognitiveFlexibility: number;
  relationshipQuality: number;
}

// ── Action Type ──────────────────────────────

export type ActionType =
  | 'journal_entry'
  | 'emotion_regulation'
  | 'reflection'
  | 'help_others'
  | 'gratitude';

// ── Character ────────────────────────────────

export type ArchetypeId =
  | 'Người Tìm Đường'
  | 'Người Hồi Sinh'
  | 'Người Kiến Tạo'
  | 'Người Đồng Cảm'
  | 'Người Khám Phá';

export interface Character {
  id: string;
  userId: string;
  archetype: ArchetypeId;
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

// ── Level ────────────────────────────────────

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
}

// ── Quest ────────────────────────────────────

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  eventType: PsychEventType;
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
