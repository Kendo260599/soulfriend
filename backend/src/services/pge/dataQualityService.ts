/**
 * DATA QUALITY SERVICE
 * 
 * PDD Quality Assurance Layer — đảm bảo chất lượng dữ liệu nghiên cứu
 * 
 * Chức năng:
 * - Phát hiện spam / short sessions / bot patterns
 * - Đánh giá completeness, validity, reliability
 * - Outlier flagging (z-score based)
 * - Response pattern detection (tất cả cùng 1 giá trị = invalid)
 * 
 * @module services/pge/dataQualityService
 * @version 1.0.0
 */

import { IStateVector, PSY_VARIABLES } from '../../models/PsychologicalState';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Minimum message length (chars) to be considered meaningful */
const MIN_MESSAGE_LENGTH = 5;

/** Minimum session messages for valid session */
const MIN_SESSION_MESSAGES = 2;

/** Maximum messages per minute (anti-spam) */
const MAX_MESSAGES_PER_MINUTE = 10;

/** Z-score threshold for outlier detection */
const OUTLIER_Z_THRESHOLD = 3.0;

/** Minimum variance across state vector to be considered valid */
const MIN_STATE_VARIANCE = 0.001;

// ════════════════════════════════════════════════════════════════
// QUALITY FLAGS
// ════════════════════════════════════════════════════════════════

export interface IDataQualityResult {
  score: number;               // [0,1] — overall quality
  flags: string[];             // quality issues found
  isValid: boolean;            // passes minimum threshold
  details: {
    completeness: number;      // [0,1] — are all fields present?
    validity: number;          // [0,1] — are values in valid range?
    reliability: number;       // [0,1] — consistent patterns?
    freshness: number;         // [0,1] — how recent is the data?
  };
}

// ════════════════════════════════════════════════════════════════
// DATA QUALITY SERVICE CLASS
// ════════════════════════════════════════════════════════════════

class DataQualityService {

  // ────────────────────────────────────────────────
  // MESSAGE-LEVEL QUALITY
  // ────────────────────────────────────────────────

  /**
   * Đánh giá chất lượng một message-level data point
   */
  assessMessageQuality(params: {
    messageText: string;
    stateVector: IStateVector;
    confidence: number;
    extractionMethod: string;
    timestamp: Date;
  }): IDataQualityResult {
    const { messageText, stateVector, confidence, extractionMethod, timestamp } = params;
    const flags: string[] = [];

    // 1. Completeness
    let completeness = 1.0;
    if (!messageText || messageText.trim().length === 0) {
      flags.push('empty_message');
      completeness -= 0.5;
    } else if (messageText.trim().length < MIN_MESSAGE_LENGTH) {
      flags.push('short_message');
      completeness -= 0.2;
    }

    const vecValues = PSY_VARIABLES.map(v => stateVector[v]);
    const nonZero = vecValues.filter(v => v > 0).length;
    if (nonZero === 0) {
      flags.push('zero_state_vector');
      completeness -= 0.3;
    }
    completeness = Math.max(0, completeness);

    // 2. Validity
    let validity = 1.0;
    const outOfRange = vecValues.filter(v => v < 0 || v > 1).length;
    if (outOfRange > 0) {
      flags.push('out_of_range_values');
      validity -= 0.3 * (outOfRange / vecValues.length);
    }

    // Check for "flat" responses (all same value — likely extraction failure)
    const variance = this.computeVariance(vecValues);
    if (variance < MIN_STATE_VARIANCE && nonZero > 0) {
      flags.push('flat_response_pattern');
      validity -= 0.3;
    }
    validity = Math.max(0, validity);

    // 3. Reliability
    let reliability = confidence;
    if (extractionMethod === 'rule_based') {
      reliability *= 0.8; // rule-based slightly less reliable
    }

    // 4. Freshness
    const ageHours = (Date.now() - timestamp.getTime()) / 3600_000;
    const freshness = ageHours < 1 ? 1.0 : ageHours < 24 ? 0.9 : ageHours < 168 ? 0.7 : 0.5;

    // Overall score
    const score = (completeness * 0.3 + validity * 0.3 + reliability * 0.25 + freshness * 0.15);
    const isValid = score >= 0.4 && !flags.includes('zero_state_vector');

    return {
      score: Math.round(score * 1000) / 1000,
      flags,
      isValid,
      details: {
        completeness: Math.round(completeness * 1000) / 1000,
        validity: Math.round(validity * 1000) / 1000,
        reliability: Math.round(reliability * 1000) / 1000,
        freshness: Math.round(freshness * 1000) / 1000,
      },
    };
  }

  // ────────────────────────────────────────────────
  // SESSION-LEVEL QUALITY
  // ────────────────────────────────────────────────

  /**
   * Đánh giá chất lượng toàn session
   */
  assessSessionQuality(params: {
    messageCount: number;
    durationMs: number;
    avgConfidence: number;
    messageTimestamps: Date[];
  }): IDataQualityResult {
    const { messageCount, durationMs, avgConfidence, messageTimestamps } = params;
    const flags: string[] = [];

    // 1. Completeness — enough messages?
    let completeness = 1.0;
    if (messageCount < MIN_SESSION_MESSAGES) {
      flags.push('too_few_messages');
      completeness = messageCount / MIN_SESSION_MESSAGES;
    }

    // 2. Validity — spam detection
    let validity = 1.0;
    if (messageTimestamps.length >= 2) {
      // Check message rate
      const durationMinutes = durationMs / 60_000;
      if (durationMinutes > 0) {
        const rate = messageCount / durationMinutes;
        if (rate > MAX_MESSAGES_PER_MINUTE) {
          flags.push('suspected_spam');
          validity -= 0.5;
        }
      }

      // Check for uniform timing (bot pattern)
      const intervals = [];
      for (let i = 1; i < messageTimestamps.length; i++) {
        intervals.push(messageTimestamps[i].getTime() - messageTimestamps[i - 1].getTime());
      }
      if (intervals.length >= 3) {
        const intervalVariance = this.computeVariance(intervals);
        const intervalMean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (intervalMean > 0 && intervalVariance / (intervalMean * intervalMean) < 0.01) {
          flags.push('suspected_bot');
          validity -= 0.4;
        }
      }
    }
    validity = Math.max(0, validity);

    // 3. Reliability
    const reliability = avgConfidence;

    // 4. Freshness
    const freshness = 1.0; // session-level is always fresh

    const score = (completeness * 0.3 + validity * 0.3 + reliability * 0.25 + freshness * 0.15);
    const isValid = score >= 0.4 && !flags.includes('suspected_bot');

    return {
      score: Math.round(score * 1000) / 1000,
      flags,
      isValid,
      details: {
        completeness: Math.round(completeness * 1000) / 1000,
        validity: Math.round(validity * 1000) / 1000,
        reliability: Math.round(reliability * 1000) / 1000,
        freshness: Math.round(freshness * 1000) / 1000,
      },
    };
  }

  // ────────────────────────────────────────────────
  // SURVEY QUALITY
  // ────────────────────────────────────────────────

  /**
   * Đánh giá chất lượng survey response
   */
  assessSurveyQuality(params: {
    answers: number[];
    expectedLength: number;
    completionTimeMs: number;
    minValidTime?: number;     // minimum reasonable time (ms)
  }): IDataQualityResult {
    const { answers, expectedLength, completionTimeMs, minValidTime = 30_000 } = params;
    const flags: string[] = [];

    // 1. Completeness
    let completeness = answers.length / expectedLength;
    if (answers.length < expectedLength) {
      flags.push('incomplete_survey');
    }
    completeness = Math.min(1, completeness);

    // 2. Validity
    let validity = 1.0;

    // All same answer (straight-lining)
    const uniqueAnswers = new Set(answers);
    if (uniqueAnswers.size === 1 && answers.length >= 5) {
      flags.push('straight_lining');
      validity -= 0.5;
    }

    // Too fast to be genuine
    if (completionTimeMs < minValidTime) {
      flags.push('too_fast');
      validity -= 0.3;
    }

    // Check answer range (DASS-21: 0-3)
    const outOfRange = answers.filter(a => a < 0 || a > 3).length;
    if (outOfRange > 0) {
      flags.push('out_of_range_answers');
      validity -= 0.3;
    }
    validity = Math.max(0, validity);

    // 3. Reliability — inverse of variability from straight-lining
    const reliability = uniqueAnswers.size > 1 ? 1.0 : 0.3;

    // 4. Freshness
    const freshness = 1.0;

    const score = (completeness * 0.3 + validity * 0.3 + reliability * 0.25 + freshness * 0.15);
    const isValid = score >= 0.4;

    return {
      score: Math.round(score * 1000) / 1000,
      flags,
      isValid,
      details: {
        completeness: Math.round(completeness * 1000) / 1000,
        validity: Math.round(validity * 1000) / 1000,
        reliability: Math.round(reliability * 1000) / 1000,
        freshness: Math.round(freshness * 1000) / 1000,
      },
    };
  }

  // ────────────────────────────────────────────────
  // OUTLIER DETECTION
  // ────────────────────────────────────────────────

  /**
   * Detect outliers in a series of SPSI scores
   * Uses z-score method
   */
  detectOutliers(scores: number[]): {
    outlierIndices: number[];
    mean: number;
    stdDev: number;
  } {
    if (scores.length < 3) {
      return { outlierIndices: [], mean: 0, stdDev: 0 };
    }

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return { outlierIndices: [], mean, stdDev };

    const outlierIndices: number[] = [];
    for (let i = 0; i < scores.length; i++) {
      const z = Math.abs(scores[i] - mean) / stdDev;
      if (z > OUTLIER_Z_THRESHOLD) {
        outlierIndices.push(i);
      }
    }

    return { outlierIndices, mean, stdDev };
  }

  // ────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────

  private computeVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  }
}

// ════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════

export const dataQualityService = new DataQualityService();
