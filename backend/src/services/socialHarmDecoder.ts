/**
 * Social Harm Decoder
 *
 * Detects patterns of social harm in user messages, including:
 *   - Gaslighting / emotional manipulation
 *   - Shaming / victim-blaming
 *   - Coercive control
 *   - Toxic cultural norms (Vietnamese-specific)
 *
 * This module analyzes the USER's description of their situation
 * to identify when the user is being subjected to harmful social
 * dynamics — NOT to flag the user themselves.
 *
 * @module services/socialHarmDecoder
 * @version 1.0.0
 */

import { RiskLevel, toNumericScore } from '../types/risk';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export type HarmCategory =
  | 'gaslighting'
  | 'emotional_manipulation'
  | 'shaming'
  | 'victim_blaming'
  | 'coercive_control'
  | 'toxic_norms';

export interface HarmPattern {
  /** Unique pattern ID */
  id: string;
  /** Category of social harm */
  category: HarmCategory;
  /** Vietnamese keywords / phrases (lowercased) */
  keywords: string[];
  /** Risk level this pattern implies */
  riskLevel: RiskLevel;
  /** Pattern confidence (0..1) */
  baseConfidence: number;
  /** Human-readable description */
  description: string;
}

export interface SocialHarmResult {
  /** Whether any social harm was detected */
  detected: boolean;
  /** Detected harm categories */
  categories: HarmCategory[];
  /** Risk level from social harm analysis */
  riskLevel: RiskLevel;
  /** Numeric score 0-100 */
  score: number;
  /** Confidence in the detection (0..1) */
  confidence: number;
  /** Matched patterns */
  matchedPatterns: Array<{
    patternId: string;
    category: HarmCategory;
    matchedKeywords: string[];
    riskLevel: RiskLevel;
  }>;
  /** Contextual recommendations for the response generator */
  responseGuidance: string[];
}

// =============================================================================
// HARM PATTERN DATABASE
// =============================================================================

const HARM_PATTERNS: HarmPattern[] = [
  // ─── GASLIGHTING ─────────────────────────────────────────────────────────
  {
    id: 'gaslighting_denial',
    category: 'gaslighting',
    keywords: [
      'em tưởng tượng', 'em nghĩ nhiều quá', 'có chuyện gì đâu',
      'em bịa chuyện', 'không có chuyện đó', 'em điên rồi',
      'em nhớ nhầm', 'chuyện đó không xảy ra', 'em tự nghĩ ra',
      'đừng có mà bịa', 'em quá nhạy cảm',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.75,
    description: 'Phủ nhận thực tế / trải nghiệm của nạn nhân',
  },
  {
    id: 'gaslighting_blame_shift',
    category: 'gaslighting',
    keywords: [
      'tại em hết', 'do em gây ra', 'em mà không thế thì',
      'em làm anh phải', 'nếu em nghe lời thì', 'em ép anh phải',
      'em bắt anh', 'vì em mà', 'em không biết gì',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.7,
    description: 'Đổ lỗi / chuyển trách nhiệm sang nạn nhân',
  },

  // ─── EMOTIONAL MANIPULATION ──────────────────────────────────────────────
  {
    id: 'manipulation_threats',
    category: 'emotional_manipulation',
    keywords: [
      'anh sẽ tự tử', 'anh sẽ chết', 'nếu em bỏ anh',
      'không có em anh chết', 'em mà đi là anh chết',
      'anh sẽ làm liều', 'anh sẽ tìm đến cái chết',
      'dọa tự tử', 'dọa chết', 'dọa tự làm hại',
    ],
    riskLevel: RiskLevel.HIGH,
    baseConfidence: 0.85,
    description: 'Dọa tự hại để kiểm soát cảm xúc',
  },
  {
    id: 'manipulation_isolation',
    category: 'emotional_manipulation',
    keywords: [
      'cấm em gặp', 'không cho em đi', 'không cho em gặp bạn',
      'cấm em liên lạc', 'kiểm tra điện thoại', 'đọc tin nhắn em',
      'theo dõi em', 'không cho em đi làm', 'cấm em ra ngoài',
      'nhốt em trong nhà', 'không cho gặp gia đình',
    ],
    riskLevel: RiskLevel.HIGH,
    baseConfidence: 0.85,
    description: 'Cô lập nạn nhân khỏi hệ thống hỗ trợ',
  },
  {
    id: 'manipulation_guilt',
    category: 'emotional_manipulation',
    keywords: [
      'em không biết ơn', 'anh hy sinh vì em', 'anh làm tất cả vì em',
      'em phụ lòng anh', 'em vô ơn', 'em ích kỷ',
      'em chỉ nghĩ cho mình', 'anh đã lo cho em',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.65,
    description: 'Gây cảm giác tội lỗi để kiểm soát',
  },

  // ─── SHAMING ─────────────────────────────────────────────────────────────
  {
    id: 'shaming_appearance',
    category: 'shaming',
    keywords: [
      'em xấu', 'em béo', 'em mập', 'nhìn em ghê',
      'không ai thèm em', 'ai mà thích em', 'em trông kinh',
      'em gầy quá', 'em mặc đồ gì mà',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.7,
    description: 'Chê bai ngoại hình / body-shaming',
  },
  {
    id: 'shaming_intelligence',
    category: 'shaming',
    keywords: [
      'em ngu', 'em dốt', 'em không biết gì', 'em dốt nát',
      'em kém', 'em bất tài', 'em vô dụng', 'em không làm được gì',
      'em chẳng ra gì', 'em vô tích sự',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.75,
    description: 'Xúc phạm trí tuệ / năng lực',
  },

  // ─── VICTIM BLAMING ──────────────────────────────────────────────────────
  {
    id: 'victim_blaming_dv',
    category: 'victim_blaming',
    keywords: [
      'chồng đánh vì yêu', 'đánh vì em hư', 'đánh để dạy',
      'em hư nên bị đánh', 'có đánh mới nên người',
      'em làm anh ấy tức', 'tại em anh ấy mới đánh',
      'em xứng đáng bị đánh',
    ],
    riskLevel: RiskLevel.HIGH,
    baseConfidence: 0.9,
    description: 'Đổ lỗi nạn nhân bạo lực gia đình',
  },
  {
    id: 'victim_blaming_sa',
    category: 'victim_blaming',
    keywords: [
      'tại em mặc hở', 'tại em đi khuya', 'em quyến rũ',
      'em khiêu khích', 'em tự chuốc lấy', 'tại em đẹp quá',
      'em dẫn dụ', 'em mời gọi',
    ],
    riskLevel: RiskLevel.HIGH,
    baseConfidence: 0.9,
    description: 'Đổ lỗi nạn nhân xâm hại tình dục',
  },

  // ─── COERCIVE CONTROL ────────────────────────────────────────────────────
  {
    id: 'coercive_financial',
    category: 'coercive_control',
    keywords: [
      'giữ tiền em', 'không cho em tiền', 'kiểm soát tiền',
      'không cho em xài tiền', 'em phải xin tiền',
      'anh giữ hết lương', 'không cho em mua',
    ],
    riskLevel: RiskLevel.HIGH,
    baseConfidence: 0.8,
    description: 'Kiểm soát tài chính',
  },
  {
    id: 'coercive_threats',
    category: 'coercive_control',
    keywords: [
      'giết em', 'đánh em', 'anh sẽ đánh', 'dọa đánh',
      'dọa giết', 'cho em biết tay', 'em sẽ biết hậu quả',
      'em coi chừng', 'anh không tha đâu',
    ],
    riskLevel: RiskLevel.CRITICAL,
    baseConfidence: 0.9,
    description: 'Đe dọa bạo lực',
  },

  // ─── TOXIC CULTURAL NORMS ────────────────────────────────────────────────
  {
    id: 'toxic_gender_norms',
    category: 'toxic_norms',
    keywords: [
      'đàn bà phải', 'phụ nữ phải', 'vợ phải nghe chồng',
      'con gái phải', 'đàn bà không được', 'phụ nữ không nên',
      'gái hư', 'đàn bà hư', 'xuất giá tòng phu',
      'phận đàn bà', 'phụ nữ phải chịu',
    ],
    riskLevel: RiskLevel.LOW,
    baseConfidence: 0.6,
    description: 'Áp đặt vai trò giới truyền thống có hại',
  },
  {
    id: 'toxic_family_pressure',
    category: 'toxic_norms',
    keywords: [
      'nhà chồng bắt', 'mẹ chồng bắt', 'phải sinh con trai',
      'chưa có con trai', 'nhà chồng coi thường', 'nhà chồng bắt nạt',
      'bố mẹ ép', 'gia đình ép', 'phải lấy chồng',
      'ế rồi', 'già rồi chưa lấy chồng',
    ],
    riskLevel: RiskLevel.MODERATE,
    baseConfidence: 0.65,
    description: 'Áp lực gia đình / xã hội mang tính cưỡng ép',
  },
];

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class SocialHarmDecoder {
  private patterns: HarmPattern[] = HARM_PATTERNS;

  /**
   * Analyze a user message for social harm patterns.
   *
   * This detects when the user is DESCRIBING harmful situations
   * they are experiencing (gaslighting, manipulation, abuse, etc.)
   *
   * @param message — The user's message text
   * @returns SocialHarmResult — Detection results
   */
  analyze(message: string): SocialHarmResult {
    const normalizedMessage = this.normalize(message);
    const matchedPatterns: SocialHarmResult['matchedPatterns'] = [];
    const categoriesSet = new Set<HarmCategory>();

    for (const pattern of this.patterns) {
      const matchedKeywords = pattern.keywords.filter(keyword =>
        normalizedMessage.includes(this.normalize(keyword))
      );

      if (matchedKeywords.length > 0) {
        matchedPatterns.push({
          patternId: pattern.id,
          category: pattern.category,
          matchedKeywords,
          riskLevel: pattern.riskLevel,
        });
        categoriesSet.add(pattern.category);
      }
    }

    if (matchedPatterns.length === 0) {
      return {
        detected: false,
        categories: [],
        riskLevel: RiskLevel.NONE,
        score: 0,
        confidence: 0,
        matchedPatterns: [],
        responseGuidance: [],
      };
    }

    // Determine highest risk level among matched patterns
    const riskLevel = this.calculateRiskLevel(matchedPatterns);
    const confidence = this.calculateConfidence(matchedPatterns);
    const score = toNumericScore(riskLevel) * 10 * confidence;
    const categories = Array.from(categoriesSet);
    const responseGuidance = this.generateGuidance(categories, riskLevel);

    logger.info('Social harm detected', {
      categories,
      riskLevel,
      patternCount: matchedPatterns.length,
      confidence: Math.round(confidence * 100) / 100,
    });

    return {
      detected: true,
      categories,
      riskLevel,
      score: Math.round(score),
      confidence,
      matchedPatterns,
      responseGuidance,
    };
  }

  /**
   * Normalize text for matching — lowercase, collapse whitespace,
   * remove common diacritics variations.
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate final risk level from matched patterns.
   * Uses highest-risk-wins with escalation for multiple categories.
   */
  private calculateRiskLevel(
    matches: SocialHarmResult['matchedPatterns']
  ): RiskLevel {
    // Base level: highest individual match
    const levels = matches.map(m => m.riskLevel);
    const levelOrder: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 1,
      [RiskLevel.MODERATE]: 2,
      [RiskLevel.HIGH]: 3,
      [RiskLevel.CRITICAL]: 4,
      [RiskLevel.EXTREME]: 5,
    };

    let highestIdx = 0;
    for (const lvl of levels) {
      if (levelOrder[lvl] > highestIdx) {
        highestIdx = levelOrder[lvl];
      }
    }

    // Escalation: multiple distinct categories → bump up one level
    const uniqueCategories = new Set(matches.map(m => m.category));
    if (uniqueCategories.size >= 3 && highestIdx < 5) {
      highestIdx = Math.min(highestIdx + 1, 5);
    }

    const reverseOrder: Record<number, RiskLevel> = {
      0: RiskLevel.NONE,
      1: RiskLevel.LOW,
      2: RiskLevel.MODERATE,
      3: RiskLevel.HIGH,
      4: RiskLevel.CRITICAL,
      5: RiskLevel.EXTREME,
    };

    return reverseOrder[highestIdx] || RiskLevel.NONE;
  }

  /**
   * Calculate overall confidence from matched patterns.
   * Weighted average — patterns with more keyword matches get higher weight.
   */
  private calculateConfidence(
    matches: SocialHarmResult['matchedPatterns']
  ): number {
    // Look up base confidence from pattern database
    let weightedSum = 0;
    let totalWeight = 0;

    for (const match of matches) {
      const pattern = this.patterns.find(p => p.id === match.patternId);
      const baseConf = pattern?.baseConfidence || 0.5;
      const keywordWeight = Math.min(match.matchedKeywords.length, 3); // cap at 3

      weightedSum += baseConf * keywordWeight;
      totalWeight += keywordWeight;
    }

    const avgConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Boost if multiple categories detected (more certain)
    const categories = new Set(matches.map(m => m.category));
    const categoryBoost = Math.min(categories.size * 0.05, 0.15);

    return Math.min(avgConfidence + categoryBoost, 1.0);
  }

  /**
   * Generate guidance for the AI response generator based on detected harm.
   */
  private generateGuidance(
    categories: HarmCategory[],
    riskLevel: RiskLevel
  ): string[] {
    const guidance: string[] = [];

    // Universal guidance for any social harm detection
    guidance.push('validate_user_experience');
    guidance.push('avoid_minimizing');

    if (categories.includes('gaslighting')) {
      guidance.push('affirm_reality');
      guidance.push('normalize_feelings');
    }

    if (categories.includes('victim_blaming')) {
      guidance.push('explicitly_not_their_fault');
      guidance.push('challenge_victim_blaming');
    }

    if (categories.includes('emotional_manipulation')) {
      guidance.push('name_manipulation_pattern');
      guidance.push('empower_autonomy');
    }

    if (categories.includes('coercive_control')) {
      guidance.push('safety_planning');
      guidance.push('professional_dv_resources');
    }

    if (categories.includes('shaming')) {
      guidance.push('counter_negative_self_talk');
      guidance.push('affirm_worth');
    }

    if (categories.includes('toxic_norms')) {
      guidance.push('gently_challenge_norms');
      guidance.push('respect_cultural_context');
    }

    // Risk-level-specific guidance
    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.EXTREME) {
      guidance.push('immediate_safety_check');
      guidance.push('provide_hotline');
    } else if (riskLevel === RiskLevel.HIGH) {
      guidance.push('suggest_professional_support');
    }

    return guidance;
  }
}

// Export singleton
export const socialHarmDecoder = new SocialHarmDecoder();
export default socialHarmDecoder;
