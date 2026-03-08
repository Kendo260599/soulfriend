/**
 * RESILIENCE & GROWTH DYNAMICS ENGINE
 * 
 * Phase 10: Resilience quantification, growth tracking, and protective factor analysis.
 * 
 * Capabilities:
 * - Resilience index computation (bounce-back + stability + growth + protective)
 * - Growth phase classification (decline → stagnation → early_growth → acceleration → consolidation → mastery)
 * - Growth milestone detection (zone upgrades, breakthroughs, stability achieved)
 * - Protective factor identification (which themes/interventions protect against EBH)
 * - Recovery trajectory modeling (expected vs actual logistic curve)
 * - Escape velocity assessment (is growth momentum sufficient?)
 * - Relapse probability estimation
 * - Dimensional growth momentum analysis
 * 
 * @module services/pge/resilienceEngine
 * @version 1.0.0 — Phase 10: Resilience & Growth Dynamics
 */

import { PsychologicalState } from '../../models/PsychologicalState';
import { InterventionRecord } from '../../models/InterventionRecord';
import { ConversationLog } from '../../models/ConversationLog';
import {
  stateToVec, classifyZone, Vec,
  computeBounceBackRate,
  computeGrowthVelocity,
  computeStabilityIndex,
  detectGrowthMilestones,
  modelRecoveryTrajectory,
  computeResilienceIndex,
  classifyGrowthPhase,
  estimateRelapseProbability,
  identifyProtectiveFactors,
  computeEscapeVelocity,
  computeGrowthMomentum,
  GrowthPhase,
  GrowthMilestone,
  ProtectiveFactor,
  potentialEnergy,
} from './mathEngine';
import { extractThemes } from './mathEngine';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const CACHE_TTL = 5 * 60_000;
const MAX_STATES = 500;
const MIN_STATES_FOR_ANALYSIS = 5;

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface ResilienceProfile {
  userId: string;
  resilienceIndex: number;
  bounceBackRate: number;
  growthVelocity: number;
  stabilityIndex: number;
  protectiveStrength: number;
  relapseProbability: number;
  growthPhase: GrowthPhase;
  currentZone: string;
  currentEBH: number;
  analyzedAt: Date;
}

export interface RecoveryTrajectoryResult {
  userId: string;
  expectedCurve: number[];
  actualCurve: number[];
  deviation: number;
  phase: 'ahead' | 'on_track' | 'behind' | 'stalled';
  projectedSessionsToSafe: number | null;
  baselineEBH: number;
  currentEBH: number;
  analyzedAt: Date;
}

export interface EscapeVelocityResult {
  userId: string;
  escapeVelocity: number;
  currentMomentum: number;
  sufficient: boolean;
  analyzedAt: Date;
}

export interface GrowthDashboardData {
  resilience: ResilienceProfile;
  milestones: GrowthMilestone[];
  protectiveFactors: ProtectiveFactor[];
  recoveryTrajectory: RecoveryTrajectoryResult;
  escapeVelocity: EscapeVelocityResult;
  growthMomentum: number[];
  dimensionGrowth: Array<{ dimension: string; momentum: number }>;
  analyzedAt: Date;
}

// ════════════════════════════════════════════
// SERVICE CLASS
// ════════════════════════════════════════════

const PSY_LABELS_SHORT = [
  'stress', 'anxiety', 'sadness', 'anger', 'loneliness',
  'shame', 'guilt', 'hopelessness', 'hope', 'calmness',
  'joy', 'gratitude', 'selfWorth', 'selfEfficacy',
  'rumination', 'cognitiveClarity', 'avoidance', 'helpSeeking',
  'socialEngagement', 'motivation', 'trustInOthers', 'perceivedSupport',
  'fearOfJudgment', 'mentalFatigue',
];

class ResilienceEngineService {
  private cache: Map<string, { data: any; ts: number }> = new Map();
  private static readonly MAX_CACHE_SIZE = 200;

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, ts: Date.now() });
    if (this.cache.size > ResilienceEngineService.MAX_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
  }

  invalidateCache(userId?: string): void {
    if (userId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(userId)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  // ────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────

  private async getUserStates(userId: string): Promise<any[]> {
    return PsychologicalState.find({ userId })
      .sort({ messageIndex: 1 })
      .limit(MAX_STATES)
      .lean();
  }

  // ────────────────────────────────────
  // RESILIENCE PROFILE
  // ────────────────────────────────────

  async getResilienceProfile(userId: string): Promise<ResilienceProfile> {
    const cacheKey = `${userId}:resilience`;
    const cached = this.getCached<ResilienceProfile>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[ResilienceEngine] Computing resilience profile', { userId });

      const states = await this.getUserStates(userId);

      if (states.length < MIN_STATES_FOR_ANALYSIS) {
        const empty: ResilienceProfile = {
          userId,
          resilienceIndex: 0.5,
          bounceBackRate: 0.5,
          growthVelocity: 0,
          stabilityIndex: 0.5,
          protectiveStrength: 0,
          relapseProbability: 0.3,
          growthPhase: 'stagnation',
          currentZone: 'unknown',
          currentEBH: 0.5,
          analyzedAt: new Date(),
        };
        return empty;
      }

      const ebhSeries = states.map((s: any) => s.ebhScore ?? 0.5);
      const latestState = states[states.length - 1] as any;
      const currentEBH = latestState.ebhScore ?? 0.5;
      const currentZone = classifyZone(currentEBH);

      const bounceBackRate = computeBounceBackRate(ebhSeries);
      const growthVelocity = computeGrowthVelocity(ebhSeries);
      const stabilityIndex = computeStabilityIndex(ebhSeries);

      // Protective strength from factors
      const factors = await this.getProtectiveFactors(userId);
      const protectiveStrength = factors.length > 0
        ? factors.reduce((s, f) => s + f.strength, 0) / factors.length
        : 0;

      const resilienceIndex = computeResilienceIndex({
        bounceBackRate,
        growthVelocity,
        stabilityIndex,
        protectiveStrength,
      });

      const growthPhase = classifyGrowthPhase(ebhSeries, resilienceIndex);

      // Variance trend for relapse estimation
      const recent10 = ebhSeries.slice(-10);
      const older10 = ebhSeries.slice(-20, -10);
      const recentVar = recent10.length > 1 ? this.variance(recent10) : 0;
      const olderVar = older10.length > 1 ? this.variance(older10) : recentVar;
      const varianceTrend = recentVar - olderVar;

      // Simple autocorrelation
      const autoCorr = this.autoCorrelation(recent10);

      const relapseProbability = estimateRelapseProbability({
        resilienceIndex,
        recentVarianceTrend: varianceTrend,
        recentAutoCorrelation: autoCorr,
        currentZone,
      });

      const result: ResilienceProfile = {
        userId,
        resilienceIndex,
        bounceBackRate,
        growthVelocity,
        stabilityIndex,
        protectiveStrength,
        relapseProbability,
        growthPhase,
        currentZone,
        currentEBH,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[ResilienceEngine] Resilience profile failed', { userId, error: err });
      throw err;
    }
  }

  private variance(arr: number[]): number {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  }

  private autoCorrelation(arr: number[]): number {
    if (arr.length < 3) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    let num = 0, denom = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      num += (arr[i] - mean) * (arr[i + 1] - mean);
      denom += (arr[i] - mean) ** 2;
    }
    return denom > 0 ? num / denom : 0;
  }

  // ────────────────────────────────────
  // GROWTH MILESTONES
  // ────────────────────────────────────

  async getGrowthMilestones(userId: string): Promise<GrowthMilestone[]> {
    const cacheKey = `${userId}:milestones`;
    const cached = this.getCached<GrowthMilestone[]>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[ResilienceEngine] Detecting growth milestones', { userId });

      const states = await this.getUserStates(userId);
      const stateData = states.map((s: any, i: number) => ({
        ebhScore: s.ebhScore ?? 0.5,
        zone: classifyZone(s.ebhScore ?? 0.5),
        index: s.messageIndex ?? i,
      }));

      const milestones = detectGrowthMilestones(stateData);
      this.setCache(cacheKey, milestones);
      return milestones;
    } catch (err) {
      logger.error('[ResilienceEngine] Milestone detection failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // PROTECTIVE FACTORS
  // ────────────────────────────────────

  async getProtectiveFactors(userId: string): Promise<ProtectiveFactor[]> {
    const cacheKey = `${userId}:protective`;
    const cached = this.getCached<ProtectiveFactor[]>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[ResilienceEngine] Identifying protective factors', { userId });

      // Get states + conversations + interventions
      const [states, logs, interventions] = await Promise.all([
        this.getUserStates(userId),
        ConversationLog.find({ userId })
          .sort({ timestamp: 1 })
          .limit(MAX_STATES)
          .select('userMessage timestamp')
          .lean(),
        InterventionRecord.find({ userId })
          .sort({ createdAt: 1 })
          .limit(MAX_STATES)
          .lean(),
      ]);

      const ebhSeries = states.map((s: any) => s.ebhScore ?? 0.5);
      const overallAvgEBH = ebhSeries.reduce((s: number, v: number) => s + v, 0) / (ebhSeries.length || 1);

      // Build timeline: themes + interventions + EBH per step
      const messages = logs.map((l: any) => l.userMessage).filter(Boolean);
      const len = Math.min(messages.length, ebhSeries.length);

      // Build intervention lookup by approximate index
      const interventionMap = new Map<number, string>();
      for (const intv of interventions) {
        const idx = (intv as any).messageIndex ?? 0;
        interventionMap.set(idx, (intv as any).interventionType || 'unknown');
      }

      const timeline: Array<{ themes: string[]; ebhScore: number; interventionType?: string }> = [];
      for (let i = 0; i < len; i++) {
        const themes = extractThemes(messages[i]).map((t: { theme: string }) => t.theme);
        timeline.push({
          themes,
          ebhScore: ebhSeries[i],
          interventionType: interventionMap.get(i),
        });
      }

      const factors = identifyProtectiveFactors(timeline, overallAvgEBH);
      this.setCache(cacheKey, factors);
      return factors;
    } catch (err) {
      logger.error('[ResilienceEngine] Protective factor analysis failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // RECOVERY TRAJECTORY
  // ────────────────────────────────────

  async getRecoveryTrajectory(userId: string): Promise<RecoveryTrajectoryResult> {
    const cacheKey = `${userId}:trajectory`;
    const cached = this.getCached<RecoveryTrajectoryResult>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[ResilienceEngine] Modeling recovery trajectory', { userId });

      const states = await this.getUserStates(userId);
      const ebhSeries = states.map((s: any) => s.ebhScore ?? 0.5);

      const baselineEBH = ebhSeries.length > 0 ? ebhSeries[0] : 0.5;
      const currentEBH = ebhSeries.length > 0 ? ebhSeries[ebhSeries.length - 1] : 0.5;

      const trajectory = modelRecoveryTrajectory(ebhSeries, baselineEBH);

      const result: RecoveryTrajectoryResult = {
        userId,
        ...trajectory,
        baselineEBH,
        currentEBH,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[ResilienceEngine] Recovery trajectory failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // ESCAPE VELOCITY
  // ────────────────────────────────────

  async getEscapeVelocity(userId: string): Promise<EscapeVelocityResult> {
    const cacheKey = `${userId}:escape`;
    const cached = this.getCached<EscapeVelocityResult>(cacheKey);
    if (cached) return cached;

    try {
      logger.info('[ResilienceEngine] Computing escape velocity', { userId });

      const states = await this.getUserStates(userId);
      const ebhSeries = states.map((s: any) => s.ebhScore ?? 0.5);
      const growthVelocity = computeGrowthVelocity(ebhSeries);

      // Get latest state vector and interaction matrix
      const latestState = states.length > 0 ? states[states.length - 1] : null;
      const currentVec = latestState ? stateToVec((latestState as any).stateVector) : new Array(24).fill(0.5);

      // Use identity-like matrix if no interaction matrix available
      const dim = currentVec.length;
      const identityMatrix = Array.from({ length: dim }, (_, i) =>
        Array.from({ length: dim }, (_, j) => (i === j ? 0.1 : 0))
      );

      const ev = computeEscapeVelocity(currentVec, growthVelocity, identityMatrix);

      const result: EscapeVelocityResult = {
        userId,
        ...ev,
        analyzedAt: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('[ResilienceEngine] Escape velocity failed', { userId, error: err });
      throw err;
    }
  }

  // ────────────────────────────────────
  // FULL GROWTH DASHBOARD
  // ────────────────────────────────────

  async getGrowthDashboard(userId: string): Promise<GrowthDashboardData> {
    const [resilience, milestones, protectiveFactors, recoveryTrajectory, escapeVelocity] = await Promise.all([
      this.getResilienceProfile(userId),
      this.getGrowthMilestones(userId),
      this.getProtectiveFactors(userId),
      this.getRecoveryTrajectory(userId),
      this.getEscapeVelocity(userId),
    ]);

    // Dimensional growth momentum
    const states = await this.getUserStates(userId);
    const stateVecs = states.map((s: any) => stateToVec(s.stateVector));
    const momentum = computeGrowthMomentum(stateVecs, 10);

    const dimensionGrowth = momentum.map((m, i) => ({
      dimension: PSY_LABELS_SHORT[i] || `dim_${i}`,
      momentum: m,
    }));

    return {
      resilience,
      milestones,
      protectiveFactors,
      recoveryTrajectory,
      escapeVelocity,
      growthMomentum: momentum,
      dimensionGrowth,
      analyzedAt: new Date(),
    };
  }
}

// Singleton export
export const resilienceEngine = new ResilienceEngineService();
