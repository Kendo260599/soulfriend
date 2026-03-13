/**
 * Quest Semantic Registry — Single source of truth for ALL quest completion semantics.
 *
 * Every quest resolution (completionMode, validation rule, reward style,
 * minimum input requirement, badge type) is derived from this registry.
 * No other file should hardcode these values.
 */

import type { CompletionMode } from './types';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

export interface QuestValidationRule {
  requiresJournalText: boolean;
  requiresAutoEvent: boolean;
  minSentences: number;     // 0 = no text required
  maxTextLength: number;    // 0 = unlimited
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
// REGISTRY — per-mode semantic definitions
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
// ACTION TYPE → COMPLETION MODE mapping
// ══════════════════════════════════════════════

const ACTION_TYPE_MODE_MAP: Record<string, CompletionMode> = {
  journal_entry: 'requires_input',
  story_shared: 'requires_input',
};

// ══════════════════════════════════════════════
// RESOLVERS
// ══════════════════════════════════════════════

/**
 * Resolve completionMode for any quest-like object.
 * Priority: explicit completionMode → actionType mapping → default manual_confirm
 */
export function resolveCompletionMode(quest: { completionMode?: CompletionMode | string; actionType?: string }): CompletionMode {
  if (quest.completionMode && quest.completionMode in COMPLETION_MODE_SEMANTICS) {
    return quest.completionMode as CompletionMode;
  }
  if (quest.actionType && quest.actionType in ACTION_TYPE_MODE_MAP) {
    return ACTION_TYPE_MODE_MAP[quest.actionType];
  }
  return 'manual_confirm';
}

/**
 * Get full semantics for a quest-like object.
 */
export function resolveQuestSemantics(quest: { completionMode?: CompletionMode | string; actionType?: string }): QuestSemantics {
  const mode = resolveCompletionMode(quest);
  return COMPLETION_MODE_SEMANTICS[mode];
}

// ══════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════

export interface QuestCompleteOpts {
  journalText?: string;
  autoEvent?: boolean;
}

/**
 * Centralized validation for quest completion.
 * Replaces the old validateCompletionMode() function.
 */
export function validateQuestCompletion(
  semantics: QuestSemantics,
  opts: QuestCompleteOpts,
): { ok: true } | { ok: false; error: string } {
  const { validation } = semantics;

  if (validation.requiresAutoEvent && !opts.autoEvent) {
    return { ok: false, error: 'Quest này hoàn thành tự động — không thể hoàn thành trực tiếp' };
  }

  if (validation.requiresJournalText && !opts.journalText) {
    return { ok: false, error: 'Quest này cần nội dung nhập liệu để hoàn thành' };
  }

  if (validation.minSentences > 0 && opts.journalText) {
    const sentences = opts.journalText.split(/[.!?…。]+\s*|\n+/u).filter(s => s.trim().length > 0);
    if (sentences.length < validation.minSentences) {
      return { ok: false, error: `Cần ít nhất ${validation.minSentences} câu` };
    }
  }

  if (validation.maxTextLength > 0 && opts.journalText && opts.journalText.length > validation.maxTextLength) {
    return { ok: false, error: `Nội dung không được vượt quá ${validation.maxTextLength} ký tự` };
  }

  return { ok: true };
}
