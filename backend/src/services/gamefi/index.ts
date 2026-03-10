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
} from './gamefiEngine';

// Narrative Detector (re-export from integration/narrativeTrigger)
export { detectEvent, detectEventWithScores } from './narrativeDetector';

// Feedback Generator (re-export from integration/gamefiFeedback)
export { generateFeedback, generateShortFeedback, generateSafetyMessage } from './feedbackGenerator';

// Types — from original engine
export type { PsychEventType, PsychEvent, EventResult } from '../../../../gamefi/core/eventHandler';
export type { GrowthStats } from '../../../../gamefi/core/types';

// Types — backend API response types
export type { Character, DailyQuest, Badge, GameProfile } from './types';
