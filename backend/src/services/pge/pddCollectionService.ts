/**
 * PDD COLLECTION SERVICE
 * 
 * Psychological Dynamics Dataset — 5-Layer Collection Pipeline
 * 
 * Layer 1: User Interaction → raw events
 * Layer 2: Event Logging → ResearchEvent records
 * Layer 3: Emotion Processing → SPSI + quality scoring
 * Layer 4: Dataset Builder → PDDSnapshot aggregation
 * Layer 5: Research Database → queryable dataset
 * 
 * Chức năng:
 * - Ghi lại research events (message, survey, intervention, session, crisis)
 * - Build emotional trajectories per participant
 * - Generate daily/weekly/monthly snapshots
 * - Population-level dataset statistics
 * - Data export for research analysis
 * 
 * @module services/pge/pddCollectionService
 * @version 1.0.0
 */

import { PsychologicalState, IPsychologicalState, PSY_VARIABLES, IStateVector } from '../../models/PsychologicalState';
import { ResearchEvent, IResearchEvent, ResearchEventType } from '../../models/ResearchEvent';
import { PDDSnapshot, IPDDSnapshot, IEmotionalTrajectoryPoint } from '../../models/PDDSnapshot';
import { ResearchConsent } from '../../models/ResearchConsent';
import { SPSIRecord } from '../../models/SPSIRecord';
import { anonymizationEngine } from './anonymizationEngine';
import { dataQualityService } from './dataQualityService';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const CONSENT_VERSION = '1.0';

/** Key emotion variables tracked in trajectories */
const TRAJECTORY_VARIABLES = [
  'stress', 'anxiety', 'sadness', 'loneliness', 'hopelessness',
  'hope', 'perceivedSupport', 'rumination', 'gratitude',
];

// ════════════════════════════════════════════════════════════════
// PDD COLLECTION SERVICE CLASS
// ════════════════════════════════════════════════════════════════

class PDDCollectionService {

  // ────────────────────────────────────────────────
  // CONSENT CHECK
  // ────────────────────────────────────────────────

  /**
   * Check if user has given research consent
   */
  async hasConsent(userId: string): Promise<boolean> {
    const consent = await ResearchConsent.findOne({
      userId,
      consentGiven: true,
      withdrawDate: { $exists: false },
    }).lean();
    return !!consent;
  }

  // ────────────────────────────────────────────────
  // LAYER 2: EVENT LOGGING
  // ────────────────────────────────────────────────

  /**
   * Log a research event (respects consent)
   */
  async logEvent(params: {
    userId: string;
    sessionId: string;
    eventType: ResearchEventType;
    payload: Record<string, unknown>;
    dataQuality?: number;
  }): Promise<IResearchEvent | null> {
    try {
      // Check consent
      const consented = await this.hasConsent(params.userId);
      if (!consented) return null;

      const event = new ResearchEvent({
        participantHash: anonymizationEngine.hashUserId(params.userId),
        sessionHash: anonymizationEngine.hashSessionId(params.sessionId),
        eventType: params.eventType,
        timestamp: new Date(),
        payload: params.payload,
        consentVersion: CONSENT_VERSION,
        dataQuality: params.dataQuality ?? 1.0,
      });

      await event.save();
      return event;
    } catch (err) {
      logger.warn('[PDD] Event logging failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Log message event (called from orchestrator)
   */
  async logMessageEvent(params: {
    userId: string;
    sessionId: string;
    role: 'user' | 'assistant';
    messageIndex: number;
    wordCount: number;
    emotionSummary?: Record<string, number>;
    spsiScore?: number;
    ebhScore?: number;
    zone?: string;
    dataQuality?: number;
  }): Promise<void> {
    await this.logEvent({
      userId: params.userId,
      sessionId: params.sessionId,
      eventType: 'message_event',
      payload: {
        role: params.role,
        messageIndex: params.messageIndex,
        wordCount: params.wordCount,
        emotionSummary: params.emotionSummary,
        spsiScore: params.spsiScore,
        ebhScore: params.ebhScore,
        zone: params.zone,
      },
      dataQuality: params.dataQuality,
    });
  }

  /**
   * Log session event (start/end)
   */
  async logSessionEvent(params: {
    userId: string;
    sessionId: string;
    action: 'start' | 'end' | 'timeout';
    durationMs?: number;
    messageCount?: number;
    avgSPSI?: number;
    peakEBH?: number;
  }): Promise<void> {
    await this.logEvent({
      userId: params.userId,
      sessionId: params.sessionId,
      eventType: 'session_event',
      payload: {
        action: params.action,
        durationMs: params.durationMs,
        messageCount: params.messageCount,
        avgSPSI: params.avgSPSI,
        peakEBH: params.peakEBH,
      },
    });
  }

  /**
   * Log survey event (DASS-21 completion)
   */
  async logSurveyEvent(params: {
    userId: string;
    sessionId: string;
    testType: string;
    totalScore: number;
    subscaleScores?: Record<string, number>;
    severity?: string;
    completionTimeMs?: number;
  }): Promise<void> {
    await this.logEvent({
      userId: params.userId,
      sessionId: params.sessionId,
      eventType: 'survey_event',
      payload: {
        testType: params.testType,
        totalScore: params.totalScore,
        subscaleScores: params.subscaleScores,
        severity: params.severity,
        completionTimeMs: params.completionTimeMs,
      },
    });
  }

  /**
   * Log intervention event
   */
  async logInterventionEvent(params: {
    userId: string;
    sessionId: string;
    interventionType: string;
    reason: string;
    accepted: boolean;
    preEBH: number;
    postEBH?: number;
    effectiveness?: number;
  }): Promise<void> {
    await this.logEvent({
      userId: params.userId,
      sessionId: params.sessionId,
      eventType: 'intervention_event',
      payload: params,
    });
  }

  /**
   * Log crisis event
   */
  async logCrisisEvent(params: {
    userId: string;
    sessionId: string;
    riskLevel: 'high' | 'critical';
    triggerSource: string;
    escalated: boolean;
    responseTimeMs?: number;
  }): Promise<void> {
    await this.logEvent({
      userId: params.userId,
      sessionId: params.sessionId,
      eventType: 'crisis_event',
      payload: params,
    });
  }

  // ────────────────────────────────────────────────
  // LAYER 4: SNAPSHOT BUILDER
  // ────────────────────────────────────────────────

  /**
   * Build daily snapshot for a participant
   */
  async buildDailySnapshot(userId: string, date: Date): Promise<IPDDSnapshot | null> {
    const consented = await this.hasConsent(userId);
    if (!consented) return null;

    const participantHash = anonymizationEngine.hashUserId(userId);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch all PGE states for the day
    const states = await PsychologicalState.find({
      userId,
      timestamp: { $gte: dayStart, $lte: dayEnd },
    }).sort({ timestamp: 1 }).lean();

    if (states.length === 0) return null;

    // Fetch SPSI records
    const spsiRecords = await SPSIRecord.find({
      userId,
      timestamp: { $gte: dayStart, $lte: dayEnd },
      granularity: 'message',
    }).lean();

    // Fetch research events
    const events = await ResearchEvent.find({
      participantHash,
      timestamp: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    // Build emotional trajectories
    const trajectories = this.buildEmotionalTrajectories(states);

    // SPSI stats
    const spsiScores = spsiRecords.map(r => r.spsiScore);
    const spsiMean = spsiScores.length > 0
      ? spsiScores.reduce((a, b) => a + b, 0) / spsiScores.length : 0;
    const spsiMin = spsiScores.length > 0 ? Math.min(...spsiScores) : 0;
    const spsiMax = spsiScores.length > 0 ? Math.max(...spsiScores) : 0;
    const spsiStdDev = this.stdDev(spsiScores);
    const spsiAlertCount = spsiRecords.filter(r => r.alertLevel !== 'none').length;

    // EBH stats
    const ebhScores = states.map(s => s.ebhScore);
    const ebhMean = ebhScores.reduce((a, b) => a + b, 0) / ebhScores.length;
    const ebhMax = Math.max(...ebhScores);
    const criticalCount = states.filter(
      s => s.zone === 'critical' || s.zone === 'black_hole'
    ).length;
    const timeInCritical = criticalCount / states.length;

    // Session summary from events
    const sessionEvents = events.filter(e => e.eventType === 'session_event');
    const sessionStarts = sessionEvents.filter(
      e => (e.payload as Record<string, unknown>).action === 'start'
    );
    const sessionEnds = sessionEvents.filter(
      e => (e.payload as Record<string, unknown>).action === 'end'
    );

    // Intervention summary
    const interventionEvents = events.filter(e => e.eventType === 'intervention_event');
    const interventionPayloads = interventionEvents.map(e => e.payload as Record<string, unknown>);
    const acceptedInterventions = interventionPayloads.filter(p => p.accepted);

    // Self-report summary
    const surveyEvents = events.filter(e => e.eventType === 'survey_event');
    const surveyPayloads = surveyEvents.map(e => e.payload as Record<string, unknown>);

    // SPSI trend (linear regression over available data)
    const spsiTrend = spsiScores.length >= 3 ? this.linearSlope(spsiScores) : 0;

    const snapshot = new PDDSnapshot({
      participantHash,
      periodStart: dayStart,
      periodEnd: dayEnd,
      granularity: 'daily',

      spsi: {
        mean: spsiMean,
        min: spsiMin,
        max: spsiMax,
        stdDev: spsiStdDev,
        trend: spsiTrend,
        alertCount: spsiAlertCount,
      },

      ebh: {
        mean: ebhMean,
        max: ebhMax,
        timeInCritical,
      },

      emotionalTrajectories: trajectories,

      sessions: {
        sessionCount: Math.max(sessionStarts.length, 1),
        totalMessages: states.length,
        totalDurationMs: sessionEnds.reduce(
          (sum, e) => sum + ((e.payload as Record<string, unknown>).durationMs as number || 0), 0
        ),
        avgMessagesPerSession: states.length / Math.max(sessionStarts.length, 1),
        avgDurationMs: sessionEnds.length > 0
          ? sessionEnds.reduce(
              (sum, e) => sum + ((e.payload as Record<string, unknown>).durationMs as number || 0), 0
            ) / sessionEnds.length
          : 0,
      },

      interventions: {
        totalSuggested: interventionEvents.length,
        totalAccepted: acceptedInterventions.length,
        acceptanceRate: interventionEvents.length > 0
          ? acceptedInterventions.length / interventionEvents.length : 0,
        avgEffectiveness: acceptedInterventions.length > 0
          ? acceptedInterventions.reduce(
              (sum, p) => sum + ((p.effectiveness as number) || 0), 0
            ) / acceptedInterventions.length
          : 0,
        types: this.countByKey(interventionPayloads, 'interventionType'),
      },

      selfReports: {
        count: surveyEvents.length,
        avgStress: this.avgField(surveyPayloads, 'subscaleScores', 'stress'),
        avgAnxiety: this.avgField(surveyPayloads, 'subscaleScores', 'anxiety'),
        avgDepression: this.avgField(surveyPayloads, 'subscaleScores', 'depression'),
      },

      dataCompleteness: states.length >= 3 ? 1.0 : states.length / 3,
      eventCount: events.length,
    });

    // Upsert (one snapshot per participant per day)
    await PDDSnapshot.findOneAndUpdate(
      { participantHash, granularity: 'daily', periodStart: dayStart },
      snapshot.toObject(),
      { upsert: true, new: true }
    );

    return snapshot;
  }

  // ────────────────────────────────────────────────
  // LAYER 5: RESEARCH QUERIES
  // ────────────────────────────────────────────────

  /**
   * Get dataset statistics for research dashboard
   */
  async getDatasetStatistics(): Promise<{
    totalParticipants: number;
    totalEvents: number;
    totalSnapshots: number;
    eventDistribution: Record<string, number>;
    dateRange: { earliest: Date | null; latest: Date | null };
    avgDataCompleteness: number;
  }> {
    const [eventStats] = await ResearchEvent.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          participants: { $addToSet: '$participantHash' },
          earliest: { $min: '$timestamp' },
          latest: { $max: '$timestamp' },
        },
      },
    ]);

    const [eventDist] = await ResearchEvent.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $group: { _id: null, distribution: { $push: { k: '$_id', v: '$count' } } } },
      { $project: { distribution: { $arrayToObject: '$distribution' } } },
    ]);

    const snapshotCount = await PDDSnapshot.countDocuments();

    const [qualityStats] = await PDDSnapshot.aggregate([
      { $group: { _id: null, avgCompleteness: { $avg: '$dataCompleteness' } } },
    ]);

    return {
      totalParticipants: eventStats?.participants?.length ?? 0,
      totalEvents: eventStats?.totalEvents ?? 0,
      totalSnapshots: snapshotCount,
      eventDistribution: eventDist?.distribution ?? {},
      dateRange: {
        earliest: eventStats?.earliest ?? null,
        latest: eventStats?.latest ?? null,
      },
      avgDataCompleteness: qualityStats?.avgCompleteness ?? 0,
    };
  }

  /**
   * Export participant trajectory (anonymized) for research
   */
  async exportParticipantTrajectory(participantHash: string, options: {
    startDate?: Date;
    endDate?: Date;
    granularity?: 'daily' | 'weekly' | 'monthly';
  } = {}) {
    const { startDate, endDate, granularity = 'daily' } = options;
    const query: Record<string, unknown> = { participantHash, granularity };
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
      query.periodStart = dateFilter;
    }

    return PDDSnapshot.find(query).sort({ periodStart: 1 }).lean();
  }

  /**
   * Population-level snapshot export (for statistical analysis)
   */
  async exportPopulationData(options: {
    startDate?: Date;
    endDate?: Date;
    granularity?: 'daily' | 'weekly';
    limit?: number;
  } = {}) {
    const { startDate, endDate, granularity = 'daily', limit = 10000 } = options;
    const query: Record<string, unknown> = { granularity };
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
      query.periodStart = dateFilter;
    }

    return PDDSnapshot.find(query).sort({ periodStart: 1 }).limit(limit).lean();
  }

  // ────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────

  /**
   * Build emotional trajectory points from PGE states
   */
  private buildEmotionalTrajectories(
    states: Array<Pick<IPsychologicalState, 'stateVector'>>
  ): IEmotionalTrajectoryPoint[] {
    return TRAJECTORY_VARIABLES.map(variable => {
      const values = states.map(s => s.stateVector[variable as keyof IStateVector]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const stdDev = this.stdDev(values);
      const trend = values.length >= 2 ? this.linearSlope(values) : 0;

      return { variable, mean, min, max, stdDev, trend };
    });
  }

  private stdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private linearSlope(ys: number[]): number {
    if (ys.length < 2) return 0;
    const xs = ys.map((_, i) => i);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
    const denom = n * sumX2 - sumX * sumX;
    return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  }

  private countByKey(
    records: Record<string, unknown>[],
    key: string
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of records) {
      const val = String(r[key] || 'unknown');
      counts[val] = (counts[val] || 0) + 1;
    }
    return counts;
  }

  private avgField(
    records: Record<string, unknown>[],
    parentKey: string,
    childKey: string
  ): number | undefined {
    const values: number[] = [];
    for (const r of records) {
      const parent = r[parentKey] as Record<string, number> | undefined;
      if (parent && typeof parent[childKey] === 'number') {
        values.push(parent[childKey]);
      }
    }
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : undefined;
  }
}

// ════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════

export const pddCollectionService = new PDDCollectionService();
