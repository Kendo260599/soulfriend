// ============================================
// SoulFriend GameFi — MongoDB Persistence Layer
// ============================================
// Write-through cache: in-memory Maps = fast cache,
// MongoDB = persistent store. Lazy load per user.

import mongoose from 'mongoose';
import GameFiState from '../../models/GameFiState';
import GameFiLog from '../../models/GameFiLog';
import {
  getCharacter as getCoreCharacter,
  setCharacter,
} from '../../../../gamefi/core/eventHandler';
import type { Character, StreakInfo, ActionType, QuestState } from '../../../../gamefi/core/types';
import {
  restoreQuestStates, getAllQuestStates,
} from '../../../../gamefi/quests/questStateMachine';
import { getStreak, setStreak } from '../../../../gamefi/economy/economyEngine';
import { getLogsForCharacter, loadLogs } from '../../../../gamefi/engine/dataLogger';
import { logger } from '../../utils/logger';

// ══════════════════════════════════════════════
// LOADED USER TRACKING
// ══════════════════════════════════════════════

const loadedUsers = new Set<string>();

/** Per-user loading promises to prevent concurrent loads (race condition fix) */
const loadingPromises = new Map<string, Promise<void>>();

/** Callback to restore skill state into gamefiEngine's local store */
let _skillStateRestorer: ((userId: string, data: { unlockedSkills: string[]; unlockedSynergies: string[]; masteredBranches: string[] }) => void) | null = null;

/** Callback to restore createdAt timestamp */
let _createdAtRestorer: ((userId: string, createdAt: string) => void) | null = null;

export function registerSkillStateRestorer(
  fn: (userId: string, data: { unlockedSkills: string[]; unlockedSynergies: string[]; masteredBranches: string[] }) => void,
): void {
  _skillStateRestorer = fn;
}

export function registerCreatedAtRestorer(
  fn: (userId: string, createdAt: string) => void,
): void {
  _createdAtRestorer = fn;
}

/** Check if MongoDB is connected */
function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// ══════════════════════════════════════════════
// LOAD — Hydrate in-memory Maps from MongoDB
// ══════════════════════════════════════════════

/**
 * Ensure a user's GameFi data is loaded from MongoDB into memory.
 * No-op if already loaded or DB not connected.
 * Uses per-user Promise locking to prevent concurrent loads.
 */
export async function ensureUserLoaded(userId: string): Promise<void> {
  if (loadedUsers.has(userId) || !isDbConnected()) return;

  // If another call is already loading this user, wait for it
  const existing = loadingPromises.get(userId);
  if (existing) {
    await existing;
    return;
  }

  const loadPromise = _loadUserFromDb(userId);
  loadingPromises.set(userId, loadPromise);

  try {
    await loadPromise;
  } finally {
    loadingPromises.delete(userId);
  }
}

/** Internal: actual DB load logic (called once per user via lock) */
async function _loadUserFromDb(userId: string): Promise<void> {
  try {
    const doc = await GameFiState.findOne({ userId }).lean();
    if (doc) {
      // Reconstruct Character object
      const char: Character = {
        id: doc.characterId,
        name: userId,
        archetype: doc.archetype as Character['archetype'],
        level: doc.level,
        xp: doc.xp,
        growthScore: doc.growthScore,
        growthStats: {
          emotionalAwareness: doc.growthStats?.emotionalAwareness ?? 0,
          psychologicalSafety: doc.growthStats?.psychologicalSafety ?? 0,
          meaning: doc.growthStats?.meaning ?? 0,
          cognitiveFlexibility: doc.growthStats?.cognitiveFlexibility ?? 0,
          relationshipQuality: doc.growthStats?.relationshipQuality ?? 0,
        },
        soulPoints: doc.soulPoints,
        empathyScore: doc.empathyScore,
        empathyRank: doc.empathyRank as Character['empathyRank'],
        badges: doc.badges || [],
        currentLocation: doc.currentLocation as Character['currentLocation'],
        completedQuestIds: doc.completedQuestIds || [],
      };
      setCharacter(userId, char);

      // Restore skill state
      if (_skillStateRestorer && (doc.unlockedSkills?.length || doc.unlockedSynergies?.length || doc.masteredBranches?.length)) {
        _skillStateRestorer(userId, {
          unlockedSkills: doc.unlockedSkills || [],
          unlockedSynergies: doc.unlockedSynergies || [],
          masteredBranches: doc.masteredBranches || [],
        });
      }

      // Restore createdAt metadata
      if (doc.gameCreatedAt) {
        _createdAtRestorer?.(userId, doc.gameCreatedAt);
      }

      // Restore streaks
      if (doc.streaks) {
        for (const s of doc.streaks) {
          const info: StreakInfo = {
            characterId: doc.characterId,
            type: s.type as StreakInfo['type'],
            currentStreak: s.currentStreak,
            longestStreak: s.longestStreak,
            lastActivityDate: s.lastActivityDate,
          };
          setStreak(doc.characterId, s.type as StreakInfo['type'], info);
        }
      }

      // Restore quest states from DB (or derive from completedQuestIds)
      if (doc.questStates && Object.keys(doc.questStates).length > 0) {
        restoreQuestStates(userId, doc.questStates as Record<string, QuestState>);
      } else if (doc.completedQuestIds?.length) {
        // Back-compat: existing completed quests get 'rewarded' state
        const legacy: Record<string, QuestState> = {};
        for (const qid of doc.completedQuestIds) legacy[qid] = 'rewarded';
        restoreQuestStates(userId, legacy);
      }

      // Restore action logs for this character
      const logDocs = await GameFiLog.find({ characterId: doc.characterId })
        .sort({ timestamp: 1 })
        .lean();
      if (logDocs.length > 0) {
        const existingLogs = getLogsForCharacter(doc.characterId);
        if (existingLogs.length === 0) {
          // Only load if not already in memory
          const actionLogs = logDocs.map(l => ({
            id: l.logId,
            characterId: l.characterId,
            actionType: l.actionType as ActionType,
            growthChange: l.growthChange || {},
            questId: l.questId,
            emotion: l.emotion,
            timestamp: l.timestamp,
          }));
          loadLogs(actionLogs);
        }
      }
    }
  } catch (err) {
    logger.error(`GameFi persistence: failed to load user ${userId}:`, err);
  }

  loadedUsers.add(userId);
}

// ══════════════════════════════════════════════
// SAVE — Persist current state to MongoDB
// ══════════════════════════════════════════════

/** Callback to get skill state for saving */
let _skillStateGetter: ((userId: string) => { unlockedSkills: string[]; unlockedSynergies: string[]; masteredBranches: string[] } | null) | null = null;

/** Callback to get createdAt for saving */
let _createdAtGetter: ((userId: string) => string | undefined) | null = null;

export function registerSkillStateGetter(
  fn: (userId: string) => { unlockedSkills: string[]; unlockedSynergies: string[]; masteredBranches: string[] } | null,
): void {
  _skillStateGetter = fn;
}

export function registerCreatedAtGetter(
  fn: (userId: string) => string | undefined,
): void {
  _createdAtGetter = fn;
}

/**
 * Save a user's complete GameFi state to MongoDB.
 * Called after mutation operations.
 */
export async function saveUserState(userId: string): Promise<void> {
  if (!isDbConnected()) return;

  try {
    const char = getCoreCharacter(userId);
    if (!char) return;

    // Gather streak data for this character
    const streakTypes: Array<StreakInfo['type']> = ['daily_ritual', 'reflection', 'community'];
    const streaks = streakTypes.map(type => {
      const s = getStreak(char.id, type);
      return {
        type: s.type,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastActivityDate: s.lastActivityDate,
      };
    }).filter(s => s.currentStreak > 0 || s.lastActivityDate);

    // Gather skill state and createdAt from gamefiEngine
    const skillState = _skillStateGetter?.(userId);
    const gameCreatedAt = _createdAtGetter?.(userId);

    const updateData: Record<string, unknown> = {
      characterId: char.id,
      archetype: char.archetype,
      level: char.level,
      xp: char.xp,
      growthScore: char.growthScore,
      growthStats: { ...char.growthStats },
      soulPoints: char.soulPoints,
      empathyScore: char.empathyScore,
      empathyRank: char.empathyRank,
      badges: char.badges,
      currentLocation: char.currentLocation,
      completedQuestIds: char.completedQuestIds,
      questStates: getAllQuestStates(userId),
      streaks,
    };

    if (skillState) {
      updateData.unlockedSkills = skillState.unlockedSkills;
      updateData.unlockedSynergies = skillState.unlockedSynergies;
      updateData.masteredBranches = skillState.masteredBranches;
    }
    if (gameCreatedAt) {
      updateData.gameCreatedAt = gameCreatedAt;
    }

    await GameFiState.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.error(`GameFi persistence: failed to save user ${userId}:`, err);
  }
}

/**
 * Save a single action log to MongoDB.
 * Called after events that generate logs.
 */
export async function saveActionLog(
  characterId: string,
  logId: string,
  actionType: string,
  growthChange: Record<string, number>,
  timestamp: number,
  questId?: string,
  emotion?: string,
): Promise<void> {
  if (!isDbConnected()) return;

  try {
    await GameFiLog.findOneAndUpdate(
      { logId },
      {
        $set: {
          characterId,
          actionType,
          growthChange,
          questId,
          emotion,
          timestamp,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    logger.error(`GameFi persistence: failed to save log ${logId}:`, err);
  }
}

/**
 * Save skill state for a user (stored inside the GameFiState document).
 */
export async function saveSkillState(
  userId: string,
  skillState: { unlockedSkills: string[]; unlockedSynergies: string[]; masteredBranches: string[] },
): Promise<void> {
  if (!isDbConnected()) return;

  try {
    await GameFiState.findOneAndUpdate(
      { userId },
      {
        $set: {
          unlockedSkills: skillState.unlockedSkills,
          unlockedSynergies: skillState.unlockedSynergies,
          masteredBranches: skillState.masteredBranches,
        },
      }
    );
  } catch (err) {
    logger.error(`GameFi persistence: failed to save skill state for ${userId}:`, err);
  }
}

// ══════════════════════════════════════════════
// RESET (testing)
// ══════════════════════════════════════════════

export function resetLoadedUsers(): void {
  loadedUsers.clear();
  loadingPromises.clear();
}
