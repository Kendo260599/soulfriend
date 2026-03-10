// ============================================
// SoulFriend GameFi — Psychological State Engine
// ============================================
// "Bộ não vật lý" của thế giới nội tâm.
// P(t) = [E, S, M, C, R] — state vector
// Mỗi hành động thay đổi trạng thái.

import {
  GrowthStats,
  Character,
  StateZone,
  EmotionalSignal,
  StateSnapshot,
  RecoveryEvent,
  StateTriggerDef,
  SafetyAlert,
} from '../core/types';

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════

/** State zone thresholds (based on GrowthScore) */
const STATE_ZONES: { zone: StateZone; minScore: number }[] = [
  { zone: 'disorientation',   minScore: 0 },
  { zone: 'self_exploration',  minScore: 20 },
  { zone: 'stabilization',    minScore: 40 },
  { zone: 'growth',           minScore: 60 },
  { zone: 'mentor_stage',     minScore: 80 },
];

/** Time decay factor — trạng thái giảm nhẹ khi không hoạt động */
const DECAY_FACTOR = 0.99;

/** Ngưỡng emotional signal để kích hoạt safety alert */
const SIGNAL_THRESHOLD = 60;

/** Giới hạn store size — tránh memory leak */
const MAX_STORE_SIZE = 1000;

/** Số đường dây hỗ trợ sức khỏe tâm thần quốc gia (Vietnam) */
const CRISIS_HOTLINE = '1800-599-100';

/** Predefined state triggers */
const DEFAULT_TRIGGERS: StateTriggerDef[] = [
  {
    id: 'trigger_narrative_reframing',
    description: 'E > 50 và C > 50 → mở skill Narrative Reframing',
    unlocks: 'skill_narrative_reframing',
    checkFn: (s) => s.emotionalAwareness > 50 && s.cognitiveFlexibility > 50,
  },
  {
    id: 'trigger_community_guide',
    description: 'R > 60 → role Community Guide',
    unlocks: 'role_community_guide',
    checkFn: (s) => s.relationshipQuality > 60,
  },
  {
    id: 'trigger_deep_reflection',
    description: 'E > 40 và M > 40 → mở quest deep reflection',
    unlocks: 'quest_deep_reflection',
    checkFn: (s) => s.emotionalAwareness > 40 && s.meaning > 40,
  },
  {
    id: 'trigger_mentor_path',
    description: 'Tất cả stat > 60 → mentor path',
    unlocks: 'path_mentor',
    checkFn: (s) =>
      s.emotionalAwareness > 60 &&
      s.psychologicalSafety > 60 &&
      s.meaning > 60 &&
      s.cognitiveFlexibility > 60 &&
      s.relationshipQuality > 60,
  },
  {
    id: 'trigger_stabilization_quest',
    description: 'S > 50 → mở khu vực an toàn mới',
    unlocks: 'area_safe_haven',
    checkFn: (s) => s.psychologicalSafety > 50,
  },
];

// ══════════════════════════════════════════════
// IN-MEMORY STORES
// ══════════════════════════════════════════════

const snapshotStore: StateSnapshot[] = [];
const signalStore: EmotionalSignal[] = [];
const recoveryStore: RecoveryEvent[] = [];
const alertStore: SafetyAlert[] = [];
const triggers: StateTriggerDef[] = [...DEFAULT_TRIGGERS];

// ══════════════════════════════════════════════
// PUBLIC API — Init & Reset
// ══════════════════════════════════════════════

/** Reset state engine (testing) */
export function resetStateEngine(): void {
  snapshotStore.length = 0;
  signalStore.length = 0;
  recoveryStore.length = 0;
  alertStore.length = 0;
  triggers.length = 0;
  triggers.push(...DEFAULT_TRIGGERS);
}

/** Initialize state engine (load default triggers) */
export function initStateEngine(): void {
  // Ensure triggers are loaded (idempotent)
  if (triggers.length === 0) {
    triggers.push(...DEFAULT_TRIGGERS);
  }
}

// ══════════════════════════════════════════════
// STATE ZONE DETECTION
// ══════════════════════════════════════════════

/** Calculate growth score from stats */
export function calcGrowthScore(stats: GrowthStats): number {
  const sum =
    stats.emotionalAwareness +
    stats.psychologicalSafety +
    stats.meaning +
    stats.cognitiveFlexibility +
    stats.relationshipQuality;
  return Math.round(sum / 5);
}

/** Determine state zone from growth score */
export function getStateZone(growthScore: number): StateZone {
  let zone: StateZone = 'disorientation';
  for (const entry of STATE_ZONES) {
    if (growthScore >= entry.minScore) zone = entry.zone;
  }
  return zone;
}

/** Get all state zone definitions */
export function getStateZones(): readonly { zone: StateZone; minScore: number }[] {
  return STATE_ZONES;
}

// ══════════════════════════════════════════════
// STATE SNAPSHOTS — quỹ đạo tâm lý
// ══════════════════════════════════════════════

/** Take a snapshot of current state */
export function takeSnapshot(character: Character): StateSnapshot {
  const growthScore = calcGrowthScore(character.growthStats);
  const snapshot: StateSnapshot = {
    characterId: character.id,
    timestamp: Date.now(),
    state: { ...character.growthStats },
    growthScore,
    zone: getStateZone(growthScore),
  };
  snapshotStore.push(snapshot);
  if (snapshotStore.length > MAX_STORE_SIZE) snapshotStore.splice(0, snapshotStore.length - MAX_STORE_SIZE);
  return snapshot;
}

/** Get trajectory (all snapshots) for a character */
export function getTrajectory(characterId: string): StateSnapshot[] {
  return snapshotStore.filter((s) => s.characterId === characterId);
}

/** Get the latest snapshot */
export function getLatestSnapshot(characterId: string): StateSnapshot | undefined {
  const charSnapshots = getTrajectory(characterId);
  return charSnapshots.length > 0 ? charSnapshots[charSnapshots.length - 1] : undefined;
}

/** Get total snapshot count */
export function getSnapshotCount(): number {
  return snapshotStore.length;
}

// ══════════════════════════════════════════════
// TIME DECAY — trạng thái giảm khi không hoạt động
// ══════════════════════════════════════════════

/** Apply time decay to stats (one day of inactivity) */
export function applyDecay(stats: GrowthStats, days: number = 1): GrowthStats {
  const factor = Math.pow(DECAY_FACTOR, days);
  return {
    emotionalAwareness: Math.round(stats.emotionalAwareness * factor),
    psychologicalSafety: Math.round(stats.psychologicalSafety * factor),
    meaning: Math.round(stats.meaning * factor),
    cognitiveFlexibility: Math.round(stats.cognitiveFlexibility * factor),
    relationshipQuality: Math.round(stats.relationshipQuality * factor),
  };
}

/** Get decay factor */
export function getDecayFactor(): number {
  return DECAY_FACTOR;
}

// ══════════════════════════════════════════════
// EMOTIONAL SIGNAL DETECTION
// ══════════════════════════════════════════════

/** Record an emotional signal */
export function recordSignal(
  characterId: string,
  type: EmotionalSignal['type'],
  intensity: number,
): EmotionalSignal {
  const signal: EmotionalSignal = {
    characterId,
    type,
    intensity: Math.max(0, Math.min(100, intensity)),
    timestamp: Date.now(),
  };
  signalStore.push(signal);
  if (signalStore.length > MAX_STORE_SIZE) signalStore.splice(0, signalStore.length - MAX_STORE_SIZE);
  return signal;
}

/** Get signals for a character */
export function getSignals(characterId: string): EmotionalSignal[] {
  return signalStore.filter((s) => s.characterId === characterId);
}

/** Check if any signal exceeds threshold */
export function hasHighSignal(characterId: string): boolean {
  return getSignals(characterId).some((s) => s.intensity >= SIGNAL_THRESHOLD);
}

/** Get signal threshold constant */
export function getSignalThreshold(): number {
  return SIGNAL_THRESHOLD;
}

// ══════════════════════════════════════════════
// RECOVERY DETECTION
// ══════════════════════════════════════════════

/** Detect recovery: zone improved from previous snapshot */
export function detectRecovery(characterId: string): RecoveryEvent | null {
  const trajectory = getTrajectory(characterId);
  if (trajectory.length < 2) return null;

  const prev = trajectory[trajectory.length - 2];
  const curr = trajectory[trajectory.length - 1];

  const zoneOrder: StateZone[] = ['disorientation', 'self_exploration', 'stabilization', 'growth', 'mentor_stage'];
  const prevIdx = zoneOrder.indexOf(prev.zone);
  const currIdx = zoneOrder.indexOf(curr.zone);

  if (currIdx > prevIdx) {
    const event: RecoveryEvent = {
      characterId,
      detectedAt: Date.now(),
      fromZone: prev.zone,
      toZone: curr.zone,
    };
    recoveryStore.push(event);
    return event;
  }
  return null;
}

/** Get all recovery events for a character */
export function getRecoveryEvents(characterId: string): RecoveryEvent[] {
  return recoveryStore.filter((r) => r.characterId === characterId);
}

// ══════════════════════════════════════════════
// TRIGGER CONDITIONS
// ══════════════════════════════════════════════

/** Check which triggers are activated by current stats */
export function checkTriggers(stats: GrowthStats): StateTriggerDef[] {
  return triggers.filter((t) => t.checkFn(stats));
}

/** Get all trigger definitions */
export function getAllTriggers(): StateTriggerDef[] {
  return [...triggers];
}

/** Add a custom trigger */
export function addTrigger(trigger: StateTriggerDef): void {
  triggers.push(trigger);
}

// ══════════════════════════════════════════════
// SAFETY LAYER — phát hiện nguy cơ
// ══════════════════════════════════════════════

/** Check safety and generate alerts if needed */
export function checkSafety(character: Character): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const stats = character.growthStats;

  // Low psychological safety
  if (stats.psychologicalSafety <= 10) {
    alerts.push({
      characterId: character.id,
      type: 'low_safety',
      severity: stats.psychologicalSafety <= 5 ? 'high' : 'medium',
      timestamp: Date.now(),
      suggestedAction: 'Gợi ý quest nhẹ nhàng về an toàn tâm lý. Hiển thị thông điệp hỗ trợ.',
      shouldPauseGame: stats.psychologicalSafety <= 5,
      escalationRequired: stats.psychologicalSafety <= 5,
      crisisHotline: stats.psychologicalSafety <= 5 ? CRISIS_HOTLINE : undefined,
    });
  }

  // High loneliness signal
  const lonelySignals = getSignals(character.id).filter((s) => s.type === 'loneliness');
  const recentLonely = lonelySignals.filter((s) => s.intensity >= SIGNAL_THRESHOLD);
  if (recentLonely.length > 0) {
    const isHigh = recentLonely.some((s) => s.intensity >= 80);
    alerts.push({
      characterId: character.id,
      type: 'high_loneliness',
      severity: isHigh ? 'high' : 'medium',
      timestamp: Date.now(),
      suggestedAction: 'Gợi ý kết nối cộng đồng. Quest: "Một Bước Kết Nối".',
      escalationRequired: isHigh,
    });
  }

  // Crisis signal (hopelessness) — highest severity
  const hopelessSignals = getSignals(character.id).filter(
    (s) => s.type === 'hopelessness' && s.intensity >= SIGNAL_THRESHOLD,
  );
  if (hopelessSignals.length > 0) {
    alerts.push({
      characterId: character.id,
      type: 'crisis_signal',
      severity: 'high',
      timestamp: Date.now(),
      suggestedAction: 'QUAN TRỎNG: Hiển thị thông điệp hỗ trợ và hướng dẫn liên hệ chuyên gia tâm lý ngay.',
      shouldPauseGame: true,
      escalationRequired: true,
      crisisHotline: CRISIS_HOTLINE,
    });
  }

  for (const a of alerts) alertStore.push(a);
  if (alertStore.length > MAX_STORE_SIZE) alertStore.splice(0, alertStore.length - MAX_STORE_SIZE);
  return alerts;
}

/** Get all safety alerts */
export function getSafetyAlerts(characterId: string): SafetyAlert[] {
  return alertStore.filter((a) => a.characterId === characterId);
}

/** Get total alert count */
export function getAlertCount(): number {
  return alertStore.length;
}

/** Get crisis hotline number */
export function getCrisisHotline(): string {
  return CRISIS_HOTLINE;
}

// ══════════════════════════════════════════════
// STATE VISUALIZATION DATA — radar chart
// ══════════════════════════════════════════════

/** Get radar chart data for a character */
export function getRadarChartData(stats: GrowthStats): { label: string; value: number }[] {
  return [
    { label: 'Nhận diện cảm xúc', value: stats.emotionalAwareness },
    { label: 'An toàn tâm lý',    value: stats.psychologicalSafety },
    { label: 'Ý nghĩa sống',      value: stats.meaning },
    { label: 'Linh hoạt nhận thức', value: stats.cognitiveFlexibility },
    { label: 'Kết nối xã hội',    value: stats.relationshipQuality },
  ];
}
