// ============================================
// SoulFriend GameFi — Core Engine (Backend)
// ============================================
// Self-contained GameFi engine for the backend API.
// Handles: Character, XP, Level, Growth Stats, Economy, Quests, Badges, Safety.

import {
  Character,
  GrowthStats,
  ActionType,
  ArchetypeId,
  LevelInfo,
  PsychEventType,
  PsychEvent,
  EventResult,
  DailyQuest,
  Badge,
  GameProfile,
} from './types';
import { generateFeedback } from './feedbackGenerator';

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════

const LEVEL_TABLE: LevelInfo[] = [
  { level: 1, title: 'Người Quan Sát', xpRequired: 0 },
  { level: 2, title: 'Người Tìm Hiểu', xpRequired: 100 },
  { level: 3, title: 'Người Thấu Hiểu', xpRequired: 300 },
  { level: 4, title: 'Người Kết Nối', xpRequired: 600 },
  { level: 5, title: 'Người Dẫn Đường', xpRequired: 1000 },
];

const GROWTH_DELTAS: Record<ActionType, Partial<GrowthStats>> = {
  journal_entry: { emotionalAwareness: 3, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 2 },
  emotion_regulation: { emotionalAwareness: 2, psychologicalSafety: 2, meaning: 1, cognitiveFlexibility: 1, relationshipQuality: 1 },
  reflection: { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, cognitiveFlexibility: 3 },
  help_others: { emotionalAwareness: 1, psychologicalSafety: 1, meaning: 1, relationshipQuality: 3 },
  gratitude: { emotionalAwareness: 1, psychologicalSafety: 2, meaning: 2, relationshipQuality: 1 },
};

const EVENT_TO_ACTION: Record<PsychEventType, ActionType> = {
  journal_entry: 'journal_entry',
  story_shared: 'emotion_regulation',
  emotion_checkin: 'reflection',
  user_helped_user: 'help_others',
  quest_completed: 'gratitude',
};

const INSTANT_REWARDS: Record<string, { xp: number; soulPoints: number; empathyPoints: number }> = {
  journal_entry: { xp: 3, soulPoints: 2, empathyPoints: 0 },
  story_shared: { xp: 5, soulPoints: 0, empathyPoints: 0 },
  emotion_checkin: { xp: 2, soulPoints: 1, empathyPoints: 0 },
  user_helped_user: { xp: 2, soulPoints: 0, empathyPoints: 3 },
  quest_completed: { xp: 5, soulPoints: 0, empathyPoints: 0 },
};

const MAX_DAILY_XP = 100;
const MAX_STAT_VALUE = 100;
const MAX_CHARACTERS = 10000;

// Crisis keywords for safety detection
const CRISIS_KEYWORDS = [
  'tự tử', 'tự sát', 'không muốn sống', 'muốn chết',
  'kết thúc cuộc sống', 'tự hại', 'tự gây thương tích',
  'suicide', 'kill myself', 'end my life', 'self harm',
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const characterStore: Map<string, Character> = new Map();
const dailyXpStore: Map<string, number> = new Map(); // key: `userId_YYYY-MM-DD`

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function calculateLevel(xp: number): number {
  let level = 1;
  for (const entry of LEVEL_TABLE) {
    if (xp >= entry.xpRequired) level = entry.level;
  }
  return level;
}

function getLevelTitle(level: number): string {
  return LEVEL_TABLE.find(l => l.level === level)?.title ?? 'Người Quan Sát';
}

function calculateGrowthScore(stats: GrowthStats): number {
  const sum = stats.emotionalAwareness + stats.psychologicalSafety +
    stats.meaning + stats.cognitiveFlexibility + stats.relationshipQuality;
  return Math.round(sum / 5);
}

function checkCrisis(content: string): boolean {
  const lower = content.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

// ══════════════════════════════════════════════
// CHARACTER MANAGEMENT
// ══════════════════════════════════════════════

export function getOrCreateCharacter(userId: string): Character {
  let char = characterStore.get(userId);
  if (!char) {
    char = {
      id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      archetype: 'Người Khám Phá',
      level: 1,
      xp: 0,
      growthScore: 0,
      growthStats: baseGrowthStats(),
      soulPoints: 0,
      empathyPoints: 0,
      streak: 1,
      lastActiveDate: todayStr(),
      completedQuestIds: [],
      badges: [],
      createdAt: new Date().toISOString(),
    };
    characterStore.set(userId, char);

    // Evict oldest if store is too large
    if (characterStore.size > MAX_CHARACTERS) {
      const firstKey = characterStore.keys().next().value;
      if (firstKey !== undefined) characterStore.delete(firstKey);
    }
  }

  // Update streak
  const today = todayStr();
  if (char.lastActiveDate !== today) {
    const lastDate = new Date(char.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      char.streak += 1;
    } else if (diffDays > 1) {
      char.streak = 1;
    }
    char.lastActiveDate = today;
  }

  return char;
}

export function getCharacter(userId: string): Character | undefined {
  return characterStore.get(userId);
}

// ══════════════════════════════════════════════
// EVENT PROCESSING
// ══════════════════════════════════════════════

export function processEvent(event: PsychEvent): EventResult {
  const { userId, eventType, content } = event;

  const character = getOrCreateCharacter(userId);
  const oldLevel = character.level;

  // 1. Update growth stats
  const actionType = EVENT_TO_ACTION[eventType];
  const statsBefore = { ...character.growthStats };
  const baseDelta = GROWTH_DELTAS[actionType];

  if (baseDelta) {
    for (const key of Object.keys(baseDelta) as (keyof GrowthStats)[]) {
      const value = baseDelta[key] ?? 0;
      character.growthStats[key] = Math.min(MAX_STAT_VALUE, character.growthStats[key] + value);
    }
  }

  const growthImpact: Partial<GrowthStats> = {};
  for (const key of Object.keys(statsBefore) as (keyof GrowthStats)[]) {
    const delta = character.growthStats[key] - statsBefore[key];
    if (delta > 0) growthImpact[key] = delta;
  }

  character.growthScore = calculateGrowthScore(character.growthStats);

  // 2. Calculate reward with daily cap
  const base = INSTANT_REWARDS[eventType] ?? { xp: 2, soulPoints: 0, empathyPoints: 0 };
  const dailyKey = `${userId}_${todayStr()}`;
  const dailyXpUsed = dailyXpStore.get(dailyKey) ?? 0;
  const remainingXp = Math.max(0, MAX_DAILY_XP - dailyXpUsed);
  const xpGained = Math.min(base.xp, remainingXp);

  dailyXpStore.set(dailyKey, dailyXpUsed + xpGained);
  character.xp += xpGained;
  character.soulPoints += base.soulPoints;
  character.empathyPoints += base.empathyPoints;

  // 3. Level check
  character.level = calculateLevel(character.xp);
  const leveledUp = character.level > oldLevel;

  // 4. Quest suggestion based on event type
  const questSuggestions: Record<PsychEventType, string> = {
    journal_entry: 'Viết về 3 điều bạn biết ơn hôm nay',
    story_shared: 'Chia sẻ một kỷ niệm đẹp từ tuần qua',
    emotion_checkin: 'Thử phương pháp hít thở 4-7-8 để thư giãn',
    user_helped_user: 'Gửi lời cảm ơn đến một người quan trọng',
    quest_completed: 'Khám phá một chủ đề tâm lý mới hôm nay',
  };
  const unlockedQuest = questSuggestions[eventType] ?? null;

  // 5. Safety check
  const safetyAlert = content ? checkCrisis(content) : false;

  // 6. Milestone
  let milestone: string | null = null;
  if (leveledUp) {
    milestone = `Lên cấp ${character.level}: ${getLevelTitle(character.level)}`;
  }

  const result: EventResult = {
    xpGained,
    growthImpact,
    newLevel: character.level,
    levelTitle: getLevelTitle(character.level),
    unlockedQuest,
    milestone,
    safetyAlert,
    rewards: {
      soulPoints: base.soulPoints,
      empathyPoints: base.empathyPoints,
    },
    feedback: '',
  };

  // Generate feedback
  result.feedback = generateFeedback(result);

  return result;
}

// ══════════════════════════════════════════════
// DAILY QUESTS
// ══════════════════════════════════════════════

export function getDailyQuests(userId: string): DailyQuest[] {
  const character = getOrCreateCharacter(userId);
  const today = todayStr();

  return [
    {
      id: `quest_dass_${today}`,
      title: 'Làm test DASS-21',
      description: 'Hoàn thành bài đánh giá DASS-21 để biết trạng thái tâm lý hôm nay',
      icon: '🧠',
      xpReward: 5,
      eventType: 'quest_completed',
      completed: character.completedQuestIds.includes(`quest_dass_${today}`),
    },
    {
      id: `quest_chat_${today}`,
      title: 'Trò chuyện với AI',
      description: 'Chat với AI ít nhất 3 tin nhắn về cảm xúc của bạn',
      icon: '💬',
      xpReward: 3,
      eventType: 'emotion_checkin',
      completed: character.completedQuestIds.includes(`quest_chat_${today}`),
    },
    {
      id: `quest_journal_${today}`,
      title: 'Ghi nhật ký cảm xúc',
      description: 'Viết 3 câu về cảm xúc và suy nghĩ của bạn hôm nay',
      icon: '📝',
      xpReward: 3,
      eventType: 'journal_entry',
      completed: character.completedQuestIds.includes(`quest_journal_${today}`),
    },
    {
      id: `quest_breathing_${today}`,
      title: 'Bài tập thở 5 phút',
      description: 'Thực hành hít thở sâu 5 phút để giảm stress',
      icon: '🧘',
      xpReward: 2,
      eventType: 'emotion_checkin',
      completed: character.completedQuestIds.includes(`quest_breathing_${today}`),
    },
    {
      id: `quest_research_${today}`,
      title: 'Đọc nghiên cứu',
      description: 'Khám phá 1 bài nghiên cứu về sức khỏe tâm lý',
      icon: '📖',
      xpReward: 2,
      eventType: 'quest_completed',
      completed: character.completedQuestIds.includes(`quest_research_${today}`),
    },
    {
      id: `quest_share_${today}`,
      title: 'Chia sẻ câu chuyện',
      description: 'Chia sẻ một trải nghiệm hoặc câu chuyện tích cực',
      icon: '💝',
      xpReward: 5,
      eventType: 'story_shared',
      completed: character.completedQuestIds.includes(`quest_share_${today}`),
    },
  ];
}

export function completeQuest(userId: string, questId: string): EventResult | null {
  const character = getOrCreateCharacter(userId);
  if (character.completedQuestIds.includes(questId)) return null;

  character.completedQuestIds.push(questId);

  return processEvent({
    userId,
    eventType: 'quest_completed',
    content: `Hoàn thành quest: ${questId}`,
  });
}

// ══════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════

export function getBadges(userId: string): Badge[] {
  const character = getOrCreateCharacter(userId);

  return [
    {
      id: 'badge_starter',
      name: 'Người Bắt Đầu',
      icon: '🌱',
      description: 'Bắt đầu hành trình sức khỏe tâm lý',
      unlocked: character.xp > 0,
    },
    {
      id: 'badge_streak_3',
      name: 'Kiên Trì 3 Ngày',
      icon: '🔥',
      description: '3 ngày liên tiếp sử dụng',
      unlocked: character.streak >= 3,
    },
    {
      id: 'badge_streak_7',
      name: 'Streak 7 Ngày',
      icon: '⭐',
      description: '7 ngày liên tiếp sử dụng',
      unlocked: character.streak >= 7,
    },
    {
      id: 'badge_streak_30',
      name: 'Kiên Trì 30 Ngày',
      icon: '💎',
      description: '30 ngày liên tiếp sử dụng',
      unlocked: character.streak >= 30,
    },
    {
      id: 'badge_empath',
      name: 'Người Đồng Cảm',
      icon: '💜',
      description: 'Đạt 10 Empathy Points',
      unlocked: character.empathyPoints >= 10,
    },
    {
      id: 'badge_soul',
      name: 'Tâm Hồn Phong Phú',
      icon: '✨',
      description: 'Đạt 20 Soul Points',
      unlocked: character.soulPoints >= 20,
    },
    {
      id: 'badge_growth',
      name: 'Người Trưởng Thành',
      icon: '🌳',
      description: 'Growth Score đạt 20+',
      unlocked: character.growthScore >= 20,
    },
    {
      id: 'badge_champion',
      name: 'Champion',
      icon: '🏆',
      description: 'Đạt Level 5 — Người Dẫn Đường',
      unlocked: character.level >= 5,
    },
  ];
}

// ══════════════════════════════════════════════
// GAME PROFILE
// ══════════════════════════════════════════════

export function getGameProfile(userId: string): GameProfile {
  const character = getOrCreateCharacter(userId);
  const quests = getDailyQuests(userId);
  const badges = getBadges(userId);
  const levelTitle = getLevelTitle(character.level);

  // XP progress to next level
  const currentLevelEntry = LEVEL_TABLE.find(l => l.level === character.level);
  const nextLevelEntry = LEVEL_TABLE.find(l => l.level === character.level + 1);
  const currentXpRequired = currentLevelEntry?.xpRequired ?? 0;
  const nextXpRequired = nextLevelEntry?.xpRequired ?? currentXpRequired + 500;
  const xpToNextLevel = nextXpRequired - character.xp;
  const xpRange = nextXpRequired - currentXpRequired;
  const xpProgress = xpRange > 0
    ? Math.round(((character.xp - currentXpRequired) / xpRange) * 100)
    : 100;

  return {
    character,
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
  return ['journal_entry', 'story_shared', 'emotion_checkin', 'user_helped_user', 'quest_completed'];
}

// ══════════════════════════════════════════════
// RESET (testing)
// ══════════════════════════════════════════════

export function resetEngine(): void {
  characterStore.clear();
  dailyXpStore.clear();
}
