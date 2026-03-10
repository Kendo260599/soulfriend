// ============================================
// SoulFriend — Integration Layer (Public API)
// ============================================
// Barrel export cho toàn bộ Integration Layer.
//
// Usage:
//   import { sendEvent, detectEvent, generateFeedback } from './integration';

// GameFi Bridge — gửi event, query profile
export {
  sendEvent,
  quickEvent,
  processUserMessage,
  onEvent,
  clearListeners,
  setBridgeEnabled,
  isBridgeEnabled,
  configureBridge,
  getEventLog,
  getEventLogCount,
  getUserGameProfile,
  getSupportedEventTypes,
  resetBridge,
} from './gamefiBridge';

export type { EventListener, BridgeConfig } from './gamefiBridge';

// Narrative Trigger — detect event từ message
export {
  detectEvent,
  detectEventWithScores,
  shouldTriggerEvent,
  getKeywordCounts,
} from './narrativeTrigger';

// Feedback Generator — tạo thông điệp cho user
export {
  generateFeedback,
  generateShortFeedback,
  generateMilestoneMessage,
  generateSafetyMessage,
} from './gamefiFeedback';

// Re-export types from GameFi
export type {
  PsychEventType,
  PsychEvent,
  EventResult,
} from '../gamefi/core/eventHandler';
