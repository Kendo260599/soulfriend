/**
 * INTERACTION CAPTURE SERVICE
 * 
 * V5 Learning Pipeline — Module 1: Data Capture Loop
 * Thu thập mọi tương tác user-AI thành dữ liệu nghiên cứu
 * 
 * @module services/interactionCaptureService
 * @version 5.0.0
 */

import InteractionEvent, { IInteractionEvent } from '../models/InteractionEvent';
import { logger } from '../utils/logger';

class InteractionCaptureService {
  /**
   * Capture một interaction event
   */
  async capture(data: {
    sessionId: string;
    userId: string;
    userText: string;
    aiResponse: string;
    responseTimeMs: number;
    riskLevel?: string;
    sentiment?: string;
    sentimentScore?: number;
    conversationDepth?: number;
    conversationStage?: string;
    escalationTriggered?: boolean;
    escalationType?: string;
    aiModelUsed?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    topicCategory?: string;
  }): Promise<IInteractionEvent | null> {
    try {
      const event = new InteractionEvent({
        sessionId: data.sessionId,
        userId: data.userId,
        userText: data.userText,
        userTextLength: data.userText.length,
        aiResponse: data.aiResponse,
        aiResponseLength: data.aiResponse.length,
        responseTimeMs: data.responseTimeMs,
        riskLevel: data.riskLevel || 'NONE',
        sentiment: data.sentiment || 'neutral',
        sentimentScore: data.sentimentScore || 0,
        conversationDepth: data.conversationDepth || 0,
        conversationStage: data.conversationStage || 'opening',
        escalationTriggered: data.escalationTriggered || false,
        escalationType: data.escalationType || 'none',
        aiModelUsed: data.aiModelUsed || 'gpt-4o-mini',
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        topicCategory: data.topicCategory,
        platform: 'web',
        locale: 'vi',
      });

      const saved = await event.save();
      logger.info(`[InteractionCapture] Captured event ${saved._id} for session ${data.sessionId}`);
      return saved;
    } catch (error) {
      logger.error('[InteractionCapture] Failed to capture event:', error);
      return null;
    }
  }

  /**
   * Lấy interactions theo session
   */
  async getBySession(sessionId: string): Promise<any[]> {
    return InteractionEvent.find({ sessionId }).sort({ conversationDepth: 1 }).lean();
  }

  /**
   * Lấy interactions theo user
   */
  async getByUser(userId: string, limit = 100): Promise<any[]> {
    return InteractionEvent.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean();
  }

  /**
   * Tổng hợp thống kê theo khoảng thời gian
   */
  async getStats(startDate: Date, endDate: Date): Promise<any> {
    const stats = await InteractionEvent.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTimeMs' },
          avgSentimentScore: { $avg: '$sentimentScore' },
          avgConversationDepth: { $avg: '$conversationDepth' },
          escalationCount: { $sum: { $cond: ['$escalationTriggered', 1, 0] } },
          riskDistribution: {
            $push: '$riskLevel',
          },
          sentimentDistribution: {
            $push: '$sentiment',
          },
        },
      },
    ]);

    if (!stats.length) {
      return {
        totalInteractions: 0,
        avgResponseTime: 0,
        avgSentimentScore: 0,
        avgConversationDepth: 0,
        escalationRate: 0,
      };
    }

    const s = stats[0];
    return {
      totalInteractions: s.totalInteractions,
      avgResponseTime: Math.round(s.avgResponseTime),
      avgSentimentScore: Number(s.avgSentimentScore.toFixed(3)),
      avgConversationDepth: Number(s.avgConversationDepth.toFixed(1)),
      escalationRate: Number((s.escalationCount / s.totalInteractions).toFixed(4)),
      riskDistribution: this.countDistribution(s.riskDistribution),
      sentimentDistribution: this.countDistribution(s.sentimentDistribution),
    };
  }

  /**
   * Lấy interactions cần review (risk cao hoặc sentiment tiêu cực)
   */
  async getForReview(limit = 50): Promise<any[]> {
    return InteractionEvent.find({
      $or: [
        { riskLevel: { $in: ['HIGH', 'CRITICAL', 'EXTREME'] } },
        { sentiment: { $in: ['very_negative'] } },
        { escalationTriggered: true },
        { expertReviewRecommended: true },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Đếm phân bố
   */
  private countDistribution(arr: string[]): Record<string, number> {
    return arr.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

export const interactionCaptureService = new InteractionCaptureService();
export default interactionCaptureService;
