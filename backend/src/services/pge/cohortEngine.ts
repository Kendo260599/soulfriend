/**
 * COHORT ENGINE
 * 
 * Phase 8: Population-Level Cohort Analytics & Peer Comparison
 * 
 * Capabilities:
 * - K-Means clustering of users by psychological state profiles
 * - Per-user cohort assignment with similarity scoring
 * - Peer comparison (EBH, effectiveness, recovery rate percentiles)
 * - Population-level summary & benchmarks
 * - Intervention effectiveness by cohort
 * - Common state transition pattern mining
 * - Periodic snapshot generation for trend analysis
 * 
 * @module services/pge/cohortEngine
 * @version 1.0.0 — Phase 8: Cohort Analytics
 */

import { PsychologicalState } from '../../models/PsychologicalState';
import { SessionMetrics } from '../../models/SessionMetrics';
import { InterventionRecord } from '../../models/InterventionRecord';
import { CohortAssignment, CohortSnapshot } from '../../models/CohortProfile';
import {
  stateToVec, classifyZone, Vec,
  computeCentroid, clusterVariance, kMeansClustering,
  cosineSimilarity, computePopulationZScores, cohortBenchmark,
  mineTransitionPatterns, interventionEffectivenessByCohort,
  populationSummary,
} from './mathEngine';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const DEFAULT_K = 4;                    // default cluster count
const MIN_USERS_FOR_CLUSTERING = 5;     // minimum users to run k-means
const SNAPSHOT_CACHE_TTL = 5 * 60_000;  // 5 minutes
const MAX_STATES_PER_USER = 100;        // limit states per user for clustering

const COHORT_LABELS: Record<number, string> = {
  0: 'Khủng hoảng — Cần hỗ trợ khẩn cấp',
  1: 'Dễ tổn thương — Cần theo dõi',
  2: 'Ổn định — Duy trì tiến trình',
  3: 'Phát triển — Đang cải thiện tốt',
};

// ════════════════════════════════════════════
// SERVICE CLASS
// ════════════════════════════════════════════

class CohortEngineService {
  private snapshotCache: { data: any; ts: number } | null = null;

  /**
   * Run full population clustering and generate a snapshot.
   * 1) Gather all users' mean state vectors
   * 2) K-Means clustering
   * 3) Assign each user to a cohort
   * 4) Compute population stats, transition patterns, intervention effectiveness
   * 5) Save snapshot + update assignments
   */
  async generateSnapshot(k: number = DEFAULT_K): Promise<any> {
    try {
      logger.info('[CohortEngine] Generating population snapshot', { k });

      // 1) Get distinct users with states
      const userIds: string[] = await PsychologicalState.distinct('userId');
      if (userIds.length < MIN_USERS_FOR_CLUSTERING) {
        logger.info('[CohortEngine] Not enough users for clustering', { count: userIds.length });
        return { success: false, message: `Need at least ${MIN_USERS_FOR_CLUSTERING} users, found ${userIds.length}` };
      }

      // 2) Compute mean state vector per user + latest EBH
      const userProfiles: Array<{
        userId: string;
        meanVec: Vec;
        latestEBH: number;
        zones: string[];
      }> = [];

      for (const uid of userIds) {
        const states = await PsychologicalState.find({ userId: uid })
          .sort({ messageIndex: -1 })
          .limit(MAX_STATES_PER_USER)
          .lean();

        if (states.length < 2) continue;

        const vecs = states.map(s => stateToVec(s.stateVector));
        const meanVec = computeCentroid(vecs);
        const latestEBH = (states[0] as any).ebhScore ?? 0; // stored from orchestrator
        const zones = states.map(s => classifyZone((s as any).ebhScore ?? 0));

        userProfiles.push({ userId: uid, meanVec, latestEBH, zones });
      }

      if (userProfiles.length < MIN_USERS_FOR_CLUSTERING) {
        return { success: false, message: `Only ${userProfiles.length} users have enough data` };
      }

      // 3) K-Means clustering on mean vectors
      const effectiveK = Math.min(k, userProfiles.length);
      const vectors = userProfiles.map(u => u.meanVec);
      const { assignments, centroids } = kMeansClustering(vectors, effectiveK);

      // 4) Sort clusters by avgEBH (highest danger first) and assign labels
      const clusterStats: Array<{
        cohortId: number;
        members: typeof userProfiles;
        centroid: Vec;
      }> = [];

      for (let c = 0; c < effectiveK; c++) {
        const members = userProfiles.filter((_, i) => assignments[i] === c);
        clusterStats.push({ cohortId: c, members, centroid: centroids[c] });
      }

      // Sort by average EBH descending (crisis first)
      clusterStats.sort((a, b) => {
        const avgA = a.members.reduce((s, m) => s + m.latestEBH, 0) / (a.members.length || 1);
        const avgB = b.members.reduce((s, m) => s + m.latestEBH, 0) / (b.members.length || 1);
        return avgB - avgA;
      });

      // 5) Gather session metrics per user for benchmarks
      const allSessionMetrics = await SessionMetrics.find({}).lean();
      const userSessionMap: Record<string, typeof allSessionMetrics> = {};
      for (const sm of allSessionMetrics) {
        if (!userSessionMap[sm.userId]) userSessionMap[sm.userId] = [];
        userSessionMap[sm.userId].push(sm);
      }

      // 6) Gather interventions for effectiveness analysis
      const allInterventions = await InterventionRecord.find({}).lean();

      // 7) Build cohort data + update assignments
      const cohorts: any[] = [];
      const ebhScoresAll: number[] = [];
      const effScoresAll: number[] = [];

      for (let idx = 0; idx < clusterStats.length; idx++) {
        const cluster = clusterStats[idx];
        const label = COHORT_LABELS[idx] || `Nhóm ${idx}`;

        // Per-cluster metrics
        const memberEBHs = cluster.members.map(m => m.latestEBH);
        const avgEBH = memberEBHs.length > 0
          ? memberEBHs.reduce((s, v) => s + v, 0) / memberEBHs.length : 0;

        const memberEffScores: number[] = [];
        const memberRecoveryRates: number[] = [];
        const sessionTypeCounts: Record<string, number> = {};

        for (const m of cluster.members) {
          const sessions = userSessionMap[m.userId] || [];
          for (const s of sessions) {
            memberEffScores.push(s.effectivenessScore);
            memberRecoveryRates.push(s.recoveryRate || 0);
            sessionTypeCounts[s.sessionType] = (sessionTypeCounts[s.sessionType] || 0) + 1;
          }
        }

        const avgEff = memberEffScores.length > 0
          ? memberEffScores.reduce((s, v) => s + v, 0) / memberEffScores.length : 0;
        const avgRecovery = memberRecoveryRates.length > 0
          ? memberRecoveryRates.reduce((s, v) => s + v, 0) / memberRecoveryRates.length : 0;

        const dominantSessionType = Object.entries(sessionTypeCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

        // Intervention effectiveness for this cohort's members
        const cohortInterventions = allInterventions.filter(ir =>
          cluster.members.some(m => m.userId === ir.userId)
        );
        const interventionStats = interventionEffectivenessByCohort(
          cohortInterventions.map(ir => ({
            interventionType: ir.interventionType || 'unknown',
            deltaEBH: ir.deltaEBH || 0,
          }))
        );

        const variance = clusterVariance(
          cluster.members.map(m => m.meanVec),
          cluster.centroid
        );

        cohorts.push({
          cohortId: idx,
          label,
          centroid: cluster.centroid,
          memberCount: cluster.members.length,
          variance,
          avgEBH,
          avgEffectiveness: avgEff,
          avgRecoveryRate: avgRecovery,
          dominantSessionType,
          topInterventions: interventionStats.slice(0, 3).map(i => ({
            type: i.type, successRate: i.successRate,
          })),
        });

        ebhScoresAll.push(...memberEBHs);
        effScoresAll.push(...memberEffScores);

        // Update each user's CohortAssignment
        for (const m of cluster.members) {
          const similarity = cosineSimilarity(m.meanVec, cluster.centroid);
          const ebhBench = cohortBenchmark(memberEBHs, m.latestEBH);
          const effBench = cohortBenchmark(
            memberEffScores,
            (userSessionMap[m.userId] || []).reduce((s, ss) => s + ss.effectivenessScore, 0) /
              ((userSessionMap[m.userId] || []).length || 1)
          );
          const recBench = cohortBenchmark(
            memberRecoveryRates,
            (userSessionMap[m.userId] || []).reduce((s, ss) => s + (ss.recoveryRate || 0), 0) /
              ((userSessionMap[m.userId] || []).length || 1)
          );

          await CohortAssignment.findOneAndUpdate(
            { userId: m.userId },
            {
              cohortId: idx,
              cohortLabel: label,
              similarity,
              meanStateVector: m.meanVec,
              assignedAt: new Date(),
              peerComparison: {
                ebhPercentile: ebhBench.rank,
                effectivenessPercentile: effBench.rank,
                recoveryRatePercentile: recBench.rank,
              },
            },
            { upsert: true, new: true }
          );
        }
      }

      // 8) Population summary
      const popStats = populationSummary(ebhScoresAll, effScoresAll);

      // 9) Transition pattern mining
      const allTrajectories = userProfiles.map(u => u.zones);
      const patterns = mineTransitionPatterns(allTrajectories, 10);

      // 10) Save snapshot
      const snapshot = await CohortSnapshot.create({
        snapshotDate: new Date(),
        totalUsers: userProfiles.length,
        cohorts,
        populationStats: popStats.ebh
          ? { ...popStats.ebh, effectivenessMean: popStats.effectiveness.mean, effectivenessStd: popStats.effectiveness.std }
          : { ebhMean: 0, ebhStd: 0, dangerCount: 0, safeCount: 0, effectivenessMean: 0, effectivenessStd: 0 },
        transitionPatterns: patterns,
      });

      this.snapshotCache = { data: snapshot, ts: Date.now() };
      logger.info('[CohortEngine] Snapshot generated', {
        totalUsers: userProfiles.length,
        cohorts: cohorts.length,
        patterns: patterns.length,
      });

      return { success: true, data: snapshot };
    } catch (err: any) {
      logger.error('[CohortEngine] Snapshot generation failed', { error: err.message });
      throw err;
    }
  }

  /**
   * Get the latest snapshot (cached for 5 min).
   */
  async getLatestSnapshot(): Promise<any> {
    if (this.snapshotCache && Date.now() - this.snapshotCache.ts < SNAPSHOT_CACHE_TTL) {
      return this.snapshotCache.data;
    }
    const snapshot = await CohortSnapshot.findOne().sort({ snapshotDate: -1 }).lean();
    if (snapshot) {
      this.snapshotCache = { data: snapshot, ts: Date.now() };
    }
    return snapshot;
  }

  /**
   * Get a user's cohort assignment + peer comparison.
   */
  async getUserCohort(userId: string): Promise<any> {
    const assignment = await CohortAssignment.findOne({ userId }).lean();
    if (!assignment) {
      return { assigned: false, message: 'User chưa được phân nhóm. Hãy chạy phân tích dân số trước.' };
    }

    // Get cohort peers' summary
    const peers = await CohortAssignment.find({ cohortId: assignment.cohortId }).lean();
    const peerCount = peers.length;

    return {
      assigned: true,
      cohortId: assignment.cohortId,
      cohortLabel: assignment.cohortLabel,
      similarity: assignment.similarity,
      peerComparison: assignment.peerComparison,
      peerCount,
      assignedAt: assignment.assignedAt,
    };
  }

  /**
   * Get population dashboard data for experts.
   * Combines latest snapshot + current user's position.
   */
  async getPopulationDashboard(userId?: string): Promise<any> {
    const snapshot = await this.getLatestSnapshot();

    const result: any = {
      hasSnapshot: !!snapshot,
      snapshot: snapshot || null,
    };

    if (userId) {
      result.userCohort = await this.getUserCohort(userId);

      // Z-scores vs population
      const allAssignments = await CohortAssignment.find({}).lean();
      const populationMeans = allAssignments
        .filter(a => a.meanStateVector && a.meanStateVector.length > 0)
        .map(a => a.meanStateVector);

      const userAssignment = allAssignments.find(a => a.userId === userId);
      if (userAssignment && userAssignment.meanStateVector && populationMeans.length >= 2) {
        result.zScores = computePopulationZScores(userAssignment.meanStateVector, populationMeans);
      }
    }

    return result;
  }

  /**
   * Invalidate snapshot cache.
   */
  invalidateCache(): void {
    this.snapshotCache = null;
  }
}

// Singleton export
export const cohortEngine = new CohortEngineService();
