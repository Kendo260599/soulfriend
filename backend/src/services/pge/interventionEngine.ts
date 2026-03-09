/**
 * INTERVENTION ENGINE — PGE Phase 2
 * 
 * Positive Attractor & Escape Force System
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Intervention Pipeline:                                     │
 * │                                                             │
 * │  1. Receive EBH alert (zone ≠ safe)                        │
 * │  2. Get current state S(t), interaction matrix A            │
 * │  3. Compute escape force required: ||A·S||                  │
 * │  4. Get/initialize intervention matrix B                    │
 * │  5. Search optimal intervention: min ||S(t+k) − S_PA||     │
 * │  6. Generate recommendation with confidence                 │
 * │  7. Track outcome → update B matrix (learning)             │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * @module services/pge/interventionEngine
 * @version 2.0.0 — PGE Phase 2 + Phase 4 Topology Integration
 */

import { logger } from '../../utils/logger';
import { PSY_DIMENSION } from '../../models/PsychologicalState';
import InterventionRecord, {
  InterventionType,
  INTERVENTION_TYPES,
  INTERVENTION_LABELS,
  INTERVENTION_DESCRIPTIONS,
  INTERVENTION_DIMENSION,
  IInterventionRecord,
} from '../../models/InterventionRecord';
import {
  Vec, Mat,
  stateToVec, vecToState,
  zeros, vecNorm, vecSub, vecScale,
  matVec,
  defaultInterventionMatrix as defaultB,
  findOptimalIntervention,
  computeESScore,
  computeEBHScore,
  distanceToAttractor,
  positiveAttractor,
  escapeForceRequired,
  escapeForceAchieved,
  compareTrajectories,
  defaultWeightMatrix,
  potentialEnergy,
  classifyZone,
  learnInterventionMatrix,
  interventionVector,
  applyTopologyWeights,
  getTopologyStrategyReason,
  TopologyProfile,
} from './mathEngine';
import { topologyMapper } from './topologyMapper';
import { banditPolicy } from './banditPolicy';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Minimum EBH score to trigger intervention recommendation */
const INTERVENTION_THRESHOLD = 0.3;

/** Minimum records needed to learn B matrix */
const MIN_RECORDS_FOR_B_LEARNING = 5;

/** B matrix regularization */
const B_REGULARIZATION = 0.1;

/** Maximum intervention records to consider for learning */
const MAX_LEARNING_RECORDS = 200;

// ════════════════════════════════════════════════════════════════
// INTERVENTION ENGINE
// ════════════════════════════════════════════════════════════════

class InterventionEngine {

  /**
   * Get intervention recommendation for a user based on current state.
   * 
   * Pipeline:
   * 1. Check if intervention is needed (EBH > threshold)
   * 2. Get historical intervention data for learning
   * 3. Get/learn B matrix
   * 4. Find optimal intervention
   * 5. Create recommendation record
   * 6. Return top recommendation + alternatives
   */
  async getRecommendation(params: {
    userId: string;
    sessionId: string;
    currentState: Vec;          // S(t) — 24D state vector
    interactionMatrix: Mat;     // A — 24×24
    ebhScore: number;
    zone: string;
    loopStrength?: number;
    negativeInertia?: number;
  }): Promise<{
    recommended: boolean;
    intervention?: {
      type: InterventionType;
      typeName: string;
      description: string;
      intensity: number;
      interventionVec: number[];
      predictedEBH: number;
      predictedES: number;
      effectiveness: number;
      escapeForce: number;
      escapeRatio: number;
      reason: string;
      topologyProfile?: string;
      topologyStrategy?: string;
      banditInfo?: string;
      trajectoryComparison: {
        withoutIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
        withIntervention: Array<{ step: number; ebhScore: number; esScore: number }>;
      };
    };
    alternatives: Array<{
      type: InterventionType;
      typeName: string;
      effectiveness: number;
      reason: string;
    }>;
    currentMetrics: {
      ebhScore: number;
      esScore: number;
      distanceToPA: number;
      escapeForceRequired: number;
      zone: string;
    };
  }> {
    const { userId, sessionId, currentState, interactionMatrix, ebhScore, zone } = params;

    // 1. Check threshold
    if (ebhScore < INTERVENTION_THRESHOLD && zone === 'safe') {
      const esScore = computeESScore(currentState);
      return {
        recommended: false,
        alternatives: [],
        currentMetrics: {
          ebhScore,
          esScore,
          distanceToPA: distanceToAttractor(currentState),
          escapeForceRequired: escapeForceRequired(interactionMatrix, currentState).required,
          zone,
        },
      };
    }

    // 2. Get learned B matrix (or default)
    const B = await this.getInterventionMatrix(userId, interactionMatrix);

    // 3. Find optimal intervention
    const candidates = findOptimalIntervention(
      currentState,
      interactionMatrix,
      B,
      5,   // simulation steps
      0.1, // dt
      [0.5, 0.7, 1.0], // intensity levels
      params.loopStrength ?? 0,
      params.negativeInertia ?? 0,
    );

    // 3.5 PHASE 4: Apply topology profile weights
    let topologyProfile: TopologyProfile | undefined;
    let topologyStrategy: string | undefined;
    let weightedCandidates = candidates;
    try {
      const topoResult = await topologyMapper.computeTopology(userId);
      if (topoResult.profile?.profile) {
        topologyProfile = topoResult.profile.profile as TopologyProfile;
        topologyStrategy = getTopologyStrategyReason(topologyProfile);
        weightedCandidates = applyTopologyWeights(candidates, topologyProfile);
        logger.info('[InterventionEngine] Topology-weighted intervention', {
          userId: userId.substring(0, 8),
          profile: topologyProfile,
          topCandidate: weightedCandidates[0]?.typeName,
        });
      }
    } catch (err) {
      logger.warn('[InterventionEngine] Topology lookup failed, using unweighted:', err);
    }

    // 3.7 PHASE 5: Bandit RL boost — Thompson Sampling contextual weights
    let banditInfo: string | undefined;
    try {
      const banditResult = await banditPolicy.selectArm(userId, {
        topologyProfile: topologyProfile,
        zone,
        ebhScore,
      });
      if (banditResult.active) {
        // Apply bandit boost: multiply effectiveness by (0.8 + 0.2 * normalizedBanditScore)
        const maxBanditScore = banditResult.selections[0]?.combinedScore || 1;
        weightedCandidates = weightedCandidates.map(c => {
          if (c.type < 0 || c.type >= INTERVENTION_TYPES.length) return c;
          const banditSel = banditResult.selections.find(s => s.arm === c.type);
          if (!banditSel) return c;
          const normalizedScore = banditSel.combinedScore / Math.max(0.01, maxBanditScore);
          return {
            ...c,
            effectiveness: Math.min(1, c.effectiveness * (0.8 + 0.2 * normalizedScore)),
          };
        }).sort((a, b) => b.effectiveness - a.effectiveness);

        banditInfo = `Bandit RL (${banditResult.totalObservations} obs): ${banditResult.bestArm.armName} — Thompson value ${banditResult.bestArm.sampledValue.toFixed(3)}`;
        logger.info('[InterventionEngine] Bandit-boosted intervention', {
          userId: userId.substring(0, 8),
          bestBanditArm: banditResult.bestArm.armName,
          observations: banditResult.totalObservations,
        });
      }
    } catch (err) {
      logger.warn('[InterventionEngine] Bandit lookup failed:', err);
    }

    if (weightedCandidates.length === 0) {
      return {
        recommended: false,
        alternatives: [],
        currentMetrics: {
          ebhScore,
          esScore: computeESScore(currentState),
          distanceToPA: distanceToAttractor(currentState),
          escapeForceRequired: escapeForceRequired(interactionMatrix, currentState).required,
          zone,
        },
      };
    }

    // 4. Best candidate
    const best = weightedCandidates[0];
    const bestType = best.type >= 0 && best.type < INTERVENTION_TYPES.length
      ? INTERVENTION_TYPES[best.type]
      : INTERVENTION_TYPES[0];

    // 5. Compare trajectories for visualization
    const comparison = compareTrajectories(
      currentState,
      interactionMatrix,
      B,
      best.interventionVec,
      10, // 10 steps for visualization
      0.1,
    );

    const W = defaultWeightMatrix();
    const trajectoryComparison = {
      withoutIntervention: comparison.withoutIntervention.map((s, i) => ({
        step: i,
        ebhScore: computeEBHScore({
          loopStrength: params.loopStrength ?? 0,
          negativeInertia: params.negativeInertia ?? 0,
          potentialEnergy: potentialEnergy(s, W),
          hopeLevel: s[8],
        }),
        esScore: computeESScore(s),
      })),
      withIntervention: comparison.withIntervention.map((s, i) => ({
        step: i,
        ebhScore: computeEBHScore({
          loopStrength: params.loopStrength ?? 0,
          negativeInertia: params.negativeInertia ?? 0,
          potentialEnergy: potentialEnergy(s, W),
          hopeLevel: s[8],
        }),
        esScore: computeESScore(s),
      })),
    };

    // 6. Create intervention record
    const esScore = computeESScore(currentState);
    try {
      const alternatives = candidates
        .slice(1, 4)
        .filter(c => c.type >= 0 && c.type < INTERVENTION_TYPES.length)
        .map(c => ({
          type: INTERVENTION_TYPES[c.type] as InterventionType,
          predictedEffectiveness: c.effectiveness,
        }));

      await InterventionRecord.create({
        userId,
        sessionId,
        interventionType: bestType,
        interventionVector: best.interventionVec,
        interventionIntensity: vecNorm(best.interventionVec),
        preState: currentState,
        preEBH: ebhScore,
        preES: esScore,
        preZone: zone,
        predictedEffectiveness: best.effectiveness,
        recommendationReason: best.reason,
        alternativeInterventions: alternatives,
        wasAccepted: true,
        usedForLearning: false,
      });
    } catch (err) {
      logger.warn('[InterventionEngine] Failed to save record:', err);
    }

    // 7. Build response
    const { required: reqForce } = escapeForceRequired(interactionMatrix, currentState);

    return {
      recommended: true,
      intervention: {
        type: bestType,
        typeName: INTERVENTION_LABELS[bestType],
        description: INTERVENTION_DESCRIPTIONS[bestType],
        intensity: best.intensity,
        interventionVec: best.interventionVec,
        predictedEBH: best.predictedEBH,
        predictedES: best.predictedES,
        effectiveness: best.effectiveness,
        escapeForce: best.escapeForce,
        escapeRatio: best.escapeRatio,
        reason: best.reason,
        topologyProfile: topologyProfile,
        topologyStrategy: topologyStrategy,
        banditInfo: banditInfo,
        trajectoryComparison,
      },
      alternatives: weightedCandidates
        .slice(1, 4)
        .filter(c => c.type >= 0 && c.type < INTERVENTION_TYPES.length)
        .map(c => ({
          type: INTERVENTION_TYPES[c.type] as InterventionType,
          typeName: INTERVENTION_LABELS[INTERVENTION_TYPES[c.type]],
          effectiveness: c.effectiveness,
          reason: c.reason,
        })),
      currentMetrics: {
        ebhScore,
        esScore,
        distanceToPA: distanceToAttractor(currentState),
        escapeForceRequired: reqForce,
        zone,
      },
    };
  }

  /**
   * Record intervention outcome (when next message arrives after intervention).
   * Computes effectiveness and reward signal for learning.
   */
  async recordOutcome(params: {
    userId: string;
    sessionId: string;
    postState: Vec;
    postEBH: number;
    interactionMatrix: Mat;
  }): Promise<{ updated: boolean; effectiveness?: number }> {
    try {
      // Find the most recent intervention without outcome
      const record = await InterventionRecord.findOne({
        userId: params.userId,
        sessionId: params.sessionId,
        postState: { $exists: false },
      }).sort({ recommendedAt: -1 });

      if (!record) {
        return { updated: false };
      }

      const postES = computeESScore(params.postState);
      const deltaEBH = params.postEBH - record.preEBH;
      const deltaES = postES - record.preES;

      // Effectiveness: how much improvement occurred
      // EBH decrease (negative deltaEBH) = good
      // ES increase (positive deltaES) = good
      const ebhImprovement = Math.max(0, -deltaEBH); // positive when EBH decreased
      const esImprovement = Math.max(0, deltaES);     // positive when ES increased

      const effectiveness = Math.min(1,
        0.5 * (ebhImprovement / Math.max(0.01, record.preEBH)) +
        0.5 * (esImprovement / Math.max(0.01, 1 - record.preES))
      );

      // Escape force achieved
      const B = await this.getInterventionMatrix(params.userId, params.interactionMatrix);
      const achieved = escapeForceAchieved(B, record.interventionVector);

      // Reward signal for RL: normalized EBH reduction
      const rewardSignal = -deltaEBH; // positive = good (EBH decreased)

      // Update record
      record.postState = params.postState;
      record.postEBH = params.postEBH;
      record.postES = postES;
      record.postZone = classifyZone(params.postEBH);
      record.deltaEBH = deltaEBH;
      record.deltaES = deltaES;
      record.effectiveness = effectiveness;
      record.escapeForceAchieved = achieved;
      record.rewardSignal = rewardSignal;
      record.outcomeRecordedAt = new Date();
      await record.save();

      logger.info('[InterventionEngine] Outcome recorded', {
        userId: params.userId.substring(0, 8),
        type: record.interventionType,
        deltaEBH: deltaEBH.toFixed(3),
        deltaES: deltaES.toFixed(3),
        effectiveness: effectiveness.toFixed(3),
      });

      // Check if we should retrain B matrix
      const completedCount = await InterventionRecord.countDocuments({
        userId: params.userId,
        effectiveness: { $exists: true },
        usedForLearning: false,
      });

      if (completedCount >= MIN_RECORDS_FOR_B_LEARNING) {
        this.updateInterventionMatrix(params.userId, params.interactionMatrix).catch(err => {
          logger.warn('[InterventionEngine] B matrix update failed:', err);
        });
      }

      // Phase 5: Invalidate bandit cache after new outcome
      banditPolicy.invalidateCache(params.userId);

      return { updated: true, effectiveness };
    } catch (error) {
      logger.error('[InterventionEngine] recordOutcome failed:', error);
      return { updated: false };
    }
  }

  /**
   * Get intervention matrix B for user.
   * Uses learned B if available, otherwise default.
   */
  private async getInterventionMatrix(userId: string, A: Mat): Promise<Mat> {
    try {
      // Check for completed interventions to learn from
      const records = await InterventionRecord.find({
        userId,
        effectiveness: { $exists: true },
      })
      .sort({ outcomeRecordedAt: -1 })
      .limit(MAX_LEARNING_RECORDS)
      .lean();

      if (records.length < MIN_RECORDS_FOR_B_LEARNING) {
        return defaultB();
      }

      const outcomes = records.map(r => ({
        preState: r.preState,
        postState: r.postState!,
        interventionVec: r.interventionVector,
      }));

      const { matrix } = learnInterventionMatrix(outcomes, A, 1.0, B_REGULARIZATION);
      return matrix;
    } catch {
      return defaultB();
    }
  }

  /**
   * Update B matrix from accumulated intervention data.
   */
  private async updateInterventionMatrix(userId: string, A: Mat): Promise<void> {
    try {
      const records = await InterventionRecord.find({
        userId,
        effectiveness: { $exists: true },
        usedForLearning: false,
      })
      .sort({ outcomeRecordedAt: -1 })
      .limit(MAX_LEARNING_RECORDS)
      .lean();

      if (records.length < MIN_RECORDS_FOR_B_LEARNING) return;

      const outcomes = records.map(r => ({
        preState: r.preState,
        postState: r.postState!,
        interventionVec: r.interventionVector,
      }));

      const { matrix, loss } = learnInterventionMatrix(outcomes, A, 1.0, B_REGULARIZATION);

      // Mark records as used
      await InterventionRecord.updateMany(
        { _id: { $in: records.map(r => r._id) } },
        { $set: { usedForLearning: true } },
      );

      logger.info('[InterventionEngine] B matrix updated', {
        userId: userId.substring(0, 8),
        records: records.length,
        loss: loss.toFixed(4),
      });
    } catch (error) {
      logger.error('[InterventionEngine] B matrix update failed:', error);
    }
  }

  /**
   * Get ES score trend for a user over time.
   */
  async getESTrend(userId: string, stateHistory: Array<{ timestamp: Date; stateVector: any }>): Promise<Array<{
    timestamp: Date;
    esScore: number;
    distanceToPA: number;
  }>> {
    return stateHistory.map(s => {
      const vec = stateToVec(s.stateVector);
      return {
        timestamp: s.timestamp,
        esScore: computeESScore(vec),
        distanceToPA: distanceToAttractor(vec),
      };
    });
  }

  /**
   * Get intervention history for a user with effectiveness stats.
   */
  async getInterventionHistory(userId: string, limit = 50): Promise<{
    records: Array<{
      type: InterventionType;
      typeName: string;
      recommendedAt: Date;
      preEBH: number;
      postEBH?: number;
      preES: number;
      postES?: number;
      effectiveness?: number;
      reason: string;
      wasAccepted: boolean;
    }>;
    stats: {
      totalRecommendations: number;
      completedOutcomes: number;
      averageEffectiveness: number;
      bestInterventionType: string;
      typeEffectiveness: Record<string, { count: number; avgEffectiveness: number }>;
    };
  }> {
    const records = await InterventionRecord.find({ userId })
      .sort({ recommendedAt: -1 })
      .limit(limit)
      .lean();

    // Compute stats
    const completed = records.filter(r => r.effectiveness != null);
    const avgEff = completed.length > 0
      ? completed.reduce((s, r) => s + (r.effectiveness ?? 0), 0) / completed.length
      : 0;

    // Per-type stats
    const typeStats: Record<string, { count: number; totalEff: number }> = {};
    for (const r of completed) {
      const key = r.interventionType;
      if (!typeStats[key]) typeStats[key] = { count: 0, totalEff: 0 };
      typeStats[key].count++;
      typeStats[key].totalEff += r.effectiveness ?? 0;
    }

    const typeEffectiveness: Record<string, { count: number; avgEffectiveness: number }> = {};
    let bestType = '';
    let bestAvg = -1;
    for (const [type, stat] of Object.entries(typeStats)) {
      const avg = stat.count > 0 ? stat.totalEff / stat.count : 0;
      typeEffectiveness[type] = { count: stat.count, avgEffectiveness: avg };
      if (avg > bestAvg) {
        bestAvg = avg;
        bestType = type;
      }
    }

    return {
      records: records.map(r => ({
        type: r.interventionType,
        typeName: INTERVENTION_LABELS[r.interventionType],
        recommendedAt: r.recommendedAt,
        preEBH: r.preEBH,
        postEBH: r.postEBH,
        preES: r.preES,
        postES: r.postES,
        effectiveness: r.effectiveness,
        reason: r.recommendationReason,
        wasAccepted: r.wasAccepted,
      })),
      stats: {
        totalRecommendations: records.length,
        completedOutcomes: completed.length,
        averageEffectiveness: Number(avgEff.toFixed(3)),
        bestInterventionType: INTERVENTION_LABELS[bestType as InterventionType] || 'N/A',
        typeEffectiveness,
      },
    };
  }
}

export const interventionEngine = new InterventionEngine();
export default interventionEngine;
