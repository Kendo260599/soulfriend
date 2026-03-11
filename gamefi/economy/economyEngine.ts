// ============================================
// SoulFriend GameFi — Economy Engine
// ============================================
// Hệ thống kinh tế: XP, SoulPoint, EmpathyPoint
// Streak, reward formula, anti-addiction (daily cap)

import {
  Character,
  CurrencyType,
  RewardTier,
  Reward,
  StreakInfo,
  DailyEconomy,
  RewardResult,
} from '../core/types';

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════

/** Giới hạn XP mỗi ngày – anti-addiction */
const MAX_DAILY_XP = 100;

/** Giới hạn SoulPoints mỗi ngày – anti-farming */
const MAX_DAILY_SOULPOINTS = 50;

/** Giới hạn EmpathyPoints mỗi ngày – anti-farming */
const MAX_DAILY_EMPATHYPOINTS = 30;

/** Phần thưởng tức thời cho mỗi loại hành động */
const INSTANT_REWARDS: Record<string, { xp: number; soulPoints: number; empathyPoints: number }> = {
  quest_complete:   { xp: 5,  soulPoints: 0, empathyPoints: 0 },
  reflection:       { xp: 3,  soulPoints: 2, empathyPoints: 0 },
  journaling:       { xp: 3,  soulPoints: 2, empathyPoints: 0 },
  help_others:      { xp: 2,  soulPoints: 0, empathyPoints: 3 },
  community_reply:  { xp: 2,  soulPoints: 1, empathyPoints: 2 },
  checkin:          { xp: 2,  soulPoints: 1, empathyPoints: 0 },
};

/** Streak milestones */
const STREAK_MILESTONES = [
  { days: 3,  bonusXp: 10, label: '3 ngày liên tiếp' },
  { days: 7,  bonusXp: 20, label: '7 ngày liên tiếp', badgeId: 'badge_nguoi_quan_sat_streak' },
  { days: 14, bonusXp: 30, label: '14 ngày liên tiếp', unlocksQuest: true },
  { days: 30, bonusXp: 50, label: '30 ngày liên tiếp', badgeId: 'badge_kien_tri' },
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const streakMap: Map<string, StreakInfo> = new Map();         // key: charId_type
const dailyMap: Map<string, DailyEconomy> = new Map();        // key: charId_date

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function streakKey(charId: string, type: StreakInfo['type']): string {
  return `${charId}_${type}`;
}

function dailyKey(charId: string, date: string): string {
  return `${charId}_${date}`;
}

// ══════════════════════════════════════════════
// PUBLIC API — Economy Init
// ══════════════════════════════════════════════

/** Load a streak into the in-memory map (for persistence restore) */
export function setStreak(characterId: string, type: StreakInfo['type'], info: StreakInfo): void {
  streakMap.set(streakKey(characterId, type), info);
}

/** Get all streaks currently in memory (for persistence) */
export function getAllStreaks(): Map<string, StreakInfo> {
  return streakMap;
}

/** Reset economy stores (testing) */
export function resetEconomy(): void {
  streakMap.clear();
  dailyMap.clear();
}

/** Get max daily XP constant */
export function getMaxDailyXp(): number {
  return MAX_DAILY_XP;
}

/** Get max daily SoulPoints constant */
export function getMaxDailySoulPoints(): number {
  return MAX_DAILY_SOULPOINTS;
}

/** Get max daily EmpathyPoints constant */
export function getMaxDailyEmpathyPoints(): number {
  return MAX_DAILY_EMPATHYPOINTS;
}

// ══════════════════════════════════════════════
// DAILY ECONOMY — Anti-addiction XP cap
// ══════════════════════════════════════════════

/** Get or create today's daily economy for a character */
export function getDailyEconomy(characterId: string, date?: string): DailyEconomy {
  const d = date ?? todayStr();
  const key = dailyKey(characterId, d);
  let daily = dailyMap.get(key);
  if (!daily) {
    daily = {
      characterId,
      date: d,
      xpEarned: 0,
      maxDailyXp: MAX_DAILY_XP,
      soulPointsEarned: 0,
      empathyPointsEarned: 0,
      restReminderSent: false,
    };
    dailyMap.set(key, daily);
  }
  return daily;
}

/** Check how much XP can still be earned today */
export function remainingDailyXp(characterId: string, date?: string): number {
  const daily = getDailyEconomy(characterId, date);
  return Math.max(0, daily.maxDailyXp - daily.xpEarned);
}

/** Check if rest reminder should show */
export function shouldShowRestReminder(characterId: string, date?: string): boolean {
  const daily = getDailyEconomy(characterId, date);
  return daily.xpEarned >= daily.maxDailyXp;
}

// ══════════════════════════════════════════════
// STREAK SYSTEM
// ══════════════════════════════════════════════

/** Get streak info (creates if not exists) */
export function getStreak(characterId: string, type: StreakInfo['type']): StreakInfo {
  const key = streakKey(characterId, type);
  let streak = streakMap.get(key);
  if (!streak) {
    streak = {
      characterId,
      type,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
    };
    streakMap.set(key, streak);
  }
  return streak;
}

/** Record today's activity for a streak type. Returns updated streak. */
export function recordStreakActivity(
  characterId: string,
  type: StreakInfo['type'],
  date?: string,
): StreakInfo {
  const today = date ?? todayStr();
  const streak = getStreak(characterId, type);

  // Already recorded today
  if (streak.lastActivityDate === today) return streak;

  // Check continuity — is it consecutive?
  if (streak.lastActivityDate) {
    const lastDate = new Date(streak.lastActivityDate + 'T00:00:00Z');
    const todayDate = new Date(today + 'T00:00:00Z');
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      streak.currentStreak += 1;
    } else if (diffDays > 1) {
      streak.currentStreak = 1; // reset
    }
    // diffDays === 0 already handled above
  } else {
    streak.currentStreak = 1;
  }

  streak.lastActivityDate = today;
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  return streak;
}

/** Calculate streak bonus XP */
export function getStreakBonusXp(streak: StreakInfo): number {
  let bonus = 0;
  for (const m of STREAK_MILESTONES) {
    if (streak.currentStreak >= m.days) {
      bonus = m.bonusXp; // take highest applicable
    }
  }
  return bonus;
}

/** Get all streak milestones */
export function getStreakMilestones(): readonly typeof STREAK_MILESTONES[number][] {
  return STREAK_MILESTONES;
}

// ══════════════════════════════════════════════
// REWARD FORMULA
// ══════════════════════════════════════════════

/**
 * Tính phần thưởng cho một hành động.
 * reward = base_xp + empathy_bonus + streak_bonus
 * XP bị giới hạn bởi daily cap.
 */
export function calculateReward(
  characterId: string,
  actionKey: string,
  streakType?: StreakInfo['type'],
  date?: string,
): RewardResult {
  const base = INSTANT_REWARDS[actionKey] ?? { xp: 2, soulPoints: 0, empathyPoints: 0 };
  const rewards: Reward[] = [];

  // Base instant reward
  rewards.push({ type: 'xp', amount: base.xp, tier: 'instant', reason: actionKey });
  if (base.soulPoints > 0) {
    rewards.push({ type: 'soulPoint', amount: base.soulPoints, tier: 'instant', reason: actionKey });
  }
  if (base.empathyPoints > 0) {
    rewards.push({ type: 'empathyPoint', amount: base.empathyPoints, tier: 'instant', reason: actionKey });
  }

  // Streak bonus
  let streakBonus = 0;
  if (streakType) {
    const streak = getStreak(characterId, streakType);
    streakBonus = getStreakBonusXp(streak);
    if (streakBonus > 0) {
      rewards.push({ type: 'xp', amount: streakBonus, tier: 'daily', reason: `streak_${streakType}_${streak.currentStreak}d` });
    }
  }

  // Sum totals
  let totalXp = 0;
  let totalSoulPoints = 0;
  let totalEmpathyPoints = 0;
  for (const r of rewards) {
    if (r.type === 'xp') totalXp += r.amount;
    if (r.type === 'soulPoint') totalSoulPoints += r.amount;
    if (r.type === 'empathyPoint') totalEmpathyPoints += r.amount;
  }

  // Apply daily caps (XP, SoulPoints, EmpathyPoints)
  const daily = getDailyEconomy(characterId, date);
  const remainingXp = Math.max(0, daily.maxDailyXp - daily.xpEarned);
  const cappedXp = Math.min(totalXp, remainingXp);

  const remainingSp = Math.max(0, MAX_DAILY_SOULPOINTS - daily.soulPointsEarned);
  const cappedSoulPoints = Math.min(totalSoulPoints, remainingSp);

  const remainingEp = Math.max(0, MAX_DAILY_EMPATHYPOINTS - daily.empathyPointsEarned);
  const cappedEmpathyPoints = Math.min(totalEmpathyPoints, remainingEp);

  // Update daily tracking
  daily.xpEarned += cappedXp;
  daily.soulPointsEarned += cappedSoulPoints;
  daily.empathyPointsEarned += cappedEmpathyPoints;

  const restReminder = daily.xpEarned >= daily.maxDailyXp;
  if (restReminder) daily.restReminderSent = true;

  return {
    rewards,
    totalXp,
    totalSoulPoints: cappedSoulPoints,
    totalEmpathyPoints: cappedEmpathyPoints,
    streakBonus,
    cappedXp,
    restReminder,
  };
}

/** Get instant reward presets (for UI display) */
export function getInstantRewardPresets(): Record<string, { xp: number; soulPoints: number; empathyPoints: number }> {
  return { ...INSTANT_REWARDS };
}
