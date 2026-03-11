// ============================================
// SoulFriend GameFi — Event Handler
// ============================================
// Xử lý psychological events từ chatbot.
// Mỗi event → XP + growth stats + level check + milestone.

import {
  Character,
  GrowthStats,
  ActionType,
  NarrativeInputType,
} from './types';

import {
  createCharacter,
  gainXP,
  updateGrowthStats,
  calculateGrowthScore,
  getLevelTitle,
} from './character';

import { calculateReward } from '../economy/economyEngine';
import { logAction } from '../engine/dataLogger';
import {
  submitNarrativeInput,
  analyzeNarrative,
  suggestQuest,
  detectPatterns,
} from '../narrative/narrativeEngine';
import {
  takeSnapshot,
  checkSafety,
  recordSignal,
} from '../engine/stateEngine';
import { detectEmotions } from '../narrative/emotionEmbedding';
import { recordMeaningShift } from '../engine/behaviorLoop';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

/** Các loại event tâm lý mà chatbot gửi */
export type PsychEventType =
  | 'journal_entry'
  | 'story_shared'
  | 'emotion_checkin'
  | 'user_helped_user'
  | 'quest_completed';

/** Event từ chatbot → GameFi */
export interface PsychEvent {
  userId: string;
  eventType: PsychEventType;
  content: string;
  metadata?: Record<string, unknown>;
  /** Override economy reward instead of using INSTANT_REWARDS table */
  rewardOverride?: { xp?: number; soulPoints?: number; empathyPoints?: number };
}

/** Kết quả trả về cho chatbot */
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
}

// ══════════════════════════════════════════════
// MAPPING — event → GameFi action
// ══════════════════════════════════════════════

/** Map PsychEventType → ActionType trong GameFi */
const EVENT_TO_ACTION: Record<PsychEventType, ActionType> = {
  journal_entry:     'journal_entry',
  story_shared:      'emotion_regulation',
  emotion_checkin:   'reflection',
  user_helped_user:  'help_others',
  quest_completed:   'gratitude',
};

/** Map PsychEventType → economy reward key */
const EVENT_TO_REWARD_KEY: Record<PsychEventType, string> = {
  journal_entry:     'reflection',
  story_shared:      'quest_complete',
  emotion_checkin:   'reflection',
  user_helped_user:  'help_others',
  quest_completed:   'quest_complete',
};

/** Map PsychEventType → narrative input type */
const EVENT_TO_NARRATIVE: Record<PsychEventType, NarrativeInputType> = {
  journal_entry:     'journal',
  story_shared:      'story',
  emotion_checkin:   'checkin',
  user_helped_user:  'community_reply',
  quest_completed:   'quest_answer',
};

// ══════════════════════════════════════════════
// IN-MEMORY CHARACTER STORE (bridge-level)
// ══════════════════════════════════════════════

const characterMap: Map<string, Character> = new Map();
const MAX_CHARACTERS = 10000;

/** Get or create character for a userId */
export function getOrCreateCharacter(userId: string): Character {
  let char = characterMap.get(userId);
  if (!char) {
    char = createCharacter(userId, 'Người Khám Phá');
    characterMap.set(userId, char);
    if (characterMap.size > MAX_CHARACTERS) {
      // Evict oldest entry
      const firstKey = characterMap.keys().next().value;
      if (firstKey !== undefined) characterMap.delete(firstKey);
    }
  }
  return char;
}

/** Get character by userId (no auto-create) */
export function getCharacter(userId: string): Character | undefined {
  return characterMap.get(userId);
}

/** Load a character into the in-memory map (for persistence restore) */
export function setCharacter(userId: string, char: Character): void {
  characterMap.set(userId, char);
}

/** Get all characters currently in memory (for persistence save) */
export function getAllCharacters(): Map<string, Character> {
  return characterMap;
}

/** Reset event handler (testing) */
export function resetEventHandler(): void {
  characterMap.clear();
}

// ══════════════════════════════════════════════
// CORE — Process Psychological Event
// ══════════════════════════════════════════════

/**
 * Xử lý một psychological event từ chatbot.
 *
 * Flow:
 *  1. Map event → GameFi action type
 *  2. Update growth stats
 *  3. Calculate economy reward (XP, SP, EP)
 *  4. Apply XP → check level up
 *  5. Narrative analysis → suggest quest
 *  6. Detect emotion → check safety
 *  7. Log action for dataset
 *  8. Return structured result
 */
export function processEvent(event: PsychEvent): EventResult {
  const { userId, eventType, content } = event;

  // 1. Get or create character
  const character = getOrCreateCharacter(userId);
  const oldLevel = character.level;

  // 2. Map event → action and update growth stats
  const actionType = EVENT_TO_ACTION[eventType];
  const statsBefore = { ...character.growthStats };
  updateGrowthStats(character, actionType);
  const statsAfter = character.growthStats;

  // Calculate growth impact delta
  const growthImpact: Partial<GrowthStats> = {};
  for (const key of Object.keys(statsBefore) as (keyof GrowthStats)[]) {
    const delta = statsAfter[key] - statsBefore[key];
    if (delta > 0) growthImpact[key] = delta;
  }

  // 3. Calculate economy reward (rewardOverride takes priority over table)
  const rewardKey = EVENT_TO_REWARD_KEY[eventType];
  const rewardResult = calculateReward(character.id, rewardKey, undefined, undefined, event.rewardOverride);
  const xpGained = rewardResult.cappedXp;

  // 4. Apply XP and check level
  gainXP(character, xpGained);
  const leveledUp = character.level > oldLevel;

  // 5. Narrative analysis → quest suggestion
  let unlockedQuest: string | null = null;
  if (content && content.length > 0 && content.length <= 5000) {
    const narrativeType = EVENT_TO_NARRATIVE[eventType];
    const input = submitNarrativeInput(character.id, narrativeType, content);
    const analysis = analyzeNarrative(input);
    const questSuggestion = suggestQuest(analysis);
    unlockedQuest = questSuggestion.title;

    // Detect patterns for deeper insight
    detectPatterns(character.id);
  }

  // 6. Emotion detection + safety check
  let safetyAlert = false;
  if (content && content.length > 0 && content.length <= 5000) {
    const emotions = detectEmotions(character.id, `evt_${Date.now()}`, content);

    // Record emotional signals for crisis detection
    const negativeEmotions = ['sadness', 'anxiety', 'anger', 'loneliness', 'confusion'];
    if (negativeEmotions.includes(emotions.dominant)) {
      const intensity = Math.round(emotions.scores[emotions.dominant] * 100);
      recordSignal(character.id, emotions.dominant as any, intensity);
    }

    // Safety check
    const alerts = checkSafety(character);
    safetyAlert = alerts.some(a => a.severity === 'high');
  }

  // 7. Take state snapshot
  takeSnapshot(character);

  // 8. Determine milestone
  let milestone: string | null = null;
  if (leveledUp) {
    milestone = `Lên cấp ${character.level}: ${getLevelTitle(character)}`;
  } else if (character.growthScore >= 50 && calculateGrowthScore(character) >= 50) {
    // Check for growth milestone at score 50
    const totalGrowth = Object.values(statsAfter).reduce((a, b) => a + b, 0);
    if (totalGrowth >= 250) {
      milestone = 'Bạn đã đạt Mốc Trưởng Thành Tâm Lý';
    }
  }

  // 9. Log for research dataset
  logAction(character.id, actionType, growthImpact, undefined, content?.substring(0, 50));

  return {
    xpGained,
    growthImpact,
    newLevel: character.level,
    levelTitle: getLevelTitle(character),
    unlockedQuest,
    milestone,
    safetyAlert,
    rewards: {
      soulPoints: rewardResult.totalSoulPoints,
      empathyPoints: rewardResult.totalEmpathyPoints,
    },
  };
}

/** Get supported event types */
export function getSupportedEvents(): PsychEventType[] {
  return ['journal_entry', 'story_shared', 'emotion_checkin', 'user_helped_user', 'quest_completed'];
}
