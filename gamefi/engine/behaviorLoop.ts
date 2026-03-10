// ============================================
// SoulFriend GameFi — Behavioral Loop Engine
// ============================================
// Daily / Weekly / Seasonal loops + Meaning Loop
// Trái tim của game — vòng lặp hành vi

import {
  DailyRitual,
  WeeklyChallenge,
  SeasonalGoal,
  MeaningShift,
} from '../core/types';

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const dailyRitualMap: Map<string, DailyRitual> = new Map();       // key: charId_date
const weeklyMap: Map<string, WeeklyChallenge> = new Map();
const seasonalMap: Map<string, SeasonalGoal> = new Map();
const meaningShifts: MeaningShift[] = [];

/** Giới hạn store size */
const MAX_MEANING_SHIFTS = 1000;

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ritualKey(charId: string, date: string): string {
  return `${charId}_${date}`;
}

// ══════════════════════════════════════════════
// DAILY RITUAL — 5 phút mỗi ngày
// ══════════════════════════════════════════════

/** Reset all behavioral loop data (testing) */
export function resetBehaviorLoops(): void {
  dailyRitualMap.clear();
  weeklyMap.clear();
  seasonalMap.clear();
  meaningShifts.length = 0;
}

/** Get or create daily ritual for a character */
export function getDailyRitual(characterId: string, date?: string): DailyRitual {
  const d = date ?? todayStr();
  const key = ritualKey(characterId, d);
  let ritual = dailyRitualMap.get(key);
  if (!ritual) {
    ritual = {
      characterId,
      date: d,
      checkinDone: false,
      reflectionDone: false,
      communityDone: false,
      completed: false,
    };
    dailyRitualMap.set(key, ritual);
  }
  return ritual;
}

/** Mark a daily ritual step as done */
export function completeDailyStep(
  characterId: string,
  step: 'checkin' | 'reflection' | 'community',
  date?: string,
): DailyRitual {
  const ritual = getDailyRitual(characterId, date);
  if (step === 'checkin') ritual.checkinDone = true;
  if (step === 'reflection') ritual.reflectionDone = true;
  if (step === 'community') ritual.communityDone = true;

  ritual.completed = ritual.checkinDone && ritual.reflectionDone && ritual.communityDone;
  return ritual;
}

/** Check if daily ritual is completed */
export function isDailyRitualComplete(characterId: string, date?: string): boolean {
  return getDailyRitual(characterId, date).completed;
}

/** Daily ritual completion reward: +15 XP, +5 SoulPoint */
export function getDailyRitualReward(): { xp: number; soulPoints: number } {
  return { xp: 15, soulPoints: 5 };
}

// ══════════════════════════════════════════════
// WEEKLY CHALLENGE
// ══════════════════════════════════════════════

/** Các thử thách tuần mẫu */
const WEEKLY_TEMPLATES: Omit<WeeklyChallenge, 'completed' | 'weekStart'>[] = [
  {
    id: 'weekly_rewrite_story',
    title: 'Viết Lại Một Câu Chuyện',
    description: 'Viết lại một câu chuyện khó khăn trong cuộc đời bạn từ góc nhìn trưởng thành hơn.',
    xpReward: 50,
    badgeId: 'badge_cau_chuyen_moi',
  },
  {
    id: 'weekly_gratitude_7',
    title: 'Bảy Ngày Biết Ơn',
    description: 'Mỗi ngày viết 3 điều bạn biết ơn. Liên tục 7 ngày.',
    xpReward: 40,
  },
  {
    id: 'weekly_help_3',
    title: 'Ba Lần Giúp Đỡ',
    description: 'Hỗ trợ 3 người khác trong cộng đồng trong tuần này.',
    xpReward: 45,
    badgeId: 'badge_nguoi_ho_tro_tuan',
  },
  {
    id: 'weekly_emotion_map',
    title: 'Bản Đồ Cảm Xúc',
    description: 'Ghi lại cảm xúc của bạn mỗi ngày trong tuần. Cuối tuần nhìn lại pattern.',
    xpReward: 40,
  },
  {
    id: 'weekly_deep_reflection',
    title: 'Suy Ngẫm Sâu',
    description: 'Viết một bài reflection dài về điều bạn học được gần đây.',
    xpReward: 50,
    badgeId: 'badge_suy_ngam_sau',
  },
];

/** Initialize weekly challenges */
export function initWeeklyChallenges(weekStart?: string): void {
  const ws = weekStart ?? todayStr();
  for (const t of WEEKLY_TEMPLATES) {
    weeklyMap.set(t.id, { ...t, completed: false, weekStart: ws });
  }
}

/** Get all weekly challenges */
export function getAllWeeklyChallenges(): WeeklyChallenge[] {
  return Array.from(weeklyMap.values());
}

/** Get a weekly challenge by ID */
export function getWeeklyChallenge(id: string): WeeklyChallenge | undefined {
  return weeklyMap.get(id);
}

/** Complete a weekly challenge */
export function completeWeeklyChallenge(id: string): WeeklyChallenge | undefined {
  const ch = weeklyMap.get(id);
  if (!ch || ch.completed) return ch;
  ch.completed = true;
  return ch;
}

// ══════════════════════════════════════════════
// SEASONAL GOAL — 1 đến 3 tháng
// ══════════════════════════════════════════════

/** Các mục tiêu mùa mẫu */
const SEASONAL_TEMPLATES: Omit<SeasonalGoal, 'progress' | 'completed'>[] = [
  {
    id: 'season_tu_nhan_thuc',
    title: 'Hành Trình Tự Nhận Thức',
    requirements: { questsCompleted: 40, reflections: 10, empathyActions: 5 },
    rewardTitle: 'Người Thấu Hiểu',
    xpReward: 200,
  },
  {
    id: 'season_ket_noi',
    title: 'Hành Trình Kết Nối',
    requirements: { questsCompleted: 30, reflections: 5, empathyActions: 15 },
    rewardTitle: 'Người Đồng Hành',
    xpReward: 200,
  },
  {
    id: 'season_y_nghia',
    title: 'Hành Trình Ý Nghĩa',
    requirements: { questsCompleted: 50, reflections: 15, empathyActions: 10 },
    rewardTitle: 'Người Dẫn Đường',
    xpReward: 300,
  },
];

/** Initialize seasonal goals */
export function initSeasonalGoals(): void {
  for (const t of SEASONAL_TEMPLATES) {
    seasonalMap.set(t.id, {
      ...t,
      progress: { questsCompleted: 0, reflections: 0, empathyActions: 0 },
      completed: false,
    });
  }
}

/** Get all seasonal goals */
export function getAllSeasonalGoals(): SeasonalGoal[] {
  return Array.from(seasonalMap.values());
}

/** Get a seasonal goal by ID */
export function getSeasonalGoal(id: string): SeasonalGoal | undefined {
  return seasonalMap.get(id);
}

/** Update progress on a seasonal goal */
export function updateSeasonalProgress(
  id: string,
  delta: Partial<{ questsCompleted: number; reflections: number; empathyActions: number }>,
): SeasonalGoal | undefined {
  const goal = seasonalMap.get(id);
  if (!goal || goal.completed) return goal;

  goal.progress.questsCompleted += delta.questsCompleted ?? 0;
  goal.progress.reflections += delta.reflections ?? 0;
  goal.progress.empathyActions += delta.empathyActions ?? 0;

  // Check completion
  const r = goal.requirements;
  if (
    goal.progress.questsCompleted >= r.questsCompleted &&
    goal.progress.reflections >= r.reflections &&
    goal.progress.empathyActions >= r.empathyActions
  ) {
    goal.completed = true;
  }
  return goal;
}

// ══════════════════════════════════════════════
// MEANING LOOP — Narrative Shift Detection
// ══════════════════════════════════════════════

/** Record a meaning shift (narrative change) */
export function recordMeaningShift(
  characterId: string,
  from: string,
  to: string,
): MeaningShift {
  const shift: MeaningShift = {
    characterId,
    from,
    to,
    detectedAt: Date.now(),
  };
  meaningShifts.push(shift);
  if (meaningShifts.length > MAX_MEANING_SHIFTS) meaningShifts.splice(0, meaningShifts.length - MAX_MEANING_SHIFTS);
  return shift;
}

/** Get all meaning shifts for a character */
export function getMeaningShifts(characterId: string): MeaningShift[] {
  return meaningShifts.filter((s) => s.characterId === characterId);
}

/** Get total meaning shift count */
export function getMeaningShiftCount(): number {
  return meaningShifts.length;
}

/** Core behavioral loop description (for UI / documentation) */
export function getCoreLoopDescription(): string[] {
  return [
    '1. Nhận quest',
    '2. Thực hiện hành động (viết, chia sẻ, hỗ trợ)',
    '3. AI phân tích',
    '4. Nhận XP + growth',
    '5. Mở skill / khu vực mới',
    '6. Quest mới',
  ];
}
