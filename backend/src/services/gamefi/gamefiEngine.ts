// ============================================
// SoulFriend GameFi — Backend Engine Wrapper
// ============================================
// Full adapter around the ORIGINAL 22-system GameFi engine.
// MongoDB persistence: lazy load + write-through cache.

import {
  processEvent as originalProcessEvent,
  getOrCreateCharacter as originalGetOrCreate,
  getCharacter as originalGetCharacter,
  getSupportedEvents as originalGetSupportedEvents,
  resetEventHandler,
} from '../../../../gamefi/core/eventHandler';
import type {
  PsychEvent,
  PsychEventType,
  EventResult as OriginalEventResult,
} from '../../../../gamefi/core/eventHandler';
import type { Character as OriginalCharacter } from '../../../../gamefi/core/types';
import { getLevelTitle, getLevelTable } from '../../../../gamefi/core/character';
import { getStreak, recordStreakActivity, resetEconomy } from '../../../../gamefi/economy/economyEngine';
import {
  ensureUserLoaded, saveUserState, saveSkillState, saveActionLog, resetLoadedUsers,
  registerSkillStateRestorer, registerCreatedAtRestorer,
  registerSkillStateGetter, registerCreatedAtGetter,
} from './persistence';
import { generateFeedback as origGenerateFeedback } from '../../../../integration/gamefiFeedback';
import {
  initSkillTree, getAllSkills, getAllSynergies, getAllBranchMasteries,
  canUnlockSkill, unlockAvailableSkills, createSkillState,
} from '../../../../gamefi/skills/skillTree';
import type { UnlockContext } from '../../../../gamefi/skills/skillTree';
import type { CharacterSkillState, SkillBranchId } from '../../../../gamefi/core/types';
import {
  initWorldMap, getAllLocations, canAccessLocation, travelTo,
} from '../../../../gamefi/world/worldMap';
import {
  initQuests as initQuestDB, getAllQuests as getAllQuestsDB,
  getQuestsByCategory as getQuestsByCategoryDB,
  completeQuest as completeQuestDB,
} from '../../../../gamefi/quests/questEngine';
import {
  getPlayerPhase, buildPlayerProfile, recommendQuests,
  getQuestChain, assessDifficulty, getAvailableChainThemes,
  classifyUserType,
} from '../../../../gamefi/engine/adaptiveQuestAI';
import {
  getStateZone, getTrajectory, calcGrowthScore,
} from '../../../../gamefi/engine/stateEngine';
import {
  getDailyRitual, completeDailyStep, initWeeklyChallenges,
  getAllWeeklyChallenges, completeWeeklyChallenge,
  initSeasonalGoals, getAllSeasonalGoals, updateSeasonalProgress,
  getMeaningShifts,
} from '../../../../gamefi/engine/behaviorLoop';
import { calculateEmpathyRank } from '../../../../gamefi/engine/empathy';
import { getLogsForCharacter, getLogCount } from '../../../../gamefi/engine/dataLogger';
import {
  initLore, getAllPhilosophies, getAllLegends, getAllLocationLores,
  getWorldName, getPlayerRole, getCommunityName, getLoreForEvent,
} from '../../../../gamefi/lore/loreEngine';
import type {
  Character, DailyQuest, Badge, GameProfile,
  SkillTreeData, SkillInfo, SynergyInfo, BranchMasteryInfo,
  WorldMapData, LocationInfo,
  QuestDatabaseData, QuestInfo,
  AdaptiveQuestData, RecommendedQuest, QuestChainInfo,
  StateData, BehaviorData, LoreData, FullGameData,
  PlayerDashboardData,
  DashboardSkillBranch, DashboardNarrativeEvent, DashboardMilestone,
} from './types';

// ══════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════

let _initialized = false;
function ensureInit() {
  if (_initialized) return;
  initSkillTree();
  initWorldMap();
  initQuestDB();
  initWeeklyChallenges();
  initSeasonalGoals();
  initLore();

  // Register persistence restorers
  registerSkillStateRestorer((userId, data) => {
    skillStateStore.set(userId, {
      unlockedSkills: data.unlockedSkills,
      unlockedSynergies: data.unlockedSynergies,
      masteredBranches: data.masteredBranches as any[],
    });
  });
  registerCreatedAtRestorer((userId, createdAt) => {
    createdAtStore.set(userId, createdAt);
  });

  // Register persistence getters (for save)
  registerSkillStateGetter((userId) => {
    const state = skillStateStore.get(userId);
    return state || null;
  });
  registerCreatedAtGetter((userId) => {
    return createdAtStore.get(userId);
  });

  _initialized = true;
}

// ══════════════════════════════════════════════
// METADATA STORE (capped to prevent memory leaks)
// ══════════════════════════════════════════════

const MAX_METADATA_ENTRIES = 10000;
const createdAtStore: Map<string, string> = new Map();
const skillStateStore: Map<string, CharacterSkillState> = new Map();

/** FIFO eviction: remove oldest entries when map exceeds cap */
function evictIfNeeded<V>(map: Map<string, V>, max: number): void {
  if (map.size <= max) return;
  const excess = map.size - max;
  const iter = map.keys();
  for (let i = 0; i < excess; i++) {
    const key = iter.next().value;
    if (key !== undefined) map.delete(key);
  }
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSkillState(userId: string) {
  if (!skillStateStore.has(userId)) {
    evictIfNeeded(skillStateStore, MAX_METADATA_ENTRIES);
    skillStateStore.set(userId, createSkillState());
  }
  return skillStateStore.get(userId)!;
}

/** Convert original Character → frontend-friendly Character */
function toFrontendCharacter(char: OriginalCharacter): Character {
  const streakInfo = getStreak(char.id, 'daily_ritual');
  if (!createdAtStore.has(char.name)) {
    evictIfNeeded(createdAtStore, MAX_METADATA_ENTRIES);
    createdAtStore.set(char.name, new Date().toISOString());
  }
  return {
    id: char.id,
    userId: char.name,
    archetype: char.archetype,
    level: char.level,
    xp: char.xp,
    growthScore: char.growthScore,
    growthStats: { ...char.growthStats },
    soulPoints: char.soulPoints,
    empathyPoints: char.empathyScore,
    streak: streakInfo.currentStreak,
    lastActiveDate: streakInfo.lastActivityDate || todayStr(),
    completedQuestIds: [...char.completedQuestIds],
    badges: [...char.badges],
    createdAt: createdAtStore.get(char.name) || new Date().toISOString(),
  };
}

// ══════════════════════════════════════════════
// CHARACTER MANAGEMENT (delegate to original)
// ══════════════════════════════════════════════

export async function getOrCreateCharacter(userId: string): Promise<Character> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const result = toFrontendCharacter(char);
  await saveUserState(userId);
  return result;
}

export async function getCharacter(userId: string): Promise<Character | undefined> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetCharacter(userId);
  return char ? toFrontendCharacter(char) : undefined;
}

// ══════════════════════════════════════════════
// EVENT PROCESSING (original engine + enrich)
// ══════════════════════════════════════════════

export async function processEvent(event: PsychEvent): Promise<OriginalEventResult & { feedback: string }> {
  ensureInit();
  await ensureUserLoaded(event.userId);
  // Full 10-step pipeline from original engine:
  //  1. Map event → action with archetype bonus
  //  2. Update growth stats with archetype growth %
  //  3. Economy reward (streaks, daily caps, soul/empathy points)
  //  4. Apply XP → level up
  //  5. Narrative analysis → dynamic quest suggestion
  //  6. Emotion detection → safety check (crisis signals)
  //  7. State snapshot
  //  8. Milestone detection (level + growth milestones)
  //  9. Action logging for research dataset
  const logCountBefore = getLogCount();
  const result = originalProcessEvent(event);

  // Apply rewards to character (original returns but doesn't accumulate)
  const char = originalGetOrCreate(event.userId);
  char.soulPoints += result.rewards.soulPoints;
  char.empathyScore += result.rewards.empathyPoints;

  // Track daily streak
  recordStreakActivity(char.id, 'daily_ritual');

  // Generate friendly feedback message
  const feedback = origGenerateFeedback(result);

  // Persist state + action log
  await saveUserState(event.userId);

  // Persist the action log created by the pipeline
  const logCountAfter = getLogCount();
  if (logCountAfter > logCountBefore) {
    const charLogs = getLogsForCharacter(char.id);
    const latestLog = charLogs[charLogs.length - 1];
    if (latestLog) {
      await saveActionLog(
        latestLog.characterId,
        latestLog.id,
        latestLog.actionType,
        latestLog.growthChange as Record<string, number>,
        latestLog.timestamp,
        latestLog.questId,
        latestLog.emotion,
      );
    }
  }

  return { ...result, feedback };
}

// ══════════════════════════════════════════════
// DAILY QUESTS — pool of 15, pick 6 per day
// ══════════════════════════════════════════════

interface DailyQuestTemplate {
  key: string;      // stable prefix, e.g. "quest_dass"
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  eventType: string;
}

// Core quests (always included)
const CORE_DAILY_QUESTS: DailyQuestTemplate[] = [
  { key: 'quest_dass', title: 'Làm test DASS-21', description: 'Hoàn thành bài đánh giá DASS-21 để biết trạng thái tâm lý hôm nay', icon: '🧠', xpReward: 5, eventType: 'quest_completed' },
  { key: 'quest_chat', title: 'Trò chuyện với AI', description: 'Chat với AI ít nhất 3 tin nhắn về cảm xúc của bạn', icon: '💬', xpReward: 3, eventType: 'emotion_checkin' },
];

// Rotating pool (pick 4 from these each day)
const ROTATING_DAILY_QUESTS: DailyQuestTemplate[] = [
  { key: 'quest_journal', title: 'Ghi nhật ký cảm xúc', description: 'Viết 3 câu về cảm xúc và suy nghĩ của bạn hôm nay', icon: '📝', xpReward: 3, eventType: 'journal_entry' },
  { key: 'quest_breathing', title: 'Bài tập thở 5 phút', description: 'Thực hành hít thở sâu 5 phút để giảm stress', icon: '🧘', xpReward: 2, eventType: 'emotion_checkin' },
  { key: 'quest_research', title: 'Đọc nghiên cứu', description: 'Khám phá 1 bài nghiên cứu về sức khỏe tâm lý', icon: '📖', xpReward: 2, eventType: 'quest_completed' },
  { key: 'quest_share', title: 'Chia sẻ câu chuyện', description: 'Chia sẻ một trải nghiệm hoặc câu chuyện tích cực', icon: '💝', xpReward: 5, eventType: 'story_shared' },
  { key: 'quest_gratitude', title: 'Ba điều biết ơn', description: 'Viết ra 3 điều bạn biết ơn hôm nay', icon: '🙏', xpReward: 3, eventType: 'journal_entry' },
  { key: 'quest_music', title: 'Nghe nhạc thư giãn', description: 'Dành 10 phút nghe nhạc nhẹ nhàng và thư giãn', icon: '🎵', xpReward: 2, eventType: 'emotion_checkin' },
  { key: 'quest_walk', title: 'Đi bộ 10 phút', description: 'Đi dạo ngoài trời để thay đổi không khí', icon: '🚶', xpReward: 2, eventType: 'emotion_checkin' },
  { key: 'quest_friend', title: 'Gọi cho 1 người bạn', description: 'Kết nối với bạn bè hoặc người thân qua cuộc gọi', icon: '📞', xpReward: 3, eventType: 'story_shared' },
  { key: 'quest_selfcare', title: 'Chăm sóc bản thân', description: 'Làm 1 điều nhỏ để tự thưởng cho bản thân hôm nay', icon: '💆', xpReward: 2, eventType: 'emotion_checkin' },
  { key: 'quest_positive', title: 'Suy nghĩ tích cực', description: 'Viết lại 1 suy nghĩ tiêu cực thành tích cực', icon: '☀️', xpReward: 3, eventType: 'journal_entry' },
  { key: 'quest_water', title: 'Uống đủ nước', description: 'Uống ít nhất 8 ly nước trong ngày hôm nay', icon: '💧', xpReward: 2, eventType: 'emotion_checkin' },
  { key: 'quest_sleep', title: 'Ghi nhật ký giấc ngủ', description: 'Ghi lại giờ ngủ, giờ dậy và chất lượng giấc ngủ', icon: '🌙', xpReward: 2, eventType: 'journal_entry' },
  { key: 'quest_kindness', title: 'Hành động tử tế', description: 'Làm 1 điều tốt cho người khác hôm nay', icon: '💕', xpReward: 4, eventType: 'story_shared' },
];

/** Deterministic seed from date string → pick consistent 4 from rotating pool */
function dailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export async function getDailyQuests(userId: string): Promise<DailyQuest[]> {
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const today = todayStr();

  // Pick 4 rotating quests deterministically based on date
  const shuffled = [...ROTATING_DAILY_QUESTS].sort((a, b) => {
    const ha = dailySeed(today + a.key);
    const hb = dailySeed(today + b.key);
    return ha - hb;
  });
  const picked = shuffled.slice(0, 4);

  const templates = [...CORE_DAILY_QUESTS, ...picked];

  return templates.map(t => ({
    id: `${t.key}_${today}`,
    title: t.title,
    description: t.description,
    icon: t.icon,
    xpReward: t.xpReward,
    eventType: t.eventType,
    completed: char.completedQuestIds.includes(`${t.key}_${today}`),
  }));
}

export async function completeQuest(userId: string, questId: string): Promise<(OriginalEventResult & { feedback: string }) | null> {
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  if (char.completedQuestIds.includes(questId)) return null;

  char.completedQuestIds.push(questId);
  const result = await processEvent({
    userId,
    eventType: 'quest_completed',
    content: `Hoàn thành quest: ${questId}`,
  });
  return result;
}

// ══════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════

export async function getBadges(userId: string): Promise<Badge[]> {
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const streakInfo = getStreak(char.id, 'daily_ritual');

  return [
    {
      id: 'badge_starter',
      name: 'Người Bắt Đầu',
      icon: '🌱',
      description: 'Bắt đầu hành trình sức khỏe tâm lý',
      unlocked: char.xp > 0,
    },
    {
      id: 'badge_streak_3',
      name: 'Kiên Trì 3 Ngày',
      icon: '🔥',
      description: '3 ngày liên tiếp sử dụng',
      unlocked: streakInfo.currentStreak >= 3,
    },
    {
      id: 'badge_streak_7',
      name: 'Streak 7 Ngày',
      icon: '⭐',
      description: '7 ngày liên tiếp sử dụng',
      unlocked: streakInfo.currentStreak >= 7,
    },
    {
      id: 'badge_streak_30',
      name: 'Kiên Trì 30 Ngày',
      icon: '💎',
      description: '30 ngày liên tiếp sử dụng',
      unlocked: streakInfo.currentStreak >= 30,
    },
    {
      id: 'badge_empath',
      name: 'Người Đồng Cảm',
      icon: '💜',
      description: 'Đạt 10 Empathy Points',
      unlocked: char.empathyScore >= 10,
    },
    {
      id: 'badge_soul',
      name: 'Tâm Hồn Phong Phú',
      icon: '✨',
      description: 'Đạt 20 Soul Points',
      unlocked: char.soulPoints >= 20,
    },
    {
      id: 'badge_growth',
      name: 'Người Trưởng Thành',
      icon: '🌳',
      description: 'Growth Score đạt 20+',
      unlocked: char.growthScore >= 20,
    },
    {
      id: 'badge_champion',
      name: 'Champion',
      icon: '🏆',
      description: 'Đạt Level 5 — Người Dẫn Đường',
      unlocked: char.level >= 5,
    },
  ];
}

// ══════════════════════════════════════════════
// GAME PROFILE
// ══════════════════════════════════════════════

export async function getGameProfile(userId: string): Promise<GameProfile> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const frontendChar = toFrontendCharacter(char);
  const quests = await getDailyQuests(userId);
  const badges = await getBadges(userId);
  const levelTitle = getLevelTitle(char);
  const levelTable = getLevelTable();
  const currentEntry = levelTable.find(l => l.level === char.level);
  const nextEntry = levelTable.find(l => l.level === char.level + 1);
  const currentXpReq = currentEntry?.xpRequired ?? 0;
  const nextXpReq = nextEntry?.xpRequired ?? currentXpReq + 500;
  const xpToNextLevel = nextXpReq - char.xp;
  const xpRange = nextXpReq - currentXpReq;
  const xpProgress = xpRange > 0
    ? Math.round(((char.xp - currentXpReq) / xpRange) * 100)
    : 100;

  return {
    character: frontendChar,
    quests,
    badges,
    levelTitle,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    xpProgress: Math.max(0, Math.min(100, xpProgress)),
  };
}

// ══════════════════════════════════════════════
// SUPPORTED EVENTS
// ══════════════════════════════════════════════

export function getSupportedEvents(): PsychEventType[] {
  return originalGetSupportedEvents();
}

// ══════════════════════════════════════════════
// SKILL TREE
// ══════════════════════════════════════════════

export async function getSkillTree(userId: string): Promise<SkillTreeData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const state = getSkillState(userId);

  const ctx: UnlockContext = {
    character: char,
    skillState: state,
    categoryCounts: {},
    reflectionCount: char.completedQuestIds.length,
    helpOthersCount: Math.floor(char.empathyScore / 4),
    hasNarrativeQuest: char.completedQuestIds.some(id => id.includes('narrative')),
  };

  // Auto-unlock available skills
  unlockAvailableSkills(ctx);

  const allSkills = getAllSkills();
  const skills: SkillInfo[] = allSkills.map(s => ({
    id: s.id,
    branch: s.branch,
    tier: s.tier,
    ten: s.ten,
    moTa: s.moTa,
    linkedLocation: s.linkedLocation,
    unlocked: state.unlockedSkills.includes(s.id),
    canUnlock: !state.unlockedSkills.includes(s.id) && canUnlockSkill(s, ctx),
  }));

  const synergies: SynergyInfo[] = getAllSynergies().map(syn => ({
    id: syn.id,
    ten: syn.ten,
    moTa: syn.moTa,
    requiredSkills: syn.requiredSkills,
    unlocked: state.unlockedSynergies.includes(syn.id),
  }));

  const masteries: BranchMasteryInfo[] = getAllBranchMasteries().map(bm => ({
    branch: bm.branch,
    ten: bm.ten,
    danhHieu: bm.danhHieu,
    mastered: state.masteredBranches.includes(bm.branch),
  }));

  const data: SkillTreeData = {
    skills,
    synergies,
    masteries,
    unlockedCount: state.unlockedSkills.length,
    totalCount: allSkills.length,
  };

  // Persist skill state if changed
  await saveSkillState(userId, state);
  return data;
}

// ══════════════════════════════════════════════
// WORLD MAP
// ══════════════════════════════════════════════

export async function getWorldMap(userId: string): Promise<WorldMapData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const allLocations = getAllLocations();

  const locations: LocationInfo[] = allLocations.map(loc => ({
    id: loc.id,
    ten: loc.ten,
    moTa: loc.moTa,
    levelRequired: loc.unlock.levelRequired,
    growthScoreRequired: loc.unlock.growthScoreRequired,
    unlocked: canAccessLocation(char, loc.id),
    isCurrent: char.currentLocation === loc.id,
  }));

  return {
    locations,
    currentLocation: char.currentLocation,
    unlockedCount: locations.filter(l => l.unlocked).length,
    totalCount: locations.length,
  };
}

export async function travel(userId: string, locationId: string): Promise<{ success: boolean; message: string }> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const result = travelTo(char, locationId as any);
  if (result.success) await saveUserState(userId);
  return result;
}

// ══════════════════════════════════════════════
// QUEST DATABASE (full 200)
// ══════════════════════════════════════════════

export async function getQuestDatabase(userId: string, category?: string, page = 1, limit = 20): Promise<QuestDatabaseData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  let allQuests = getAllQuestsDB();

  if (category) {
    allQuests = getQuestsByCategoryDB(category as any);
  }

  const allQuestInfos: QuestInfo[] = allQuests.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    location: q.location,
    xpReward: q.xpReward,
    loai: q.loai,
    completed: char.completedQuestIds.includes(q.id),
  }));

  const totalCount = allQuestInfos.length;
  const completedCount = allQuestInfos.filter(q => q.completed).length;
  const categories = [...new Set(getAllQuestsDB().map(q => q.category))];

  // Pagination
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // cap at 100
  const totalPages = Math.ceil(totalCount / safeLimit);
  const offset = (safePage - 1) * safeLimit;
  const quests = allQuestInfos.slice(offset, offset + safeLimit);

  return {
    quests,
    totalCount,
    completedCount,
    categories,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}

export async function completeFullQuest(userId: string, questId: string): Promise<(OriginalEventResult & { feedback: string }) | null> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  if (char.completedQuestIds.includes(questId)) return null;

  const quest = getAllQuestsDB().find(q => q.id === questId);
  if (quest) {
    completeQuestDB(char, quest);
  } else {
    // Chain step or custom quest — manually track completion
    char.completedQuestIds.push(questId);
  }

  return await processEvent({
    userId,
    eventType: 'quest_completed',
    content: `Hoàn thành quest: ${questId}`,
  });
}

// ══════════════════════════════════════════════
// QUEST COMPLETION HISTORY
// ══════════════════════════════════════════════

export interface QuestHistoryEntry {
  questId: string;
  title: string;
  category: string;
  xpReward: number;
  completedAt: number;
}

export async function getQuestHistory(userId: string): Promise<QuestHistoryEntry[]> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const allQuests = getAllQuestsDB();
  const logs = getLogsForCharacter(char.id);

  // Build history from action logs that have a questId
  const questLogs = logs
    .filter(l => l.questId && char.completedQuestIds.includes(l.questId))
    .map(l => {
      const quest = allQuests.find(q => q.id === l.questId);
      return {
        questId: l.questId!,
        title: quest ? quest.title : l.questId!,
        category: quest ? quest.category : 'chain',
        xpReward: quest ? quest.xpReward : 10,
        completedAt: l.timestamp,
      };
    });

  // Also include completedQuestIds that might not have logs (e.g. daily quests auto-completed)
  const loggedIds = new Set(questLogs.map(l => l.questId));
  const extra = char.completedQuestIds
    .filter(id => !loggedIds.has(id))
    .map(id => {
      const quest = allQuests.find(q => q.id === id);
      return {
        questId: id,
        title: quest ? quest.title : id,
        category: quest ? quest.category : 'daily',
        xpReward: quest ? quest.xpReward : 10,
        completedAt: 0,
      };
    });

  return [...questLogs, ...extra].sort((a, b) => b.completedAt - a.completedAt);
}

// ══════════════════════════════════════════════
// ADAPTIVE QUEST AI
// ══════════════════════════════════════════════

export async function getAdaptiveQuests(userId: string): Promise<AdaptiveQuestData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const gs = calcGrowthScore(char.growthStats);
  const phase = getPlayerPhase(gs);
  const allQuests = getAllQuestsDB();

  const completedCategories = allQuests
    .filter(q => char.completedQuestIds.includes(q.id))
    .map(q => q.category);

  const userType = classifyUserType(completedCategories as any);
  const difficulty = assessDifficulty(char.id, char.level);
  const scored = recommendQuests(allQuests, char.growthStats, char.completedQuestIds, undefined, 5);

  const recommendations: RecommendedQuest[] = scored.map(s => ({
    questId: s.questId,
    title: s.quest.title,
    description: s.quest.description,
    category: s.quest.category,
    xpReward: s.quest.xpReward,
    totalScore: s.totalScore,
    reason: s.statNeed > 30 ? 'Cải thiện điểm yếu' : s.narrativeRelevance > 0 ? 'Phù hợp câu chuyện' : 'Khám phá mới',
  }));

  // Get a quest chain based on weakest stat
  const themes = getAvailableChainThemes();
  let questChain: QuestChainInfo | null = null;
  if (themes.length > 0) {
    const chain = getQuestChain(themes[0]);
    if (chain) {
      questChain = {
        id: chain.id,
        theme: chain.theme,
        title: chain.title,
        steps: chain.steps.map(s => ({
          order: s.order, title: s.title, description: s.description, xpReward: s.xpReward,
          completed: char.completedQuestIds.includes(`${chain.id}_step_${s.order}`),
        })),
        totalXp: chain.totalXp,
        completedSteps: chain.steps.filter(s => char.completedQuestIds.includes(`${chain.id}_step_${s.order}`)).length,
      };
    }
  }

  // Build all chains with progress
  const allChains: QuestChainInfo[] = themes.map(t => {
    const c = getQuestChain(t);
    if (!c) return null;
    const steps = c.steps.map(s => ({
      order: s.order, title: s.title, description: s.description, xpReward: s.xpReward,
      completed: char.completedQuestIds.includes(`${c.id}_step_${s.order}`),
    }));
    return {
      id: c.id, theme: c.theme, title: c.title, steps,
      totalXp: c.totalXp,
      completedSteps: steps.filter(s => s.completed).length,
    };
  }).filter(Boolean) as QuestChainInfo[];

  return {
    playerPhase: phase,
    userType,
    recommendations,
    questChain,
    allChains,
    difficulty: {
      current: difficulty.currentDifficulty,
      suggested: difficulty.suggestedDifficulty,
      completionRate: difficulty.completionRate,
      shouldAdjust: difficulty.shouldAdjust,
      reason: difficulty.reason,
    },
  };
}

// ══════════════════════════════════════════════
// STATE & TRAJECTORY
// ══════════════════════════════════════════════

export async function getStateData(userId: string): Promise<StateData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const gs = calcGrowthScore(char.growthStats);
  const zone = getStateZone(gs);
  const trajectory = getTrajectory(char.id).map(s => ({
    timestamp: s.timestamp,
    zone: s.zone,
    growthScore: s.growthScore,
    stats: { ...s.state },
  }));
  const empathyRank = calculateEmpathyRank(char.empathyScore);

  return {
    zone,
    growthScore: gs,
    trajectory,
    empathyRank,
    empathyScore: char.empathyScore,
  };
}

// ══════════════════════════════════════════════
// BEHAVIOR LOOPS
// ══════════════════════════════════════════════

export async function getBehaviorData(userId: string): Promise<BehaviorData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);

  const ritual = getDailyRitual(char.id);
  const weeklyChallenges = getAllWeeklyChallenges().map(ch => ({
    id: ch.id,
    title: ch.title,
    description: ch.description,
    xpReward: ch.xpReward,
    completed: ch.completed,
  }));
  const seasonalGoals = getAllSeasonalGoals().map(g => ({
    id: g.id,
    title: g.title,
    rewardTitle: g.rewardTitle,
    xpReward: g.xpReward,
    progress: { ...g.progress },
    requirements: { ...g.requirements },
    completed: g.completed,
  }));
  const shifts = getMeaningShifts(char.id).map(s => ({
    from: s.from,
    to: s.to,
    detectedAt: s.detectedAt,
  }));

  return {
    dailyRitual: {
      date: ritual.date,
      checkinDone: ritual.checkinDone,
      reflectionDone: ritual.reflectionDone,
      communityDone: ritual.communityDone,
      completed: ritual.completed,
    },
    weeklyChallenges,
    seasonalGoals,
    meaningShifts: shifts,
  };
}

export async function completeDailyRitualStep(userId: string, step: 'checkin' | 'reflection' | 'community') {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const ritual = completeDailyStep(char.id, step);
  if (ritual.completed) {
    // Bonus for completing full daily ritual
    await processEvent({ userId, eventType: 'quest_completed', content: 'Hoàn thành nghi thức hàng ngày' });
  }
  await saveUserState(userId);
  return ritual;
}

export async function completeWeekly(userId: string, challengeId: string) {
  ensureInit();
  await ensureUserLoaded(userId);
  const ch = completeWeeklyChallenge(challengeId);
  if (ch?.completed) {
    await processEvent({ userId, eventType: 'quest_completed', content: `Hoàn thành thử thách tuần: ${ch.title}` });
  }
  return ch;
}

// ══════════════════════════════════════════════
// LORE
// ══════════════════════════════════════════════

export function getLoreData(): LoreData {
  ensureInit();
  return {
    worldName: getWorldName(),
    playerRole: getPlayerRole(),
    communityName: getCommunityName(),
    philosophies: getAllPhilosophies(),
    legends: getAllLegends(),
    locationLores: getAllLocationLores(),
  };
}

export function getLoreMessage(trigger: string, ref: string): string | null {
  ensureInit();
  const msg = getLoreForEvent(trigger as any, ref);
  return msg?.text ?? null;
}

// ══════════════════════════════════════════════
// FULL GAME DATA
// ══════════════════════════════════════════════

export async function getFullGameData(userId: string): Promise<FullGameData> {
  ensureInit();
  await ensureUserLoaded(userId);
  return {
    profile: await getGameProfile(userId),
    skillTree: await getSkillTree(userId),
    worldMap: await getWorldMap(userId),
    state: await getStateData(userId),
    behavior: await getBehaviorData(userId),
    lore: getLoreData(),
  };
}

// ══════════════════════════════════════════════
// PLAYER DASHBOARD (aggregated view)
// ══════════════════════════════════════════════

const BRANCH_NAMES: Record<string, { name: string; icon: string }> = {
  self_awareness: { name: 'Tự Nhận Thức', icon: '🪞' },
  emotional_regulation: { name: 'Điều Tiết Cảm Xúc', icon: '🌊' },
  cognitive_flexibility: { name: 'Linh Hoạt Nhận Thức', icon: '🧠' },
  relationship_skills: { name: 'Kỹ Năng Quan Hệ', icon: '🤝' },
  meaning_purpose: { name: 'Ý Nghĩa & Mục Đích', icon: '⛰️' },
};

const LOC_ICONS: Record<string, string> = {
  thung_lung_cau_hoi: '🏞️', rung_tu_nhan_thuc: '🌲', dong_song_cam_xuc: '🌊',
  thanh_pho_ket_noi: '🏙️', dinh_nui_y_nghia: '⛰️',
};

function generateInsight(char: OriginalCharacter, questsCompleted: number, streak: number): string {
  const stats = char.growthStats;
  const strongest = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
  const weakest = Object.entries(stats).sort((a, b) => a[1] - b[1])[0];

  const nameMap: Record<string, string> = {
    emotionalAwareness: 'nhận diện cảm xúc',
    psychologicalSafety: 'an toàn tâm lý',
    meaning: 'ý nghĩa sống',
    cognitiveFlexibility: 'linh hoạt nhận thức',
    relationshipQuality: 'kết nối xã hội',
  };

  const parts: string[] = [];
  if (questsCompleted > 0) {
    parts.push(`Bạn đã hoàn thành ${questsCompleted} nhiệm vụ.`);
  }
  if (streak >= 3) {
    parts.push(`Chuỗi ${streak} ngày liên tiếp cho thấy bạn đang rất kiên trì!`);
  }
  if (strongest[1] > 30) {
    parts.push(`Điểm mạnh của bạn là ${nameMap[strongest[0]] || strongest[0]} (${strongest[1]}/100).`);
  }
  if (weakest[1] < 30) {
    parts.push(`Hãy dành thời gian phát triển ${nameMap[weakest[0]] || weakest[0]} — đây là cơ hội tăng trưởng lớn.`);
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Hãy bắt đầu hành trình bằng cách hoàn thành nhiệm vụ đầu tiên!';
}

function generateSuggestion(char: OriginalCharacter, quests: { id: string; title: string; completed: boolean }[]): string {
  const incomplete = quests.find(q => !q.completed);
  if (incomplete) return `Hoàn thành nhiệm vụ "${incomplete.title}"`;

  const stats = char.growthStats;
  const weakest = Object.entries(stats).sort((a, b) => a[1] - b[1])[0];
  const suggestionMap: Record<string, string> = {
    emotionalAwareness: 'Viết nhật ký cảm xúc: "Hôm nay tôi cảm thấy..."',
    psychologicalSafety: 'Thử bài tập thở 5 phút để tạo cảm giác an toàn',
    meaning: 'Liệt kê 3 điều bạn biết ơn hôm nay',
    cognitiveFlexibility: 'Thử nhìn một vấn đề từ góc độ khác',
    relationshipQuality: 'Chia sẻ một câu chuyện tích cực với ai đó',
  };
  return suggestionMap[weakest[0]] || 'Hãy trò chuyện với AI về cảm xúc của bạn hôm nay';
}

export async function getPlayerDashboard(userId: string): Promise<PlayerDashboardData> {
  ensureInit();
  await ensureUserLoaded(userId);
  const char = originalGetOrCreate(userId);
  const frontendChar = toFrontendCharacter(char);
  const profile = await getGameProfile(userId);
  const skills = await getSkillTree(userId);
  const world = await getWorldMap(userId);
  const stateD = await getStateData(userId);
  const behaviorD = await getBehaviorData(userId);
  const badges = await getBadges(userId);
  const dailyQ = await getDailyQuests(userId);

  // Identity
  const identity = {
    name: char.name || userId,
    archetype: char.archetype,
    level: char.level,
    xp: char.xp,
    xpProgress: profile.xpProgress,
    xpToNextLevel: profile.xpToNextLevel,
    levelTitle: profile.levelTitle,
    soulPoints: frontendChar.soulPoints,
    empathyPoints: frontendChar.empathyPoints,
    streak: frontendChar.streak,
    createdAt: frontendChar.createdAt,
  };

  // Psychological state
  const psychologicalState = { ...char.growthStats };

  // Skill branches
  const branches = Object.keys(BRANCH_NAMES);
  const skillBranches: DashboardSkillBranch[] = branches.map(branch => {
    const branchSkills = skills.skills
      .filter(s => s.branch === branch)
      .map(s => ({ id: s.id, name: s.ten, unlocked: s.unlocked }));
    const mastery = skills.masteries.find(m => m.branch === branch);
    return {
      branch,
      name: BRANCH_NAMES[branch].name,
      icon: BRANCH_NAMES[branch].icon,
      skills: branchSkills,
      mastered: mastery?.mastered || false,
      masteryTitle: mastery?.danhHieu || '',
    };
  });

  // Quest progress
  const questsCompletedTotal = char.completedQuestIds.length;
  const reflectionStreak = frontendChar.streak;
  const incomplete = dailyQ.find(q => !q.completed);
  const questProgress = {
    dailyQuests: dailyQ.map(q => ({ id: q.id, title: q.title, icon: q.icon, completed: q.completed })),
    questsCompletedTotal,
    reflectionStreak,
    currentQuestHint: incomplete ? incomplete.title : null,
  };

  // Narrative timeline — build from trajectory + meaning shifts + milestones
  const narrativeTimeline: DashboardNarrativeEvent[] = [];

  // Start event
  narrativeTimeline.push({
    timestamp: new Date(frontendChar.createdAt).getTime() || Date.now() - 86400000 * 30,
    label: 'Bắt đầu hành trình',
    type: 'start',
  });

  // Zone changes from trajectory
  let lastZone = '';
  const zoneNames: Record<string, string> = {
    disorientation: 'Mất Phương Hướng',
    self_exploration: 'Tự Khám Phá',
    stabilization: 'Ổn Định',
    growth: 'Phát Triển',
    mentor_stage: 'Người Dẫn Đường',
  };
  for (const t of stateD.trajectory) {
    if (t.zone !== lastZone) {
      narrativeTimeline.push({
        timestamp: t.timestamp,
        label: `Đạt trạng thái: ${zoneNames[t.zone] || t.zone}`,
        type: 'zone_change',
      });
      lastZone = t.zone;
    }
  }

  // Meaning shifts
  for (const shift of behaviorD.meaningShifts) {
    narrativeTimeline.push({
      timestamp: shift.detectedAt,
      label: `Thay đổi ý nghĩa: ${shift.from} → ${shift.to}`,
      type: 'meaning_shift',
    });
  }

  // Milestones from badges
  const unlockedBadges = badges.filter(b => b.unlocked);
  for (const b of unlockedBadges) {
    narrativeTimeline.push({
      timestamp: Date.now() - Math.random() * 86400000 * 7,
      label: `Đạt huy hiệu: ${b.name}`,
      type: 'milestone',
    });
  }

  narrativeTimeline.sort((a, b) => a.timestamp - b.timestamp);

  // Milestones
  const milestones: DashboardMilestone[] = badges.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    description: b.description,
    unlocked: b.unlocked,
  }));

  // Community role
  const empathyRankNames: Record<string, string> = {
    newcomer: 'Người Mới',
    listener: 'Người Lắng Nghe',
    supporter: 'Người Hỗ Trợ',
    mentor: 'Người Dẫn Đường',
    guardian: 'Người Bảo Hộ',
  };
  const communityRole = {
    role: empathyRankNames[stateD.empathyRank] || stateD.empathyRank,
    empathyScore: stateD.empathyScore,
    empathyRank: stateD.empathyRank,
    peoplHelped: Math.floor(stateD.empathyScore / 4),
  };

  // World progress
  const worldProgress = {
    locations: world.locations.map(l => ({
      id: l.id,
      name: l.ten,
      icon: LOC_ICONS[l.id] || '🏔️',
      unlocked: l.unlocked,
      isCurrent: l.isCurrent,
    })),
    currentLocation: world.currentLocation,
    unlockedCount: world.unlockedCount,
    totalCount: world.totalCount,
  };

  // AI-generated insight and suggestion
  const personalInsight = generateInsight(char, questsCompletedTotal, frontendChar.streak);
  const dailySuggestion = generateSuggestion(char, dailyQ);

  return {
    identity,
    psychologicalState,
    skillBranches,
    questProgress,
    narrativeTimeline,
    milestones,
    communityRole,
    worldProgress,
    personalInsight,
    dailySuggestion,
    zone: stateD.zone,
    growthScore: stateD.growthScore,
  };
}

// ══════════════════════════════════════════════
// RESET (testing)
// ══════════════════════════════════════════════

export function resetEngine(): void {
  resetEventHandler();
  resetEconomy();
  createdAtStore.clear();
  skillStateStore.clear();
  resetLoadedUsers();
  _initialized = false;
}
