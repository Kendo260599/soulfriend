/**
 * Bias Monitor
 *
 * Checks AI-generated responses for harmful biases before sending
 * them to the user. Detects:
 *   - Gender bias / stereotyping
 *   - Victim-blaming language
 *   - Dismissive / minimizing language
 *   - Cultural insensitivity
 *   - Over-pathologizing normal emotions
 *
 * This module analyzes the BOT's RESPONSE to ensure the AI
 * does not reinforce harmful patterns the user is experiencing.
 *
 * @module services/biasMonitor
 * @version 1.0.0
 */

import { RiskLevel, toNumericScore } from '../types/risk';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export type BiasCategory =
  | 'gender_bias'
  | 'victim_blaming'
  | 'dismissive'
  | 'cultural_insensitivity'
  | 'over_pathologizing';

export interface BiasPattern {
  /** Unique pattern ID */
  id: string;
  /** Category of bias */
  category: BiasCategory;
  /** Phrases to detect (lowercased) */
  phrases: string[];
  /** Severity — how harmful is this bias in a mental health context */
  severity: RiskLevel;
  /** Base confidence */
  baseConfidence: number;
  /** Description of why this is problematic */
  description: string;
  /** Suggested replacement guidance */
  suggestion: string;
}

export interface BiasCheckResult {
  /** Whether any bias was detected in the response */
  biasDetected: boolean;
  /** Detected bias categories */
  categories: BiasCategory[];
  /** Severity level of detected bias */
  severityLevel: RiskLevel;
  /** Numeric score 0-100 */
  score: number;
  /** Confidence in detection (0..1) */
  confidence: number;
  /** Matched bias patterns */
  matchedPatterns: Array<{
    patternId: string;
    category: BiasCategory;
    matchedPhrases: string[];
    severity: RiskLevel;
    suggestion: string;
  }>;
  /** Whether the response should be rewritten */
  shouldRewrite: boolean;
  /** Specific corrections to apply */
  corrections: string[];
}

// =============================================================================
// BIAS PATTERN DATABASE
// =============================================================================

const BIAS_PATTERNS: BiasPattern[] = [
  // ─── GENDER BIAS ─────────────────────────────────────────────────────────
  {
    id: 'gender_role_reinforcement',
    category: 'gender_bias',
    phrases: [
      'phụ nữ nên', 'con gái nên', 'đàn bà phải',
      'phụ nữ thường', 'phái yếu', 'phận nữ',
      'bản năng làm mẹ', 'thiên chức phụ nữ',
      'phụ nữ cần biết nhẫn nhịn',
    ],
    severity: RiskLevel.MODERATE,
    baseConfidence: 0.7,
    description: 'Reinforcing gender role stereotypes',
    suggestion: 'Dùng ngôn ngữ trung tính về giới, tôn trọng sự chọn lựa cá nhân',
  },
  {
    id: 'gender_essentialism',
    category: 'gender_bias',
    phrases: [
      'phụ nữ tự nhiên là', 'đàn bà bẩm sinh',
      'bản chất phụ nữ', 'phụ nữ vốn dĩ',
      'gen phụ nữ', 'phụ nữ sinh ra để',
    ],
    severity: RiskLevel.LOW,
    baseConfidence: 0.65,
    description: 'Biological essentialism about gender',
    suggestion: 'Tránh quy chụp bản chất giới tính, mỗi người có đặc điểm riêng',
  },

  // ─── VICTIM BLAMING ──────────────────────────────────────────────────────
  {
    id: 'vb_responsibility_shift',
    category: 'victim_blaming',
    phrases: [
      'bạn cũng có phần', 'bạn cũng góp phần',
      'có thể bạn đã', 'bạn nên xem lại mình',
      'bạn cũng cần nhìn nhận lại', 'hai bên đều có lỗi',
      'bạn đã làm gì mà', 'bạn cần thay đổi',
    ],
    severity: RiskLevel.HIGH,
    baseConfidence: 0.75,
    description: 'Shifting responsibility to the victim',
    suggestion: 'Tuyệt đối không đổ lỗi cho nạn nhân. Xác nhận rằng bạo lực không bao giờ là lỗi của nạn nhân.',
  },
  {
    id: 'vb_provocation_imply',
    category: 'victim_blaming',
    phrases: [
      'bạn có chọc giận', 'bạn nói gì mà',
      'bạn làm gì mà anh ấy', 'tại sao bạn không tránh',
      'bạn có thể phòng tránh', 'nếu bạn không',
    ],
    severity: RiskLevel.HIGH,
    baseConfidence: 0.8,
    description: 'Implying victim provoked the abuse',
    suggestion: 'Không bao giờ gợi ý nạn nhân "khiêu khích" bạo lực',
  },

  // ─── DISMISSIVE LANGUAGE ─────────────────────────────────────────────────
  {
    id: 'dismissive_feelings',
    category: 'dismissive',
    phrases: [
      'đừng lo quá', 'không có gì đâu', 'đừng nghĩ nhiều',
      'bạn nghĩ nhiều quá', 'chuyện nhỏ thôi', 'ai cũng vậy',
      'chuyện bình thường', 'không sao đâu', 'bạn lo xa quá',
      'nghĩ tích cực lên', 'cố lên', 'vui lên',
    ],
    severity: RiskLevel.MODERATE,
    baseConfidence: 0.65,
    description: 'Minimizing or dismissing user emotions',
    suggestion: 'Công nhận cảm xúc của người dùng thay vì tối thiểu hóa',
  },
  {
    id: 'dismissive_comparison',
    category: 'dismissive',
    phrases: [
      'người khác còn khổ hơn', 'nhiều người còn tệ hơn',
      'so với người khác', 'bạn may mắn hơn',
      'có người còn không có', 'ít nhất bạn còn',
    ],
    severity: RiskLevel.MODERATE,
    baseConfidence: 0.7,
    description: 'Invalidating via comparison with others',
    suggestion: 'Không so sánh nỗi đau — mỗi trải nghiệm đều có giá trị',
  },

  // ─── CULTURAL INSENSITIVITY ──────────────────────────────────────────────
  {
    id: 'cultural_family_dismiss',
    category: 'cultural_insensitivity',
    phrases: [
      'bỏ gia đình đi', 'rời xa gia đình', 'cắt đứt quan hệ',
      'đừng quan tâm gia đình', 'gia đình không quan trọng',
    ],
    severity: RiskLevel.LOW,
    baseConfidence: 0.6,
    description: 'Dismissing family bonds in Vietnamese culture',
    suggestion: 'Tôn trọng mối quan hệ gia đình — gợi ý ranh giới lành mạnh thay vì cắt đứt',
  },
  {
    id: 'cultural_western_bias',
    category: 'cultural_insensitivity',
    phrases: [
      'ở nước ngoài', 'theo phương tây', 'như ở mỹ',
      'văn hóa tiến bộ hơn', 'xã hội hiện đại',
    ],
    severity: RiskLevel.LOW,
    baseConfidence: 0.55,
    description: 'Western-centric advice that may not apply',
    suggestion: 'Đưa ra lời khuyên phù hợp bối cảnh văn hóa Việt Nam',
  },

  // ─── OVER-PATHOLOGIZING ──────────────────────────────────────────────────
  {
    id: 'over_pathologize_normal',
    category: 'over_pathologizing',
    phrases: [
      'bạn có thể bị trầm cảm', 'bạn có dấu hiệu',
      'bạn cần đi khám ngay', 'bạn có triệu chứng',
      'bạn nên uống thuốc', 'bạn bị rối loạn',
    ],
    severity: RiskLevel.MODERATE,
    baseConfidence: 0.6,
    description: 'Diagnosing or over-pathologizing normal emotional responses',
    suggestion: 'AI không nên chẩn đoán — chỉ gợi ý tìm hỗ trợ chuyên môn khi cần',
  },
];

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class BiasMonitor {
  private patterns: BiasPattern[] = BIAS_PATTERNS;

  /**
   * Check an AI-generated response for harmful biases.
   *
   * Call this BEFORE sending the response to the user.
   * If biasDetected is true and shouldRewrite is true,
   * the response should be regenerated with corrections applied.
   *
   * @param response — The AI-generated response text to check
   * @param userContext — Optional context about the user's situation
   * @returns BiasCheckResult — Detection results
   */
  check(response: string, userContext?: string): BiasCheckResult {
    const normalizedResponse = this.normalize(response);
    const matchedPatterns: BiasCheckResult['matchedPatterns'] = [];
    const categoriesSet = new Set<BiasCategory>();

    for (const pattern of this.patterns) {
      const matchedPhrases = pattern.phrases.filter(phrase =>
        normalizedResponse.includes(this.normalize(phrase))
      );

      if (matchedPhrases.length > 0) {
        matchedPatterns.push({
          patternId: pattern.id,
          category: pattern.category,
          matchedPhrases,
          severity: pattern.severity,
          suggestion: pattern.suggestion,
        });
        categoriesSet.add(pattern.category);
      }
    }

    if (matchedPatterns.length === 0) {
      return {
        biasDetected: false,
        categories: [],
        severityLevel: RiskLevel.NONE,
        score: 0,
        confidence: 0,
        matchedPatterns: [],
        shouldRewrite: false,
        corrections: [],
      };
    }

    const severityLevel = this.calculateSeverity(matchedPatterns);
    const confidence = this.calculateConfidence(matchedPatterns);
    const score = toNumericScore(severityLevel) * 10 * confidence;
    const categories = Array.from(categoriesSet);
    const corrections = matchedPatterns.map(p => p.suggestion);

    // Should rewrite if any HIGH+ bias detected, or victim_blaming of any level
    const shouldRewrite =
      severityLevel === RiskLevel.HIGH ||
      severityLevel === RiskLevel.CRITICAL ||
      severityLevel === RiskLevel.EXTREME ||
      categories.includes('victim_blaming');

    if (matchedPatterns.length > 0) {
      logger.warn('Bias detected in AI response', {
        categories,
        severityLevel,
        patternCount: matchedPatterns.length,
        shouldRewrite,
      });
    }

    return {
      biasDetected: true,
      categories,
      severityLevel,
      score: Math.round(score),
      confidence,
      matchedPatterns,
      shouldRewrite,
      corrections,
    };
  }

  /**
   * Generate a system prompt addendum to prevent detected biases
   * from appearing in a regenerated response.
   */
  generateBiasGuard(biasResult: BiasCheckResult): string {
    if (!biasResult.biasDetected) return '';

    const guards: string[] = [
      'QUAN TRỌNG: Phản hồi trước đó có chứa bias cần sửa.',
      'Hãy đảm bảo phản hồi mới KHÔNG chứa các yếu tố sau:',
    ];

    for (const pattern of biasResult.matchedPatterns) {
      guards.push(`- TRÁNH: ${pattern.matchedPhrases.join(', ')}`);
      guards.push(`  THAY BẰNG: ${pattern.suggestion}`);
    }

    guards.push(
      '',
      'Nguyên tắc:',
      '- Luôn xác nhận và công nhận cảm xúc của người dùng.',
      '- Không bao giờ đổ lỗi cho nạn nhân.',
      '- Tôn trọng bối cảnh văn hóa Việt Nam.',
      '- Không chẩn đoán — chỉ gợi ý tìm hỗ trợ chuyên môn.',
      '- Dùng ngôn ngữ trung tính về giới.'
    );

    return guards.join('\n');
  }

  /**
   * Normalize text for matching
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate severity from matched patterns (highest wins)
   */
  private calculateSeverity(
    matches: BiasCheckResult['matchedPatterns']
  ): RiskLevel {
    const levelOrder: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 1,
      [RiskLevel.MODERATE]: 2,
      [RiskLevel.HIGH]: 3,
      [RiskLevel.CRITICAL]: 4,
      [RiskLevel.EXTREME]: 5,
    };

    let highest = 0;
    for (const match of matches) {
      const level = levelOrder[match.severity] || 0;
      if (level > highest) highest = level;
    }

    const reverseOrder: Record<number, RiskLevel> = {
      0: RiskLevel.NONE,
      1: RiskLevel.LOW,
      2: RiskLevel.MODERATE,
      3: RiskLevel.HIGH,
      4: RiskLevel.CRITICAL,
      5: RiskLevel.EXTREME,
    };

    return reverseOrder[highest] || RiskLevel.NONE;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    matches: BiasCheckResult['matchedPatterns']
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const match of matches) {
      const pattern = this.patterns.find(p => p.id === match.patternId);
      const baseConf = pattern?.baseConfidence || 0.5;
      const phraseWeight = Math.min(match.matchedPhrases.length, 3);

      weightedSum += baseConf * phraseWeight;
      totalWeight += phraseWeight;
    }

    return totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1.0) : 0;
  }
}

// Export singleton
export const biasMonitor = new BiasMonitor();
export default biasMonitor;
