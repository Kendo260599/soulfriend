const DAILY_QUEST_ID_RE = /^(quest_[a-z0-9_]+)_(\d{4}-\d{2}-\d{2})$/;

export function utcDateKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function parseDailyQuestId(questId: string): { prefix: string; date: string } | null {
  const m = questId.match(DAILY_QUEST_ID_RE);
  if (!m) return null;
  return { prefix: m[1], date: m[2] };
}

export function isTodayDailyQuestId(questId: string, now: Date = new Date()): boolean {
  const parsed = parseDailyQuestId(questId);
  if (!parsed) return false;
  return parsed.date === utcDateKey(now);
}
