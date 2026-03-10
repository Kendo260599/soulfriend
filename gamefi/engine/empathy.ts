// ============================================
// SoulFriend GameFi — Empathy Reputation System
// ============================================
//
// Internet thường thưởng cho toxic behavior.
// SoulFriend làm ngược lại — thưởng sự đồng cảm.

import { Character, EmpathyRank } from '../core/types';

// ── Empathy rank thresholds ──────────────────

const EMPATHY_RANKS: { rank: EmpathyRank; minScore: number }[] = [
  { rank: 'Người Lắng Nghe', minScore: 0 },
  { rank: 'Người Đồng Cảm',  minScore: 20 },
  { rank: 'Người Hỗ Trợ',    minScore: 50 },
  { rank: 'Người Dẫn Đường',  minScore: 100 },
];

// ── Scoring deltas ───────────────────────────

type EmpathyAction = 'supportive_reply' | 'positive_feedback' | 'help_others'
  | 'toxic_response' | 'judgement';

const EMPATHY_DELTAS: Record<EmpathyAction, number> = {
  supportive_reply:  3,
  positive_feedback: 2,
  help_others:       4,
  toxic_response:   -5,
  judgement:        -3,
};

// ── Functions ────────────────────────────────

/** Calculate the empathy rank based on current score */
export function calculateEmpathyRank(score: number): EmpathyRank {
  let rank: EmpathyRank = 'Người Lắng Nghe';
  for (const entry of EMPATHY_RANKS) {
    if (score >= entry.minScore) rank = entry.rank;
  }
  return rank;
}

/** Apply an empathy action and recalculate rank */
export function applyEmpathyAction(
  character: Character,
  action: EmpathyAction,
): Character {
  const delta = EMPATHY_DELTAS[action] ?? 0;
  character.empathyScore = Math.max(0, character.empathyScore + delta);
  character.empathyRank = calculateEmpathyRank(character.empathyScore);
  return character;
}

/** Get the full empathy rank table */
export function getEmpathyRanks(): readonly { rank: EmpathyRank; minScore: number }[] {
  return EMPATHY_RANKS;
}
