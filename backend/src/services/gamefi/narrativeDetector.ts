// ============================================
// SoulFriend GameFi — Narrative Detector (Backend)
// ============================================
// Detects PsychEventType from user message using keyword + phrase matching.
// Vietnamese + English support.

import { PsychEventType } from './types';

// ══════════════════════════════════════════════
// KEYWORD DICTIONARIES
// ══════════════════════════════════════════════

const KEYWORDS: Record<PsychEventType, string[]> = {
  journal_entry: [
    'nhật ký', 'hôm nay tôi', 'ghi lại', 'viết về', 'suy nghĩ của tôi',
    'diary', 'today i', 'journal', 'write about', 'my thoughts',
    'ngày hôm nay', 'tâm sự', 'ghi chép',
  ],
  story_shared: [
    'câu chuyện', 'kể về', 'chia sẻ', 'trải nghiệm', 'kỷ niệm',
    'story', 'share', 'experience', 'tell about', 'memory',
    'chuyện của tôi', 'tôi muốn kể', 'hồi nhỏ',
  ],
  emotion_checkin: [
    'cảm thấy', 'buồn', 'vui', 'lo lắng', 'stress', 'sợ', 'giận',
    'cô đơn', 'mệt mỏi', 'bất an', 'hạnh phúc', 'thoải mái',
    'feel', 'sad', 'happy', 'anxious', 'angry', 'lonely', 'tired',
    'worried', 'excited', 'cảm xúc', 'tâm trạng',
  ],
  user_helped_user: [
    'giúp đỡ', 'hỗ trợ', 'lắng nghe', 'khuyên', 'an ủi',
    'helped', 'support', 'listen', 'advice', 'comfort',
    'tôi đã giúp', 'động viên', 'chia sẻ kinh nghiệm',
  ],
  quest_completed: [
    'hoàn thành', 'xong rồi', 'đã làm', 'bài tập', 'quest',
    'completed', 'done', 'finished', 'exercise',
    'tôi đã hoàn thành', 'xong bài', 'làm xong',
  ],
};

// Phrase patterns with higher weight
const PHRASE_PATTERNS: Array<{ pattern: string; eventType: PsychEventType; weight: number }> = [
  { pattern: 'hôm nay tôi muốn viết', eventType: 'journal_entry', weight: 3 },
  { pattern: 'tôi muốn ghi lại', eventType: 'journal_entry', weight: 3 },
  { pattern: 'nhật ký hôm nay', eventType: 'journal_entry', weight: 3 },
  { pattern: 'tôi muốn kể', eventType: 'story_shared', weight: 3 },
  { pattern: 'tôi muốn chia sẻ', eventType: 'story_shared', weight: 3 },
  { pattern: 'câu chuyện của tôi', eventType: 'story_shared', weight: 3 },
  { pattern: 'tôi cảm thấy', eventType: 'emotion_checkin', weight: 3 },
  { pattern: 'tâm trạng hôm nay', eventType: 'emotion_checkin', weight: 3 },
  { pattern: 'hôm nay tôi thấy', eventType: 'emotion_checkin', weight: 2 },
  { pattern: 'tôi đang rất', eventType: 'emotion_checkin', weight: 2 },
  { pattern: 'tôi đã giúp', eventType: 'user_helped_user', weight: 3 },
  { pattern: 'giúp được bạn', eventType: 'user_helped_user', weight: 3 },
  { pattern: 'tôi đã hoàn thành', eventType: 'quest_completed', weight: 3 },
  { pattern: 'xong rồi nè', eventType: 'quest_completed', weight: 3 },
  { pattern: 'tôi đã làm xong', eventType: 'quest_completed', weight: 3 },
  { pattern: 'i feel', eventType: 'emotion_checkin', weight: 2 },
  { pattern: 'i helped', eventType: 'user_helped_user', weight: 2 },
  { pattern: 'i completed', eventType: 'quest_completed', weight: 2 },
];

// ══════════════════════════════════════════════
// DETECTION LOGIC
// ══════════════════════════════════════════════

/**
 * Detect event type from a user message.
 * Returns the best matching PsychEventType or null if no match.
 */
export function detectEvent(message: string): PsychEventType | null {
  if (!message || typeof message !== 'string') return null;

  const lower = message.toLowerCase().normalize('NFC');
  const scores: Record<PsychEventType, number> = {
    journal_entry: 0,
    story_shared: 0,
    emotion_checkin: 0,
    user_helped_user: 0,
    quest_completed: 0,
  };

  // Phase 1: Keyword matching
  for (const [eventType, keywords] of Object.entries(KEYWORDS) as [PsychEventType, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[eventType] += 1;
      }
    }
  }

  // Phase 2: Phrase patterns (higher weight)
  for (const { pattern, eventType, weight } of PHRASE_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      scores[eventType] += weight;
    }
  }

  // Find best match with threshold >= 1
  let bestType: PsychEventType | null = null;
  let bestScore = 0;
  for (const [eventType, score] of Object.entries(scores) as [PsychEventType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestType = eventType;
    }
  }

  return bestScore >= 1 ? bestType : null;
}

/**
 * Detect event with full score details (for debugging).
 */
export function detectEventWithScores(message: string): {
  detected: PsychEventType | null;
  scores: Record<PsychEventType, number>;
} {
  if (!message || typeof message !== 'string') {
    return {
      detected: null,
      scores: { journal_entry: 0, story_shared: 0, emotion_checkin: 0, user_helped_user: 0, quest_completed: 0 },
    };
  }

  const lower = message.toLowerCase().normalize('NFC');
  const scores: Record<PsychEventType, number> = {
    journal_entry: 0,
    story_shared: 0,
    emotion_checkin: 0,
    user_helped_user: 0,
    quest_completed: 0,
  };

  for (const [eventType, keywords] of Object.entries(KEYWORDS) as [PsychEventType, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) scores[eventType] += 1;
    }
  }

  for (const { pattern, eventType, weight } of PHRASE_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) scores[eventType] += weight;
  }

  let bestType: PsychEventType | null = null;
  let bestScore = 0;
  for (const [eventType, score] of Object.entries(scores) as [PsychEventType, number][]) {
    if (score > bestScore) { bestScore = score; bestType = eventType; }
  }

  return { detected: bestScore >= 1 ? bestType : null, scores };
}
