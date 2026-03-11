// ============================================
// SoulFriend — AI Narrative Trigger
// ============================================
// Phân tích tin nhắn người dùng → xác định event tâm lý.
//
// Module này KHÔNG sửa đổi AI hoặc chatbot hiện tại.
// Nó chỉ cung cấp hàm detectEvent() để chatbot gọi
// sau khi nhận tin nhắn từ người dùng.
//
// Flow: User message → detectEvent() → PsychEventType

import type { PsychEventType } from '../gamefi/core/eventHandler';

// ══════════════════════════════════════════════
// KEYWORD DICTIONARIES — Vietnamese + English
// ══════════════════════════════════════════════
// NOTE: narrativeEngine.ts has a separate EMOTION_KEYWORDS mapping
// specific emotions (sadness, anxiety, etc.) → keywords for narrative
// generation. Those serve a different classification purpose than these
// event-type detection keywords and are intentionally separate.

/** Từ khóa cho journal_entry (viết nhật ký, chia sẻ suy nghĩ) */
const JOURNAL_KEYWORDS = [
  'nhật ký', 'hôm nay tôi', 'ngày hôm nay', 'viết về',
  'ghi lại', 'nhìn lại ngày', 'cuối ngày', 'sáng nay',
  'diary', 'today i', 'my day', 'journal',
  'tối nay', 'tuần này', 'tháng này',
];

/** Từ khóa cho story_shared (chia sẻ câu chuyện cá nhân) */
const STORY_KEYWORDS = [
  'câu chuyện', 'kể về', 'chia sẻ', 'trải nghiệm',
  'kỷ niệm', 'ngày xưa', 'hồi đó', 'lần đầu',
  'nhớ lại', 'quá khứ', 'đã từng', 'khi tôi',
  'story', 'share', 'experience', 'remember',
  'tôi đã', 'chuyện của tôi', 'muốn kể',
];

/** Từ khóa cho emotion_checkin (nhận diện và chia sẻ cảm xúc) */
const EMOTION_KEYWORDS = [
  'cảm thấy', 'buồn', 'vui', 'lo lắng', 'lo âu',
  'sợ', 'giận', 'tức', 'hạnh phúc', 'cô đơn',
  'mệt mỏi', 'căng thẳng', 'stress', 'áp lực',
  'bất an', 'hoang mang', 'tuyệt vọng', 'hy vọng',
  'feel', 'feeling', 'anxious', 'sad', 'happy',
  'angry', 'lonely', 'tired', 'stressed',
  'khóc', 'đau', 'thất vọng', 'lo', 'sợ hãi',
  'nhẹ nhõm', 'thanh thản', 'bình tĩnh',
];

/** Từ khóa cho user_helped_user (hỗ trợ người khác) */
const HELP_KEYWORDS = [
  'giúp đỡ', 'hỗ trợ', 'giúp bạn', 'chia sẻ với bạn',
  'lắng nghe', 'đồng hành', 'khuyên', 'an ủi',
  'helped', 'support', 'listen', 'encourage',
  'động viên', 'cổ vũ', 'giúp ai đó', 'làm cho người khác',
];

/** Từ khóa cho quest_completed (hoàn thành nhiệm vụ/bài tập) */
const QUEST_KEYWORDS = [
  'hoàn thành', 'xong rồi', 'đã làm', 'đã thực hiện',
  'bài tập', 'nhiệm vụ', 'thử thách', 'quest',
  'completed', 'done', 'finished', 'task',
  'làm xong', 'thực hành', 'đã viết', 'đã thở',
];

// ══════════════════════════════════════════════
// PATTERN PHRASES — ngữ cảnh sâu hơn
// ══════════════════════════════════════════════

/** Cụm từ mạnh (higher weight than keywords) */
const PHRASE_PATTERNS: { pattern: string; event: PsychEventType; weight: number }[] = [
  // Journal
  { pattern: 'hôm nay tôi muốn viết', event: 'journal_entry', weight: 3 },
  { pattern: 'ghi lại suy nghĩ', event: 'journal_entry', weight: 3 },
  { pattern: 'nhìn lại ngày hôm nay', event: 'journal_entry', weight: 3 },

  // Story
  { pattern: 'tôi muốn kể', event: 'story_shared', weight: 3 },
  { pattern: 'có một câu chuyện', event: 'story_shared', weight: 3 },
  { pattern: 'chia sẻ trải nghiệm', event: 'story_shared', weight: 3 },
  { pattern: 'kể cho bạn nghe', event: 'story_shared', weight: 3 },

  // Emotion
  { pattern: 'tôi cảm thấy', event: 'emotion_checkin', weight: 3 },
  { pattern: 'tôi đang rất', event: 'emotion_checkin', weight: 2 },
  { pattern: 'cảm xúc của tôi', event: 'emotion_checkin', weight: 3 },
  { pattern: 'i feel', event: 'emotion_checkin', weight: 3 },
  { pattern: 'i am feeling', event: 'emotion_checkin', weight: 3 },

  // Help
  { pattern: 'tôi đã giúp', event: 'user_helped_user', weight: 3 },
  { pattern: 'giúp đỡ một người', event: 'user_helped_user', weight: 3 },
  { pattern: 'lắng nghe bạn ấy', event: 'user_helped_user', weight: 3 },

  // Quest
  { pattern: 'tôi đã hoàn thành', event: 'quest_completed', weight: 3 },
  { pattern: 'làm xong bài tập', event: 'quest_completed', weight: 3 },
  { pattern: 'đã thực hiện xong', event: 'quest_completed', weight: 3 },
];

// ══════════════════════════════════════════════
// DETECTION ENGINE
// ══════════════════════════════════════════════

interface DetectionScore {
  event: PsychEventType;
  score: number;
}

/**
 * Phân tích tin nhắn và xác định loại psychological event.
 *
 * @param message - Tin nhắn từ người dùng
 * @returns PsychEventType phù hợp nhất, hoặc null nếu không detect được
 */
export function detectEvent(message: string): PsychEventType | null {
  if (!message || message.trim().length === 0) return null;

  const lower = message.toLowerCase();
  const scores: Record<PsychEventType, number> = {
    journal_entry: 0,
    story_shared: 0,
    emotion_checkin: 0,
    user_helped_user: 0,
    quest_completed: 0,
  };

  // Phase 1: Keyword scoring
  for (const kw of JOURNAL_KEYWORDS) {
    if (lower.includes(kw)) scores.journal_entry += 1;
  }
  for (const kw of STORY_KEYWORDS) {
    if (lower.includes(kw)) scores.story_shared += 1;
  }
  for (const kw of EMOTION_KEYWORDS) {
    if (lower.includes(kw)) scores.emotion_checkin += 1;
  }
  for (const kw of HELP_KEYWORDS) {
    if (lower.includes(kw)) scores.user_helped_user += 1;
  }
  for (const kw of QUEST_KEYWORDS) {
    if (lower.includes(kw)) scores.quest_completed += 1;
  }

  // Phase 2: Phrase pattern scoring (higher weight)
  for (const pp of PHRASE_PATTERNS) {
    if (lower.includes(pp.pattern)) {
      scores[pp.event] += pp.weight;
    }
  }

  // Find best match
  let bestEvent: PsychEventType | null = null;
  let bestScore = 0;

  for (const [event, score] of Object.entries(scores) as [PsychEventType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestEvent = event;
    }
  }

  // Minimum threshold: at least 1 keyword match
  if (bestScore < 1) return null;

  return bestEvent;
}

/**
 * Phân tích message và trả về tất cả scores (cho debugging/logging).
 */
export function detectEventWithScores(message: string): {
  detected: PsychEventType | null;
  scores: Record<PsychEventType, number>;
} {
  if (!message || message.trim().length === 0) {
    return {
      detected: null,
      scores: {
        journal_entry: 0,
        story_shared: 0,
        emotion_checkin: 0,
        user_helped_user: 0,
        quest_completed: 0,
      },
    };
  }

  const lower = message.toLowerCase();
  const scores: Record<PsychEventType, number> = {
    journal_entry: 0,
    story_shared: 0,
    emotion_checkin: 0,
    user_helped_user: 0,
    quest_completed: 0,
  };

  for (const kw of JOURNAL_KEYWORDS) {
    if (lower.includes(kw)) scores.journal_entry += 1;
  }
  for (const kw of STORY_KEYWORDS) {
    if (lower.includes(kw)) scores.story_shared += 1;
  }
  for (const kw of EMOTION_KEYWORDS) {
    if (lower.includes(kw)) scores.emotion_checkin += 1;
  }
  for (const kw of HELP_KEYWORDS) {
    if (lower.includes(kw)) scores.user_helped_user += 1;
  }
  for (const kw of QUEST_KEYWORDS) {
    if (lower.includes(kw)) scores.quest_completed += 1;
  }

  for (const pp of PHRASE_PATTERNS) {
    if (lower.includes(pp.pattern)) {
      scores[pp.event] += pp.weight;
    }
  }

  let bestEvent: PsychEventType | null = null;
  let bestScore = 0;
  for (const [event, score] of Object.entries(scores) as [PsychEventType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestEvent = event;
    }
  }
  if (bestScore < 1) bestEvent = null;

  return { detected: bestEvent, scores };
}

/**
 * Kiểm tra xem message có chứa nội dung tâm lý đáng ghi nhận không.
 * Dùng để chatbot quyết định có gửi event hay không.
 */
export function shouldTriggerEvent(message: string): boolean {
  return detectEvent(message) !== null;
}

/** Lấy tất cả keyword lists (cho testing/debugging) */
export function getKeywordCounts(): Record<PsychEventType, number> {
  return {
    journal_entry: JOURNAL_KEYWORDS.length,
    story_shared: STORY_KEYWORDS.length,
    emotion_checkin: EMOTION_KEYWORDS.length,
    user_helped_user: HELP_KEYWORDS.length,
    quest_completed: QUEST_KEYWORDS.length,
  };
}
