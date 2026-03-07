/**
 * ADAPTIVE SESSION MANAGER
 * 
 * Phase 7: Optimizes session pacing and engagement timing
 * based on user's psychological state dynamics.
 * 
 * Capabilities:
 * - Finalize completed sessions → aggregate metrics
 * - Track recovery patterns across sessions
 * - Predict optimal engagement windows
 * - Assess session readiness in real-time
 * - Generate engagement insights for experts
 * 
 * @module services/pge/sessionManager
 * @version 1.0.0 — Phase 7: Adaptive Session Manager
 */

import { PsychologicalState } from '../../models/PsychologicalState';
import { SessionMetrics, ISessionMetrics } from '../../models/SessionMetrics';
import { InterventionRecord } from '../../models/InterventionRecord';
import {
  stateToVec, computeEBHScore, classifyZone,
  computeESScore, potentialEnergy, defaultWeightMatrix,
  computeSessionDelta, messagesToRecovery, computeEngagementLevel,
  sessionEffectivenessScore, estimateRecoveryRate,
  classifySessionType, predictOptimalHours,
  sessionReadinessScore, computeSessionDepth, Vec,
} from './mathEngine';
import { forecastEngine } from './forecastEngine';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Minimum messages to consider a session valid */
const MIN_SESSION_MESSAGES = 2;

/** Maximum past sessions for analytics */
const MAX_HISTORY = 50;

/** Cache TTL for readiness score */
const READINESS_CACHE_TTL = 60_000; // 1 minute

// ════════════════════════════════════════════════════════════════
// SESSION MANAGER SERVICE
// ════════════════════════════════════════════════════════════════

class SessionManagerService {
  private readinessCache = new Map<string, { data: any; timestamp: number }>();

  /**
   * FINALIZE SESSION — aggregate all states in a completed session
   * into a single SessionMetrics record.
   * 
   * Call this when a chat session ends (e.g., user disconnects,
   * session timeout, or explicit session close).
   */
  async finalizeSession(userId: string, sessionId: string): Promise<ISessionMetrics | null> {
    try {
      // Check if already finalized
      const existing = await SessionMetrics.findOne({ userId, sessionId }).lean();
      if (existing) {
        logger.info('[SessionManager] Session already finalized', { userId: userId.substring(0, 8), sessionId: sessionId.substring(0, 8) });
        return existing as unknown as ISessionMetrics;
      }

      // Get all states for this session
      const states = await PsychologicalState.find({ userId, sessionId })
        .sort({ messageIndex: 1 })
        .lean();

      if (states.length < MIN_SESSION_MESSAGES) {
        logger.info('[SessionManager] Session too short to finalize', { userId: userId.substring(0, 8), messageCount: states.length });
        return null;
      }

      const W = defaultWeightMatrix();
      const firstState = states[0];
      const lastState = states[states.length - 1];

      // Compute EBH & ES for all states
      const ebhScores = states.map(s => s.ebhScore);
      const stateVectors: Vec[] = states.map(s => stateToVec(s.stateVector));
      const esScores = stateVectors.map(v => computeESScore(v));

      // Session metrics
      const { deltaEBH, minEBH, maxEBH, trend } = computeSessionDelta(ebhScores);
      
      const startTime = new Date(firstState.timestamp);
      const endTime = new Date(lastState.timestamp);
      const durationMinutes = Math.max(1, (endTime.getTime() - startTime.getTime()) / 60000);
      const hourOfDay = startTime.getHours();

      const startEBH = ebhScores[0];
      const endEBH = ebhScores[ebhScores.length - 1];
      const startES = esScores[0];
      const endES = esScores[esScores.length - 1];
      const deltaES = endES - startES;

      const engagementLevel = computeEngagementLevel(states.length, durationMinutes);
      const depth = computeSessionDepth(stateVectors);

      const recovery = messagesToRecovery(ebhScores);
      const recovered = recovery >= 0;

      const effectiveness = sessionEffectivenessScore({
        startEBH, endEBH, startES, endES,
        messageCount: states.length,
        recovered,
      });

      const sessionType = classifySessionType(startEBH, firstState.zone, trend);

      // Check if intervention was applied during this session
      const intervention = await InterventionRecord.findOne({
        userId, sessionId,
      }).lean();

      // Get past sessions to compute optimal hours
      const pastSessions = await SessionMetrics.find({ userId })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY)
        .lean();

      const hourHistory = pastSessions.map(s => ({
        hour: s.hourOfDay,
        effectiveness: s.effectivenessScore,
      }));
      // Add current session
      hourHistory.push({ hour: hourOfDay, effectiveness: effectiveness });
      const optimalHours = predictOptimalHours(hourHistory);

      // Recovery rate across sessions
      const sessionDeltas = pastSessions.map(s => ({
        deltaEBH: s.deltaEBH,
        messageCount: s.messageCount,
      }));
      sessionDeltas.push({ deltaEBH, messageCount: states.length });
      const recoveryRate = estimateRecoveryRate(sessionDeltas);

      // Create session metrics record
      const metrics = await SessionMetrics.create({
        userId,
        sessionId,
        startTime,
        endTime,
        durationMinutes: Math.round(durationMinutes),
        hourOfDay,
        startEBH,
        endEBH,
        deltaEBH,
        minEBH,
        maxEBH,
        startES,
        endES,
        deltaES,
        messageCount: states.length,
        engagementLevel,
        sessionDepth: Number(depth.toFixed(3)),
        messagesToRecovery: recovery,
        recoveryRate: Number(recoveryRate.toFixed(4)),
        sessionType,
        startZone: firstState.zone,
        endZone: lastState.zone,
        trend,
        effectivenessScore: Number(effectiveness.toFixed(3)),
        interventionApplied: !!intervention,
        interventionType: (intervention as any)?.interventionType,
        optimalNextHours: optimalHours,
      });

      logger.info('[SessionManager] Session finalized', {
        userId: userId.substring(0, 8),
        sessionId: sessionId.substring(0, 8),
        sessionType,
        effectivenessScore: effectiveness.toFixed(3),
        deltaEBH: deltaEBH.toFixed(3),
        messages: states.length,
        duration: `${Math.round(durationMinutes)}min`,
      });

      return metrics;
    } catch (error) {
      logger.error('[SessionManager] finalizeSession failed:', error);
      throw error;
    }
  }

  /**
   * GET SESSION ANALYTICS — comprehensive view of user's session patterns
   */
  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    recentSessions: Array<{
      sessionId: string;
      date: string;
      sessionType: string;
      deltaEBH: number;
      effectiveness: number;
      engagementLevel: string;
      duration: number;
      messageCount: number;
      trend: string;
    }>;
    patterns: {
      avgEffectiveness: number;
      avgDuration: number;
      avgDeltaEBH: number;
      avgRecoveryRate: number;
      bestSessionType: string;
      mostCommonType: string;
      sessionTypeDistribution: Record<string, number>;
      engagementDistribution: Record<string, number>;
    };
    optimalHours: number[];
    readiness: {
      score: number;
      recommendation: string;
    };
    recoveryTrend: Array<{
      date: string;
      recoveryRate: number;
      effectiveness: number;
    }>;
  }> {
    const sessions = await SessionMetrics.find({ userId })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY)
      .lean();

    const totalSessions = sessions.length;

    // Recent sessions (last 10)
    const recentSessions = sessions.slice(0, 10).map(s => ({
      sessionId: s.sessionId,
      date: s.startTime.toISOString(),
      sessionType: s.sessionType,
      deltaEBH: s.deltaEBH,
      effectiveness: s.effectivenessScore,
      engagementLevel: s.engagementLevel,
      duration: s.durationMinutes,
      messageCount: s.messageCount,
      trend: s.trend,
    }));

    // Patterns
    const avgEffectiveness = sessions.length > 0
      ? sessions.reduce((s, v) => s + v.effectivenessScore, 0) / sessions.length
      : 0;
    const avgDuration = sessions.length > 0
      ? sessions.reduce((s, v) => s + v.durationMinutes, 0) / sessions.length
      : 0;
    const avgDeltaEBH = sessions.length > 0
      ? sessions.reduce((s, v) => s + v.deltaEBH, 0) / sessions.length
      : 0;
    const avgRecoveryRate = sessions.length > 0
      ? sessions.reduce((s, v) => s + v.recoveryRate, 0) / sessions.length
      : 0;

    // Session type distribution
    const typeCount: Record<string, number> = {};
    const engagementCount: Record<string, number> = {};
    for (const s of sessions) {
      typeCount[s.sessionType] = (typeCount[s.sessionType] || 0) + 1;
      engagementCount[s.engagementLevel] = (engagementCount[s.engagementLevel] || 0) + 1;
    }

    // Find best session type by effectiveness
    const typeEffectiveness: Record<string, number[]> = {};
    for (const s of sessions) {
      if (!typeEffectiveness[s.sessionType]) typeEffectiveness[s.sessionType] = [];
      typeEffectiveness[s.sessionType].push(s.effectivenessScore);
    }
    let bestSessionType = 'maintenance';
    let bestAvg = 0;
    for (const [type, effs] of Object.entries(typeEffectiveness)) {
      const avg = effs.reduce((s, v) => s + v, 0) / effs.length;
      if (avg > bestAvg) { bestAvg = avg; bestSessionType = type; }
    }

    // Most common type
    let mostCommonType = 'maintenance';
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) { maxCount = count; mostCommonType = type; }
    }

    // Optimal hours (from most recent session's computed values, or re-compute)
    const hourHistory = sessions.map(s => ({
      hour: s.hourOfDay,
      effectiveness: s.effectivenessScore,
    }));
    const optimalHours = predictOptimalHours(hourHistory);

    // Readiness assessment
    const readiness = await this.assessReadiness(userId, sessions);

    // Recovery trend (last 10 sessions, chronological)
    const recoveryTrend = sessions.slice(0, 10).reverse().map(s => ({
      date: s.startTime.toISOString().split('T')[0],
      recoveryRate: s.recoveryRate,
      effectiveness: s.effectivenessScore,
    }));

    return {
      totalSessions,
      recentSessions,
      patterns: {
        avgEffectiveness: Number(avgEffectiveness.toFixed(3)),
        avgDuration: Math.round(avgDuration),
        avgDeltaEBH: Number(avgDeltaEBH.toFixed(3)),
        avgRecoveryRate: Number(avgRecoveryRate.toFixed(4)),
        bestSessionType,
        mostCommonType,
        sessionTypeDistribution: typeCount,
        engagementDistribution: engagementCount,
      },
      optimalHours,
      readiness,
      recoveryTrend,
    };
  }

  /**
   * ASSESS READINESS — is now a good time for a session?
   */
  async assessReadiness(
    userId: string,
    cachedSessions?: any[]
  ): Promise<{ score: number; recommendation: string }> {
    // Check cache
    const cached = this.readinessCache.get(userId);
    if (cached && Date.now() - cached.timestamp < READINESS_CACHE_TTL) {
      return cached.data;
    }

    try {
      const sessions = cachedSessions || await SessionMetrics.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const lastSession = sessions[0];
      const hoursSinceLastSession = lastSession
        ? (Date.now() - new Date(lastSession.endTime).getTime()) / 3600000
        : 999; // no previous session

      const lastEffectiveness = lastSession?.effectivenessScore ?? 0.5;

      // Get current EBH
      const currentState = await PsychologicalState.findOne({ userId })
        .sort({ timestamp: -1 })
        .lean();
      const currentEBH = currentState?.ebhScore ?? 0;

      // Get forecast alert level
      let forecastAlertLevel = 'none';
      try {
        const forecast = await forecastEngine.generateForecast(userId);
        forecastAlertLevel = forecast.alertLevel;
      } catch {
        // Forecast may not be available
      }

      const result = sessionReadinessScore({
        hoursSinceLastSession,
        lastSessionEffectiveness: lastEffectiveness,
        currentEBH,
        forecastAlertLevel,
      });

      // Cache result
      this.readinessCache.set(userId, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      logger.warn('[SessionManager] assessReadiness failed:', error);
      return { score: 0.5, recommendation: 'Không thể đánh giá — hãy thử lại sau.' };
    }
  }

  /**
   * AUTO-FINALIZE — find and finalize sessions that have been idle.
   * A session is considered complete if no new messages for > idleMinutes.
   */
  async autoFinalizeStaleSessions(idleMinutes: number = 30): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - idleMinutes * 60000);

      // Find distinct sessions with recent activity but not finalized
      const pipeline = [
        { $match: { timestamp: { $lt: cutoff } } },
        {
          $group: {
            _id: { userId: '$userId', sessionId: '$sessionId' },
            lastMessage: { $max: '$timestamp' },
            messageCount: { $sum: 1 },
          },
        },
        { $match: { messageCount: { $gte: MIN_SESSION_MESSAGES } } },
        { $sort: { lastMessage: -1 as const } },
        { $limit: 50 },
      ];

      const staleSessions = await PsychologicalState.aggregate(pipeline);
      let finalized = 0;

      for (const session of staleSessions) {
        const { userId, sessionId } = session._id;
        // Check if already finalized
        const exists = await SessionMetrics.findOne({ userId, sessionId }).lean();
        if (!exists) {
          await this.finalizeSession(userId, sessionId);
          finalized++;
        }
      }

      if (finalized > 0) {
        logger.info(`[SessionManager] Auto-finalized ${finalized} stale sessions`);
      }
      return finalized;
    } catch (error) {
      logger.error('[SessionManager] autoFinalizeStaleSessions failed:', error);
      return 0;
    }
  }

  /**
   * Invalidate readiness cache for a user
   */
  invalidateCache(userId: string): void {
    this.readinessCache.delete(userId);
  }
}

export const sessionManager = new SessionManagerService();
export default sessionManager;
