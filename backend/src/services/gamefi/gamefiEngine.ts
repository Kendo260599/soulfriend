// ============================================
// SoulFriend GameFi — Backend Engine Wrapper
// ============================================
// Thin adapter around the ORIGINAL 22-system GameFi engine
// (gamefi/core/) and integration layer (integration/).
//
// The original engine provides: archetype growth bonus, economy
// with streaks & daily caps, narrative analysis, emotion detection,
// state engine, crisis signals, behavioral loop, and data logging.
//
// This wrapper adds: API-friendly profile, daily quests, badges,
// streak tracking, and character type mapping for the frontend.

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
import { generateFeedback as origGenerateFeedback } from '../../../../integration/gamefiFeedback';
import type { Character, DailyQuest, Badge, GameProfile } from './types';

// ══════════════════════════════════════════════
// METADATA STORE (fields not in original Character)
// ══════════════════════════════════════════════

const createdAtStore: Map<string, string> = new Map();

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convert original Character → frontend-friendly Character */
function toFrontendCharacter(char: OriginalCharacter): Character {
  const streakInfo = getStreak(char.id, 'daily_ritual');
  if (!createdAtStore.has(char.name)) {
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

export function getOrCreateCharacter(userId: string): Character {
  const char = originalGetOrCreate(userId);
  return toFrontendCharacter(char);
}

export function getCharacter(userId: string): Character | undefined {
  const char = originalGetCharacter(userId);
  return char ? toFrontendCharacter(char) : undefined;
}

// ══════════════════════════════════════════════
// EVENT PROCESSING (original engine + enrich)
// ══════════════════════════════════════════════

export function processEvent(event: PsychEvent): OriginalEventResult & { feedback: string } {
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
  const result = originalProcessEvent(event);

  // Apply rewards to character (original returns but doesn't accumulate)
  const char = originalGetOrCreate(event.userId);
  char.soulPoints += result.rewards.soulPoints;
  char.empathyScore += result.rewards.empathyPoints;

  // Track daily streak
  recordStreakActivity(char.id, 'daily_ritual');

  // Generate friendly feedback message
  const feedback = origGenerateFeedback(result);
  return { ...result, feedback };
}

// ══════════════════════════════════════════════
// DAILY QUESTS
// ══════════════════════════════════════════════

export function getDailyQuests(userId: string): DailyQuest[] {
  const char = originalGetOrCreate(userId);
  const today = todayStr();

  return [
    {
      id: `quest_dass_${today}`,
      title: 'Làm test DASS-21',
      description: 'Hoàn thành bài đánh giá DASS-21 để biết trạng thái tâm lý hôm nay',
      icon: '🧠',
      xpReward: 5,
      eventType: 'quest_completed',
      completed: char.completedQuestIds.includes(`quest_dass_${today}`),
    },
    {
      id: `quest_chat_${today}`,
      title: 'Trò chuyện với AI',
      description: 'Chat với AI ít nhất 3 tin nhắn về cảm xúc của bạn',
      icon: '💬',
      xpReward: 3,
      eventType: 'emotion_checkin',
      completed: char.completedQuestIds.includes(`quest_chat_${today}`),
    },
    {
      id: `quest_journal_${today}`,
      title: 'Ghi nhật ký cảm xúc',
      description: 'Viết 3 câu về cảm xúc và suy nghĩ của bạn hôm nay',
      icon: '📝',
      xpReward: 3,
      eventType: 'journal_entry',
      completed: char.completedQuestIds.includes(`quest_journal_${today}`),
    },
    {
      id: `quest_breathing_${today}`,
      title: 'Bài tập thở 5 phút',
      description: 'Thực hành hít thở sâu 5 phút để giảm stress',
      icon: '🧘',
      xpReward: 2,
      eventType: 'emotion_checkin',
      completed: char.completedQuestIds.includes(`quest_breathing_${today}`),
    },
    {
      id: `quest_research_${today}`,
      title: 'Đọc nghiên cứu',
      description: 'Khám phá 1 bài nghiên cứu về sức khỏe tâm lý',
      icon: '📖',
      xpReward: 2,
      eventType: 'quest_completed',
      completed: char.completedQuestIds.includes(`quest_research_${today}`),
    },
    {
      id: `quest_share_${today}`,
      title: 'Chia sẻ câu chuyện',
      description: 'Chia sẻ một trải nghiệm hoặc câu chuyện tích cực',
      icon: '💝',
      xpReward: 5,
      eventType: 'story_shared',
      completed: char.completedQuestIds.includes(`quest_share_${today}`),
    },
  ];
}

export function completeQuest(userId: string, questId: string): (OriginalEventResult & { feedback: string }) | null {
  const char = originalGetOrCreate(userId);
  if (char.completedQuestIds.includes(questId)) return null;

  char.completedQuestIds.push(questId);
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

export function getGameProfile(userId: string): GameProfile {
  const char = originalGetOrCreate(userId);
  const frontendChar = toFrontendCharacter(char);
  const quests = getDailyQuests(userId);
  const badges = getBadges(userId);
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
// RESET (testing)
// ══════════════════════════════════════════════

export function resetEngine(): void {
  resetEventHandler();
  resetEconomy();
  createdAtStore.clear();
}
