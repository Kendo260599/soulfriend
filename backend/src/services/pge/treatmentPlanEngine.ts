/**
 * ADAPTIVE TREATMENT PLANNING & CLINICAL INTELLIGENCE ENGINE
 * 
 * Phase 11: Synthesizes all 10 prior PGE phases into actionable clinical intelligence.
 * 
 * Capabilities:
 * - Treatment plan generation with prioritized goals and intervention sequencing
 * - Goal progress tracking via vector projection (baseline→current→target)
 * - Pre-session briefing generation (what changed, what to focus on, alerts)
 * - Discharge readiness assessment with clinical gating
 * - Plan adaptation when trajectory/forecast data shifts
 * - Clinical dashboard aggregating all engines
 * 
 * @module services/pge/treatmentPlanEngine
 * @version 1.0.0 — Phase 11: Adaptive Treatment Planning
 */

import { PsychologicalState, PSY_VARIABLES } from '../../models/PsychologicalState';
import { InterventionRecord } from '../../models/InterventionRecord';
import { ConversationLog } from '../../models/ConversationLog';
import {
  stateToVec, classifyZone, Vec,
  computeTreatmentPriority,
  generateGoalTimeline,
  computeGoalProgress,
  computeDischargeReadiness,
  computePlanAdaptation,
  computeSessionBriefingScore,
  PrioritizedGoal,
  GoalTimeline,
  GoalProgress,
  DischargeReadiness,
  PlanAdaptation,
  SessionBriefingScore,
  GrowthPhase,
} from './mathEngine';
import { resilienceEngine } from './resilienceEngine';
import { forecastEngine } from './forecastEngine';
import { sessionManager } from './sessionManager';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════

const CACHE_TTL = 5 * 60_000;
const MAX_STATES = 500;
const MIN_STATES_FOR_PLAN = 5;
const DEFAULT_SESSION_FREQ = 2; // sessions/week

// Safe-zone target vector: ideal psychological state
const SAFE_TARGET = PSY_VARIABLES.map(v => {
  const positive = ['hope', 'calmness', 'joy', 'gratitude', 'selfWorth',
    'selfEfficacy', 'cognitiveClarity', 'helpSeeking', 'socialEngagement',
    'motivation', 'trustInOthers', 'perceivedSupport'];
  return positive.includes(v) ? 0.8 : 0.15;
});

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface TreatmentGoal {
  id: string;
  dimension: string;
  dimensionLabel: string;
  priority: number;
  urgency: number;
  impact: number;
  tractability: number;
  currentValue: number;
  targetValue: number;
  progress: number;
  status: 'active' | 'completed' | 'deferred';
}

export interface TreatmentPlan {
  userId: string;
  goals: TreatmentGoal[];
  timeline: GoalTimeline;
  growthPhase: string;
  currentZone: string;
  currentEBH: number;
  generatedAt: string;
}

export interface SessionBriefing {
  userId: string;
  priority: 'routine' | 'elevated' | 'urgent';
  focusAreas: string[];
  lastSessionDelta: number;
  daysSinceLastSession: number;
  currentZone: string;
  currentEBH: number;
  alertLevel: string;
  activeGoals: number;
  completedGoals: number;
  topChanges: Array<{ dimension: string; label: string; change: number }>;
  recommendations: string[];
}

export interface DischargeAssessment {
  userId: string;
  score: number;
  ready: boolean;
  blockers: string[];
  resilienceIndex: number;
  stabilityIndex: number;
  relapseProbability: number;
  growthPhase: string;
  sessionsInSafeZone: number;
  goalCompletionRatio: number;
}

export interface ClinicalDashboardData {
  plan: TreatmentPlan;
  briefing: SessionBriefing;
  discharge: DischargeAssessment;
  adaptation: PlanAdaptation;
  goalProgress: GoalProgress;
}

// ════════════════════════════════════════════
// LABEL MAPS
// ════════════════════════════════════════════

const DIMENSION_LABELS: Record<string, string> = {
  stress: 'Căng thẳng', anxiety: 'Lo âu', sadness: 'Buồn bã', anger: 'Tức giận',
  loneliness: 'Cô đơn', shame: 'Xấu hổ', guilt: 'Tội lỗi', hopelessness: 'Tuyệt vọng',
  hope: 'Hy vọng', calmness: 'Bình tĩnh', joy: 'Vui vẻ', gratitude: 'Biết ơn',
  selfWorth: 'Giá trị bản thân', selfEfficacy: 'Tự tin năng lực',
  rumination: 'Suy nghĩ lặp', cognitiveClarity: 'Sáng suốt',
  avoidance: 'Né tránh', helpSeeking: 'Tìm giúp đỡ',
  socialEngagement: 'Kết nối XH', motivation: 'Động lực',
  trustInOthers: 'Tin tưởng', perceivedSupport: 'Được hỗ trợ',
  fearOfJudgment: 'Sợ phán xét', mentalFatigue: 'Mệt mỏi TT',
};

// ════════════════════════════════════════════
// TREATMENT PLAN ENGINE
// ════════════════════════════════════════════

class TreatmentPlanEngine {
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

  // ─── TREATMENT PLAN ───

  async generateTreatmentPlan(userId: string): Promise<TreatmentPlan> {
    const cacheKey = `plan:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: -1 }).limit(MAX_STATES).lean();

    if (states.length < MIN_STATES_FOR_PLAN) {
      const emptyPlan: TreatmentPlan = {
        userId, goals: [], growthPhase: 'stagnation',
        currentZone: 'unknown', currentEBH: 0,
        timeline: { estimatedSessions: 0, weeklyMilestones: [], confidence: 0 },
        generatedAt: new Date().toISOString(),
      };
      return emptyPlan;
    }

    states.reverse();
    const currentState = states[states.length - 1] as any;
    const baselineState = states[0] as any;

    const currentVec = stateToVec(currentState.stateVector);
    const baselineVec = stateToVec(baselineState.stateVector);
    const ebhScore = currentState.stateVector?.EBH ?? 0.5;
    const zone = classifyZone(ebhScore);

    // Get intervention responsiveness per dimension
    const interventions = await InterventionRecord.find({ userId })
      .sort({ createdAt: -1 }).limit(200).lean();

    const responsiveness = PSY_VARIABLES.map(() => 0.5); // default
    if (interventions.length > 0) {
      // Use effectiveness score to estimate dimension responsiveness
      for (const ir of interventions) {
        const eff = (ir as any).effectiveness;
        if (eff !== undefined && eff !== null) {
          // Distribute effectiveness across dimensions proportionally
          PSY_VARIABLES.forEach((_v, i) => {
            responsiveness[i] = 0.7 * responsiveness[i] + 0.3 * Math.min(1, eff);
          });
        }
      }
    }

    // Get resilience data
    let growthPhase: string = 'stagnation';
    let recoveryRate = 0.1;
    let growthVelocity = 0;
    try {
      const resilience = await resilienceEngine.getResilienceProfile(userId);
      growthPhase = resilience.growthPhase;
      recoveryRate = resilience.bounceBackRate;
      growthVelocity = resilience.growthVelocity;
    } catch (e) { /* resilience may not be available */ }

    // Generate prioritized goals
    const rawGoals = computeTreatmentPriority(currentVec, SAFE_TARGET, responsiveness);

    // Map to treatment goals with dimension names
    const goals: TreatmentGoal[] = rawGoals.slice(0, 10).map((g, idx) => {
      const dimIdx = parseInt(g.dimension);
      const dimName = PSY_VARIABLES[dimIdx] || g.dimension;
      const fullDist = SAFE_TARGET[dimIdx] - baselineVec[dimIdx];
      const traveled = currentVec[dimIdx] - baselineVec[dimIdx];
      const progress = Math.abs(fullDist) > 0.001
        ? Math.min(1, Math.max(0, traveled / fullDist))
        : 1;

      return {
        id: `goal_${dimName}_${Date.now()}`,
        dimension: dimName,
        dimensionLabel: DIMENSION_LABELS[dimName] || dimName,
        priority: g.priority,
        urgency: g.urgency,
        impact: g.impact,
        tractability: g.tractability,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        progress,
        status: progress >= 0.95 ? 'completed' : 'active',
      };
    });

    // Generate timeline
    const timeline = generateGoalTimeline(
      currentVec, SAFE_TARGET, recoveryRate, growthVelocity, DEFAULT_SESSION_FREQ,
    );

    const plan: TreatmentPlan = {
      userId, goals, timeline, growthPhase,
      currentZone: zone, currentEBH: ebhScore,
      generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, plan);
    return plan;
  }

  // ─── GOAL PROGRESS ───

  async trackGoalProgress(userId: string): Promise<GoalProgress> {
    const cacheKey = `progress:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: -1 }).limit(MAX_STATES).lean();

    if (states.length < 2) {
      return { overallProgress: 0, dimensionProgress: {} };
    }

    states.reverse();
    const baselineVec = stateToVec((states[0] as any).stateVector);
    const currentVec = stateToVec((states[states.length - 1] as any).stateVector);

    const progress = computeGoalProgress(baselineVec, currentVec, SAFE_TARGET, [...PSY_VARIABLES]);

    this.setCache(cacheKey, progress);
    return progress;
  }

  // ─── SESSION BRIEFING ───

  async generateSessionBriefing(userId: string): Promise<SessionBriefing> {
    const cacheKey = `briefing:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: -1 }).limit(30).lean();

    if (states.length === 0) {
      const empty: SessionBriefing = {
        userId, priority: 'routine', focusAreas: [],
        lastSessionDelta: 0, daysSinceLastSession: 0,
        currentZone: 'unknown', currentEBH: 0, alertLevel: 'none',
        activeGoals: 0, completedGoals: 0, topChanges: [],
        recommendations: ['Chưa có dữ liệu. Cần ít nhất 1 phiên tư vấn.'],
      };
      return empty;
    }

    const currentState = states[0] as any; // most recent
    const currentVec = stateToVec(currentState.stateVector);
    const ebhScore = currentState.stateVector?.EBH ?? 0.5;
    const zone = classifyZone(ebhScore);

    // Delta since last session
    let lastSessionDelta = 0;
    let daysSinceLastSession = 0;
    const topChanges: Array<{ dimension: string; label: string; change: number }> = [];

    if (states.length >= 2) {
      const prevState = states[1] as any;
      const prevVec = stateToVec(prevState.stateVector);
      const prevEBH = prevState.stateVector?.EBH ?? 0.5;
      lastSessionDelta = ebhScore - prevEBH;

      const now = new Date(currentState.createdAt).getTime();
      const prev = new Date(prevState.createdAt).getTime();
      daysSinceLastSession = Math.round((now - prev) / 86400000);

      // Top dimension changes
      const changes = PSY_VARIABLES.map((v, i) => ({
        dimension: v,
        label: DIMENSION_LABELS[v] || v,
        change: currentVec[i] - prevVec[i],
      }));
      changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      topChanges.push(...changes.slice(0, 5).filter(c => Math.abs(c.change) > 0.02));
    }

    // Forecast alert
    let alertLevel = 'none';
    try {
      const forecast = await forecastEngine.generateForecast(userId);
      if (forecast && (forecast as any).alertLevel) alertLevel = (forecast as any).alertLevel;
    } catch { /* no forecast */ }

    // Goal counts
    let activeGoals = 0, completedGoals = 0;
    try {
      const plan = await this.generateTreatmentPlan(userId);
      activeGoals = plan.goals.filter(g => g.status === 'active').length;
      completedGoals = plan.goals.filter(g => g.status === 'completed').length;
    } catch { /* no plan */ }

    // Top risk dimensions
    const riskDims = PSY_VARIABLES
      .map((v, i) => ({ dim: v, score: currentVec[i] }))
      .filter(d => {
        const positive = ['hope', 'calmness', 'joy', 'gratitude', 'selfWorth',
          'selfEfficacy', 'cognitiveClarity', 'helpSeeking', 'socialEngagement',
          'motivation', 'trustInOthers', 'perceivedSupport'];
        return positive.includes(d.dim) ? d.score < 0.3 : d.score > 0.7;
      })
      .map(d => DIMENSION_LABELS[d.dim] || d.dim);

    const briefingScore = computeSessionBriefingScore({
      lastSessionDelta, daysSinceLastSession, currentZone: zone,
      alertLevel, activeGoals, completedGoals,
      topRiskDimensions: riskDims,
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (briefingScore.priority === 'urgent') {
      recommendations.push('⚠️ Phiên này cần ưu tiên xử lý khủng hoảng trước khi làm việc mục tiêu.');
    }
    if (lastSessionDelta > 0.1) {
      recommendations.push('📈 EBH tăng — kiểm tra sự kiện stress gần đây.');
    }
    if (lastSessionDelta < -0.1) {
      recommendations.push('📉 EBH giảm tốt — củng cố tiến bộ và đặt mục tiêu mới.');
    }
    if (daysSinceLastSession > 14) {
      recommendations.push('📅 Khoảng cách phiên dài — đánh giá lại tình trạng tổng quát.');
    }
    if (topChanges.some(c => c.change > 0.15)) {
      const worsened = topChanges.filter(c => c.change > 0.15).map(c => c.label);
      recommendations.push(`🔍 Chiều kích xấu đi: ${worsened.join(', ')}`);
    }

    const briefing: SessionBriefing = {
      userId, ...briefingScore, lastSessionDelta, daysSinceLastSession,
      currentZone: zone, currentEBH: ebhScore, alertLevel,
      activeGoals, completedGoals, topChanges, recommendations,
    };

    this.setCache(cacheKey, briefing);
    return briefing;
  }

  // ─── DISCHARGE READINESS ───

  async assessDischargeReadiness(userId: string): Promise<DischargeAssessment> {
    const cacheKey = `discharge:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const states = await PsychologicalState.find({ userId })
      .sort({ createdAt: -1 }).limit(MAX_STATES).lean();

    if (states.length < MIN_STATES_FOR_PLAN) {
      return {
        userId, score: 0, ready: false,
        blockers: ['Không đủ dữ liệu (cần ≥ 5 phiên)'],
        resilienceIndex: 0, stabilityIndex: 0, relapseProbability: 1,
        growthPhase: 'stagnation', sessionsInSafeZone: 0, goalCompletionRatio: 0,
      };
    }

    states.reverse();

    // Count consecutive sessions in safe zone
    let sessionsInSafeZone = 0;
    for (let i = states.length - 1; i >= 0; i--) {
      const ebh = (states[i] as any).stateVector?.EBH ?? 0.5;
      if (classifyZone(ebh) === 'safe') sessionsInSafeZone++;
      else break;
    }

    // Resilience data
    let resilienceIndex = 0, stabilityIndex = 0, relapseProbability = 1;
    let growthPhase: string = 'stagnation';
    try {
      const rp = await resilienceEngine.getResilienceProfile(userId);
      resilienceIndex = rp.resilienceIndex;
      stabilityIndex = rp.stabilityIndex;
      relapseProbability = rp.relapseProbability;
      growthPhase = rp.growthPhase;
    } catch { /* fallback */ }

    // Goal completion
    let goalCompletionRatio = 0;
    try {
      const plan = await this.generateTreatmentPlan(userId);
      const total = plan.goals.length;
      if (total > 0) {
        goalCompletionRatio = plan.goals.filter(g => g.status === 'completed').length / total;
      }
    } catch { /* fallback */ }

    const currentEBH = (states[states.length - 1] as any).stateVector?.EBH ?? 0.5;

    const result = computeDischargeReadiness({
      resilienceIndex, stabilityIndex, relapseProbability,
      growthPhase: growthPhase as GrowthPhase,
      ebhScore: currentEBH, sessionsInSafeZone, goalCompletionRatio,
    });

    const assessment: DischargeAssessment = {
      userId, ...result, resilienceIndex, stabilityIndex,
      relapseProbability, growthPhase, sessionsInSafeZone, goalCompletionRatio,
    };

    this.setCache(cacheKey, assessment);
    return assessment;
  }

  // ─── PLAN ADAPTATION ───

  async checkPlanAdaptation(userId: string): Promise<PlanAdaptation> {
    let forecastTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    let actualVsExpected = 0;
    let newRiskFactors = false;
    let interventionEffectiveness = 0.5;

    try {
      const forecast = await forecastEngine.generateForecast(userId);
      if (forecast) {
        if ((forecast as any).alertLevel === 'critical' || (forecast as any).alertLevel === 'high') {
          forecastTrend = 'worsening';
        } else if ((forecast as any).trendDirection === 'improving') {
          forecastTrend = 'improving';
        }
      }
    } catch { /* no forecast */ }

    try {
      const trajectory = await resilienceEngine.getRecoveryTrajectory(userId);
      if (trajectory) actualVsExpected = trajectory.deviation;
    } catch { /* no trajectory */ }

    // Check recent interventions effectiveness
    try {
      const recentIR = await InterventionRecord.find({ userId })
        .sort({ createdAt: -1 }).limit(5).lean();
      if (recentIR.length > 0) {
        const effs = recentIR
          .filter((ir: any) => ir.effectiveness !== undefined)
          .map((ir: any) => ir.effectiveness as number);
        if (effs.length > 0) {
          interventionEffectiveness = effs.reduce((a, b) => a + b, 0) / effs.length;
        }
      }
    } catch { /* fallback */ }

    return computePlanAdaptation({
      forecastTrend, actualVsExpected, newRiskFactors, interventionEffectiveness,
    });
  }

  // ─── CLINICAL DASHBOARD ───

  async getClinicalDashboard(userId: string): Promise<ClinicalDashboardData> {
    const cacheKey = `clinical:${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const [plan, briefing, discharge, adaptation, goalProgress] = await Promise.all([
      this.generateTreatmentPlan(userId),
      this.generateSessionBriefing(userId),
      this.assessDischargeReadiness(userId),
      this.checkPlanAdaptation(userId),
      this.trackGoalProgress(userId),
    ]);

    const dashboard: ClinicalDashboardData = {
      plan, briefing, discharge, adaptation, goalProgress,
    };

    this.setCache(cacheKey, dashboard);
    return dashboard;
  }
}

export const treatmentPlanEngine = new TreatmentPlanEngine();
