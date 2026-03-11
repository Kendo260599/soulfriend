// ============================================
// SoulFriend GameFi — Action Data Logging
// ============================================
//
// Mỗi hành động tạo dữ liệu nghiên cứu.
// Sau nhiều tháng → Psychological Dynamics Dataset.

import { ActionLog, ActionType, GrowthStats } from '../core/types';

// ── In-memory log store ──────────────────────

const MAX_LOGS = 10000;
const MAX_LOGS_PER_USER = 500;
const logs: ActionLog[] = [];
const userLogCount: Map<string, number> = new Map();
let logCounter = 0;

/** Record an action */
export function logAction(
  characterId: string,
  actionType: ActionType,
  growthChange: Partial<GrowthStats>,
  questId?: string,
  emotion?: string,
): ActionLog {
  logCounter += 1;
  const entry: ActionLog = {
    id: `log_${Date.now()}_${logCounter}`,
    characterId,
    actionType,
    growthChange,
    questId,
    emotion,
    timestamp: Date.now(),
  };

  // Per-user eviction: if user exceeds limit, remove their oldest log
  const count = userLogCount.get(characterId) ?? 0;
  if (count >= MAX_LOGS_PER_USER) {
    const idx = logs.findIndex(l => l.characterId === characterId);
    if (idx >= 0) {
      logs.splice(idx, 1);
    } else {
      userLogCount.set(characterId, 0);
    }
  } else {
    userLogCount.set(characterId, count + 1);
  }

  logs.push(entry);

  // Global cap as safety net
  if (logs.length > MAX_LOGS) {
    const removed = logs.splice(0, logs.length - MAX_LOGS);
    // Adjust per-user counts
    for (const r of removed) {
      const c = userLogCount.get(r.characterId);
      if (c !== undefined && c > 0) userLogCount.set(r.characterId, c - 1);
    }
  }

  return entry;
}

/** Get all logs for a character */
export function getLogsForCharacter(characterId: string): ActionLog[] {
  return logs.filter((l) => l.characterId === characterId);
}

/** Get all logs (for dataset export) */
export function getAllLogs(): ActionLog[] {
  return [...logs];
}

/** Get log count */
export function getLogCount(): number {
  return logs.length;
}

/** Load logs from persistent storage (for persistence restore) */
export function loadLogs(savedLogs: ActionLog[]): void {
  logs.length = 0;
  userLogCount.clear();
  logs.push(...savedLogs.slice(-MAX_LOGS));
  // Rebuild per-user counts
  for (const l of logs) {
    userLogCount.set(l.characterId, (userLogCount.get(l.characterId) ?? 0) + 1);
  }
  logCounter = savedLogs.length;
}

/** Clear logs (for testing only) */
export function clearLogs(): void {
  logs.length = 0;
  userLogCount.clear();
  logCounter = 0;
}
