/**
 * DASS-21 → PGE BRIDGE SERVICE
 *
 * Kết nối kết quả test DASS-21 với PGE Engine:
 * 1. Map DASS-21 subscale scores → 24D state vector bias
 * 2. Provide latest test severity for risk assessment boosting
 * 3. Trigger PGE state initialization after test completion
 *
 * DASS-21 subscale scores (đã ×2):
 *   - Depression: 0–42  (normal 0-9, mild 10-13, moderate 14-20, severe 21-27, extremely_severe 28+)
 *   - Anxiety:    0–42  (normal 0-7, mild 8-9, moderate 10-14, severe 15-19, extremely_severe 20+)
 *   - Stress:     0–42  (normal 0-14, mild 15-18, moderate 19-25, severe 26-33, extremely_severe 34+)
 *
 * PGE state vector: 24 variables (0.0–1.0)
 *
 * @module services/pge/dassTestBridge
 * @version 1.0.0
 */

import TestResult from '../../models/TestResult';
import { IStateVector, PSY_VARIABLES } from '../../models/PsychologicalState';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export interface DASSScores {
  depression: number;  // 0-42
  anxiety: number;     // 0-42
  stress: number;      // 0-42
  severity: string;    // overall severity
  completedAt: Date;
}

export interface DASSStateBias {
  /** Partial state vector bias from DASS-21 (only affected variables) */
  bias: Partial<IStateVector>;
  /** Confidence weight: how strongly to blend test data vs text extraction (0-1) */
  weight: number;
  /** Whether the test data is recent enough to be relevant */
  isRecent: boolean;
  /** Source DASS scores */
  scores: DASSScores;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Max age of test result to be considered "recent" (7 days) */
const MAX_TEST_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Weight decay: test influence decreases over time */
const WEIGHT_BASE = 0.4;  // max blend weight for a fresh test
const WEIGHT_DECAY_PER_DAY = 0.05; // lose 5% per day

/** DASS-21 max possible score per subscale (7 items × 3 × 2) */
const MAX_SUBSCALE_SCORE = 42;

// ════════════════════════════════════════════════════════════════
// MAPPING: DASS-21 → PGE 24D State Bias
// ════════════════════════════════════════════════════════════════

/**
 * Convert DASS-21 subscale scores (0-42) to PGE state variable values (0-1).
 *
 * Mapping rationale (based on DASS-21 construct validity):
 * - Depression subscale → sadness, hopelessness, ↓joy, ↓motivation, ↓selfWorth
 * - Anxiety subscale → anxiety, fearOfJudgment, avoidance, rumination
 * - Stress subscale → stress, anger, mentalFatigue, ↓calmness, ↓cognitiveClarity
 */
function mapDASSToStateBias(scores: DASSScores): Partial<IStateVector> {
  const dNorm = Math.min(1, Math.max(0, scores.depression) / MAX_SUBSCALE_SCORE);
  const aNorm = Math.min(1, Math.max(0, scores.anxiety) / MAX_SUBSCALE_SCORE);
  const sNorm = Math.min(1, Math.max(0, scores.stress) / MAX_SUBSCALE_SCORE);

  return {
    // Depression subscale → negative emotions & reduced positive
    sadness: dNorm * 0.9,
    hopelessness: dNorm * 0.85,
    guilt: dNorm * 0.4,
    loneliness: dNorm * 0.5,
    joy: Math.max(0, 0.6 - dNorm * 0.6),
    motivation: Math.max(0, 0.6 - dNorm * 0.55),
    selfWorth: Math.max(0, 0.6 - dNorm * 0.6),
    selfEfficacy: Math.max(0, 0.6 - dNorm * 0.4),

    // Anxiety subscale → anxiety cluster
    anxiety: aNorm * 0.9,
    fearOfJudgment: aNorm * 0.6,
    avoidance: aNorm * 0.5,
    rumination: aNorm * 0.55,

    // Stress subscale → stress cluster
    stress: sNorm * 0.9,
    anger: sNorm * 0.4,
    mentalFatigue: sNorm * 0.7,
    calmness: Math.max(0, 0.6 - sNorm * 0.55),
    cognitiveClarity: Math.max(0, 0.6 - sNorm * 0.45),

    // Cross-loading: combined severity affects social & help-seeking
    socialEngagement: Math.max(0, 0.5 - (dNorm + aNorm) / 2 * 0.4),
    trustInOthers: Math.max(0, 0.5 - (dNorm + aNorm) / 2 * 0.3),
    helpSeeking: Math.max(0.1, 0.4 - dNorm * 0.3 + aNorm * 0.1),
    perceivedSupport: Math.max(0, 0.5 - dNorm * 0.3),
    hope: Math.max(0, 0.5 - dNorm * 0.5),
    gratitude: Math.max(0, 0.4 - dNorm * 0.35),
    shame: (dNorm * 0.3 + aNorm * 0.3),
  };
}

// ════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════

class DASSTestBridgeService {
  private cache: Map<string, { result: DASSStateBias | null; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 500;
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get DASS-21 state bias for a user.
   * Returns null if no recent test or userId unavailable.
   */
  async getStateBias(userId: string): Promise<DASSStateBias | null> {
    if (!userId) return null;

    // Periodic cleanup of stale cache entries
    this.cleanupIfNeeded();

    // Check cache
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      // Find most recent DASS-21 test for this user
      const latestTest = await TestResult.findOne({
        userId,
        testType: 'DASS-21',
      })
        .sort({ completedAt: -1 })
        .lean() as any;

      if (!latestTest) {
        this.cache.set(userId, { result: null, cachedAt: Date.now() });
        return null;
      }

      const completedAt = new Date(latestTest.completedAt);
      const ageMs = Date.now() - completedAt.getTime();

      // Check if test is recent enough
      const isRecent = ageMs <= MAX_TEST_AGE_MS;

      // Extract subscale scores
      const subscales = latestTest.subscaleScores || {};
      const evaluation = latestTest.evaluation || {};
      const scores: DASSScores = {
        depression: subscales.depression ?? 0,
        anxiety: subscales.anxiety ?? 0,
        stress: subscales.stress ?? 0,
        severity: evaluation.severity || 'unknown',
        completedAt,
      };

      // Compute weight (decays with time)
      const ageDays = ageMs / (24 * 60 * 60 * 1000);
      const weight = isRecent
        ? Math.max(0.1, WEIGHT_BASE - ageDays * WEIGHT_DECAY_PER_DAY)
        : 0.1; // minimal influence for old tests

      const bias = mapDASSToStateBias(scores);

      const result: DASSStateBias = {
        bias,
        weight,
        isRecent,
        scores,
      };

      this.cache.set(userId, { result, cachedAt: Date.now() });

      logger.debug('[DASSBridge] State bias computed', {
        userId: userId.substring(0, 8),
        depression: scores.depression,
        anxiety: scores.anxiety,
        stress: scores.stress,
        severity: scores.severity,
        weight: weight.toFixed(2),
        isRecent,
        ageDays: ageDays.toFixed(1),
      });

      return result;
    } catch (error) {
      logger.warn('[DASSBridge] Failed to get DASS scores:', error);
      this.cache.set(userId, { result: null, cachedAt: Date.now() });
      return null;
    }
  }

  /**
   * Blend DASS-21 bias into an extracted state vector.
   *
   * Formula: S_blended[i] = (1 - w) * S_text[i] + w * S_dass[i]
   * where w = bias weight (higher for fresh tests, lower for old ones)
   *
   * Only modifies variables that have DASS mapping.
   */
  blendWithExtraction(
    extractedState: IStateVector,
    dassBias: DASSStateBias
  ): IStateVector {
    const blended: any = { ...extractedState };
    const w = dassBias.weight;

    for (const [key, dassValue] of Object.entries(dassBias.bias)) {
      if (dassValue !== undefined && key in extractedState) {
        const textValue = (extractedState as any)[key] ?? 0;
        // Weighted blend: take the higher-severity value when DASS shows risk
        blended[key] = Math.max(0, Math.min(1,
          (1 - w) * textValue + w * dassValue
        ));
      }
    }

    return blended as IStateVector;
  }

  /**
   * Get severity level for risk assessment boosting.
   * Returns a risk boost factor based on test severity.
   */
  async getRiskBoost(userId: string): Promise<{
    boost: number;           // 0-30 points to add to risk score
    severity: string;        // DASS severity level
    shouldElevate: boolean;  // whether to elevate risk level by one tier
  }> {
    const bias = await this.getStateBias(userId);
    if (!bias || !bias.isRecent) {
      return { boost: 0, severity: 'none', shouldElevate: false };
    }

    const { depression, anxiety, stress, severity } = bias.scores;

    // Extremely severe on any subscale → significant boost
    const isExtreme = depression >= 28 || anxiety >= 20 || stress >= 34;
    // Severe on any subscale
    const isSevere = depression >= 21 || anxiety >= 15 || stress >= 26;
    // Moderate on any subscale
    const isModerate = depression >= 14 || anxiety >= 10 || stress >= 19;

    if (isExtreme) {
      return { boost: 25, severity, shouldElevate: true };
    } else if (isSevere) {
      return { boost: 15, severity, shouldElevate: true };
    } else if (isModerate) {
      return { boost: 8, severity, shouldElevate: false };
    }

    return { boost: 0, severity, shouldElevate: false };
  }

  /**
   * Evict expired entries and enforce max cache size
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL_MS) return;
    this.lastCleanup = now;

    // Remove expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.cachedAt >= this.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }

    // If still over max size, evict oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for a user (call after new test submission)
   */
  invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }
}

export const dassTestBridge = new DASSTestBridgeService();
export default dassTestBridge;
