/**
 * IMPACT ANALYTICS ENGINE
 * 
 * V5 Learning Pipeline — Module 10: Impact Analytics
 * Đo lường và phân tích tác động thực tế của ứng dụng
 * 
 * Metrics:
 * - psychologicalSafetyIndex
 * - helpSeekingRate
 * - conversationDepth
 * - empathyScoreAverage
 * - riskEscalationRate
 * - expertInterventionSuccess
 * 
 * @module services/impactAnalyticsEngine
 * @version 5.0.0
 */

import InteractionEvent from '../models/InteractionEvent';
import EvaluationScore from '../models/EvaluationScore';
import UserFeedback from '../models/UserFeedback';
import ExpertReview from '../models/ExpertReview';
import CriticalAlert from '../models/CriticalAlert';
import { logger } from '../utils/logger';

interface ImpactMetrics {
  period: { start: Date; end: Date };
  
  // Core Impact
  psychologicalSafetyIndex: number; // 0-100
  helpSeekingRate: number; // % users who seek help after AI suggests
  conversationDepth: number; // avg messages per session
  empathyScoreAverage: number; // 0-1
  
  // Safety
  riskEscalationRate: number; // % conversations that escalate
  crisisDetectionAccuracy: number; // accuracy of crisis flagging
  
  // Quality
  aiResponseQuality: number; // avg evaluation score
  userSatisfactionRate: number; // % helpful ratings
  positiveOutcomeRate: number; // % feel_better + same
  
  // Expert
  expertInterventionCount: number;
  expertInterventionSuccess: number; // % resolved
  avgExpertResponseTime: number; // seconds
  
  // Volume
  totalInteractions: number;
  uniqueUsers: number;
  totalSessions: number;
}

interface TrendData {
  date: string;
  value: number;
}

class ImpactAnalyticsEngine {
  /**
   * Tính toán tất cả impact metrics cho khoảng thời gian
   */
  async calculateMetrics(startDate: Date, endDate: Date): Promise<ImpactMetrics> {
    const [
      interactionStats,
      evaluationStats,
      feedbackStats,
      crisisStats,
      expertStats,
    ] = await Promise.all([
      this.getInteractionMetrics(startDate, endDate),
      this.getEvaluationMetrics(startDate, endDate),
      this.getFeedbackMetrics(startDate, endDate),
      this.getCrisisMetrics(startDate, endDate),
      this.getExpertMetrics(startDate, endDate),
    ]);

    // Calculate Psychological Safety Index (composite)
    const psi = this.calculatePSI(
      feedbackStats.positiveOutcomeRate,
      evaluationStats.avgSafety,
      interactionStats.escalationRate,
      feedbackStats.helpfulRate
    );

    return {
      period: { start: startDate, end: endDate },
      
      psychologicalSafetyIndex: psi,
      helpSeekingRate: crisisStats.helpSeekingRate,
      conversationDepth: interactionStats.avgConversationDepth,
      empathyScoreAverage: evaluationStats.avgEmpathy,
      
      riskEscalationRate: interactionStats.escalationRate,
      crisisDetectionAccuracy: crisisStats.detectionAccuracy,
      
      aiResponseQuality: evaluationStats.avgOverall,
      userSatisfactionRate: feedbackStats.helpfulRate,
      positiveOutcomeRate: feedbackStats.positiveOutcomeRate,
      
      expertInterventionCount: expertStats.totalInterventions,
      expertInterventionSuccess: expertStats.successRate,
      avgExpertResponseTime: expertStats.avgResponseTime,
      
      totalInteractions: interactionStats.totalInteractions,
      uniqueUsers: interactionStats.uniqueUsers,
      totalSessions: interactionStats.totalSessions,
    };
  }

  /**
   * Trend data cho dashboard
   */
  async getTrends(metric: string, days = 30): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      let value = 0;

      switch (metric) {
        case 'interactions':
          value = await InteractionEvent.countDocuments({
            timestamp: { $gte: dayStart, $lte: dayEnd },
          });
          break;
        case 'empathy':
          const empathyResult = await EvaluationScore.aggregate([
            { $match: { timestamp: { $gte: dayStart, $lte: dayEnd } } },
            { $group: { _id: null, avg: { $avg: '$empathyScore' } } },
          ]);
          value = empathyResult[0]?.avg || 0;
          break;
        case 'satisfaction':
          const feedbacks = await UserFeedback.find({
            timestamp: { $gte: dayStart, $lte: dayEnd },
          }).lean();
          value = feedbacks.length
            ? feedbacks.filter(f => f.rating === 'helpful').length / feedbacks.length
            : 0;
          break;
        case 'escalations':
          value = await InteractionEvent.countDocuments({
            timestamp: { $gte: dayStart, $lte: dayEnd },
            escalationTriggered: true,
          });
          break;
        case 'quality':
          const qualityResult = await EvaluationScore.aggregate([
            { $match: { timestamp: { $gte: dayStart, $lte: dayEnd } } },
            { $group: { _id: null, avg: { $avg: '$overallScore' } } },
          ]);
          value = qualityResult[0]?.avg || 0;
          break;
        default:
          break;
      }

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        value: Number(typeof value === 'number' ? value.toFixed(3) : value),
      });
    }

    return trends;
  }

  /**
   * Full dashboard data
   */
  async getDashboardData(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [metrics30d, metrics7d, trends] = await Promise.all([
      this.calculateMetrics(thirtyDaysAgo, now),
      this.calculateMetrics(sevenDaysAgo, now),
      Promise.all([
        this.getTrends('interactions', 30),
        this.getTrends('empathy', 30),
        this.getTrends('satisfaction', 30),
        this.getTrends('quality', 30),
      ]),
    ]);

    return {
      current: metrics30d,
      weekly: metrics7d,
      trends: {
        interactions: trends[0],
        empathy: trends[1],
        satisfaction: trends[2],
        quality: trends[3],
      },
      generatedAt: new Date(),
    };
  }

  // ===== PRIVATE METRIC CALCULATORS =====

  private async getInteractionMetrics(start: Date, end: Date): Promise<any> {
    const stats = await InteractionEvent.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
          avgConversationDepth: { $avg: '$conversationDepth' },
          avgResponseTime: { $avg: '$responseTimeMs' },
          escalationCount: { $sum: { $cond: ['$escalationTriggered', 1, 0] } },
          avgSentiment: { $avg: '$sentimentScore' },
        },
      },
    ]);

    if (!stats.length) {
      return {
        totalInteractions: 0, uniqueUsers: 0, totalSessions: 0,
        avgConversationDepth: 0, escalationRate: 0,
      };
    }

    const s = stats[0];
    return {
      totalInteractions: s.totalInteractions,
      uniqueUsers: s.uniqueUsers.length,
      totalSessions: s.uniqueSessions.length,
      avgConversationDepth: Number(s.avgConversationDepth.toFixed(1)),
      avgResponseTime: Math.round(s.avgResponseTime),
      escalationRate: Number((s.escalationCount / s.totalInteractions).toFixed(4)),
      avgSentiment: Number(s.avgSentiment.toFixed(3)),
    };
  }

  private async getEvaluationMetrics(start: Date, end: Date): Promise<any> {
    const stats = await EvaluationScore.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          avgEmpathy: { $avg: '$empathyScore' },
          avgHelpfulness: { $avg: '$helpfulnessScore' },
          avgSafety: { $avg: '$safetyScore' },
          avgClinical: { $avg: '$clinicalAlignment' },
          avgOverall: { $avg: '$overallScore' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (!stats.length) {
      return { avgEmpathy: 0, avgSafety: 0, avgOverall: 0 };
    }

    const s = stats[0];
    return {
      avgEmpathy: Number(s.avgEmpathy.toFixed(3)),
      avgHelpfulness: Number(s.avgHelpfulness.toFixed(3)),
      avgSafety: Number(s.avgSafety.toFixed(3)),
      avgClinical: Number(s.avgClinical.toFixed(3)),
      avgOverall: Number(s.avgOverall.toFixed(3)),
    };
  }

  private async getFeedbackMetrics(start: Date, end: Date): Promise<any> {
    const stats = await UserFeedback.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          helpful: { $sum: { $cond: [{ $eq: ['$rating', 'helpful'] }, 1, 0] } },
          feelBetter: { $sum: { $cond: [{ $eq: ['$emotionChange', 'feel_better'] }, 1, 0] } },
          same: { $sum: { $cond: [{ $eq: ['$emotionChange', 'same'] }, 1, 0] } },
        },
      },
    ]);

    if (!stats.length) {
      return { helpfulRate: 0, positiveOutcomeRate: 0 };
    }

    const s = stats[0];
    return {
      helpfulRate: Number((s.helpful / s.total).toFixed(3)),
      positiveOutcomeRate: Number(((s.feelBetter + s.same) / s.total).toFixed(3)),
    };
  }

  private async getCrisisMetrics(start: Date, end: Date): Promise<any> {
    const alerts = await CriticalAlert.find({
      timestamp: { $gte: start, $lte: end },
    }).lean();

    const resolved = alerts.filter(a => a.status === 'resolved');
    const totalEscalations = await InteractionEvent.countDocuments({
      timestamp: { $gte: start, $lte: end },
      escalationTriggered: true,
    });

    return {
      totalAlerts: alerts.length,
      resolvedAlerts: resolved.length,
      helpSeekingRate: alerts.length > 0 ? Number((resolved.length / alerts.length).toFixed(3)) : 0,
      detectionAccuracy: 0.85, // placeholder — needs HITL feedback to calculate
    };
  }

  private async getExpertMetrics(start: Date, end: Date): Promise<any> {
    const reviews = await ExpertReview.find({
      timestamp: { $gte: start, $lte: end },
    }).lean();

    const alerts = await CriticalAlert.find({
      timestamp: { $gte: start, $lte: end },
      status: { $in: ['intervened', 'resolved'] },
    }).lean();

    return {
      totalInterventions: alerts.length,
      successRate: alerts.length > 0
        ? Number((alerts.filter(a => a.status === 'resolved').length / alerts.length).toFixed(3))
        : 0,
      avgResponseTime: alerts.length > 0
        ? Math.round(
            alerts.reduce((sum: number, a: any) => {
              if (a.acknowledgedAt && a.timestamp) {
                return sum + (new Date(a.acknowledgedAt).getTime() - new Date(a.timestamp).getTime()) / 1000;
              }
              return sum;
            }, 0) / alerts.length
          )
        : 0,
      totalReviews: reviews.length,
    };
  }

  /**
   * Psychological Safety Index (composite score 0-100)
   * Weighted formula based on multiple signals
   */
  private calculatePSI(
    positiveOutcome: number,
    safetyScore: number,
    escalationRate: number,
    helpfulRate: number
  ): number {
    const psi =
      positiveOutcome * 30 +
      safetyScore * 30 +
      (1 - Math.min(escalationRate, 1)) * 20 +
      helpfulRate * 20;

    return Math.round(Math.min(100, Math.max(0, psi)));
  }
}

export const impactAnalyticsEngine = new ImpactAnalyticsEngine();
export default impactAnalyticsEngine;
