/**
 * OUTCOMES & CONTINUOUS LEARNING ENGINE
 * 
 * Phase 12: Closes the validation loop across all prior PGE phases.
 * Converts PGE from open-loop (recommend → assume works) to
 * closed-loop (recommend → track → measure → learn → improve).
 * 
 * Capabilities:
 * - Treatment outcome measurement (expected vs actual progress)
 * - Intervention effectiveness analysis (effect size per type)
 * - Forecast accuracy validation (predicted vs actual EBH)
 * - Expert review signal aggregation (systematic quality improvement)
 * - User feedback integration (feel_better/worse → learning signal)
 * - Safety event contextualization (risk × psychology)
 * - Outcome benchmarking (user vs cohort)
 * - Full outcomes dashboard
 * 
 * @module services/pge/outcomeLearningEngine
 * @version 1.0.0 — Phase 12: Outcomes & Continuous Learning
 */

import { PsychologicalState, PSY_VARIABLES } from '../../models/PsychologicalState';
import { InterventionRecord } from '../../models/InterventionRecord';
import ExpertReview from '../../models/ExpertReview';
import UserFeedback from '../../models/UserFeedback';
import { SafetyLog } from '../../models/SafetyLog';
import {
  stateToVec, classifyZone, Vec,
  computeTreatmentOutcome,
  computeInterventionEffectiveness,
  computeForecastAccuracy,
  aggregateExpertSignals,
  computeOutcomeBenchmark,
  contextualizeSafetyEvent,
  computeFeedbackSignal,
  TreatmentOutcome,
  InterventionEffectivenessResult,
  ForecastAccuracy,
  ExpertSignalAggregation,
  OutcomesBenchmark,
  SafetyContextScore,
} from './mathEngine';
import { forecastEngine } from './forecastEngine';
import { resilienceEngine } from './resilienceEngine';
import { treatmentPlanEngine } from './treatmentPlanEngine';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const CACHE_TTL = 5 * 60_000;
const MAX_STATES = 500;
const MIN_STATES = 5;

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface UserOutcomeProfile {
  userId: string;
  treatmentOutcome: TreatmentOutcome;
  totalSessions: number;
  baselineEBH: number;
  currentEBH: number;
  improvementRate: number;    // EBH improvement per session
  generatedAt: string;
}

export interface InterventionEffectivenessProfile {
  interventionType: string;
  avgEffectiveness: InterventionEffectivenessResult;
  sampleSize: number;
  bestContext: string;
  worstContext: string;
}

export interface ForecastValidation {
  userId: string;
  accuracy: ForecastAccuracy;
  predictedTrajectory: number[];
  actualTrajectory: number[];
  validationWindow: number;
  generatedAt: string;
}

export interface UserFeedbackInsights {
  totalFeedbacks: number;
  helpfulRate: number;
  emotionChangeDistribution: Record<string, number>;
  avgSignal: number;
  trend: 'improving' | 'stable' | 'declining';
  generatedAt: string;
}

export interface SafetyContextReport {
  userId: string;
  events: Array<{
    eventType: string;
    timestamp: Date;
    context: SafetyContextScore;
    violationCount: number;
  }>;
  overallRisk: number;
  totalEvents: number;
  unreviewedCount: number;
  generatedAt: string;
}

export interface OutcomesDashboardData {
  outcomeProfile: UserOutcomeProfile;
  interventionEffectiveness: InterventionEffectivenessProfile[];
  forecastValidation: ForecastValidation;
  expertSignals: ExpertSignalAggregation;
  feedbackInsights: UserFeedbackInsights;
  safetyContext: SafetyContextReport;
  benchmark: OutcomesBenchmark;
}

// ════════════════════════════════════════════
// OUTCOME LEARNING ENGINE
// ════════════════════════════════════════════

class OutcomeLearningEngine {
  private cache = new Map<string, { data: any; ts: number }>();

  private getCached(key: string) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, ts: Date.now() });
  }

  invalidateCache(userId: string) {
    for (const k of this.cache.keys()) {
      if (k.includes(userId)) this.cache.delete(k);
    }
  }

  // ─── USER OUTCOME PROFILE ───

  async getUserOutcomeProfile(userId: string): Promise<UserOutcomeProfile> {
    const cacheKey = `outcome:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: 1 }).limit(MAX_STATES).lean();

    if (states.length < MIN_STATES) {
      const empty: UserOutcomeProfile = {
        userId, totalSessions: states.length, baselineEBH: 0, currentEBH: 0,
        improvementRate: 0, generatedAt: new Date().toISOString(),
        treatmentOutcome: {
          expectedProgress: 0, actualProgress: 0,
          progressIndex: 0, variance: 0, clinicallySignificant: false,
        },
      };
      return empty;
    }

    const baselineState = states[0] as any;
    const currentState = states[states.length - 1] as any;

    const baselineVec = stateToVec(baselineState.stateVector);
    const currentVec = stateToVec(currentState.stateVector);
    const baselineEBH = baselineState.stateVector?.EBH ?? 0.5;
    const currentEBH = currentState.stateVector?.EBH ?? 0.5;

    // Target: ideal safe state
    const targetVec = PSY_VARIABLES.map(v => {
      const positive = ['hope', 'calmness', 'joy', 'gratitude', 'selfWorth',
        'selfEfficacy', 'cognitiveClarity', 'helpSeeking', 'socialEngagement',
        'motivation', 'trustInOthers', 'perceivedSupport'];
      return positive.includes(v) ? 0.8 : 0.15;
    });

    // Expected timeline from treatment plan
    let expectedTimeline = states.length; // default: linear
    try {
      const plan = await treatmentPlanEngine.generateTreatmentPlan(userId);
      if (plan.timeline.estimatedSessions > 0) {
        expectedTimeline = plan.timeline.estimatedSessions;
      }
    } catch { /* fallback */ }

    const treatmentOutcome = computeTreatmentOutcome(
      baselineVec, currentVec, targetVec, expectedTimeline, states.length,
    );

    const improvementRate = states.length > 0
      ? (baselineEBH - currentEBH) / states.length
      : 0;

    const profile: UserOutcomeProfile = {
      userId, treatmentOutcome, totalSessions: states.length,
      baselineEBH, currentEBH, improvementRate,
      generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, profile);
    return profile;
  }

  // ─── INTERVENTION EFFECTIVENESS ───

  async analyzeInterventionEffectiveness(userId: string): Promise<InterventionEffectivenessProfile[]> {
    const cacheKey = `intEff:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const interventions = await InterventionRecord.find({ userId })
      .sort({ createdAt: 1 }).limit(500).lean();

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: 1 }).limit(MAX_STATES).lean();

    if (interventions.length === 0 || states.length < 2) return [];

    // Group interventions by type
    const byType: Record<string, Array<{
      pre: Vec; post: Vec; zone: string;
    }>> = {};

    for (const ir of interventions) {
      const irAny = ir as any;
      const irTime = new Date(irAny.createdAt || irAny.timestamp).getTime();
      const type = irAny.interventionType || irAny.type || 'unknown';

      // Find closest state BEFORE and AFTER this intervention
      let preState: any = null, postState: any = null;
      for (const s of states) {
        const sTime = new Date((s as any).createdAt).getTime();
        if (sTime <= irTime) preState = s;
        if (sTime > irTime && !postState) postState = s;
      }

      if (preState && postState) {
        const preVec = stateToVec((preState as any).stateVector);
        const postVec = stateToVec((postState as any).stateVector);
        const zone = classifyZone((preState as any).stateVector?.EBH ?? 0.5);

        if (!byType[type]) byType[type] = [];
        byType[type].push({ pre: preVec, post: postVec, zone });
      }
    }

    // Compute effectiveness per type
    const profiles: InterventionEffectivenessProfile[] = [];

    for (const [type, samples] of Object.entries(byType)) {
      if (samples.length === 0) continue;

      // Average pre/post across all samples for this type
      const dim = samples[0].pre.length;
      const avgPre = new Array(dim).fill(0);
      const avgPost = new Array(dim).fill(0);

      for (const s of samples) {
        for (let i = 0; i < dim; i++) {
          avgPre[i] += s.pre[i] / samples.length;
          avgPost[i] += s.post[i] / samples.length;
        }
      }

      const avgEff = computeInterventionEffectiveness(avgPre, avgPost, samples.length);

      // Find best/worst context (zone)
      const zoneStats: Record<string, number[]> = {};
      for (const s of samples) {
        if (!zoneStats[s.zone]) zoneStats[s.zone] = [];
        // Quick effectiveness = EBH change direction
        const ebhPre = s.pre.reduce((sum, v) => sum + v, 0) / dim;
        const ebhPost = s.post.reduce((sum, v) => sum + v, 0) / dim;
        zoneStats[s.zone].push(ebhPre - ebhPost); // positive = improvement
      }

      let bestZone = 'unknown', worstZone = 'unknown';
      let bestAvg = -Infinity, worstAvg = Infinity;
      for (const [zone, vals] of Object.entries(zoneStats)) {
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        if (avg > bestAvg) { bestAvg = avg; bestZone = zone; }
        if (avg < worstAvg) { worstAvg = avg; worstZone = zone; }
      }

      profiles.push({
        interventionType: type,
        avgEffectiveness: avgEff,
        sampleSize: samples.length,
        bestContext: bestZone,
        worstContext: worstZone,
      });
    }

    profiles.sort((a, b) => b.avgEffectiveness.efficacy - a.avgEffectiveness.efficacy);

    this.setCache(cacheKey, profiles);
    return profiles;
  }

  // ─── FORECAST VALIDATION ───

  async validateForecast(userId: string): Promise<ForecastValidation> {
    const cacheKey = `fcVal:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Get actual EBH trajectory
    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: 1 }).limit(MAX_STATES).lean();

    const actualTrajectory = states.map(s => (s as any).stateVector?.EBH ?? 0.5);

    // Get predicted trajectory from forecast engine
    let predictedTrajectory: number[] = [];
    try {
      const forecast = await forecastEngine.generateForecast(userId);
      if (forecast && (forecast as any).forecasts) {
        predictedTrajectory = (forecast as any).forecasts.map((f: any) => f.predictedEBH ?? f.value ?? 0.5);
      }
    } catch { /* no forecast */ }

    // If no predictions, use flat line (naive forecast)
    if (predictedTrajectory.length === 0 && actualTrajectory.length > 0) {
      predictedTrajectory = actualTrajectory.map(() => actualTrajectory[0]);
    }

    const accuracy = computeForecastAccuracy(predictedTrajectory, actualTrajectory);

    const result: ForecastValidation = {
      userId, accuracy, predictedTrajectory, actualTrajectory,
      validationWindow: actualTrajectory.length,
      generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ─── EXPERT SIGNALS ───

  async aggregateExpertReviews(userId?: string): Promise<ExpertSignalAggregation> {
    const cacheKey = `expert:${userId || 'all'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const query: any = {};
    if (userId) {
      // Find reviews for sessions involving this user
      query.status = { $in: ['reviewed', 'applied'] };
    } else {
      query.status = { $in: ['reviewed', 'applied'] };
    }

    const reviews = await ExpertReview.find(query)
      .sort({ timestamp: -1 }).limit(200).lean();

    const mapped = reviews.map((r: any) => ({
      empathy: r.assessment?.empathyRating ?? 3,
      safety: r.assessment?.safetyRating ?? 3,
      accuracy: r.assessment?.clinicalAccuracy ?? 3,
      culturalFit: r.assessment?.culturalFit ?? 3,
      overall: r.assessment?.overallRating ?? 3,
      issues: r.issues || [],
      shouldRetrain: r.shouldRetrain || false,
    }));

    const result = aggregateExpertSignals(mapped);

    this.setCache(cacheKey, result);
    return result;
  }

  // ─── USER FEEDBACK INSIGHTS ───

  async getUserFeedbackInsights(userId: string): Promise<UserFeedbackInsights> {
    const cacheKey = `feedback:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const feedbacks = await UserFeedback.find({ userId })
      .sort({ timestamp: -1 }).limit(200).lean();

    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: 0, helpfulRate: 0,
        emotionChangeDistribution: {}, avgSignal: 0,
        trend: 'stable', generatedAt: new Date().toISOString(),
      };
    }

    const emotionDist: Record<string, number> = {};
    let helpfulCount = 0, totalSignal = 0;

    for (const fb of feedbacks) {
      const fbAny = fb as any;
      if (fbAny.rating === 'helpful') helpfulCount++;
      emotionDist[fbAny.emotionChange] = (emotionDist[fbAny.emotionChange] || 0) + 1;

      const { signal } = computeFeedbackSignal(fbAny.rating, fbAny.emotionChange);
      totalSignal += signal;
    }

    const avgSignal = totalSignal / feedbacks.length;
    const helpfulRate = helpfulCount / feedbacks.length;

    // Trend: compare first half vs second half
    const half = Math.floor(feedbacks.length / 2);
    let oldSignal = 0, newSignal = 0;
    for (let i = 0; i < feedbacks.length; i++) {
      const fb = feedbacks[i] as any;
      const { signal } = computeFeedbackSignal(fb.rating, fb.emotionChange);
      if (i < half) newSignal += signal; // feedbacks are sorted desc
      else oldSignal += signal;
    }

    const oldAvg = half > 0 ? oldSignal / (feedbacks.length - half) : 0;
    const newAvg = half > 0 ? newSignal / half : 0;
    const trend: UserFeedbackInsights['trend'] =
      newAvg - oldAvg > 0.1 ? 'improving'
      : newAvg - oldAvg < -0.1 ? 'declining'
      : 'stable';

    const result: UserFeedbackInsights = {
      totalFeedbacks: feedbacks.length, helpfulRate,
      emotionChangeDistribution: emotionDist, avgSignal,
      trend, generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ─── SAFETY CONTEXT ───

  async getSafetyContextReport(userId: string): Promise<SafetyContextReport> {
    const cacheKey = `safety:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const safetyEvents = await SafetyLog.find({ userId })
      .sort({ timestamp: -1 }).limit(50).lean();

    if (safetyEvents.length === 0) {
      return {
        userId, events: [], overallRisk: 0, totalEvents: 0,
        unreviewedCount: 0, generatedAt: new Date().toISOString(),
      };
    }

    // Get current psychological context
    let currentEBH = 0.5, zone = 'unknown', trendDirection = 'stable';
    let resilienceIndex = 0.5, recentVolatility = 0.1;

    try {
      const states = await PsychologicalState.find({ userId })
        .sort({ createdAt: -1 }).limit(20).lean();

      if (states.length > 0) {
        currentEBH = (states[0] as any).stateVector?.EBH ?? 0.5;
        zone = classifyZone(currentEBH);

        // Volatility: std dev of recent EBH
        const recentEBH = states.slice(0, 10).map(s => (s as any).stateVector?.EBH ?? 0.5);
        const mean = recentEBH.reduce((s, v) => s + v, 0) / recentEBH.length;
        recentVolatility = Math.sqrt(
          recentEBH.reduce((s, v) => s + (v - mean) ** 2, 0) / recentEBH.length
        );
      }
    } catch { /* fallback */ }

    try {
      const forecast = await forecastEngine.generateForecast(userId);
      if (forecast) trendDirection = (forecast as any).trendDirection || 'stable';
    } catch { /* fallback */ }

    try {
      const rp = await resilienceEngine.getResilienceProfile(userId);
      resilienceIndex = rp.resilienceIndex;
    } catch { /* fallback */ }

    // Contextualize each event
    const events = safetyEvents.map((evt: any) => {
      const maxSeverity = (evt.violations || []).reduce((max: number, v: any) => {
        const sevMap: Record<string, number> = { warning: 0.3, critical: 0.7, block: 1.0 };
        return Math.max(max, sevMap[v.severity] ?? 0.3);
      }, 0);

      const context = contextualizeSafetyEvent({
        eventSeverity: maxSeverity,
        currentEBH, zone, trendDirection,
        resilienceIndex, recentVolatility,
      });

      return {
        eventType: evt.eventType,
        timestamp: evt.timestamp,
        context,
        violationCount: evt.violationCount || 0,
      };
    });

    // Overall risk: max of recent contextual risks
    const overallRisk = events.length > 0
      ? Math.max(...events.slice(0, 5).map(e => e.context.contextualRisk))
      : 0;

    const unreviewedCount = safetyEvents.filter((e: any) => !e.reviewedByExpert).length;

    const result: SafetyContextReport = {
      userId, events, overallRisk,
      totalEvents: safetyEvents.length,
      unreviewedCount,
      generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ─── OUTCOME BENCHMARK ───

  async benchmarkUserOutcome(userId: string): Promise<OutcomesBenchmark> {
    const cacheKey = `bench:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Get user's data
    const userStates = await PsychologicalState.find({ userId })
      .sort({ createdAt: 1 }).limit(MAX_STATES).lean();

    if (userStates.length < MIN_STATES) {
      return { userProgressRate: 0, cohortAvgProgressRate: 0, percentile: 50, fasterThanAvg: false };
    }

    const userEBHStart = (userStates[0] as any).stateVector?.EBH ?? 0.5;
    const userEBHCurrent = (userStates[userStates.length - 1] as any).stateVector?.EBH ?? 0.5;

    // Get all users' progress rates for comparison
    const allUsers = await PsychologicalState.distinct('userId');
    const cohortRates: number[] = [];

    for (const uid of allUsers) {
      if (uid === userId) continue;
      const uStates = await PsychologicalState.find({ userId: uid })
        .sort({ createdAt: 1 }).select('stateVector.EBH createdAt')
        .limit(MAX_STATES).lean();

      if (uStates.length >= MIN_STATES) {
        const startEBH = (uStates[0] as any).stateVector?.EBH ?? 0.5;
        const endEBH = (uStates[uStates.length - 1] as any).stateVector?.EBH ?? 0.5;
        const rate = (startEBH - endEBH) / uStates.length;
        cohortRates.push(rate);
      }
    }

    const result = computeOutcomeBenchmark(userEBHStart, userEBHCurrent, userStates.length, cohortRates);

    this.setCache(cacheKey, result);
    return result;
  }

  // ─── OUTCOMES DASHBOARD ───

  async getOutcomesDashboard(userId: string): Promise<OutcomesDashboardData> {
    const cacheKey = `dashboard:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const [
      outcomeProfile,
      interventionEffectiveness,
      forecastValidation,
      expertSignals,
      feedbackInsights,
      safetyContext,
      benchmark,
    ] = await Promise.all([
      this.getUserOutcomeProfile(userId),
      this.analyzeInterventionEffectiveness(userId),
      this.validateForecast(userId),
      this.aggregateExpertReviews(),
      this.getUserFeedbackInsights(userId),
      this.getSafetyContextReport(userId),
      this.benchmarkUserOutcome(userId),
    ]);

    const dashboard: OutcomesDashboardData = {
      outcomeProfile,
      interventionEffectiveness,
      forecastValidation,
      expertSignals,
      feedbackInsights,
      safetyContext,
      benchmark,
    };

    this.setCache(cacheKey, dashboard);
    return dashboard;
  }
}

// Singleton export
export const outcomeLearningEngine = new OutcomeLearningEngine();
