/**
 * Quest Semantic Registry — Frontend mirror of the backend registry.
 *
 * Single source of truth for UI decisions: which modal to render,
 * minimum input requirements, reward display style.
 * Must stay in sync with backend/src/services/gamefi/questSemanticRegistry.ts.
 */

import type { CompletionMode } from './types';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

export interface QuestValidationRule {
  requiresJournalText: boolean;
  requiresAutoEvent: boolean;
  minSentences: number;
  maxTextLength: number;
}

export type RewardStyle = 'overlay' | 'chat_bubble' | 'toast';

export interface QuestRewardSpec {
  style: RewardStyle;
  showGrowthStats: boolean;
  showPoints: boolean;
  showMilestone: boolean;
}

export type BadgeType = 'soul' | 'empathy' | 'streak' | 'milestone' | 'none';

export interface QuestSemantics {
  completionMode: CompletionMode;
  validation: QuestValidationRule;
  reward: QuestRewardSpec;
  badgeType: BadgeType;
}

// ══════════════════════════════════════════════
// REGISTRY — per-mode semantic definitions (mirrors backend)
// ══════════════════════════════════════════════

export const COMPLETION_MODE_SEMANTICS: Record<CompletionMode, QuestSemantics> = {
  auto_event: {
    completionMode: 'auto_event',
    validation: { requiresJournalText: false, requiresAutoEvent: true, minSentences: 0, maxTextLength: 0 },
    reward: { style: 'overlay', showGrowthStats: true, showPoints: true, showMilestone: true },
    badgeType: 'none',
  },
  requires_input: {
    completionMode: 'requires_input',
    validation: { requiresJournalText: true, requiresAutoEvent: false, minSentences: 3, maxTextLength: 2000 },
    reward: { style: 'overlay', showGrowthStats: true, showPoints: true, showMilestone: true },
    badgeType: 'soul',
  },
  manual_confirm: {
    completionMode: 'manual_confirm',
    validation: { requiresJournalText: false, requiresAutoEvent: false, minSentences: 0, maxTextLength: 0 },
    reward: { style: 'overlay', showGrowthStats: true, showPoints: true, showMilestone: true },
    badgeType: 'none',
  },
  instant: {
    completionMode: 'instant',
    validation: { requiresJournalText: false, requiresAutoEvent: false, minSentences: 0, maxTextLength: 0 },
    reward: { style: 'toast', showGrowthStats: false, showPoints: false, showMilestone: false },
    badgeType: 'none',
  },
};

// ══════════════════════════════════════════════
// RESOLVERS
// ══════════════════════════════════════════════

/**
 * Resolve completionMode for any quest-like object.
 * Frontend uses whatever the backend provides; falls back to manual_confirm.
 */
export function resolveCompletionMode(quest: { completionMode?: CompletionMode | string }): CompletionMode {
  if (quest.completionMode && quest.completionMode in COMPLETION_MODE_SEMANTICS) {
    return quest.completionMode as CompletionMode;
  }
  return 'manual_confirm';
}

/**
 * Get full semantics for a quest-like object.
 */
export function resolveQuestSemantics(quest: { completionMode?: CompletionMode | string }): QuestSemantics {
  const mode = resolveCompletionMode(quest);
  return COMPLETION_MODE_SEMANTICS[mode];
}

// ══════════════════════════════════════════════
// REWARD PERSONALITY — per-eventType UI text
// ══════════════════════════════════════════════

export interface RewardPersonality {
  icon: string;
  heading: string;
  subtitle: string;
  encouragement: string;
}

const REWARD_PERSONALITIES: Record<string, RewardPersonality> = {
  journal_entry: {
    icon: '📝',
    heading: 'Tâm hồn được lắng nghe',
    subtitle: 'Bạn đã dũng cảm ghi lại cảm xúc của mình',
    encouragement: 'Mỗi dòng nhật ký là một bước tiến trong hành trình tự nhận thức 🌿',
  },
  help_others: {
    icon: '🤝',
    heading: 'Trái tim nhân ái',
    subtitle: 'Bạn đã lan tỏa sự tốt đẹp đến người khác',
    encouragement: 'Lòng tốt của bạn tạo nên những vòng sóng tích cực 💜',
  },
  emotion_regulation: {
    icon: '🌊',
    heading: 'Nội tâm bình yên',
    subtitle: 'Bạn đã điều tiết cảm xúc thành công',
    encouragement: 'Cảm xúc là sóng biển — bạn đang học cách lướt trên chúng 🏄',
  },
  gratitude: {
    icon: '🙏',
    heading: 'Lòng biết ơn tỏa sáng',
    subtitle: 'Bạn nhìn thấy điều tốt đẹp trong cuộc sống',
    encouragement: 'Biết ơn là ánh nắng chiếu sáng ngày mới ☀️',
  },
  reflection: {
    icon: '🪞',
    heading: 'Nhìn sâu bên trong',
    subtitle: 'Bạn đã dành thời gian suy ngẫm về bản thân',
    encouragement: 'Người hiểu mình là người mạnh mẽ nhất 🌟',
  },
};

const DEFAULT_PERSONALITY: RewardPersonality = {
  icon: '✅',
  heading: 'Nhiệm vụ hoàn thành',
  subtitle: 'Bạn đã tiến thêm một bước',
  encouragement: 'Mỗi bước nhỏ đều có ý nghĩa trên hành trình của bạn ✨',
};

/**
 * Get reward display personality for the given eventType.
 */
export function getRewardPersonality(eventType?: string): RewardPersonality {
  if (eventType && eventType in REWARD_PERSONALITIES) {
    return REWARD_PERSONALITIES[eventType];
  }
  return DEFAULT_PERSONALITY;
}
