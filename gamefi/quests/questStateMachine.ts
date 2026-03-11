// ============================================
// Quest State Machine — Pure Core Module
// ============================================
// Linear state machine for quest lifecycle.
// No backend/DB dependencies — pure logic + in-memory store.

import type { QuestState } from '../core/types';

// ── Transition Rules ─────────────────────────

/** Allowed transitions: each state maps to its single valid successor */
const ALLOWED_TRANSITIONS: Record<QuestState, QuestState | null> = {
  locked: 'available',
  available: 'in_progress',
  in_progress: 'awaiting_validation',
  awaiting_validation: 'completed',
  completed: 'rewarded',
  rewarded: null, // terminal state
};

/** Ordered state chain for path computation */
const STATE_ORDER: readonly QuestState[] = [
  'locked',
  'available',
  'in_progress',
  'awaiting_validation',
  'completed',
  'rewarded',
];

// ── Errors ───────────────────────────────────

export class InvalidTransitionError extends Error {
  constructor(questId: string, from: QuestState, to: QuestState) {
    super(`Invalid quest transition: ${from} → ${to} for quest ${questId}`);
    this.name = 'InvalidTransitionError';
  }
}

// ── Transition Logic ─────────────────────────

/** Check if a single-step transition is allowed */
export function canTransition(from: QuestState, to: QuestState): boolean {
  return ALLOWED_TRANSITIONS[from] === to;
}

/**
 * Validate and perform a single-step transition.
 * Throws InvalidTransitionError if the transition is not allowed.
 */
export function transition(questId: string, current: QuestState, target: QuestState): QuestState {
  if (!canTransition(current, target)) {
    throw new InvalidTransitionError(questId, current, target);
  }
  return target;
}

/**
 * Advance a quest through all intermediate states to reach `target`.
 * Only moves forward — cannot go backward.
 * Throws InvalidTransitionError if target is at or before current.
 */
export function computePath(current: QuestState, target: QuestState): QuestState[] {
  const fromIdx = STATE_ORDER.indexOf(current);
  const toIdx = STATE_ORDER.indexOf(target);
  if (toIdx <= fromIdx) return []; // can't go backward or stay
  return STATE_ORDER.slice(fromIdx + 1, toIdx + 1) as QuestState[];
}

// ── Per-User Quest State Store ───────────────

const questStateStore = new Map<string, Map<string, QuestState>>();

/** Get the current state of a quest for a user (defaults to 'locked') */
export function getQuestState(userId: string, questId: string): QuestState {
  return questStateStore.get(userId)?.get(questId) ?? 'locked';
}

/** Set quest state directly (use for restoring from DB) */
export function setQuestState(userId: string, questId: string, state: QuestState): void {
  if (!questStateStore.has(userId)) questStateStore.set(userId, new Map());
  questStateStore.get(userId)!.set(questId, state);
}

/**
 * Advance a quest to the target state, walking through all intermediate states.
 * Returns the new state. Throws if target is unreachable.
 */
export function advanceQuestTo(userId: string, questId: string, target: QuestState): QuestState {
  const current = getQuestState(userId, questId);
  if (current === target) return current; // already there

  const path = computePath(current, target);
  if (path.length === 0) {
    throw new InvalidTransitionError(questId, current, target);
  }

  for (const step of path) {
    transition(questId, getQuestState(userId, questId), step);
    setQuestState(userId, questId, step);
  }
  return target;
}

/**
 * Check if a quest has already been rewarded (terminal state).
 * Prevents double-reward.
 */
export function hasBeenRewarded(userId: string, questId: string): boolean {
  return getQuestState(userId, questId) === 'rewarded';
}

/** Get all quest states for a user as a plain record (for persistence) */
export function getAllQuestStates(userId: string): Record<string, QuestState> {
  const map = questStateStore.get(userId);
  if (!map) return {};
  return Object.fromEntries(map);
}

/** Restore quest states from a persisted record (called on DB load) */
export function restoreQuestStates(userId: string, states: Record<string, QuestState>): void {
  const map = new Map<string, QuestState>();
  for (const [questId, state] of Object.entries(states)) {
    if (STATE_ORDER.includes(state)) {
      map.set(questId, state);
    }
  }
  questStateStore.set(userId, map);
}

/** Clear all quest states (used by resetEngine) */
export function resetQuestStates(): void {
  questStateStore.clear();
}
