/**
 * MULTI-ARMED BANDIT POLICY — PGE Phase 5
 * 
 * Thompson Sampling with Contextual Bandits for adaptive intervention selection.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Contextual Bandit Pipeline:                                │
 * │                                                             │
 * │  1. Extract context: topology profile + zone + EBH level   │
 * │  2. Query historical arm rewards per context                │
 * │  3. Thompson Sampling: sample from Beta(α, β) per arm      │
 * │  4. UCB exploration bonus                                   │
 * │  5. Return ranked arms with expected rewards                │
 * │  6. After outcome: update via InterventionRecord            │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Arms (K=4):
 * 0: cognitive_reframing
 * 1: social_connection
 * 2: behavioral_activation
 * 3: emotional_regulation
 * 
 * Context features:
 * - topology_profile: fragile|chaotic|stuck|resilient|transitional
 * - zone: safe|caution|risk|critical|black_hole
 * - ebh_level: low (<0.3) | medium (0.3-0.6) | high (>0.6)
 * 
 * @module services/pge/banditPolicy
 * @version 1.0.0 — PGE Phase 5
 */

import { logger } from '../../utils/logger';
import InterventionRecord from '../../models/InterventionRecord';
import {
  INTERVENTION_TYPES,
  INTERVENTION_LABELS,
  InterventionType,
} from '../../models/InterventionRecord';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

/** Number of bandit arms = number of intervention types */
const K = INTERVENTION_TYPES.length; // 4

/** Minimum total observations before bandit becomes active */
const MIN_OBSERVATIONS = 15;

/** Effectiveness threshold: reward=1 if effectiveness >= this, else 0 */
const SUCCESS_THRESHOLD = 0.25;

/** UCB exploration parameter c */
const UCB_C = 1.5;

/** Prior: Beta(alpha0, beta0) — weak prior encourages exploration */
const PRIOR_ALPHA = 1.0;
const PRIOR_BETA = 1.0;

/** Maximum records to consider per context for stats */
const MAX_RECORDS_PER_CONTEXT = 500;

/** Cache TTL (ms) — cache arm stats for 5 minutes */
const CACHE_TTL = 5 * 60 * 1000;

interface BanditContext {
  topologyProfile?: string;  // fragile|chaotic|stuck|resilient|transitional
  zone: string;              // safe|caution|risk|critical|black_hole
  ebhScore: number;          // 0-1 EBH score
}

interface ArmStats {
  arm: number;
  armName: string;
  successes: number;  // α - PRIOR_ALPHA
  failures: number;   // β - PRIOR_BETA
  totalTrials: number;
  avgEffectiveness: number;
  alpha: number;      // Beta distribution α
  beta: number;       // Beta distribution β
}

interface BanditSelection {
  arm: number;
  armName: string;
  interventionType: InterventionType;
  sampledValue: number;     // Thompson Sampling sampled value
  ucb: number;              // UCB score
  combinedScore: number;    // Final ranking score
  confidence: number;       // How confident (0-1)
  reason: string;
}

interface BanditResult {
  active: boolean;           // Whether bandit has enough data to be active
  totalObservations: number;
  contextKey: string;
  selections: BanditSelection[];
  bestArm: BanditSelection;
}

// ════════════════════════════════════════════════════════════════
// BANDIT POLICY
// ════════════════════════════════════════════════════════════════

class BanditPolicy {
  private cache: Map<string, { stats: ArmStats[]; total: number; timestamp: number }> = new Map();
  private static readonly MAX_CACHE_SIZE = 200;

  /**
   * Select the best intervention arm using Thompson Sampling + UCB.
   * 
   * @param userId - User ID (arm stats are per-user + global fallback)
   * @param context - Contextual features (topology, zone, EBH)
   * @returns BanditResult with ranked arms
   */
  async selectArm(userId: string, context: BanditContext): Promise<BanditResult> {
    const ctxKey = this.contextKey(context);

    // 1. Get arm statistics from InterventionRecord
    const { stats, total } = await this.getArmStats(userId, context);

    // 2. Check if bandit has enough data
    const active = total >= MIN_OBSERVATIONS;

    // 3. Thompson Sampling: sample from Beta(α, β) for each arm
    const selections: BanditSelection[] = stats.map(arm => {
      const sampled = this.sampleBeta(arm.alpha, arm.beta);
      const ucb = this.computeUCB(arm, total);
      const combinedScore = 0.7 * sampled + 0.3 * ucb;
      const confidence = arm.totalTrials > 0
        ? Math.min(1, arm.totalTrials / 20)
        : 0;

      return {
        arm: arm.arm,
        armName: arm.armName,
        interventionType: INTERVENTION_TYPES[arm.arm],
        sampledValue: sampled,
        ucb,
        combinedScore,
        confidence,
        reason: this.generateBanditReason(arm, context, sampled),
      };
    });

    // 4. Sort by combined score (descending)
    selections.sort((a, b) => b.combinedScore - a.combinedScore);

    return {
      active,
      totalObservations: total,
      contextKey: ctxKey,
      selections,
      bestArm: selections[0],
    };
  }

  /**
   * Get arm statistics aggregated from InterventionRecord.
   */
  async getArmStats(userId: string, context: BanditContext): Promise<{ stats: ArmStats[]; total: number }> {
    const ctxKey = `${userId}:${this.contextKey(context)}`;
    const cached = this.cache.get(ctxKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { stats: cached.stats, total: cached.total };
    }

    try {
      const ebhLevel = this.getEBHLevel(context.ebhScore);

      // Query: user-specific + same context (zone + EBH level)
      // Falls back to user-global if context-specific has too few records
      const contextFilter: any = {
        userId,
        effectiveness: { $exists: true, $ne: null },
      };

      // Match zone category
      const zoneCategories: Record<string, string[]> = {
        safe: ['safe'],
        mild: ['caution'],
        severe: ['risk', 'critical', 'black_hole'],
      };
      const zoneGroup = context.zone === 'safe' ? 'safe'
        : context.zone === 'caution' ? 'mild'
        : 'severe';
      contextFilter.preZone = { $in: zoneCategories[zoneGroup] };

      const records = await InterventionRecord.find(contextFilter)
        .sort({ outcomeRecordedAt: -1 })
        .limit(MAX_RECORDS_PER_CONTEXT)
        .lean();

      // If too few context-specific records, also include user-global
      let allRecords = records;
      if (records.length < MIN_OBSERVATIONS) {
        const globalRecords = await InterventionRecord.find({
          userId,
          effectiveness: { $exists: true, $ne: null },
        })
        .sort({ outcomeRecordedAt: -1 })
        .limit(MAX_RECORDS_PER_CONTEXT)
        .lean();
        allRecords = globalRecords;
      }

      // Aggregate per arm
      const armMap = new Map<number, { successes: number; failures: number; totalEff: number }>();
      for (let i = 0; i < K; i++) {
        armMap.set(i, { successes: 0, failures: 0, totalEff: 0 });
      }

      for (const r of allRecords) {
        const armIdx = INTERVENTION_TYPES.indexOf(r.interventionType as InterventionType);
        if (armIdx < 0) continue;
        const arm = armMap.get(armIdx)!;
        const eff = r.effectiveness ?? 0;
        if (eff >= SUCCESS_THRESHOLD) {
          arm.successes++;
        } else {
          arm.failures++;
        }
        arm.totalEff += eff;
      }

      const stats: ArmStats[] = [];
      for (let i = 0; i < K; i++) {
        const arm = armMap.get(i)!;
        const total = arm.successes + arm.failures;
        stats.push({
          arm: i,
          armName: INTERVENTION_LABELS[INTERVENTION_TYPES[i]],
          successes: arm.successes,
          failures: arm.failures,
          totalTrials: total,
          avgEffectiveness: total > 0 ? arm.totalEff / total : 0,
          alpha: PRIOR_ALPHA + arm.successes,
          beta: PRIOR_BETA + arm.failures,
        });
      }

      const total = allRecords.length;
      this.cache.set(ctxKey, { stats, total, timestamp: Date.now() });
      if (this.cache.size > BanditPolicy.MAX_CACHE_SIZE) {
        const oldest = this.cache.keys().next().value;
        if (oldest) this.cache.delete(oldest);
      }

      return { stats, total };
    } catch (error) {
      logger.error('[BanditPolicy] getArmStats failed:', error);
      // Return uniform priors
      const stats: ArmStats[] = [];
      for (let i = 0; i < K; i++) {
        stats.push({
          arm: i,
          armName: INTERVENTION_LABELS[INTERVENTION_TYPES[i]],
          successes: 0,
          failures: 0,
          totalTrials: 0,
          avgEffectiveness: 0,
          alpha: PRIOR_ALPHA,
          beta: PRIOR_BETA,
        });
      }
      return { stats, total: 0 };
    }
  }

  /**
   * Thompson Sampling: sample from Beta(α, β) distribution.
   * Uses the Joehnk method for Beta sampling.
   */
  sampleBeta(alpha: number, beta: number): number {
    // Use inverse CDF approximation for common cases
    if (alpha <= 0) alpha = 0.01;
    if (beta <= 0) beta = 0.01;

    // Gamma-based method: X ~ Gamma(α), Y ~ Gamma(β), then X/(X+Y) ~ Beta(α,β)
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    if (x + y < 1e-12) return 0.5;
    return x / (x + y);
  }

  /**
   * Sample from Gamma(shape, 1) distribution.
   * Marsaglia and Tsang's method for shape >= 1.
   * For shape < 1, use the relation: Gamma(α) = Gamma(α+1) * U^(1/α).
   */
  private sampleGamma(shape: number): number {
    if (shape < 1) {
      const u = Math.random();
      return this.sampleGamma(shape + 1) * Math.pow(u, 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number, v: number;
      do {
        x = this.sampleNormal();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  /**
   * Sample from standard normal N(0,1) using Box-Muller transform.
   */
  private sampleNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1 + 1e-12)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Compute UCB (Upper Confidence Bound) for exploration.
   * UCB1 formula: μ + c * sqrt(ln(N) / n)
   */
  computeUCB(arm: ArmStats, totalN: number): number {
    if (arm.totalTrials === 0) return 1.0; // Maximum exploration for untried arms
    const exploitation = arm.avgEffectiveness;
    const exploration = UCB_C * Math.sqrt(Math.log(totalN + 1) / arm.totalTrials);
    return Math.min(1, exploitation + exploration);
  }

  /**
   * Create context key for segmented statistics.
   */
  private contextKey(context: BanditContext): string {
    const ebhLevel = this.getEBHLevel(context.ebhScore);
    const topo = context.topologyProfile || 'unknown';
    const zoneGroup = context.zone === 'safe' ? 'safe'
      : context.zone === 'caution' ? 'mild'
      : 'severe';
    return `${topo}:${zoneGroup}:${ebhLevel}`;
  }

  /**
   * Categorize EBH score into levels.
   */
  private getEBHLevel(ebh: number): string {
    if (ebh < 0.3) return 'low';
    if (ebh < 0.6) return 'medium';
    return 'high';
  }

  /**
   * Generate Vietnamese reason for bandit selection.
   */
  private generateBanditReason(arm: ArmStats, context: BanditContext, sampledValue: number): string {
    const armName = arm.armName;
    if (arm.totalTrials === 0) {
      return `${armName}: Chưa có dữ liệu — khám phá (exploration) để thu thập thông tin.`;
    }
    const avgPct = Math.round(arm.avgEffectiveness * 100);
    const successRate = Math.round((arm.successes / Math.max(1, arm.totalTrials)) * 100);
    return `${armName}: Hiệu quả trung bình ${avgPct}% | Tỉ lệ thành công ${successRate}% (${arm.successes}/${arm.totalTrials}) | Thompson value: ${sampledValue.toFixed(3)}`;
  }

  /**
   * Get bandit analytics for a user — arm performance over time.
   */
  async getAnalytics(userId: string): Promise<{
    armStats: ArmStats[];
    totalObservations: number;
    explorationRate: number;
    bestArm: { index: number; name: string; avgEffectiveness: number };
    armHistory: Array<{
      arm: number;
      armName: string;
      effectiveness: number;
      timestamp: Date;
    }>;
  }> {
    const records = await InterventionRecord.find({
      userId,
      effectiveness: { $exists: true, $ne: null },
    })
    .sort({ outcomeRecordedAt: -1 })
    .limit(200)
    .lean();

    // Aggregate stats
    const armMap = new Map<number, { successes: number; failures: number; totalEff: number }>();
    for (let i = 0; i < K; i++) {
      armMap.set(i, { successes: 0, failures: 0, totalEff: 0 });
    }

    const armHistory: Array<{ arm: number; armName: string; effectiveness: number; timestamp: Date }> = [];

    for (const r of records) {
      const armIdx = INTERVENTION_TYPES.indexOf(r.interventionType as InterventionType);
      if (armIdx < 0) continue;
      const arm = armMap.get(armIdx)!;
      const eff = r.effectiveness ?? 0;
      if (eff >= SUCCESS_THRESHOLD) arm.successes++;
      else arm.failures++;
      arm.totalEff += eff;

      armHistory.push({
        arm: armIdx,
        armName: INTERVENTION_LABELS[INTERVENTION_TYPES[armIdx]],
        effectiveness: eff,
        timestamp: r.outcomeRecordedAt ?? r.recommendedAt,
      });
    }

    const stats: ArmStats[] = [];
    let bestArmIdx = 0;
    let bestAvg = -1;

    for (let i = 0; i < K; i++) {
      const arm = armMap.get(i)!;
      const total = arm.successes + arm.failures;
      const avg = total > 0 ? arm.totalEff / total : 0;
      stats.push({
        arm: i,
        armName: INTERVENTION_LABELS[INTERVENTION_TYPES[i]],
        successes: arm.successes,
        failures: arm.failures,
        totalTrials: total,
        avgEffectiveness: avg,
        alpha: PRIOR_ALPHA + arm.successes,
        beta: PRIOR_BETA + arm.failures,
      });
      if (avg > bestAvg) {
        bestAvg = avg;
        bestArmIdx = i;
      }
    }

    // Compute exploration rate (how diverse are the recent selections)
    const recentTypes = new Set(records.slice(0, 20).map(r => r.interventionType));
    const explorationRate = recentTypes.size / K;

    return {
      armStats: stats,
      totalObservations: records.length,
      explorationRate,
      bestArm: {
        index: bestArmIdx,
        name: INTERVENTION_LABELS[INTERVENTION_TYPES[bestArmIdx]],
        avgEffectiveness: bestAvg,
      },
      armHistory: armHistory.slice(0, 50),
    };
  }

  /**
   * Invalidate cache for a user (call after new intervention outcome).
   */
  invalidateCache(userId: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

export const banditPolicy = new BanditPolicy();
export default banditPolicy;
