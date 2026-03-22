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
// Max 100k chars ≈ ~100MB; production should persist to DB via backend API.
// Using LRU eviction: keep recently active users, evict the least recently used.
// ══════════════════════════════════════════════

const characterMap: Map<string, Character> = new Map(); // key: userId, value: Character
const characterLastSeen: Map<string, number> = new Map(); // key: userId, value: timestamp
let evictionCount = 0;
const MAX_CHARACTERS = 100000;

/** Touch — update last-seen timestamp (called on every character access) */
function touch(userId: string): void {
  characterLastSeen.set(userId, Date.now());
}

/** Evict the least-recently-used character to make room. */
function evictLRU(): string | null {
  if (characterMap.size === 0) return null;
  let oldestId: string | null = null;
  let oldestTs = Infinity;
  for (const [id, ts] of characterLastSeen) {
    if (ts < oldestTs) { oldestTs = ts; oldestId = id; }
  }
  if (oldestId !== null) {
    characterMap.delete(oldestId);
    characterLastSeen.delete(oldestId);
    evictionCount++;
    console.warn(`[GameFi] LRU eviction #${evictionCount}: character "${oldestId}" removed (map size: ${characterMap.size})`);
    return oldestId;
  }
  return null;
}

/** Get or create character for a userId */
export function getOrCreateCharacter(userId: string): Character {
  let char = characterMap.get(userId);
  if (!char) {
    if (characterMap.size >= MAX_CHARACTERS) {
      evictLRU();
    }
    char = createCharacter(userId, 'Người Khám Phá');
    characterMap.set(userId, char);
  }
  touch(userId);
  return char;
}

/** Get character by userId (no auto-create). Updates LRU order. */
export function getCharacter(userId: string): Character | undefined {
  const char = characterMap.get(userId);
  if (char) touch(userId);
  return char;
}

/** Load a character into the in-memory map (for persistence restore) */
export function setCharacter(userId: string, char: Character): void {
  if (characterMap.size >= MAX_CHARACTERS && !characterMap.has(userId)) {
    evictLRU();
  }
  characterMap.set(userId, char);
  touch(userId);
}

/** Get all characters currently in memory (for persistence save) */
export function getAllCharacters(): Map<string, Character> {
  return characterMap;
}

/** Get eviction statistics */
export function getEvictionStats(): { currentSize: number; maxSize: number; evictionCount: number } {
  return { currentSize: characterMap.size, maxSize: MAX_CHARACTERS, evictionCount };
}

/** Reset event handler (testing) */
export function resetEventHandler(): void {
  characterMap.clear();
  characterLastSeen.clear();
  evictionCount = 0;
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
