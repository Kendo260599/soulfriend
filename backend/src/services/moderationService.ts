/**
 * Moderation Service - Multi-layer Risk Detection
 * 
 * Implements advanced moderation with multiple detection layers:
 * - Lexical scanning (Vietnamese keywords, slang, synonyms)
 * - OpenAI Moderation API (optional)
 * - Llama Guard 3 (optional)
 * - Perspective API (optional)
 * 
 * Based on research from 2020-2025 on psychological data and internet user behavior
 * 
 * @module ModerationService
 * @version 2.0.0
 */

import crypto from 'crypto';
import logger from '../utils/logger';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ModerationSignal {
  source: 'lexical' | 'openai' | 'llamaguard' | 'perspective';
  category: 'direct_intent' | 'plan' | 'means' | 'timeframe' | 'farewell' | 'nssi' | 'ideation' | 'other';
  confidence: number; // 0..1
  matched?: string[];
}

export interface ModerationResult {
  riskLevel: RiskLevel;
  riskScore: number; // 0..100
  signals: ModerationSignal[];
  normalized: string;
  messageHash: string; // SHA-256 for privacy
}

// =============================================================================
// TEXT NORMALIZATION
// =============================================================================

/**
 * Comprehensive text normalization for Vietnamese
 * Handles: Unicode, diacritics, leet speak, emoji, duplicate chars
 */
function normalizeText(text: string): string {
  // Step 1: Unicode normalization (NFKC - compatibility decomposition)
  let normalized = text
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFKC');

  // Step 2: Remove Vietnamese diacritics
  normalized = removeVietnameseDiacritics(normalized);

  // Step 3: Normalize leet speak (common patterns)
  normalized = normalized
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i');

  // Step 4: Remove/replace emoji (keep only text)
  normalized = normalized.replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ');
  normalized = normalized.replace(/[\u{2600}-\u{26FF}]/gu, ' ');
  normalized = normalized.replace(/[\u{2700}-\u{27BF}]/gu, ' ');

  // Step 5: Reduce duplicate characters (max 2 consecutive)
  normalized = normalized.replace(/([a-z])\1{2,}/gi, '$1$1');

  // Step 6: Lowercase and final cleanup
  normalized = normalized.toLowerCase().trim();

  return normalized;
}

/**
 * Remove Vietnamese diacritics using Unicode normalization
 */
function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// =============================================================================
// LEXICAL TRIGGERS - EXPANDED VIETNAMESE DICTIONARY
// =============================================================================

/**
 * Comprehensive Vietnamese lexicon for risk detection
 * Based on research and common patterns in Vietnamese internet users (2020-2025)
 */
const VIETNAMESE_LEXICON = {
  // Direct suicidal intent
  direct_intent: [
    'muon chet', 'khong muon song', 'tu tu', 'ket thuc cuoc doi',
    'muon bien mat', 'di xa day', 'nghi den cai chet', 'muon ngu mai',
    'khong muon ton tai', 'muon bien mat vinh vien', 'ket thuc tat ca',
    'khong con ly do song', 'vo vong', 'muon thoat khoi cuoc song nay',
  ],

  // Planning indicators
  plan: [
    'toi se', 'toi da len ke hoach', 'ke hoach', 'thu thuoc ngu',
    'mua day thung', 'nho cao', 'tim dia diem', 'nhay cau',
    'viet thu tuyet menh', 'soan thu', 'dem nay', 'ngay mai luc',
    'len ke hoach', 'toi se lam', 'da chuẩn bị', 'da san sang',
    'se lam dem nay', 'se lam toi nay', 'se lam ngay mai', 'se lam',
  ],

  // Means/methods
  means: [
    'day thung', 'dao', 'thuoc ngu', 'thuoc', 'thuoc tru sau',
    'dao lam', 'dao gam', 'sung', 'cay', 'duong ray', 'nhay cau',
    'thuoc doc', 'thuoc an than', 'thuoc ngu', 'day treo co',
    'cat mach', 'uong thuoc', 'thuoc quy liều cao',
  ],

  // Timeframe indicators
  timeframe: [
    'dem nay', 'toi nay', 'ngay mai', 'cuoi tuan nay', 'tuan toi',
    'sang mai', 'chieu nay', 'khi nao', 'luc nao', 'ngay nao',
    'sau khi', 'truoc khi', 'khi nao xong', 'lam dem nay', 'lam toi nay',
  ],

  // Farewell/goodbye messages
  farewell: [
    'tam biet', 'xin loi moi nguoi', 'du dung tim em', 'em di day',
    'hen gap o mot noi khac', 'cam on vi tat ca', 'xin loi',
    'chao tam biet', 'vinh biet', 'di vinh vien', 'xin loi ba me',
    'xin loi gia dinh', 'dung tim em nua', 'em xin loi',
  ],

  // Non-suicidal self-injury (NSSI)
  nssi: [
    'cat tay', 'tu lam dau', 'tu hanh ha', 'lam ton thuong ban than',
    'cat co', 'cat chan', 'danh minh', 'tu sat thuong', 'lam dau minh',
    'tu lam ton thuong', 'cat da', 'danh vao tuong', 'tu lam dau ban than',
  ],

  // Suicidal ideation (less direct)
  ideation: [
    'chan doi', 'vo vong', 'vo gia tri', 'khong con y nghia',
    'muon ngu mai', 'muon bien mat khoi the gioi', 'khong muon song nua',
    'khong con ly do', 'cuoc song vo nghia', 'khong con hy vong',
    'moi thu deu vo nghia', 'khong con ai quan tam', 'khong ai can minh',
  ],

  // Internet slang and metaphors (context-dependent)
  slang: [
    'end game', 'out game', 'gg life', 'di gap ong ba', 'toang roi',
    'nghi choi', 'xoa acc', 'delete account', 'log out forever',
    'quit game', 'game over', 'reset life', 'new game plus',
  ],
};

// =============================================================================
// LEXICAL SCANNING
// =============================================================================

/**
 * Scan text using lexical patterns
 * Returns array of moderation signals
 */
function scanLexical(normalizedText: string): ModerationSignal[] {
  const signals: ModerationSignal[] = [];
  const matchedKeywords: string[] = [];

  // Helper to add signal
  const addSignal = (
    category: ModerationSignal['category'],
    keywords: string[],
    confidence: number = 0.8
  ) => {
    const matched = keywords.filter(k => normalizedText.includes(k));
    if (matched.length > 0) {
      signals.push({
        source: 'lexical',
        category,
        confidence,
        matched,
      });
      matchedKeywords.push(...matched);
    }
  };

  // Scan each category
  addSignal('direct_intent', VIETNAMESE_LEXICON.direct_intent, 0.9);
  addSignal('plan', VIETNAMESE_LEXICON.plan, 0.85);
  addSignal('means', VIETNAMESE_LEXICON.means, 0.85);
  addSignal('timeframe', VIETNAMESE_LEXICON.timeframe, 0.75);
  addSignal('farewell', VIETNAMESE_LEXICON.farewell, 0.8);
  addSignal('nssi', VIETNAMESE_LEXICON.nssi, 0.8);
  addSignal('ideation', VIETNAMESE_LEXICON.ideation, 0.7);
  
  // Slang has lower confidence and is context-dependent
  const slangMatched = VIETNAMESE_LEXICON.slang.filter(k => normalizedText.includes(k));
  if (slangMatched.length > 0) {
    signals.push({
      source: 'lexical',
      category: 'other',
      confidence: 0.4, // Lower confidence for slang alone
      matched: slangMatched,
    });
  }

  // Check for negation patterns (reduce false positives)
  const strongNegation = [
    'khong muon chet', 'khong tu tu', 'khong muon lam dau',
    'khong muon tu hai', 'khong nghi den', 'khong bao gio',
  ];
  const hasNegation = strongNegation.some(neg => normalizedText.includes(neg));
  if (hasNegation && signals.length > 0) {
    // Reduce confidence of signals if strong negation present
    signals.forEach(signal => {
      signal.confidence *= 0.5;
    });
  }

  return signals;
}

// =============================================================================
// EXTERNAL MODERATION APIs (OPTIONAL)
// =============================================================================

/**
 * Check OpenAI Moderation API
 * Uses omni-moderation-latest model for self-harm detection
 */
async function checkOpenAIModeration(text: string): Promise<ModerationSignal[]> {
  try {
    if (!process.env.ENABLE_OPENAI_MODERATION || process.env.ENABLE_OPENAI_MODERATION !== 'true') {
      return [];
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI Moderation enabled but OPENAI_API_KEY not set');
      return [];
    }

    // TODO: Implement OpenAI Moderation API call
    // const response = await fetch('https://api.openai.com/v1/moderations', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'omni-moderation-latest',
    //     input: text,
    //   }),
    // });
    // const data = await response.json();
    // Map response to ModerationSignal[]

    logger.debug('OpenAI Moderation check skipped (not implemented yet)');
    return [];
  } catch (error) {
    logger.error('Error checking OpenAI Moderation:', error);
    return [];
  }
}

/**
 * Check Llama Guard 3
 * Uses Meta's Llama Guard 3 for safety classification
 */
async function checkLlamaGuard(text: string): Promise<ModerationSignal[]> {
  try {
    if (!process.env.ENABLE_LLAMA_GUARD || process.env.ENABLE_LLAMA_GUARD !== 'true') {
      return [];
    }

    // TODO: Implement Llama Guard 3 API call
    // Requires endpoint or API key
    logger.debug('Llama Guard check skipped (not implemented yet)');
    return [];
  } catch (error) {
    logger.error('Error checking Llama Guard:', error);
    return [];
  }
}

/**
 * Check Google Perspective API
 * Uses Perspective API for self-harm attribute
 */
async function checkPerspective(text: string): Promise<ModerationSignal[]> {
  try {
    if (!process.env.PERSPECTIVE_API_KEY) {
      return [];
    }

    // TODO: Implement Perspective API call
    // const response = await fetch(
    //   `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       comment: { text },
    //       requestedAttributes: { SELF_HARM: {} },
    //     }),
    //   }
    // );
    // Map response to ModerationSignal[]

    logger.debug('Perspective API check skipped (not implemented yet)');
    return [];
  } catch (error) {
    logger.error('Error checking Perspective API:', error);
    return [];
  }
}

// =============================================================================
// RISK AGGREGATION & SCORING
// =============================================================================

/**
 * Weight mapping for different categories
 * Higher weight = more critical indicator
 */
const CATEGORY_WEIGHTS: Record<ModerationSignal['category'], number> = {
  direct_intent: 40,
  plan: 25,
  means: 20,
  timeframe: 20,
  farewell: 15,
  nssi: 10,
  ideation: 8,
  other: 5,
};

/**
 * Aggregate signals into risk level and score
 * Uses weighted scoring with thresholds
 */
function aggregateSignals(signals: ModerationSignal[]): {
  riskLevel: RiskLevel;
  riskScore: number;
} {
  // Calculate weighted score
  let totalScore = 0;
  const categories = new Set<ModerationSignal['category']>();

  signals.forEach(signal => {
    if (signal.confidence > 0) {
      const weight = CATEGORY_WEIGHTS[signal.category] || 0;
      totalScore += weight * signal.confidence;
      categories.add(signal.category);
    }
  });

  // Determine risk level based on score and critical combinations
  const hasDirectIntent = categories.has('direct_intent');
  const hasPlan = categories.has('plan');
  const hasMeans = categories.has('means');
  const hasTimeframe = categories.has('timeframe');
  const hasFarewell = categories.has('farewell');

  // Critical: Direct intent (suicidal ideation is always critical) OR 
  // Direct intent + (plan OR means OR timeframe) OR very high score
  const isCritical =
    hasDirectIntent ||
    (hasPlan && hasMeans) ||
    (hasTimeframe && hasMeans) ||
    totalScore >= 60;

  // High: Plan/means/farewell alone OR high score without critical combo
  const isHigh =
    !isCritical &&
    (hasPlan || hasMeans || hasTimeframe || hasFarewell || totalScore >= 45);

  // Moderate: Some signals but not high
  const isModerate = !isCritical && !isHigh && totalScore >= 25;

  const riskLevel: RiskLevel = isCritical
    ? 'critical'
    : isHigh
    ? 'high'
    : isModerate
    ? 'moderate'
    : 'low';

  const riskScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  return { riskLevel, riskScore };
}

// =============================================================================
// MODERATION SERVICE
// =============================================================================

export class ModerationService {
  /**
   * Assess message for risk using multi-layer detection
   * @param rawText Original user message
   * @returns ModerationResult with risk level, score, signals, and hash
   */
  async assess(rawText: string): Promise<ModerationResult> {
    // Normalize text
    const normalized = normalizeText(rawText);

    // Generate message hash for privacy (SHA-256)
    const messageHash = crypto
      .createHash('sha256')
      .update(rawText)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for readability

    // Collect signals from all layers
    const signals: ModerationSignal[] = [
      ...scanLexical(normalized),
      ...(await checkOpenAIModeration(rawText)),
      ...(await checkLlamaGuard(rawText)),
      ...(await checkPerspective(rawText)),
    ];

    // Aggregate signals into risk level and score
    const { riskLevel, riskScore } = aggregateSignals(signals);

    logger.debug('Moderation assessment', {
      riskLevel,
      riskScore,
      signalCount: signals.length,
      messageHash,
    });

    return {
      riskLevel,
      riskScore,
      signals,
      normalized,
      messageHash,
    };
  }

  /**
   * Check if moderation is ready (has required APIs configured)
   */
  isReady(): boolean {
    return true; // Lexical scanning always works
  }
}

// Export singleton instance
export default new ModerationService();

