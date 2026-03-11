/**
 * GameFi — Shared Type Definitions
 */

export interface GrowthStats {
  emotionalAwareness: number;
  psychologicalSafety: number;
  meaning: number;
  cognitiveFlexibility: number;
  relationshipQuality: number;
}

export interface Character {
  id: string; userId: string; archetype: string; level: number; xp: number;
  growthScore: number; growthStats: GrowthStats; soulPoints: number;
  empathyPoints: number; streak: number; lastActiveDate: string;
  completedQuestIds: string[]; badges: string[]; createdAt: string;
}

export type CompletionMode = 'instant' | 'manual_confirm' | 'requires_input' | 'auto_event';
export interface DailyQuest { id: string; title: string; description: string; icon: string; xpReward: number; eventType: string; completed: boolean; completionMode: CompletionMode; }
export interface Badge { id: string; name: string; icon: string; description: string; unlocked: boolean; }
export interface GameProfile { character: Character; quests: DailyQuest[]; badges: Badge[]; levelTitle: string; xpToNextLevel: number; xpProgress: number; }

export interface SkillInfo { id: string; branch: string; tier: number; ten: string; moTa: string; linkedLocation: string; unlocked: boolean; canUnlock: boolean; }
export interface SynergyInfo { id: string; ten: string; moTa: string; requiredSkills: string[]; unlocked: boolean; }
export interface BranchMasteryInfo { branch: string; ten: string; danhHieu: string; mastered: boolean; }
export interface SkillTreeData { skills: SkillInfo[]; synergies: SynergyInfo[]; masteries: BranchMasteryInfo[]; unlockedCount: number; totalCount: number; }

export interface LocationInfo { id: string; ten: string; moTa: string; levelRequired: number; growthScoreRequired: number; unlocked: boolean; isCurrent: boolean; }
export interface WorldMapData { locations: LocationInfo[]; currentLocation: string; unlockedCount: number; totalCount: number; }

export interface RecommendedQuest { questId: string; title: string; description: string; category: string; xpReward: number; totalScore: number; reason: string; completionMode: CompletionMode; }
export interface QuestChainInfo { id: string; theme: string; title: string; steps: { order: number; title: string; description: string; xpReward: number; completed: boolean; completionMode: CompletionMode }[]; totalXp: number; completedSteps: number; }
export interface AdaptiveQuestData {
  playerPhase: string; userType: string; recommendations: RecommendedQuest[];
  questChain: QuestChainInfo | null;
  allChains: QuestChainInfo[];
  difficulty: { current: string; suggested: string; completionRate: number; shouldAdjust: boolean; reason: string; };
}

export interface StateData { zone: string; growthScore: number; trajectory: { timestamp: number; zone: string; growthScore: number; stats: GrowthStats }[]; empathyRank: string; empathyScore: number; }

export interface DailyRitualInfo { date: string; checkinDone: boolean; reflectionDone: boolean; communityDone: boolean; completed: boolean; }
export interface WeeklyChallengeInfo { id: string; title: string; description: string; xpReward: number; completed: boolean; }
export interface SeasonalGoalInfo { id: string; title: string; rewardTitle: string; xpReward: number; progress: { questsCompleted: number; reflections: number; empathyActions: number }; requirements: { questsCompleted: number; reflections: number; empathyActions: number }; completed: boolean; }
export interface BehaviorData { dailyRitual: DailyRitualInfo; weeklyChallenges: WeeklyChallengeInfo[]; seasonalGoals: SeasonalGoalInfo[]; meaningShifts: { from: string; to: string; detectedAt: number }[]; }

export interface LoreData {
  worldName: string; playerRole: string; communityName: string;
  philosophies: { id: string; noiDung: string }[];
  legends: { id: string; ten: string; moTa: string; becomeCondition: string }[];
  locationLores: { locationId: string; ten: string; truyenThuyet: string; trieuLy: string }[];
}

export interface QuestDbItem { id: string; title: string; description: string; category: string; location: string; xpReward: number; loai: string; completed: boolean; completionMode: CompletionMode; }
export interface QuestDbData { quests: QuestDbItem[]; totalCount: number; completedCount: number; categories: string[]; }

export interface FullGameData {
  profile: GameProfile; skillTree: SkillTreeData; worldMap: WorldMapData;
  state: StateData; behavior: BehaviorData; lore: LoreData;
}

export interface RewardData {
  xpGained: number;
  growthImpact: Partial<GrowthStats>;
  newLevel: number;
  levelTitle: string;
  milestone: string | null;
  rewards: { soulPoints: number; empathyPoints: number };
  feedback: string;
  questTitle: string;
  eventType?: string;
}

export type TabType = 'profile' | 'dashboard' | 'world' | 'skills' | 'quests' | 'behavior' | 'lore';
