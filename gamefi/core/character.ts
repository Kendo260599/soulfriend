// ============================================
// SoulFriend GameFi — Character System
// ============================================

import {
  Character,
  ArchetypeId,
  GrowthStats,
  ActionType,
  LevelInfo,
} from './types';
import { ARCHETYPES } from './archetypes';

// ── Constants ────────────────────────────────

const LEVEL_TABLE: LevelInfo[] = [
  { level: 1, title: 'Người Quan Sát',  xpRequired: 0 },
  { level: 2, title: 'Người Tìm Hiểu', xpRequired: 100 },
  { level: 3, title: 'Người Thấu Hiểu', xpRequired: 300 },
  { level: 4, title: 'Người Kết Nối',   xpRequired: 600 },
  { level: 5, title: 'Người Dẫn Đường',  xpRequired: 1000 },
];

/** How much each action type adds to each growth stat (base values)
 *  Based on Growth Impact Table:
 *  Action             Emotion Safety Meaning Cognition Relationship
 *  Viết nhật ký         +3     +1     +1      +2        0
 *  Chia sẻ câu chuyện   +2     +2     +1      +1        +1
 *  Giúp người khác      +1     +1     +2       0        +3
 *  Viết gratitude       +1     +2     +2       0        +1
 *  Reframing            +1     +1     +1      +3         0
 *  Community support    +1     +1     +1       0        +3
 */
const GROWTH_DELTAS: Record<ActionType, Partial<GrowthStats>> = {
  journal_entry:       { emotionalAwareness: 3, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 2 },
  emotion_regulation:  { emotionalAwareness: 2, psychologicalSafety: 2, meaning: 1, cognitiveFlexibility: 1, relationshipQuality: 1 },
  reflection:          { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 3 },
  help_others:         { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, relationshipQuality: 3 },
  gratitude:           { emotionalAwareness: 1, psychologicalSafety: 2, meaning: 2, relationshipQuality: 1 },
};

/** Giới hạn tối đa cho mỗi growth stat — tránh tăng vô hạn */
const MAX_STAT_VALUE = 100;

/** Giới hạn ký tự tên nhân vật */
const MAX_NAME_LENGTH = 50;

let idCounter = 0;

// ── Functions ────────────────────────────────

/** Generate a simple unique id (anonymized, no personal info) */
function generateId(): string {
  idCounter += 1;
  return `char_${Date.now()}_${idCounter}`;
}

function baseGrowthStats(): GrowthStats {
  return {
    emotionalAwareness: 0,
    psychologicalSafety: 0,
    meaning: 0,
    cognitiveFlexibility: 0,
    relationshipQuality: 0,
  };
}

/** Get max growth stat value */
export function getMaxStatValue(): number {
  return MAX_STAT_VALUE;
}

/** Create a new character with archetype-specific starting stats */
export function createCharacter(name: string, archetype: ArchetypeId): Character {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`Tên nhân vật phải từ 1-${MAX_NAME_LENGTH} ký tự`);
  }

  const stats = baseGrowthStats();
  const archetypeInfo = ARCHETYPES[archetype];
  const bonus = archetypeInfo?.startingStats ?? {};

  for (const key of Object.keys(bonus) as (keyof GrowthStats)[]) {
    stats[key] += bonus[key] ?? 0;
  }

  const character: Character = {
    id: generateId(),
    name: trimmed,
    archetype,
    level: 1,
    xp: 0,
    growthScore: 0,
    growthStats: stats,
    soulPoints: 0,
    empathyScore: 0,
    empathyRank: 'Người Lắng Nghe',
    badges: [],
    currentLocation: 'thung_lung_cau_hoi',
    completedQuestIds: [],
  };

  character.growthScore = calculateGrowthScore(character);
  return character;
}

/** Add XP to a character and recalculate level */
export function gainXP(character: Character, amount: number): Character {
  if (amount <= 0) return character;
  character.xp += amount;
  return calculateLevel(character);
}

/** Recalculate level based on current XP */
export function calculateLevel(character: Character): Character {
  let newLevel = 1;
  for (const entry of LEVEL_TABLE) {
    if (character.xp >= entry.xpRequired) {
      newLevel = entry.level;
    }
  }
  character.level = newLevel;
  return character;
}

/** Get the Vietnamese title for the current level */
export function getLevelTitle(character: Character): string {
  const entry = LEVEL_TABLE.find((l) => l.level === character.level);
  return entry?.title ?? 'Người Quan Sát';
}

/** Update growth stats based on an action type (with archetype bonus) */
export function updateGrowthStats(
  character: Character,
  actionType: ActionType,
): Character {
  const baseDelta = GROWTH_DELTAS[actionType];
  if (!baseDelta) return character;

  const archetypeInfo = ARCHETYPES[character.archetype];
  const bonus = archetypeInfo?.growthBonus ?? {};

  for (const key of Object.keys(baseDelta) as (keyof GrowthStats)[]) {
    let value = baseDelta[key] ?? 0;
    // Apply archetype growth bonus (e.g., +10% → multiply by 1.1)
    const pct = bonus[key];
    if (pct) {
      value = Math.round(value * (1 + pct / 100));
    }
    character.growthStats[key] = Math.min(MAX_STAT_VALUE, character.growthStats[key] + value);
  }

  character.growthScore = calculateGrowthScore(character);
  return character;
}

/** Calculate the Psychological Growth Score */
export function calculateGrowthScore(character: Character): number {
  const s = character.growthStats;
  const sum =
    s.emotionalAwareness +
    s.psychologicalSafety +
    s.meaning +
    s.cognitiveFlexibility +
    s.relationshipQuality;
  return Math.round(sum / 5);
}

/** Return the full level table (for UI display) */
export function getLevelTable(): readonly LevelInfo[] {
  return LEVEL_TABLE;
}
