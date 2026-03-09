/**
 * THERAPEUTIC CONTEXT SERVICE
 *
 * Service tổng hợp therapeutic profile cho mỗi user:
 *   - Emotional trajectory (xu hướng cảm xúc theo thời gian)
 *   - Coping strategy effectiveness (hiệu quả các chiến lược đối phó)
 *   - Crisis/risk history (lịch sử khủng hoảng)
 *   - Test result trends (xu hướng điểm test tâm lý)
 *   - Conversation patterns (mẫu hội thoại thường gặp)
 *
 * Tạo unified context để chatbot/expert có cái nhìn toàn diện về user.
 *
 * @module services/therapeuticContextService
 * @version 1.0.0
 */

import LongTermMemory, { ILongTermMemory } from '../models/LongTermMemory';
import ConversationLog from '../models/ConversationLog';
import TestResult, { ITestResult, TestType } from '../models/TestResult';
import { memorySystem } from './memorySystem';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

export interface EmotionalDataPoint {
  timestamp: Date;
  emotion: string;
  intensity: number; // 0-1
  source: 'conversation' | 'test' | 'feedback';
}

export interface EmotionalTrajectory {
  currentState: string;
  currentIntensity: number;
  trend: 'improving' | 'stable' | 'worsening' | 'fluctuating' | 'insufficient_data';
  dominantEmotions: Array<{ emotion: string; frequency: number; avgIntensity: number }>;
  timeline: EmotionalDataPoint[];
  volatilityScore: number; // 0-1, how much emotions fluctuate
}

export interface CopingEffectiveness {
  strategy: string;
  timesUsed: number;
  effectivenessScore: number; // 0-1
  trend: 'more_effective' | 'stable' | 'less_effective' | 'insufficient_data';
  lastUsed?: Date;
}

export interface CrisisHistorySummary {
  totalCrisisEvents: number;
  lastCrisisDate?: Date;
  crisisTypes: Array<{ type: string; count: number }>;
  averageRecoveryDays: number;
  riskTrajectory: 'decreasing' | 'stable' | 'increasing' | 'insufficient_data';
}

export interface TestTrend {
  testType: string;
  scores: Array<{ date: Date; score: number; severity: string }>;
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  latestScore: number;
  latestSeverity: string;
  changeRate: number; // negative = improving for most scales
}

export interface ConversationPattern {
  avgSessionLength: number; // messages per session
  preferredTopics: Array<{ topic: string; percentage: number }>;
  engagementLevel: 'high' | 'moderate' | 'low';
  feedbackRate: number; // % of conversations with feedback
  satisfactionTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

export interface TherapeuticProfile {
  userId: string;
  generatedAt: Date;
  dataQuality: 'comprehensive' | 'moderate' | 'limited';

  emotionalTrajectory: EmotionalTrajectory;
  copingStrategies: CopingEffectiveness[];
  crisisHistory: CrisisHistorySummary;
  testTrends: TestTrend[];
  conversationPatterns: ConversationPattern;

  // Aggregated insights
  keyInsights: string[];
  riskFactors: string[];
  protectiveFactors: string[];
  therapeuticRecommendations: string[];

  // For chatbot prompt injection
  contextSummary: string;
}

// ─────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────

export class TherapeuticContextService {
  private profileCache: Map<string, { profile: TherapeuticProfile; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 200;
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Build complete therapeutic profile for a user
   */
  async buildProfile(userId: string, forceRefresh = false): Promise<TherapeuticProfile> {
    // Check cache
    if (!forceRefresh) {
      this.cleanupIfNeeded();
      const cached = this.profileCache.get(userId);
      if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
        return cached.profile;
      }
    }

    logger.info(`[TherapeuticContext] Building profile for user ${userId}`);

    const [
      emotionalTrajectory,
      copingStrategies,
      crisisHistory,
      testTrends,
      conversationPatterns,
    ] = await Promise.all([
      this.buildEmotionalTrajectory(userId),
      this.analyzeCopingStrategies(userId),
      this.buildCrisisHistory(userId),
      this.buildTestTrends(userId),
      this.analyzeConversationPatterns(userId),
    ]);

    const keyInsights = this.extractKeyInsights(emotionalTrajectory, copingStrategies, crisisHistory, testTrends);
    const riskFactors = this.identifyRiskFactors(emotionalTrajectory, crisisHistory, testTrends);
    const protectiveFactors = this.identifyProtectiveFactors(copingStrategies, conversationPatterns);
    const therapeuticRecommendations = this.generateRecommendations(
      emotionalTrajectory, copingStrategies, crisisHistory, testTrends
    );
    const dataQuality = this.assessDataQuality(emotionalTrajectory, testTrends, conversationPatterns);
    const contextSummary = this.buildContextSummary(
      emotionalTrajectory, copingStrategies, crisisHistory, testTrends, keyInsights
    );

    const profile: TherapeuticProfile = {
      userId,
      generatedAt: new Date(),
      dataQuality,
      emotionalTrajectory,
      copingStrategies,
      crisisHistory,
      testTrends,
      conversationPatterns,
      keyInsights,
      riskFactors,
      protectiveFactors,
      therapeuticRecommendations,
      contextSummary,
    };

    this.profileCache.set(userId, { profile, cachedAt: Date.now() });
    logger.info(`[TherapeuticContext] Profile built for ${userId} (quality: ${dataQuality})`);

    return profile;
  }

  /**
   * Get compact context for chatbot prompt injection
   */
  async getContextForPrompt(userId: string): Promise<string> {
    const profile = await this.buildProfile(userId);
    return profile.contextSummary;
  }

  // ─────────────────────────────────────────────────────
  // EMOTIONAL TRAJECTORY
  // ─────────────────────────────────────────────────────

  private async buildEmotionalTrajectory(userId: string): Promise<EmotionalTrajectory> {
    const memories = await LongTermMemory.find({
      userId,
      type: { $in: ['insight', 'pattern', 'behavior'] },
      'metadata.category': { $regex: /emotion|mood|feeling|stress|anxiety|depress/i },
    })
      .sort({ createdAt: -1 })
      .limit(200);

    if (memories.length < 3) {
      return {
        currentState: 'unknown',
        currentIntensity: 0,
        trend: 'insufficient_data',
        dominantEmotions: [],
        timeline: [],
        volatilityScore: 0,
      };
    }

    // Build timeline
    const timeline: EmotionalDataPoint[] = memories.map(m => ({
      timestamp: m.createdAt,
      emotion: m.metadata.category || 'unknown',
      intensity: m.metadata.intensity ?? 0.5,
      source: 'conversation' as const,
    }));

    // Dominant emotions
    const emotionCounts = new Map<string, { count: number; totalIntensity: number }>();
    for (const dp of timeline) {
      const existing = emotionCounts.get(dp.emotion) || { count: 0, totalIntensity: 0 };
      existing.count++;
      existing.totalIntensity += dp.intensity;
      emotionCounts.set(dp.emotion, existing);
    }

    const dominantEmotions = Array.from(emotionCounts.entries())
      .map(([emotion, data]) => ({
        emotion,
        frequency: data.count,
        avgIntensity: data.totalIntensity / data.count,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Trend analysis: compare recent 1/3 vs older 2/3
    const recentCutoff = Math.floor(timeline.length / 3);
    const recentAvg = this.avgIntensity(timeline.slice(0, recentCutoff));
    const olderAvg = this.avgIntensity(timeline.slice(recentCutoff));

    const diff = recentAvg - olderAvg;
    let trend: EmotionalTrajectory['trend'];
    if (Math.abs(diff) < 0.05) trend = 'stable';
    else if (diff < -0.1) trend = 'improving'; // Lower intensity of negative emotions = improving
    else if (diff > 0.1) trend = 'worsening';
    else trend = 'fluctuating';

    // Volatility: stdev of intensities
    const intensities = timeline.map(t => t.intensity);
    const mean = intensities.reduce((s, v) => s + v, 0) / intensities.length;
    const variance = intensities.reduce((s, v) => s + (v - mean) ** 2, 0) / intensities.length;
    const volatilityScore = Math.min(1, Math.sqrt(variance) * 2); // normalize 0-1

    return {
      currentState: dominantEmotions[0]?.emotion || 'unknown',
      currentIntensity: recentAvg,
      trend,
      dominantEmotions,
      timeline: timeline.slice(0, 50), // Limit for payload size
      volatilityScore,
    };
  }

  private avgIntensity(points: EmotionalDataPoint[]): number {
    if (points.length === 0) return 0;
    return points.reduce((s, p) => s + p.intensity, 0) / points.length;
  }

  // ─────────────────────────────────────────────────────
  // COPING STRATEGIES
  // ─────────────────────────────────────────────────────

  private async analyzeCopingStrategies(userId: string): Promise<CopingEffectiveness[]> {
    const copingMemories = await LongTermMemory.find({
      userId,
      type: 'coping_strategy',
    }).sort({ createdAt: -1 });

    if (copingMemories.length === 0) return [];

    // Aggregate by category
    const strategyMap = new Map<string, {
      count: number;
      totalConfidence: number;
      totalIntensity: number;
      lastSeen: Date;
      confidences: number[];
    }>();

    for (const mem of copingMemories) {
      const cat = mem.metadata.category || mem.content.substring(0, 30);
      const existing = strategyMap.get(cat) || {
        count: 0,
        totalConfidence: 0,
        totalIntensity: 0,
        lastSeen: mem.createdAt,
        confidences: [],
      };
      existing.count++;
      existing.totalConfidence += mem.metadata.confidence;
      existing.totalIntensity += mem.metadata.intensity ?? 0.5;
      existing.confidences.push(mem.metadata.confidence);
      if (mem.createdAt > existing.lastSeen) existing.lastSeen = mem.createdAt;
      strategyMap.set(cat, existing);
    }

    return Array.from(strategyMap.entries()).map(([strategy, data]) => {
      const effectivenessScore = data.totalConfidence / data.count;

      // Trend: compare first half vs second half of confidences
      let trend: CopingEffectiveness['trend'] = 'insufficient_data';
      if (data.confidences.length >= 4) {
        const mid = Math.floor(data.confidences.length / 2);
        const firstHalf = data.confidences.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
        const secondHalf = data.confidences.slice(mid).reduce((s, v) => s + v, 0) / (data.confidences.length - mid);
        if (secondHalf - firstHalf > 0.1) trend = 'more_effective';
        else if (firstHalf - secondHalf > 0.1) trend = 'less_effective';
        else trend = 'stable';
      }

      return {
        strategy,
        timesUsed: data.count,
        effectivenessScore,
        trend,
        lastUsed: data.lastSeen,
      };
    }).sort((a, b) => b.timesUsed - a.timesUsed);
  }

  // ─────────────────────────────────────────────────────
  // CRISIS HISTORY
  // ─────────────────────────────────────────────────────

  private async buildCrisisHistory(userId: string): Promise<CrisisHistorySummary> {
    // Pull crisis-related memories
    const crisisMemories = await LongTermMemory.find({
      userId,
      $or: [
        { type: 'trigger' },
        { 'metadata.category': { $regex: /crisis|suicid|self.harm|emergency/i } },
      ],
    }).sort({ createdAt: 1 });

    if (crisisMemories.length === 0) {
      return {
        totalCrisisEvents: 0,
        crisisTypes: [],
        averageRecoveryDays: 0,
        riskTrajectory: 'insufficient_data',
      };
    }

    // Count by type
    const typeMap = new Map<string, number>();
    for (const mem of crisisMemories) {
      const type = mem.metadata.category || 'general';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }

    // Risk trajectory: compare frequency in recent 30 days vs prior 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentCount = crisisMemories.filter(m => m.createdAt >= thirtyDaysAgo).length;
    const priorCount = crisisMemories.filter(m => m.createdAt >= sixtyDaysAgo && m.createdAt < thirtyDaysAgo).length;

    let riskTrajectory: CrisisHistorySummary['riskTrajectory'] = 'insufficient_data';
    if (crisisMemories.length >= 3) {
      if (recentCount < priorCount) riskTrajectory = 'decreasing';
      else if (recentCount > priorCount) riskTrajectory = 'increasing';
      else riskTrajectory = 'stable';
    }

    // Estimate recovery time between crisis events
    let totalRecoveryDays = 0;
    let recoveryCount = 0;
    for (let i = 1; i < crisisMemories.length; i++) {
      const daysBetween = (crisisMemories[i].createdAt.getTime() - crisisMemories[i - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysBetween > 0 && daysBetween < 90) { // Only count gaps < 90 days
        totalRecoveryDays += daysBetween;
        recoveryCount++;
      }
    }

    return {
      totalCrisisEvents: crisisMemories.length,
      lastCrisisDate: crisisMemories[crisisMemories.length - 1]?.createdAt,
      crisisTypes: Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      averageRecoveryDays: recoveryCount > 0 ? Math.round(totalRecoveryDays / recoveryCount) : 0,
      riskTrajectory,
    };
  }

  // ─────────────────────────────────────────────────────
  // TEST TRENDS (Longitudinal Analysis)
  // ─────────────────────────────────────────────────────

  async buildTestTrends(userId: string): Promise<TestTrend[]> {
    // Query test results — TestResult model uses consentId, not userId directly
    // However, there's a userId index — the field may be populated dynamically
    const testResults = await TestResult.find({ userId })
      .sort({ completedAt: 1 })
      .lean() as any[];

    if (testResults.length === 0) return [];

    // Group by testType
    const byType = new Map<string, Array<{ date: Date; score: number; severity: string }>>();
    for (const result of testResults) {
      const key = result.testType;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push({
        date: result.completedAt,
        score: result.totalScore,
        severity: result.evaluation?.severity || 'unknown',
      });
    }

    const trends: TestTrend[] = [];

    for (const [testType, scores] of byType.entries()) {
      const latestScore = scores[scores.length - 1].score;
      const latestSeverity = scores[scores.length - 1].severity;

      let trend: TestTrend['trend'] = 'insufficient_data';
      let changeRate = 0;

      if (scores.length >= 2) {
        const firstScore = scores[0].score;
        changeRate = latestScore - firstScore;

        // For mental health scales, lower score = better (PHQ-9, GAD-7, DASS-21, EPDS)
        if (changeRate <= -3) trend = 'improving';
        else if (changeRate >= 3) trend = 'worsening';
        else trend = 'stable';
      }

      trends.push({ testType, scores, trend, latestScore, latestSeverity, changeRate });

      // DASS-21: also track each subscale individually for more granular trends
      if (testType === 'DASS-21') {
        const dassResults = testResults.filter(r => r.testType === 'DASS-21');
        for (const subscale of ['depression', 'anxiety', 'stress'] as const) {
          const subScores = dassResults
            .filter(r => r.subscaleScores?.[subscale] != null)
            .map(r => ({
              date: r.completedAt,
              score: r.subscaleScores[subscale] as number,
              severity: r.evaluation?.severity || 'unknown',
            }));

          if (subScores.length === 0) continue;

          const subLatest = subScores[subScores.length - 1].score;
          let subTrend: TestTrend['trend'] = 'insufficient_data';
          let subChangeRate = 0;

          if (subScores.length >= 2) {
            subChangeRate = subLatest - subScores[0].score;
            if (subChangeRate <= -3) subTrend = 'improving';
            else if (subChangeRate >= 3) subTrend = 'worsening';
            else subTrend = 'stable';
          }

          trends.push({
            testType: `DASS-21:${subscale}`,
            scores: subScores,
            trend: subTrend,
            latestScore: subLatest,
            latestSeverity: subScores[subScores.length - 1].severity,
            changeRate: subChangeRate,
          });
        }
      }
    }

    return trends;
  }

  /**
   * Compute longitudinal trend for use in enhancedScoring
   */
  async getLongitudinalTrend(
    userId: string,
    testType: string
  ): Promise<'improving' | 'stable' | 'worsening' | 'insufficient_data'> {
    const trends = await this.buildTestTrends(userId);
    const match = trends.find(t => t.testType === testType);
    return match?.trend || 'insufficient_data';
  }

  // ─────────────────────────────────────────────────────
  // CONVERSATION PATTERNS
  // ─────────────────────────────────────────────────────

  private async analyzeConversationPatterns(userId: string): Promise<ConversationPattern> {
    const recentLogs = await ConversationLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    if (recentLogs.length === 0) {
      return {
        avgSessionLength: 0,
        preferredTopics: [],
        engagementLevel: 'low',
        feedbackRate: 0,
        satisfactionTrend: 'insufficient_data',
      };
    }

    // Group by sessionId to compute avg session length
    const sessionMessages = new Map<string, number>();
    for (const log of recentLogs) {
      const sid = (log as any).sessionId || 'unknown';
      sessionMessages.set(sid, (sessionMessages.get(sid) || 0) + 1);
    }
    const sessionLengths = Array.from(sessionMessages.values());
    const avgSessionLength = sessionLengths.reduce((s, v) => s + v, 0) / sessionLengths.length;

    // Topic analysis from userIntent
    const topicCounts = new Map<string, number>();
    for (const log of recentLogs) {
      const intent = (log as any).userIntent;
      if (intent) {
        topicCounts.set(intent, (topicCounts.get(intent) || 0) + 1);
      }
    }
    const totalTopics = Array.from(topicCounts.values()).reduce((s, v) => s + v, 0) || 1;
    const preferredTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, percentage: count / totalTopics }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Feedback rate
    const withFeedback = recentLogs.filter((l: any) => l.wasHelpful !== undefined).length;
    const feedbackRate = withFeedback / recentLogs.length;

    // Engagement level
    let engagementLevel: ConversationPattern['engagementLevel'] = 'low';
    if (avgSessionLength >= 10 && recentLogs.length >= 50) engagementLevel = 'high';
    else if (avgSessionLength >= 5 || recentLogs.length >= 20) engagementLevel = 'moderate';

    // Satisfaction trend from ratings
    const ratedLogs = recentLogs
      .filter((l: any) => l.userRating != null)
      .map((l: any) => ({ rating: l.userRating, date: l.timestamp }));

    let satisfactionTrend: ConversationPattern['satisfactionTrend'] = 'insufficient_data';
    if (ratedLogs.length >= 6) {
      const mid = Math.floor(ratedLogs.length / 2);
      const olderAvg = ratedLogs.slice(mid).reduce((s, v) => s + v.rating, 0) / (ratedLogs.length - mid);
      const recentAvg = ratedLogs.slice(0, mid).reduce((s, v) => s + v.rating, 0) / mid;
      if (recentAvg - olderAvg > 0.3) satisfactionTrend = 'improving';
      else if (olderAvg - recentAvg > 0.3) satisfactionTrend = 'declining';
      else satisfactionTrend = 'stable';
    }

    return { avgSessionLength, preferredTopics, engagementLevel, feedbackRate, satisfactionTrend };
  }

  // ─────────────────────────────────────────────────────
  // INSIGHT EXTRACTION
  // ─────────────────────────────────────────────────────

  private extractKeyInsights(
    emotional: EmotionalTrajectory,
    coping: CopingEffectiveness[],
    crisis: CrisisHistorySummary,
    tests: TestTrend[]
  ): string[] {
    const insights: string[] = [];

    // Emotional insights
    if (emotional.trend === 'improving') {
      insights.push('Xu hướng cảm xúc đang cải thiện — tiếp tục duy trì các hoạt động tích cực');
    } else if (emotional.trend === 'worsening') {
      insights.push('Cần chú ý: Mức độ căng thẳng cảm xúc đang tăng — nên theo dõi sát hơn');
    }
    if (emotional.volatilityScore > 0.6) {
      insights.push('Cảm xúc dao động nhiều — cần xây dựng kỹ năng điều chỉnh cảm xúc');
    }

    // Coping insights
    const effectiveCoping = coping.filter(c => c.effectivenessScore > 0.7);
    if (effectiveCoping.length > 0) {
      insights.push(`Chiến lược đối phó hiệu quả nhất: ${effectiveCoping.map(c => c.strategy).join(', ')}`);
    }
    const ineffectiveCoping = coping.filter(c => c.effectivenessScore < 0.4 && c.timesUsed >= 3);
    if (ineffectiveCoping.length > 0) {
      insights.push(`Cần thay đổi: ${ineffectiveCoping.map(c => c.strategy).join(', ')} chưa hiệu quả`);
    }

    // Crisis insights
    if (crisis.totalCrisisEvents > 0 && crisis.riskTrajectory === 'decreasing') {
      insights.push('Tần suất khủng hoảng giảm — dấu hiệu phục hồi tích cực');
    } else if (crisis.riskTrajectory === 'increasing') {
      insights.push('⚠️ Tần suất khủng hoảng tăng — cần can thiệp sớm');
    }

    // Test insights
    for (const test of tests) {
      if (test.trend === 'improving') {
        insights.push(`${test.testType}: Điểm đang cải thiện (${test.scores[0]?.score} → ${test.latestScore})`);
      } else if (test.trend === 'worsening') {
        insights.push(`⚠️ ${test.testType}: Điểm tăng (${test.scores[0]?.score} → ${test.latestScore}), cần chú ý`);
      }
    }

    return insights;
  }

  private identifyRiskFactors(
    emotional: EmotionalTrajectory,
    crisis: CrisisHistorySummary,
    tests: TestTrend[]
  ): string[] {
    const risks: string[] = [];

    if (emotional.trend === 'worsening') risks.push('Xu hướng cảm xúc tiêu cực');
    if (emotional.volatilityScore > 0.7) risks.push('Cảm xúc không ổn định cao');
    if (crisis.riskTrajectory === 'increasing') risks.push('Tần suất khủng hoảng tăng');
    if (crisis.totalCrisisEvents >= 3) risks.push(`Lịch sử ${crisis.totalCrisisEvents} sự kiện khủng hoảng`);

    for (const test of tests) {
      if (test.trend === 'worsening' && test.latestSeverity === 'severe') {
        risks.push(`${test.testType}: Mức nghiêm trọng và đang xấu đi`);
      }
    }

    return risks;
  }

  private identifyProtectiveFactors(
    coping: CopingEffectiveness[],
    patterns: ConversationPattern
  ): string[] {
    const factors: string[] = [];

    if (coping.filter(c => c.effectivenessScore > 0.7).length >= 2) {
      factors.push('Có nhiều chiến lược đối phó hiệu quả');
    }
    if (patterns.engagementLevel === 'high') {
      factors.push('Tích cực tham gia trao đổi — cam kết chăm sóc sức khỏe tâm thần');
    }
    if (patterns.satisfactionTrend === 'improving') {
      factors.push('Mức độ hài lòng với hỗ trợ đang tăng');
    }

    return factors;
  }

  private generateRecommendations(
    emotional: EmotionalTrajectory,
    coping: CopingEffectiveness[],
    crisis: CrisisHistorySummary,
    tests: TestTrend[]
  ): string[] {
    const recs: string[] = [];

    // High-priority recommendations
    if (crisis.riskTrajectory === 'increasing') {
      recs.push('📞 Khuyến nghị: Kết nối với chuyên gia tâm lý để được hỗ trợ trực tiếp');
    }

    if (emotional.trend === 'worsening') {
      recs.push('🧘 Khuyến nghị: Thực hành mindfulness 10 phút/ngày để ổn định cảm xúc');
    }

    // Coping strategy recommendations
    const effectiveStrategies = coping.filter(c => c.effectivenessScore > 0.7);
    if (effectiveStrategies.length > 0) {
      recs.push(`💪 Tiếp tục: ${effectiveStrategies[0].strategy} — chiến lược hiệu quả nhất`);
    }

    const underusedEffective = coping.filter(c => c.effectivenessScore > 0.6 && c.timesUsed < 3);
    if (underusedEffective.length > 0) {
      recs.push(`🌱 Thử thêm: ${underusedEffective.map(c => c.strategy).join(', ')}`);
    }

    // Test-based recommendations
    for (const test of tests) {
      if (test.latestSeverity === 'severe' || test.latestSeverity === 'moderately_severe') {
        recs.push(`📋 Nên làm lại test ${test.testType} để theo dõi tiến triển`);
        break; // Only suggest one test re-take
      }
    }

    if (recs.length === 0) {
      recs.push('✨ Tiến triển tốt — tiếp tục duy trì các hoạt động chăm sóc bản thân');
    }

    return recs;
  }

  private assessDataQuality(
    emotional: EmotionalTrajectory,
    tests: TestTrend[],
    patterns: ConversationPattern
  ): TherapeuticProfile['dataQuality'] {
    let score = 0;
    if (emotional.timeline.length >= 20) score += 2;
    else if (emotional.timeline.length >= 5) score += 1;
    if (tests.length >= 2) score += 2;
    else if (tests.length >= 1) score += 1;
    if (patterns.engagementLevel === 'high') score += 2;
    else if (patterns.engagementLevel === 'moderate') score += 1;

    if (score >= 5) return 'comprehensive';
    if (score >= 3) return 'moderate';
    return 'limited';
  }

  // ─────────────────────────────────────────────────────
  // CONTEXT SUMMARY FOR PROMPT INJECTION
  // ─────────────────────────────────────────────────────

  private buildContextSummary(
    emotional: EmotionalTrajectory,
    coping: CopingEffectiveness[],
    crisis: CrisisHistorySummary,
    tests: TestTrend[],
    insights: string[]
  ): string {
    const parts: string[] = [];

    // Emotional state
    if (emotional.trend !== 'insufficient_data') {
      parts.push(`[Cảm xúc] Trạng thái: ${emotional.currentState}, xu hướng: ${this.translateTrend(emotional.trend)}, biến động: ${(emotional.volatilityScore * 100).toFixed(0)}%`);
    }

    // Coping
    const topCoping = coping.slice(0, 3);
    if (topCoping.length > 0) {
      parts.push(`[Đối phó] ${topCoping.map(c => `${c.strategy}(${(c.effectivenessScore * 100).toFixed(0)}%)`).join(', ')}`);
    }

    // Crisis
    if (crisis.totalCrisisEvents > 0) {
      parts.push(`[Khủng hoảng] ${crisis.totalCrisisEvents} sự kiện, xu hướng: ${this.translateTrend(crisis.riskTrajectory)}`);
    }

    // Tests
    for (const test of tests.slice(0, 3)) {
      parts.push(`[${test.testType}] Điểm: ${test.latestScore} (${test.latestSeverity}), xu hướng: ${this.translateTrend(test.trend)}`);
    }

    // Top 3 insights
    if (insights.length > 0) {
      parts.push(`[Nhận định] ${insights.slice(0, 3).join('; ')}`);
    }

    return parts.join('\n');
  }

  private translateTrend(trend: string): string {
    const map: Record<string, string> = {
      improving: 'cải thiện',
      stable: 'ổn định',
      worsening: 'xấu đi',
      fluctuating: 'dao động',
      increasing: 'tăng',
      decreasing: 'giảm',
      insufficient_data: 'chưa đủ dữ liệu',
      declining: 'giảm',
    };
    return map[trend] || trend;
  }

  /**
   * Evict expired entries and enforce max cache size
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL_MS) return;
    this.lastCleanup = now;

    for (const [key, entry] of this.profileCache) {
      if (now - entry.cachedAt >= this.CACHE_TTL_MS) {
        this.profileCache.delete(key);
      }
    }

    if (this.profileCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.profileCache.entries())
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
      const toRemove = entries.slice(0, this.profileCache.size - this.MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        this.profileCache.delete(key);
      }
    }
  }

  /**
   * Clear cached profile
   */
  invalidateCache(userId: string): void {
    this.profileCache.delete(userId);
  }
}

// Export singleton
export const therapeuticContextService = new TherapeuticContextService();
export default therapeuticContextService;
