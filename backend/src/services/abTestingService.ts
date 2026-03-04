/**
 * A/B Testing Service
 *
 * Framework for comparing different configurations of the risk scoring
 * and chatbot response systems. Supports:
 *   - Multi-variant experiments
 *   - Consistent user assignment (deterministic hashing)
 *   - Metric tracking per variant
 *   - Statistical significance calculation
 *   - Experiment lifecycle management
 *
 * Use cases:
 *   - Compare keyword weight configurations
 *   - Test different risk thresholds
 *   - Evaluate response style changes
 *   - Measure Social Harm Decoder impact
 *
 * @module services/abTestingService
 * @version 1.0.0
 */

import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'concluded';

export interface ExperimentVariant {
  /** Unique variant ID (e.g., 'control', 'variant_a') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Traffic allocation weight (0..1). All variants in an experiment should sum to 1. */
  weight: number;
  /** Configuration overrides for this variant */
  config: Record<string, unknown>;
  /** Description of what this variant changes */
  description: string;
}

export interface VariantMetrics {
  /** Number of users exposed to this variant */
  exposures: number;
  /** Number of risk assessments in this variant */
  assessments: number;
  /** Number of TRUE crisis detections confirmed by HITL */
  truePositives: number;
  /** Number of FALSE crisis detections (false alarms) */
  falsePositives: number;
  /** Average risk score across all assessments */
  avgRiskScore: number;
  /** Total HITL activations */
  hitlActivations: number;
  /** Average user satisfaction score (1-5, from feedback) */
  avgSatisfaction: number;
  /** Number of satisfaction ratings received */
  satisfactionCount: number;
  /** Custom tracked events */
  customEvents: Record<string, number>;
}

export interface Experiment {
  /** Unique experiment ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what is being tested */
  description: string;
  /** What metric is being optimized */
  primaryMetric: string;
  /** Current status */
  status: ExperimentStatus;
  /** Variants in this experiment */
  variants: ExperimentVariant[];
  /** Metrics tracked per variant */
  metrics: Map<string, VariantMetrics>;
  /** When experiment was created */
  createdAt: Date;
  /** When experiment started running */
  startedAt?: Date;
  /** When experiment was concluded */
  concludedAt?: Date;
  /** Winning variant (set on conclusion) */
  winner?: string;
  /** Minimum sample size per variant before conclusions can be drawn */
  minSampleSize: number;
  /** Statistical confidence threshold (default: 0.95) */
  confidenceThreshold: number;
}

export interface ExperimentResult {
  experimentId: string;
  experimentName: string;
  status: ExperimentStatus;
  variants: Array<{
    id: string;
    name: string;
    metrics: VariantMetrics;
    isWinner: boolean;
  }>;
  statisticalSignificance: boolean;
  pValue: number;
  recommendation: string;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId → experimentId → variantId

  constructor() {
    logger.info('🧪 ABTestingService initialized');
  }

  // ─────────────────────────────────────────────────────
  // EXPERIMENT MANAGEMENT
  // ─────────────────────────────────────────────────────

  /**
   * Create a new A/B test experiment
   */
  createExperiment(params: {
    name: string;
    description: string;
    primaryMetric: string;
    variants: ExperimentVariant[];
    minSampleSize?: number;
    confidenceThreshold?: number;
  }): Experiment {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Validate variant weights sum to 1
    const totalWeight = params.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error(`Variant weights must sum to 1.0 (got ${totalWeight})`);
    }

    // Validate at least 2 variants
    if (params.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const metrics = new Map<string, VariantMetrics>();
    for (const variant of params.variants) {
      metrics.set(variant.id, this.createEmptyMetrics());
    }

    const experiment: Experiment = {
      id,
      name: params.name,
      description: params.description,
      primaryMetric: params.primaryMetric,
      status: 'draft',
      variants: params.variants,
      metrics,
      createdAt: new Date(),
      minSampleSize: params.minSampleSize ?? 50,
      confidenceThreshold: params.confidenceThreshold ?? 0.95,
    };

    this.experiments.set(id, experiment);

    logger.info(`🧪 Experiment created: ${id} — "${params.name}"`, {
      variants: params.variants.map(v => v.id),
      primaryMetric: params.primaryMetric,
    });

    return experiment;
  }

  /**
   * Start an experiment (make it live)
   */
  startExperiment(experimentId: string): Experiment {
    const exp = this.getExperimentOrThrow(experimentId);
    if (exp.status !== 'draft' && exp.status !== 'paused') {
      throw new Error(`Cannot start experiment in status: ${exp.status}`);
    }

    exp.status = 'running';
    exp.startedAt = exp.startedAt || new Date();

    logger.info(`▶️ Experiment started: ${experimentId}`);
    return exp;
  }

  /**
   * Pause a running experiment
   */
  pauseExperiment(experimentId: string): Experiment {
    const exp = this.getExperimentOrThrow(experimentId);
    if (exp.status !== 'running') {
      throw new Error(`Cannot pause experiment in status: ${exp.status}`);
    }

    exp.status = 'paused';
    logger.info(`⏸️ Experiment paused: ${experimentId}`);
    return exp;
  }

  /**
   * Conclude an experiment and declare a winner
   */
  concludeExperiment(experimentId: string, winnerId?: string): ExperimentResult {
    const exp = this.getExperimentOrThrow(experimentId);

    // Auto-determine winner if not specified
    if (!winnerId) {
      const result = this.analyzeResults(experimentId);
      winnerId = result.variants.find(v => v.isWinner)?.id;
    }

    exp.status = 'concluded';
    exp.concludedAt = new Date();
    exp.winner = winnerId;

    logger.info(`🏁 Experiment concluded: ${experimentId}`, { winner: winnerId });

    return this.analyzeResults(experimentId);
  }

  // ─────────────────────────────────────────────────────
  // USER ASSIGNMENT
  // ─────────────────────────────────────────────────────

  /**
   * Get the variant assigned to a user for a given experiment.
   * Uses deterministic hashing so the same user always gets the same variant.
   * Returns null if experiment is not running.
   */
  getVariantForUser(experimentId: string, userId: string): ExperimentVariant | null {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'running') {
      return null;
    }

    // Check existing assignment
    const userExps = this.userAssignments.get(userId);
    if (userExps?.has(experimentId)) {
      const variantId = userExps.get(experimentId)!;
      return exp.variants.find(v => v.id === variantId) || null;
    }

    // Assign based on deterministic hash
    const variant = this.assignVariant(exp, userId);

    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(experimentId, variant.id);

    // Track exposure
    const metrics = exp.metrics.get(variant.id);
    if (metrics) {
      metrics.exposures++;
    }

    return variant;
  }

  /**
   * Get the active variant config for a user across ALL running experiments.
   * Returns merged config overrides.
   */
  getActiveConfigForUser(userId: string): Record<string, unknown> {
    const mergedConfig: Record<string, unknown> = {};

    for (const [expId, exp] of this.experiments) {
      if (exp.status !== 'running') continue;

      const variant = this.getVariantForUser(expId, userId);
      if (variant) {
        Object.assign(mergedConfig, variant.config);
      }
    }

    return mergedConfig;
  }

  // ─────────────────────────────────────────────────────
  // METRIC TRACKING
  // ─────────────────────────────────────────────────────

  /**
   * Record a risk assessment event for tracking
   */
  trackAssessment(
    experimentId: string,
    userId: string,
    data: {
      riskScore: number;
      wasHITLActivated: boolean;
    }
  ): void {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'running') return;

    const variantId = this.userAssignments.get(userId)?.get(experimentId);
    if (!variantId) return;

    const metrics = exp.metrics.get(variantId);
    if (!metrics) return;

    metrics.assessments++;
    metrics.avgRiskScore =
      (metrics.avgRiskScore * (metrics.assessments - 1) + data.riskScore) / metrics.assessments;

    if (data.wasHITLActivated) {
      metrics.hitlActivations++;
    }
  }

  /**
   * Record HITL outcome (true positive or false positive)
   */
  trackHITLOutcome(
    experimentId: string,
    userId: string,
    wasActualCrisis: boolean
  ): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    const variantId = this.userAssignments.get(userId)?.get(experimentId);
    if (!variantId) return;

    const metrics = exp.metrics.get(variantId);
    if (!metrics) return;

    if (wasActualCrisis) {
      metrics.truePositives++;
    } else {
      metrics.falsePositives++;
    }
  }

  /**
   * Record user satisfaction rating
   */
  trackSatisfaction(
    experimentId: string,
    userId: string,
    rating: number // 1-5
  ): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    const variantId = this.userAssignments.get(userId)?.get(experimentId);
    if (!variantId) return;

    const metrics = exp.metrics.get(variantId);
    if (!metrics) return;

    metrics.avgSatisfaction =
      (metrics.avgSatisfaction * metrics.satisfactionCount + rating) /
      (metrics.satisfactionCount + 1);
    metrics.satisfactionCount++;
  }

  /**
   * Track a custom event
   */
  trackCustomEvent(
    experimentId: string,
    userId: string,
    eventName: string,
    count: number = 1
  ): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;

    const variantId = this.userAssignments.get(userId)?.get(experimentId);
    if (!variantId) return;

    const metrics = exp.metrics.get(variantId);
    if (!metrics) return;

    metrics.customEvents[eventName] = (metrics.customEvents[eventName] || 0) + count;
  }

  // ─────────────────────────────────────────────────────
  // ANALYSIS
  // ─────────────────────────────────────────────────────

  /**
   * Analyze experiment results with statistical significance
   */
  analyzeResults(experimentId: string): ExperimentResult {
    const exp = this.getExperimentOrThrow(experimentId);

    const variantResults = exp.variants.map(v => {
      const metrics = exp.metrics.get(v.id) || this.createEmptyMetrics();
      return {
        id: v.id,
        name: v.name,
        metrics,
        isWinner: false,
      };
    });

    // Determine winner based on primary metric
    const { winnerId, pValue, significant } = this.calculateSignificance(
      exp,
      variantResults
    );

    // Mark winner
    for (const v of variantResults) {
      v.isWinner = v.id === winnerId;
    }

    const recommendation = this.generateRecommendation(exp, variantResults, significant, pValue);

    return {
      experimentId,
      experimentName: exp.name,
      status: exp.status,
      variants: variantResults,
      statisticalSignificance: significant,
      pValue,
      recommendation,
    };
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get running experiments
   */
  getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────

  private getExperimentOrThrow(id: string): Experiment {
    const exp = this.experiments.get(id);
    if (!exp) {
      throw new Error(`Experiment not found: ${id}`);
    }
    return exp;
  }

  private createEmptyMetrics(): VariantMetrics {
    return {
      exposures: 0,
      assessments: 0,
      truePositives: 0,
      falsePositives: 0,
      avgRiskScore: 0,
      hitlActivations: 0,
      avgSatisfaction: 0,
      satisfactionCount: 0,
      customEvents: {},
    };
  }

  /**
   * Deterministic variant assignment using hash-based bucketing.
   * Same userId always maps to the same variant.
   */
  private assignVariant(experiment: Experiment, userId: string): ExperimentVariant {
    // Simple hash-based assignment
    const hash = this.hashString(`${experiment.id}:${userId}`);
    const bucket = (hash % 10000) / 10000; // 0..1

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    // Fallback to last variant (shouldn't reach here if weights sum to 1)
    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Simple string hash (djb2 algorithm)
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
  }

  /**
   * Calculate statistical significance between variants.
   * Uses a simplified chi-squared test for proportions.
   */
  private calculateSignificance(
    experiment: Experiment,
    variants: Array<{ id: string; metrics: VariantMetrics }>
  ): { winnerId: string | undefined; pValue: number; significant: boolean } {
    if (variants.length < 2) {
      return { winnerId: undefined, pValue: 1, significant: false };
    }

    // Check minimum sample size
    const hasSufficientData = variants.every(
      v => v.metrics.assessments >= experiment.minSampleSize
    );

    if (!hasSufficientData) {
      return { winnerId: undefined, pValue: 1, significant: false };
    }

    // Pick the best variant based on primary metric
    let bestVariant = variants[0];
    let bestScore = this.getMetricValue(variants[0].metrics, experiment.primaryMetric);

    for (let i = 1; i < variants.length; i++) {
      const score = this.getMetricValue(variants[i].metrics, experiment.primaryMetric);
      const isBetter = experiment.primaryMetric === 'falsePositiveRate'
        ? score < bestScore // Lower FP rate is better
        : score > bestScore; // Higher is better for most metrics

      if (isBetter) {
        bestScore = score;
        bestVariant = variants[i];
      }
    }

    // Simplified significance test: two-proportion z-test between best and control
    const control = variants[0];
    const treatment = bestVariant;

    if (control.id === treatment.id) {
      return { winnerId: control.id, pValue: 1, significant: false };
    }

    const p1 = this.getMetricValue(control.metrics, experiment.primaryMetric);
    const p2 = this.getMetricValue(treatment.metrics, experiment.primaryMetric);
    const n1 = control.metrics.assessments;
    const n2 = treatment.metrics.assessments;

    // Pooled proportion
    const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));

    const z = se > 0 ? Math.abs(p2 - p1) / se : 0;

    // Approximate p-value from z-score (two-tailed)
    const pValue = this.zToPValue(z);
    const significant = pValue < (1 - experiment.confidenceThreshold);

    return {
      winnerId: significant ? treatment.id : undefined,
      pValue,
      significant,
    };
  }

  /**
   * Get a specific metric value from VariantMetrics
   */
  private getMetricValue(metrics: VariantMetrics, metricName: string): number {
    switch (metricName) {
      case 'accuracy':
        const total = metrics.truePositives + metrics.falsePositives;
        return total > 0 ? metrics.truePositives / total : 0;
      case 'falsePositiveRate':
        const totalFP = metrics.truePositives + metrics.falsePositives;
        return totalFP > 0 ? metrics.falsePositives / totalFP : 0;
      case 'hitlActivationRate':
        return metrics.assessments > 0 ? metrics.hitlActivations / metrics.assessments : 0;
      case 'avgRiskScore':
        return metrics.avgRiskScore;
      case 'avgSatisfaction':
        return metrics.avgSatisfaction;
      default:
        return metrics.customEvents[metricName] || 0;
    }
  }

  /**
   * Approximate z-score to p-value conversion (two-tailed)
   * Uses the complementary error function approximation
   */
  private zToPValue(z: number): number {
    // Abramowitz & Stegun approximation
    const absZ = Math.abs(z);
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989422804014327; // 1/sqrt(2*pi)
    const prob =
      d *
      Math.exp(-0.5 * absZ * absZ) *
      (0.319381530 * t -
        0.356563782 * t * t +
        1.781477937 * t * t * t -
        1.821255978 * t * t * t * t +
        1.330274429 * t * t * t * t * t);

    return 2 * prob; // Two-tailed
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(
    experiment: Experiment,
    variants: Array<{ id: string; name: string; metrics: VariantMetrics; isWinner: boolean }>,
    significant: boolean,
    pValue: number
  ): string {
    const hasSufficientData = variants.every(
      v => v.metrics.assessments >= experiment.minSampleSize
    );

    if (!hasSufficientData) {
      const minExposures = Math.min(...variants.map(v => v.metrics.assessments));
      return `Cần thêm dữ liệu (hiện có ${minExposures}/${experiment.minSampleSize} samples/variant). Tiếp tục chạy thí nghiệm.`;
    }

    const winner = variants.find(v => v.isWinner);

    if (!significant) {
      return `Chưa đạt mức ý nghĩa thống kê (p=${pValue.toFixed(4)}). Tiếp tục thu thập dữ liệu hoặc tăng cỡ mẫu.`;
    }

    if (winner) {
      return `Variant "${winner.name}" thắng với p=${pValue.toFixed(4)} (${experiment.primaryMetric}). Khuyến nghị: triển khai variant này cho toàn bộ người dùng.`;
    }

    return 'Không xác định được variant thắng. Cân nhắc chạy lại thí nghiệm với thiết kế khác.';
  }
}

// Export singleton
export const abTestingService = new ABTestingService();
export default abTestingService;
