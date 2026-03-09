/**
 * SPSI ENGINE — Social Psychological Stress Index
 * 
 * Chỉ số Căng thẳng Tâm lý Xã hội — phát hiện sớm xu hướng stress
 * trước khi đạt ngưỡng khủng hoảng.
 * 
 * Công thức SPSI:
 *   SPSI_raw = w1·Stress + w2·Anxiety + w3·Rumination + w4·Loneliness
 *            + w5·Hopelessness + w6·Sadness
 *            - w7·Hope - w8·PerceivedSupport - w9·Gratitude
 *   SPSI = clamp(SPSI_raw, 0, 1)
 * 
 * Tính năng:
 * - Per-message SPSI computation từ PGE state vector
 * - Session-level & daily aggregation
 * - 14-day trend analysis (slope, direction, change%)
 * - Alert thresholds: watch (0.5), warning (0.7), critical (0.85)
 * - Population-level SPSI statistics
 * - Time-lag correlation (SPSI_t vs Crisis_{t+k})
 * 
 * Mục tiêu nghiên cứu:
 * - H1: r(SPSI, DASS_stress) > 0.5
 * - H2: AUC(SPSI → crisis) > 0.75
 * - H3: Sensitivity > 0.7, False alarm < 25%
 * 
 * @module services/pge/spsiEngine
 * @version 1.0.0
 */

import { IStateVector, PSY_VARIABLES } from '../../models/PsychologicalState';
import { SPSIRecord, ISPSIRecord, ISPSIComponents, ISPSIWeights, ISPSITrend, SPSIAlertLevel } from '../../models/SPSIRecord';
import { logger } from '../../utils/logger';

// ════════════════════════════════════════════════════════════════
// CONSTANTS & DEFAULT WEIGHTS
// ════════════════════════════════════════════════════════════════

/** Default SPSI component weights (literature-informed priors) */
const DEFAULT_WEIGHTS: ISPSIWeights = {
  stress: 0.25,
  anxiety: 0.20,
  rumination: 0.15,
  loneliness: 0.15,
  hopelessness: 0.10,
  hope: 0.15,            // protective (subtracted)
  perceivedSupport: 0.08,// protective (subtracted)
  gratitude: 0.07,       // protective (subtracted)
  sadness: 0.10,
};

/** Alert thresholds */
const ALERT_THRESHOLDS = {
  watch: 0.5,
  warning: 0.7,
  critical: 0.85,
};

/** Trend detection parameters */
const TREND_WINDOW_DAYS = 14;       // observation window
const TREND_MIN_POINTS = 3;         // minimum data points for trend
const RISING_THRESHOLD = 0.30;      // 30% increase = rising
const FALLING_THRESHOLD = -0.20;    // 20% decrease = falling

/** Cache */
const CACHE_TTL = 3 * 60_000;       // 3 minutes
const MAX_CACHE_SIZE = 500;

// ════════════════════════════════════════════════════════════════
// SPSI ENGINE CLASS
// ════════════════════════════════════════════════════════════════

class SPSIEngine {
  private weights: ISPSIWeights;
  private trendCache: Map<string, { trend: ISPSITrend; ts: number }> = new Map();

  constructor() {
    this.weights = { ...DEFAULT_WEIGHTS };
  }

  // ────────────────────────────────────────────
  // CORE: Compute SPSI from state vector
  // ────────────────────────────────────────────

  /**
   * Tính SPSI score từ PGE state vector
   * 
   * @param stateVector - 24D PGE state vector
   * @returns SPSI score [0,1] và component breakdown
   */
  computeSPSI(stateVector: IStateVector): { score: number; components: ISPSIComponents } {
    const components: ISPSIComponents = {
      stress: stateVector.stress,
      anxiety: stateVector.anxiety,
      rumination: stateVector.rumination,
      loneliness: stateVector.loneliness,
      hopelessness: stateVector.hopelessness,
      hope: stateVector.hope,
      perceivedSupport: stateVector.perceivedSupport,
      gratitude: stateVector.gratitude,
      sadness: stateVector.sadness,
    };

    const w = this.weights;
    const raw =
      w.stress * components.stress +
      w.anxiety * components.anxiety +
      w.rumination * components.rumination +
      w.loneliness * components.loneliness +
      w.hopelessness * components.hopelessness +
      w.sadness * components.sadness -
      w.hope * components.hope -
      w.perceivedSupport * components.perceivedSupport -
      w.gratitude * components.gratitude;

    const score = Math.max(0, Math.min(1, raw));

    return { score, components };
  }

  /**
   * Classify alert level from SPSI score
   */
  classifyAlert(spsiScore: number): SPSIAlertLevel {
    if (spsiScore >= ALERT_THRESHOLDS.critical) return 'critical';
    if (spsiScore >= ALERT_THRESHOLDS.warning) return 'warning';
    if (spsiScore >= ALERT_THRESHOLDS.watch) return 'watch';
    return 'none';
  }

  // ────────────────────────────────────────────
  // TREND ANALYSIS
  // ────────────────────────────────────────────

  /**
   * Tính trend SPSI trong 14 ngày gần nhất
   * 
   * @param userId - user ID
   * @returns Trend object (direction, slope, changePercent)
   */
  async computeTrend(userId: string): Promise<ISPSITrend> {
    // Check cache
    const cached = this.trendCache.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.trend;
    }

    const windowStart = new Date(Date.now() - TREND_WINDOW_DAYS * 24 * 3600_000);

    const records = await SPSIRecord.find({
      userId,
      timestamp: { $gte: windowStart },
      granularity: { $in: ['session', 'daily'] },
    })
      .sort({ timestamp: 1 })
      .select({ spsiScore: 1, timestamp: 1 })
      .lean();

    if (records.length < TREND_MIN_POINTS) {
      const defaultTrend: ISPSITrend = {
        direction: 'stable',
        slope: 0,
        changePercent: 0,
        windowDays: TREND_WINDOW_DAYS,
      };
      return defaultTrend;
    }

    // Linear regression: y = a + b·x (x = days from first point)
    const t0 = records[0].timestamp.getTime();
    const xs = records.map(r => (r.timestamp.getTime() - t0) / (24 * 3600_000));
    const ys = records.map(r => r.spsiScore);

    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;

    // Change percent: compare first 25% mean vs last 25% mean
    const q = Math.max(1, Math.floor(n / 4));
    const firstMean = ys.slice(0, q).reduce((a, b) => a + b, 0) / q;
    const lastMean = ys.slice(-q).reduce((a, b) => a + b, 0) / q;
    const changePercent = firstMean > 0 ? (lastMean - firstMean) / firstMean : 0;

    let direction: ISPSITrend['direction'] = 'stable';
    if (changePercent >= RISING_THRESHOLD) direction = 'rising';
    else if (changePercent <= FALLING_THRESHOLD) direction = 'falling';

    const trend: ISPSITrend = {
      direction,
      slope: Math.round(slope * 10000) / 10000,
      changePercent: Math.round(changePercent * 1000) / 1000,
      windowDays: TREND_WINDOW_DAYS,
    };

    // Update cache (evict if full)
    if (this.trendCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.trendCache.keys().next().value;
      if (oldestKey) this.trendCache.delete(oldestKey);
    }
    this.trendCache.set(userId, { trend, ts: Date.now() });

    return trend;
  }

  // ────────────────────────────────────────────
  // RECORD & PERSIST
  // ────────────────────────────────────────────

  /**
   * Compute SPSI, trend, alert, and save to DB
   * Called from PGE orchestrator after each message
   */
  async processAndSave(params: {
    userId: string;
    sessionId: string;
    stateVector: IStateVector;
    ebhScore: number;
    zone: string;
    confidence: number;
  }): Promise<ISPSIRecord> {
    const { userId, sessionId, stateVector, ebhScore, zone, confidence } = params;

    const { score, components } = this.computeSPSI(stateVector);
    const alertLevel = this.classifyAlert(score);
    const trend = await this.computeTrend(userId);

    const record = new SPSIRecord({
      userId,
      sessionId,
      timestamp: new Date(),
      spsiScore: score,
      components,
      weights: this.weights,
      granularity: 'message',
      trend,
      alertLevel,
      ebhScore,
      zone,
      messageCount: 1,
      confidence,
      dataQuality: confidence >= 0.3 ? 1.0 : 0.5,
    });

    await record.save();

    if (alertLevel !== 'none') {
      logger.info('[SPSI] Alert detected', {
        userId: userId.substring(0, 8),
        spsiScore: score.toFixed(3),
        alertLevel,
        trend: trend.direction,
      });
    }

    return record;
  }

  // ────────────────────────────────────────────
  // SESSION AGGREGATION
  // ────────────────────────────────────────────

  /**
   * Tổng hợp SPSI session-level khi kết thúc session
   */
  async aggregateSession(userId: string, sessionId: string): Promise<ISPSIRecord | null> {
    const records = await SPSIRecord.find({
      userId,
      sessionId,
      granularity: 'message',
    }).lean();

    if (records.length === 0) return null;

    const scores = records.map(r => r.spsiScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Average components
    const avgComponents: ISPSIComponents = {
      stress: 0, anxiety: 0, rumination: 0, loneliness: 0,
      hopelessness: 0, hope: 0, perceivedSupport: 0, gratitude: 0, sadness: 0,
    };
    for (const r of records) {
      for (const key of Object.keys(avgComponents) as (keyof ISPSIComponents)[]) {
        avgComponents[key] += r.components[key] / records.length;
      }
    }

    const trend = await this.computeTrend(userId);
    const alertLevel = this.classifyAlert(avgScore);

    const sessionRecord = new SPSIRecord({
      userId,
      sessionId,
      timestamp: new Date(),
      spsiScore: avgScore,
      components: avgComponents,
      weights: this.weights,
      granularity: 'session',
      trend,
      alertLevel,
      ebhScore: Math.max(...records.map(r => r.ebhScore)),
      zone: records[records.length - 1].zone,
      messageCount: records.length,
      confidence: records.reduce((a, r) => a + r.confidence, 0) / records.length,
      dataQuality: records.reduce((a, r) => a + r.dataQuality, 0) / records.length,
    });

    await sessionRecord.save();
    return sessionRecord;
  }

  // ────────────────────────────────────────────
  // DAILY AGGREGATION
  // ────────────────────────────────────────────

  /**
   * Tổng hợp SPSI daily (gọi bởi cron hoặc end-of-day trigger)
   */
  async aggregateDaily(userId: string, date: Date): Promise<ISPSIRecord | null> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const records = await SPSIRecord.find({
      userId,
      timestamp: { $gte: dayStart, $lte: dayEnd },
      granularity: 'message',
    }).lean();

    if (records.length === 0) return null;

    const scores = records.map(r => r.spsiScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const avgComponents: ISPSIComponents = {
      stress: 0, anxiety: 0, rumination: 0, loneliness: 0,
      hopelessness: 0, hope: 0, perceivedSupport: 0, gratitude: 0, sadness: 0,
    };
    for (const r of records) {
      for (const key of Object.keys(avgComponents) as (keyof ISPSIComponents)[]) {
        avgComponents[key] += r.components[key] / records.length;
      }
    }

    const trend = await this.computeTrend(userId);
    const alertLevel = this.classifyAlert(avgScore);

    const dailyRecord = new SPSIRecord({
      userId,
      sessionId: `daily_${dayStart.toISOString().slice(0, 10)}`,
      timestamp: dayEnd,
      spsiScore: avgScore,
      components: avgComponents,
      weights: this.weights,
      granularity: 'daily',
      trend,
      alertLevel,
      ebhScore: Math.max(...records.map(r => r.ebhScore)),
      zone: records[records.length - 1].zone,
      messageCount: records.length,
      confidence: records.reduce((a, r) => a + r.confidence, 0) / records.length,
      dataQuality: records.reduce((a, r) => a + r.dataQuality, 0) / records.length,
    });

    await dailyRecord.save();
    return dailyRecord;
  }

  // ────────────────────────────────────────────
  // POPULATION STATISTICS
  // ────────────────────────────────────────────

  /**
   * Thống kê SPSI toàn population (cho research dashboard)
   */
  async getPopulationStats(options: {
    startDate?: Date;
    endDate?: Date;
    granularity?: 'session' | 'daily';
  } = {}): Promise<{
    totalRecords: number;
    totalUsers: number;
    meanSPSI: number;
    medianSPSI: number;
    stdDevSPSI: number;
    alertDistribution: Record<string, number>;
    trendDistribution: Record<string, number>;
  }> {
    const { startDate, endDate, granularity = 'daily' } = options;
    const match: Record<string, unknown> = { granularity };
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) (match.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (match.timestamp as Record<string, Date>).$lte = endDate;
    }

    const [stats] = await SPSIRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          users: { $addToSet: '$userId' },
          scores: { $push: '$spsiScore' },
          meanSPSI: { $avg: '$spsiScore' },
          alerts: { $push: '$alertLevel' },
          trends: { $push: '$trend.direction' },
        },
      },
    ]);

    if (!stats) {
      return {
        totalRecords: 0, totalUsers: 0, meanSPSI: 0,
        medianSPSI: 0, stdDevSPSI: 0,
        alertDistribution: {}, trendDistribution: {},
      };
    }

    // Compute median & stdDev
    const sorted = (stats.scores as number[]).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianSPSI = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    const mean = stats.meanSPSI;
    const variance = sorted.reduce((acc, s) => acc + (s - mean) ** 2, 0) / sorted.length;
    const stdDevSPSI = Math.sqrt(variance);

    // Distribution counts
    const alertDistribution: Record<string, number> = {};
    for (const a of stats.alerts as string[]) {
      alertDistribution[a] = (alertDistribution[a] || 0) + 1;
    }
    const trendDistribution: Record<string, number> = {};
    for (const t of stats.trends as string[]) {
      trendDistribution[t] = (trendDistribution[t] || 0) + 1;
    }

    return {
      totalRecords: stats.totalRecords,
      totalUsers: (stats.users as string[]).length,
      meanSPSI: Math.round(mean * 1000) / 1000,
      medianSPSI: Math.round(medianSPSI * 1000) / 1000,
      stdDevSPSI: Math.round(stdDevSPSI * 1000) / 1000,
      alertDistribution,
      trendDistribution,
    };
  }

  // ────────────────────────────────────────────
  // TIME-SERIES RETRIEVAL
  // ────────────────────────────────────────────

  /**
   * Lấy SPSI time series cho user (cho trend chart)
   */
  async getTimeSeries(userId: string, options: {
    days?: number;
    granularity?: 'message' | 'session' | 'daily';
    limit?: number;
  } = {}): Promise<Array<{
    timestamp: Date;
    spsiScore: number;
    alertLevel: string;
    ebhScore: number;
  }>> {
    const { days = 30, granularity = 'session', limit = 200 } = options;
    const since = new Date(Date.now() - days * 24 * 3600_000);

    return SPSIRecord.find({
      userId,
      timestamp: { $gte: since },
      granularity,
    })
      .sort({ timestamp: 1 })
      .limit(limit)
      .select({ timestamp: 1, spsiScore: 1, alertLevel: 1, ebhScore: 1 })
      .lean();
  }

  // ────────────────────────────────────────────
  // WEIGHT MANAGEMENT
  // ────────────────────────────────────────────

  /**
   * Get current SPSI weights
   */
  getWeights(): ISPSIWeights {
    return { ...this.weights };
  }

  /**
   * Update SPSI weights (từ regression / expert tuning)
   * Weights phải normalize sao cho risk factors sum ≈ 1 và protective ≈ 1
   */
  updateWeights(newWeights: Partial<ISPSIWeights>): void {
    for (const key of Object.keys(newWeights) as (keyof ISPSIWeights)[]) {
      if (typeof newWeights[key] === 'number' && newWeights[key]! >= 0) {
        this.weights[key] = newWeights[key]!;
      }
    }
    logger.info('[SPSI] Weights updated', { weights: this.weights });
  }

  /**
   * Clear trend cache (for testing)
   */
  clearCache(): void {
    this.trendCache.clear();
  }
}

// ════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════

export const spsiEngine = new SPSIEngine();
