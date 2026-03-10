// ============================================
// SoulFriend GameFi — Feedback Generator (Backend)
// ============================================
// Generates friendly Vietnamese messages from EventResult.

import { EventResult, GrowthStats } from './types';

// ══════════════════════════════════════════════
// GROWTH LABELS
// ══════════════════════════════════════════════

const GROWTH_LABELS: Record<keyof GrowthStats, string> = {
  emotionalAwareness: 'nhận diện cảm xúc',
  psychologicalSafety: 'an toàn tâm lý',
  meaning: 'ý nghĩa sống',
  cognitiveFlexibility: 'linh hoạt nhận thức',
  relationshipQuality: 'kết nối xã hội',
};

// ══════════════════════════════════════════════
// XP MESSAGE TEMPLATES
// ══════════════════════════════════════════════

const XP_MESSAGES = [
  'Bạn vừa nhận được {xp} XP trên hành trình trưởng thành.',
  'Tuyệt vời! +{xp} XP cho sự phát triển của bạn.',
  'Hành trình tuyệt vời — bạn nhận {xp} XP!',
];

// ══════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════

/**
 * Generate full feedback message from EventResult.
 */
export function generateFeedback(result: EventResult): string {
  const parts: string[] = [];

  // XP notification
  if (result.xpGained > 0) {
    const template = XP_MESSAGES[Math.floor(Math.random() * XP_MESSAGES.length)];
    parts.push(template.replace('{xp}', String(result.xpGained)));
  }

  // Growth stat changes
  if (result.growthImpact && Object.keys(result.growthImpact).length > 0) {
    const growthParts: string[] = [];
    for (const [key, value] of Object.entries(result.growthImpact)) {
      const label = GROWTH_LABELS[key as keyof GrowthStats];
      if (label && value && value > 0) {
        growthParts.push(`${label} +${value}`);
      }
    }
    if (growthParts.length > 0) {
      parts.push(`📊 ${growthParts.join(', ')}`);
    }
  }

  // Milestone
  if (result.milestone) {
    parts.push(`🎉 Mốc quan trọng: ${result.milestone}`);
  }

  // Quest suggestion
  if (result.unlockedQuest) {
    parts.push(`📋 Gợi ý tiếp theo: "${result.unlockedQuest}"`);
  }

  // Rewards
  if (result.rewards.soulPoints > 0 || result.rewards.empathyPoints > 0) {
    const rewardParts: string[] = [];
    if (result.rewards.soulPoints > 0) rewardParts.push(`${result.rewards.soulPoints} Soul Points`);
    if (result.rewards.empathyPoints > 0) rewardParts.push(`${result.rewards.empathyPoints} Empathy Points`);
    parts.push(`💰 ${rewardParts.join(', ')}`);
  }

  // Safety alert
  if (result.safetyAlert) {
    parts.push(generateSafetyMessage());
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Generate short feedback for toast/notification.
 */
export function generateShortFeedback(result: EventResult): string {
  if (result.milestone) return `🎉 ${result.milestone}`;
  if (result.xpGained > 0) return `+${result.xpGained} XP`;
  return '';
}

/**
 * Generate safety alert message with crisis hotline.
 */
export function generateSafetyMessage(): string {
  return [
    '💚 Chúng tôi nhận thấy bạn đang trải qua giai đoạn khó khăn.',
    'Bạn không đơn độc. Hãy liên hệ ngay:',
    '📞 Tổng đài hỗ trợ tâm lý: 1800-599-100 (miễn phí, 24/7)',
    '📞 Đường dây nóng: 1900-599-958',
  ].join('\n');
}
