// ============================================
// SoulFriend GameFi — Service Barrel Export
// ============================================

// Engine
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
} from './gamefiEngine';

// Narrative Detector
export { detectEvent, detectEventWithScores } from './narrativeDetector';

// Feedback Generator
export { generateFeedback, generateShortFeedback, generateSafetyMessage } from './feedbackGenerator';

// Types
export type {
  PsychEventType,
  PsychEvent,
  EventResult,
  GrowthStats,
  Character,
  DailyQuest,
  Badge,
  GameProfile,
} from './types';
