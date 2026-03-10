// ============================================
// SoulFriend — GameFi Feedback Generator
// ============================================
// Tạo thông điệp phản hồi thân thiện cho người dùng
// dựa trên kết quả GameFi.
//
// KHÔNG sửa đổi chatbot code hiện tại.
// Chatbot gọi hàm này để format kết quả GameFi thành
// tin nhắn dễ hiểu cho người dùng.

import type { EventResult } from '../gamefi/core/eventHandler';

// ══════════════════════════════════════════════
// TEMPLATES
// ══════════════════════════════════════════════

const GROWTH_LABELS: Record<string, string> = {
  emotionalAwareness:   'nhận diện cảm xúc',
  psychologicalSafety:  'an toàn tâm lý',
  meaning:              'ý nghĩa sống',
  cognitiveFlexibility: 'linh hoạt nhận thức',
  relationshipQuality:  'kết nối xã hội',
};

const XP_MESSAGES = [
  'Bạn vừa nhận được {xp} XP trên hành trình trưởng thành.',
  'Hành trình của bạn vừa tiến thêm {xp} XP.',
  '+{xp} XP — mỗi bước nhỏ đều có ý nghĩa.',
  'Bạn đã tích lũy thêm {xp} XP cho hành trình nội tâm.',
];

const MILESTONE_MESSAGES = [
  '🎉 Mốc quan trọng: {milestone}',
  '✨ Chúc mừng! {milestone}',
  '🌟 Bạn đã đạt được: {milestone}',
];

const QUEST_MESSAGES = [
  '📋 Gợi ý tiếp theo: "{quest}"',
  '🗺️ Quest mới mở: "{quest}"',
  '💡 Nhiệm vụ tiếp theo cho bạn: "{quest}"',
];

const SAFETY_MESSAGE =
  '💚 Chúng tôi nhận thấy bạn đang trải qua giai đoạn khó khăn. ' +
  'Bạn không đơn độc. Nếu cần hỗ trợ, hãy liên hệ đường dây tư vấn tâm lý: 1800-599-100 (miễn phí).';

const EMPTY_MESSAGE = 'Cảm ơn bạn đã chia sẻ. Hệ thống đã ghi nhận.';

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/**
 * Tạo thông điệp phản hồi từ kết quả GameFi.
 *
 * @param result - EventResult từ GameFi bridge
 * @returns Chuỗi thông điệp thân thiện cho người dùng
 */
export function generateFeedback(result: EventResult): string {
  const parts: string[] = [];

  // XP gained
  if (result.xpGained > 0) {
    const template = pickRandom(XP_MESSAGES);
    parts.push(template.replace('{xp}', String(result.xpGained)));
  }

  // Growth impact
  const growthParts = formatGrowthImpact(result.growthImpact);
  if (growthParts) {
    parts.push(growthParts);
  }

  // Level up / milestone
  if (result.milestone) {
    const template = pickRandom(MILESTONE_MESSAGES);
    parts.push(template.replace('{milestone}', result.milestone));
  }

  // Quest suggestion
  if (result.unlockedQuest) {
    const template = pickRandom(QUEST_MESSAGES);
    parts.push(template.replace('{quest}', result.unlockedQuest));
  }

  // Soul points / empathy points
  if (result.rewards.soulPoints > 0 || result.rewards.empathyPoints > 0) {
    const rewardParts: string[] = [];
    if (result.rewards.soulPoints > 0) {
      rewardParts.push(`+${result.rewards.soulPoints} SoulPoint`);
    }
    if (result.rewards.empathyPoints > 0) {
      rewardParts.push(`+${result.rewards.empathyPoints} EmpathyPoint`);
    }
    parts.push(rewardParts.join(', '));
  }

  // Safety alert — always at the end, with highest priority
  if (result.safetyAlert) {
    parts.push(SAFETY_MESSAGE);
  }

  if (parts.length === 0) {
    return EMPTY_MESSAGE;
  }

  return parts.join('\n');
}

/**
 * Tạo thông điệp ngắn gọn (cho notification/toast).
 */
export function generateShortFeedback(result: EventResult): string {
  if (result.safetyAlert) {
    return '💚 Chúng tôi luôn ở đây bên bạn. Gọi 1800-599-100 nếu cần.';
  }

  if (result.milestone) {
    return `✨ ${result.milestone}`;
  }

  if (result.xpGained > 0) {
    return `+${result.xpGained} XP — hành trình tiếp tục!`;
  }

  return 'Đã ghi nhận.';
}

/**
 * Tạo thông điệp kỷ niệm khi đạt milestone.
 */
export function generateMilestoneMessage(milestone: string): string {
  return [
    '════════════════════════════════',
    `  🌟 ${milestone}`,
    '  Hành trình trưởng thành của bạn vừa đạt mốc mới.',
    '  Hãy tự hào vì mỗi bước bạn đã đi.',
    '════════════════════════════════',
  ].join('\n');
}

/**
 * Tạo thông điệp an toàn tâm lý.
 */
export function generateSafetyMessage(): string {
  return SAFETY_MESSAGE;
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function formatGrowthImpact(impact: Partial<Record<string, number>>): string | null {
  const entries = Object.entries(impact).filter(([, v]) => v && v > 0);
  if (entries.length === 0) return null;

  const formatted = entries.map(([key, val]) => {
    const label = GROWTH_LABELS[key] ?? key;
    return `+${val} ${label}`;
  });

  return `Bạn đã cải thiện: ${formatted.join(', ')}.`;
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
