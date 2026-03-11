// ============================================
// SoulFriend GameFi — Action Data Logging
// ============================================
//
// Mỗi hành động tạo dữ liệu nghiên cứu.
// Sau nhiều tháng → Psychological Dynamics Dataset.

import { ActionLog, ActionType, GrowthStats } from '../core/types';

// ── In-memory log store ──────────────────────

const MAX_LOGS = 10000;
const logs: ActionLog[] = [];
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
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
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
  logs.push(...savedLogs.slice(-MAX_LOGS));
  logCounter = savedLogs.length;
}

/** Clear logs (for testing only) */
export function clearLogs(): void {
  logs.length = 0;
  logCounter = 0;
}
