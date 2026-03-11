// ============================================
// SoulFriend GameFi — Service Barrel Export
// ============================================
// Backend wraps the original 22-system GameFi engine.

// Engine (wrapper around gamefi/core/ + integration/)
export {
  getOrCreateCharacter,
  getCharacter,
  processEvent,
  getDailyQuests,
  completeQuest,
  getBadges,
  getGameProfile,
  getSupportedEvents,
  resetEngine,
  // New: Full systems
  getSkillTree,
  getWorldMap,
  travel,
  getQuestDatabase,
  completeFullQuest,
  getAdaptiveQuests,
  getStateData,
  getBehaviorData,
  completeDailyRitualStep,
  completeWeekly,
  getLoreData,
  getLoreMessage,
  getFullGameData,
  getPlayerDashboard,
  getQuestHistory,
} from './gamefiEngine';

// Narrative Detector (re-export from integration/narrativeTrigger)
export { detectEvent, detectEventWithScores } from './narrativeDetector';

// Feedback Generator (re-export from integration/gamefiFeedback)
export { generateFeedback, generateShortFeedback, generateSafetyMessage } from './feedbackGenerator';

// Types — from original engine
export type { PsychEventType, PsychEvent, EventResult } from '../../../../gamefi/core/eventHandler';
export type { GrowthStats } from '../../../../gamefi/core/types';

// Types — backend API response types
export type {
  Character, DailyQuest, Badge, GameProfile,
  SkillTreeData, WorldMapData, QuestDatabaseData,
  AdaptiveQuestData, StateData, BehaviorData, LoreData, FullGameData,
  PlayerDashboardData,
} from './types';
