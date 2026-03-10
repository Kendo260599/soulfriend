// ============================================
// SoulFriend GameFi — Narrative Detector (Backend)
// ============================================
// Re-exports from the original integration/narrativeTrigger module.
// The original has ~70 Vietnamese + English keywords across 5 event types,
// 18 phrase patterns with weights, and threshold-based detection.

export {
  detectEvent,
  detectEventWithScores,
} from '../../../../integration/narrativeTrigger';
