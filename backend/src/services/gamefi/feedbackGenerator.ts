// ============================================
// SoulFriend GameFi — Feedback Generator (Backend)
// ============================================
// Re-exports from the original integration/gamefiFeedback module.
// The original generates friendly Vietnamese messages from EventResult,
// including XP notifications, growth stat changes, milestones,
// quest suggestions, rewards, and crisis safety messages.

export {
  generateFeedback,
  generateShortFeedback,
  generateSafetyMessage,
} from '../../../../integration/gamefiFeedback';
