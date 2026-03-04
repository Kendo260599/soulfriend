/**
 * Auto Fine-Tuning Pipeline Service
 *
 * Integrated backend service that automatically:
 *   1. Monitors training data accumulation from HITL feedback
 *   2. Analyzes keyword/signal performance metrics
 *   3. Generates improvement suggestions (weights, keywords, thresholds)
 *   4. Applies approved changes to riskScoringService & moderationService
 *   5. Tracks before/after metrics for each tuning cycle
 *   6. Supports rollback if metrics degrade
 *
 * Unlike the external `scripts/auto-fine-tune-model.js`, this service
 * runs within the backend process and integrates directly with the
 * risk scoring pipeline.
 *
 * @module services/autoFineTuningService
 * @version 1.0.0
 */

import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export type TuningStatus = 'pending' | 'approved' | 'applied' | 'rolled_back' | 'rejected';

export interface TuningCycle {
  /** Unique cycle ID */
  id: string;
  /** When this cycle was created */
  createdAt: Date;
  /** Current status */
  status: TuningStatus;
  /** Number of training samples this cycle is based on */
  sampleCount: number;

  /** Snapshot of metrics BEFORE applying changes */
  metricsBefore: PerformanceSnapshot;
  /** Snapshot of metrics AFTER applying changes (populated after evaluation) */
  metricsAfter?: PerformanceSnapshot;

  /** Changes proposed in this cycle */
  proposedChanges: ProposedChanges;
  /** When changes were applied */
  appliedAt?: Date;
  /** When changes were rolled back (if applicable) */
  rolledBackAt?: Date;
  /** Reason for rejection/rollback */
  reason?: string;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgResponseTimeSeconds: number;
  totalAlerts: number;
  totalReviewed: number;
}

export interface ProposedChanges {
  /** Keywords to add to crisis detection */
  keywordsToAdd: Array<{
    keyword: string;
    suggestedWeight: number;
    reason: string;
  }>;
  /** Keywords to remove from crisis detection */
  keywordsToRemove: Array<{
    keyword: string;
    reason: string;
  }>;
  /** Keywords with weight adjustments */
  keywordsToAdjust: Array<{
    keyword: string;
    currentWeight: number;
    newWeight: number;
    reason: string;
  }>;
  /** Risk scoring source weight adjustments */
  sourceWeightAdjustments: Array<{
    source: string;
    currentWeight: number;
    newWeight: number;
    reason: string;
  }>;
  /** Threshold adjustments */
  thresholdChanges: Array<{
    parameter: string;
    currentValue: number;
    newValue: number;
    reason: string;
  }>;
}

export interface TuningConfig {
  /** Minimum training samples required before triggering a cycle */
  minimumSamples: number;
  /** Minimum samples since last cycle to trigger a new one */
  minimumNewSamples: number;
  /** Auto-apply changes? Or require manual approval */
  autoApply: boolean;
  /** Maximum degradation tolerated before auto-rollback (0..1) */
  maxDegradationThreshold: number;
  /** How many days of metrics to evaluate after applying */
  evaluationPeriodDays: number;
  /** Check interval in milliseconds (default: 6 hours) */
  checkIntervalMs: number;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: TuningConfig = {
  minimumSamples: 20,
  minimumNewSamples: 5,
  autoApply: false, // Require manual approval by default (safety first)
  maxDegradationThreshold: 0.05, // 5% max degradation
  evaluationPeriodDays: 7,
  checkIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class AutoFineTuningService {
  private config: TuningConfig;
  private tuningHistory: TuningCycle[] = [];
  private appliedKeywordWeights: Map<string, number> = new Map();
  private appliedSourceWeights: Map<string, number> = new Map();
  private checkTimer: NodeJS.Timeout | null = null;
  private lastCycleTimestamp: Date | null = null;
  private sampleCountAtLastCycle: number = 0;

  constructor(config?: Partial<TuningConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.info('🤖 AutoFineTuningService initialized', {
      minimumSamples: this.config.minimumSamples,
      autoApply: this.config.autoApply,
    });
  }

  // ─────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────

  /**
   * Start periodic checking for new training data
   */
  startPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(() => {
      this.checkAndTrigger().catch(err =>
        logger.error('Auto fine-tuning check failed:', err)
      );
    }, this.config.checkIntervalMs);

    logger.info(`⏱️ Auto fine-tuning check scheduled every ${this.config.checkIntervalMs / 3600000}h`);
  }

  /**
   * Stop periodic checking
   */
  stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      logger.info('⏹️ Auto fine-tuning periodic check stopped');
    }
  }

  // ─────────────────────────────────────────────────────
  // CORE PIPELINE
  // ─────────────────────────────────────────────────────

  /**
   * Check if conditions are met to trigger a new tuning cycle.
   * Called periodically or manually.
   */
  async checkAndTrigger(): Promise<TuningCycle | null> {
    logger.info('🔍 Checking fine-tuning trigger conditions...');

    // Gather current metrics from HITL feedback data
    const currentMetrics = await this.gatherCurrentMetrics();

    if (!currentMetrics) {
      logger.info('ℹ️ No metrics available yet — skipping');
      return null;
    }

    // Check minimum sample threshold
    if (currentMetrics.totalReviewed < this.config.minimumSamples) {
      logger.info(`ℹ️ Not enough samples: ${currentMetrics.totalReviewed}/${this.config.minimumSamples}`);
      return null;
    }

    // Check if enough new samples since last cycle
    const newSamples = currentMetrics.totalReviewed - this.sampleCountAtLastCycle;
    if (newSamples < this.config.minimumNewSamples) {
      logger.info(`ℹ️ Not enough new samples since last cycle: ${newSamples}/${this.config.minimumNewSamples}`);
      return null;
    }

    // Trigger a new tuning cycle
    return this.createTuningCycle(currentMetrics);
  }

  /**
   * Create a new tuning cycle with proposed changes
   */
  async createTuningCycle(metricsBefore: PerformanceSnapshot): Promise<TuningCycle> {
    const cycleId = `TUNE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    logger.info(`🔄 Creating tuning cycle: ${cycleId}`);

    // Generate proposed changes based on HITL feedback analysis
    const proposedChanges = await this.analyzeAndPropose();

    const cycle: TuningCycle = {
      id: cycleId,
      createdAt: new Date(),
      status: 'pending',
      sampleCount: metricsBefore.totalReviewed,
      metricsBefore,
      proposedChanges,
    };

    this.tuningHistory.push(cycle);
    this.lastCycleTimestamp = new Date();
    this.sampleCountAtLastCycle = metricsBefore.totalReviewed;

    logger.info(`📋 Tuning cycle created: ${cycleId}`, {
      keywordsToAdd: proposedChanges.keywordsToAdd.length,
      keywordsToRemove: proposedChanges.keywordsToRemove.length,
      keywordsToAdjust: proposedChanges.keywordsToAdjust.length,
      sourceWeightAdjustments: proposedChanges.sourceWeightAdjustments.length,
    });

    // Auto-apply if configured
    if (this.config.autoApply && this.hasSignificantChanges(proposedChanges)) {
      await this.applyCycle(cycleId);
    }

    return cycle;
  }

  /**
   * Manually approve and apply a pending tuning cycle
   */
  async approveCycle(cycleId: string): Promise<TuningCycle> {
    const cycle = this.tuningHistory.find(c => c.id === cycleId);
    if (!cycle) {
      throw new Error(`Tuning cycle not found: ${cycleId}`);
    }
    if (cycle.status !== 'pending') {
      throw new Error(`Cycle ${cycleId} is not pending (status: ${cycle.status})`);
    }

    cycle.status = 'approved';
    return this.applyCycle(cycleId);
  }

  /**
   * Reject a pending tuning cycle
   */
  rejectCycle(cycleId: string, reason: string): TuningCycle {
    const cycle = this.tuningHistory.find(c => c.id === cycleId);
    if (!cycle) {
      throw new Error(`Tuning cycle not found: ${cycleId}`);
    }

    cycle.status = 'rejected';
    cycle.reason = reason;

    logger.info(`❌ Tuning cycle rejected: ${cycleId} — ${reason}`);
    return cycle;
  }

  /**
   * Apply a tuning cycle's proposed changes
   */
  async applyCycle(cycleId: string): Promise<TuningCycle> {
    const cycle = this.tuningHistory.find(c => c.id === cycleId);
    if (!cycle) {
      throw new Error(`Tuning cycle not found: ${cycleId}`);
    }

    logger.info(`⚙️ Applying tuning cycle: ${cycleId}`);

    const changes = cycle.proposedChanges;

    // Apply keyword weight adjustments (stored locally, read by riskScoringService)
    for (const adj of changes.keywordsToAdjust) {
      this.appliedKeywordWeights.set(adj.keyword, adj.newWeight);
      logger.info(`⚖️ Keyword weight: "${adj.keyword}" ${adj.currentWeight} → ${adj.newWeight}`);
    }

    // Apply source weight adjustments
    for (const adj of changes.sourceWeightAdjustments) {
      this.appliedSourceWeights.set(adj.source, adj.newWeight);
      logger.info(`⚖️ Source weight: "${adj.source}" ${adj.currentWeight} → ${adj.newWeight}`);
    }

    // Mark keywords for removal (weight → 0)
    for (const rem of changes.keywordsToRemove) {
      this.appliedKeywordWeights.set(rem.keyword, 0);
      logger.info(`🗑️ Keyword disabled: "${rem.keyword}"`);
    }

    // Mark keywords for addition
    for (const add of changes.keywordsToAdd) {
      this.appliedKeywordWeights.set(add.keyword, add.suggestedWeight);
      logger.info(`➕ Keyword added: "${add.keyword}" (weight: ${add.suggestedWeight})`);
    }

    cycle.status = 'applied';
    cycle.appliedAt = new Date();

    logger.info(`✅ Tuning cycle applied: ${cycleId}`);
    return cycle;
  }

  /**
   * Roll back a previously applied tuning cycle
   */
  rollbackCycle(cycleId: string, reason: string): TuningCycle {
    const cycle = this.tuningHistory.find(c => c.id === cycleId);
    if (!cycle) {
      throw new Error(`Tuning cycle not found: ${cycleId}`);
    }
    if (cycle.status !== 'applied') {
      throw new Error(`Cycle ${cycleId} is not applied (status: ${cycle.status})`);
    }

    logger.warn(`⏪ Rolling back tuning cycle: ${cycleId} — ${reason}`);

    // Revert keyword weights
    for (const adj of cycle.proposedChanges.keywordsToAdjust) {
      this.appliedKeywordWeights.set(adj.keyword, adj.currentWeight);
    }
    for (const rem of cycle.proposedChanges.keywordsToRemove) {
      this.appliedKeywordWeights.delete(rem.keyword);
    }
    for (const add of cycle.proposedChanges.keywordsToAdd) {
      this.appliedKeywordWeights.delete(add.keyword);
    }

    // Revert source weights
    for (const adj of cycle.proposedChanges.sourceWeightAdjustments) {
      this.appliedSourceWeights.set(adj.source, adj.currentWeight);
    }

    cycle.status = 'rolled_back';
    cycle.rolledBackAt = new Date();
    cycle.reason = reason;

    logger.info(`⏪ Tuning cycle rolled back: ${cycleId}`);
    return cycle;
  }

  /**
   * Evaluate an applied cycle against post-application metrics
   */
  async evaluateCycle(cycleId: string): Promise<{
    improved: boolean;
    degraded: boolean;
    delta: Record<string, number>;
  }> {
    const cycle = this.tuningHistory.find(c => c.id === cycleId);
    if (!cycle || cycle.status !== 'applied') {
      throw new Error(`Cycle ${cycleId} not found or not applied`);
    }

    const metricsAfter = await this.gatherCurrentMetrics();
    if (!metricsAfter) {
      throw new Error('Cannot gather current metrics');
    }

    cycle.metricsAfter = metricsAfter;

    const delta = {
      accuracy: metricsAfter.accuracy - cycle.metricsBefore.accuracy,
      precision: metricsAfter.precision - cycle.metricsBefore.precision,
      recall: metricsAfter.recall - cycle.metricsBefore.recall,
      f1Score: metricsAfter.f1Score - cycle.metricsBefore.f1Score,
      falsePositiveRate: metricsAfter.falsePositiveRate - cycle.metricsBefore.falsePositiveRate,
    };

    const improved = delta.accuracy > 0 || delta.f1Score > 0;
    const degraded =
      delta.accuracy < -this.config.maxDegradationThreshold ||
      delta.f1Score < -this.config.maxDegradationThreshold;

    logger.info(`📊 Cycle evaluation: ${cycleId}`, {
      improved,
      degraded,
      accuracyDelta: `${(delta.accuracy * 100).toFixed(2)}%`,
      f1Delta: `${(delta.f1Score * 100).toFixed(2)}%`,
    });

    // Auto-rollback if degraded beyond threshold
    if (degraded) {
      logger.warn(`⚠️ Metrics degraded beyond threshold — auto-rolling back cycle ${cycleId}`);
      this.rollbackCycle(cycleId, `Auto-rollback: accuracy dropped ${(delta.accuracy * 100).toFixed(2)}%`);
    }

    return { improved, degraded, delta };
  }

  // ─────────────────────────────────────────────────────
  // ANALYSIS & PROPOSAL GENERATION
  // ─────────────────────────────────────────────────────

  /**
   * Analyze HITL feedback data and generate proposed changes.
   * This replaces the logic previously only in the external script.
   */
  private async analyzeAndPropose(): Promise<ProposedChanges> {
    const changes: ProposedChanges = {
      keywordsToAdd: [],
      keywordsToRemove: [],
      keywordsToAdjust: [],
      sourceWeightAdjustments: [],
      thresholdChanges: [],
    };

    // Analyze keyword performance from in-memory feedback
    // In production, query MongoDB:
    // const keywordStats = await HITLFeedback.getKeywordStatistics();
    // For now, use local weight tracking

    const currentWeights = this.getAppliedKeywordWeights();

    // Check source signal effectiveness
    // If social_harm or bias_monitor sources are producing many false positives,
    // suggest reducing their weight
    const sourcePerformance = this.analyzeSourcePerformance();
    for (const [source, perf] of sourcePerformance) {
      if (perf.falsePositiveRate > 0.5 && perf.sampleCount >= 5) {
        const currentWeight = this.appliedSourceWeights.get(source) || this.getDefaultSourceWeight(source);
        const newWeight = Math.max(0.3, currentWeight * 0.8);
        changes.sourceWeightAdjustments.push({
          source,
          currentWeight,
          newWeight,
          reason: `High false positive rate: ${(perf.falsePositiveRate * 100).toFixed(1)}%`,
        });
      }
    }

    logger.info('📝 Proposed changes generated', {
      adds: changes.keywordsToAdd.length,
      removes: changes.keywordsToRemove.length,
      adjusts: changes.keywordsToAdjust.length,
      sourceAdj: changes.sourceWeightAdjustments.length,
    });

    return changes;
  }

  // ─────────────────────────────────────────────────────
  // PUBLIC API (for riskScoringService integration)
  // ─────────────────────────────────────────────────────

  /**
   * Get the current adjusted source weight for a given signal source.
   * Used by riskScoringService.calculateScore() to apply dynamic weights.
   */
  getSourceWeight(source: string): number | null {
    return this.appliedSourceWeights.get(source) ?? null;
  }

  /**
   * Get all applied keyword weights.
   */
  getAppliedKeywordWeights(): Map<string, number> {
    return new Map(this.appliedKeywordWeights);
  }

  /**
   * Get all applied source weights.
   */
  getAppliedSourceWeights(): Map<string, number> {
    return new Map(this.appliedSourceWeights);
  }

  /**
   * Get the full tuning history
   */
  getTuningHistory(): TuningCycle[] {
    return [...this.tuningHistory];
  }

  /**
   * Get the latest tuning cycle
   */
  getLatestCycle(): TuningCycle | null {
    return this.tuningHistory.length > 0
      ? this.tuningHistory[this.tuningHistory.length - 1]
      : null;
  }

  /**
   * Get a summary of the current fine-tuning state
   */
  getStatus(): {
    totalCycles: number;
    activeCycle: TuningCycle | null;
    pendingCycles: number;
    appliedCycles: number;
    rolledBackCycles: number;
    currentKeywordOverrides: number;
    currentSourceOverrides: number;
    lastCycleAt: Date | null;
    nextCheckIn: string;
  } {
    const pending = this.tuningHistory.filter(c => c.status === 'pending');
    const applied = this.tuningHistory.filter(c => c.status === 'applied');
    const rolledBack = this.tuningHistory.filter(c => c.status === 'rolled_back');

    return {
      totalCycles: this.tuningHistory.length,
      activeCycle: applied.length > 0 ? applied[applied.length - 1] : null,
      pendingCycles: pending.length,
      appliedCycles: applied.length,
      rolledBackCycles: rolledBack.length,
      currentKeywordOverrides: this.appliedKeywordWeights.size,
      currentSourceOverrides: this.appliedSourceWeights.size,
      lastCycleAt: this.lastCycleTimestamp,
      nextCheckIn: this.checkTimer
        ? `${this.config.checkIntervalMs / 3600000}h`
        : 'not scheduled',
    };
  }

  // ─────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────

  private async gatherCurrentMetrics(): Promise<PerformanceSnapshot | null> {
    // In production, query MongoDB. For now, create a basic snapshot.
    // This would integrate with hitlFeedbackServicePersistent.calculatePerformanceMetrics()
    try {
      // Dynamic import to avoid circular dependencies
      const { hitlFeedbackService } = await import('./hitlFeedbackService');
      const metrics = await hitlFeedbackService.calculatePerformanceMetrics(30);

      return {
        timestamp: new Date(),
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        falsePositiveRate: metrics.falsePositiveRate,
        falseNegativeRate: metrics.falseNegativeRate,
        avgResponseTimeSeconds: metrics.avgResponseTimeSeconds,
        totalAlerts: metrics.totalAlerts,
        totalReviewed: metrics.totalReviewed,
      };
    } catch {
      logger.warn('Could not gather metrics from hitlFeedbackService');
      return null;
    }
  }

  private hasSignificantChanges(changes: ProposedChanges): boolean {
    return (
      changes.keywordsToAdd.length > 0 ||
      changes.keywordsToRemove.length > 0 ||
      changes.keywordsToAdjust.length > 0 ||
      changes.sourceWeightAdjustments.length > 0
    );
  }

  private getDefaultSourceWeight(source: string): number {
    const defaults: Record<string, number> = {
      crisis_keywords: 1.0,
      moderation: 0.9,
      social_harm: 0.85,
      bias_monitor: 0.7,
      sentiment: 0.7,
      history: 0.6,
      ai: 0.8,
      lexical: 0.8,
    };
    return defaults[source] ?? 0.5;
  }

  private analyzeSourcePerformance(): Map<string, { falsePositiveRate: number; sampleCount: number }> {
    // Placeholder: In production, aggregate from HITL feedback signals
    // Each feedback links back to which sources fired, which were correct
    return new Map();
  }
}

// Export singleton
export const autoFineTuningService = new AutoFineTuningService();
export default autoFineTuningService;
