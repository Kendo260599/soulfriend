// ============================================
// SoulFriend GameFi — Quest Engine
// ============================================

import { Character, Quest, QuestCategory } from '../core/types';
import { gainXP, updateGrowthStats } from '../core/character';
import { logAction } from '../engine/dataLogger';
import { ALL_QUESTS } from '../world/questData';

// ── In-memory quest store ────────────────────

const questStore: Map<string, Quest> = new Map();

/** Load all 200 quests into the in-memory store */
export function initQuests(): void {
  for (const q of ALL_QUESTS) {
    questStore.set(q.id, q);
  }
}

/** Get all available quests */
export function getAllQuests(): Quest[] {
  return Array.from(questStore.values());
}

/** Get a single quest by id */
export function getQuest(questId: string): Quest | undefined {
  return questStore.get(questId);
}

/** Get quests by type (reflection, narrative, community, growth) */
export function getQuestsByType(loai: Quest['loai']): Quest[] {
  return getAllQuests().filter((q) => q.loai === loai);
}

/** Get quests available at a specific location */
export function getQuestsByLocation(locationId: Quest['location']): Quest[] {
  return getAllQuests().filter((q) => q.location === locationId);
}

/** Get quests by category (10 psychological categories) */
export function getQuestsByCategory(category: QuestCategory): Quest[] {
  return getAllQuests().filter((q) => q.category === category);
}

/** Register a custom quest */
export function registerQuest(quest: Quest): void {
  questStore.set(quest.id, quest);
}

/**
 * Complete a quest — awards XP, updates growth stats, logs data.
 * Returns the updated character.
 */
export function completeQuest(character: Character, quest: Quest): Character {
  // Apply growth stats for the action type
  updateGrowthStats(character, quest.actionType);

  // Award XP (also recalculates level)
  gainXP(character, quest.xpReward);

  // Track completed quest
  if (!character.completedQuestIds.includes(quest.id)) {
    character.completedQuestIds.push(quest.id);
  }

  // Log action for data system
  logAction(character.id, quest.actionType, quest.growthImpact, quest.id);

  return character;
}
