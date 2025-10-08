/**
 * CONVERSATION LEARNING SERVICE
 *
 * Chatbot tự học từ mọi cuộc hội thoại
 */

import ConversationLog, { IConversationLog } from '../models/ConversationLog';
import logger from '../utils/logger';

export interface ConversationInput {
  userId: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  aiConfidence?: number;
  responseTime?: number;
  context?: any;
}

export interface LearningInsights {
  totalConversations: number;
  helpfulRate: number;
  avgRating: number;
  avgResponseTime: number;
  topIntents: Array<{ intent: string; count: number }>;
  improvementAreas: string[];
}

export class ConversationLearningService {
  /**
   * LOG mọi conversation tự động
   */
  async logConversation(input: ConversationInput): Promise<IConversationLog> {
    try {
      const log = await ConversationLog.create({
        conversationId: `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: input.userId,
        sessionId: input.sessionId,
        timestamp: new Date(),
        userMessage: input.userMessage,
        aiResponse: input.aiResponse,
        aiConfidence: input.aiConfidence || 0.8,
        responseTime: input.responseTime || 0,
        conversationContext: input.context,
        needsReview: false,
        approvedForTraining: false,
        language: 'vi',
        platform: 'web',
      });

      logger.info(`📝 Conversation logged: ${log.conversationId}`);

      // Auto-analyze quality (async)
      this.analyzeResponseQuality(log).catch(err => logger.error('Error analyzing quality:', err));

      return log;
    } catch (error: any) {
      logger.error('Error logging conversation:', error);
      throw error;
    }
  }

  /**
   * TỰ ĐỘNG phân tích chất lượng response
   */
  private async analyzeResponseQuality(log: IConversationLog): Promise<void> {
    // Simple heuristics (có thể nâng cấp với AI)
    const responseLength = log.aiResponse.length;
    const hasEmpathy = /xin lỗi|hiểu|cảm thông|đồng cảm/i.test(log.aiResponse);
    const hasAction = /hãy|nên|có thể|thử/i.test(log.aiResponse);

    const quality = {
      relevance: responseLength > 50 ? 0.8 : 0.5,
      clarity: responseLength < 500 ? 0.9 : 0.7,
      empathy: hasEmpathy ? 0.9 : 0.6,
      accuracy: log.aiConfidence || 0.8,
    };

    log.responseQuality = quality;

    // Auto-approve high quality responses
    const avgQuality =
      (quality.relevance + quality.clarity + quality.empathy + quality.accuracy) / 4;
    if (avgQuality >= 0.8) {
      log.approvedForTraining = true;
    } else if (avgQuality < 0.6) {
      log.needsReview = true;
    }

    await log.save();

    logger.info(`✨ Quality analyzed: ${log.conversationId} (${(avgQuality * 100).toFixed(0)}%)`);
  }

  /**
   * USER FEEDBACK - Chatbot học từ thumbs up/down
   */
  async recordFeedback(
    conversationId: string,
    wasHelpful: boolean,
    rating?: number,
    feedback?: string
  ): Promise<void> {
    const log = await ConversationLog.findOne({ conversationId });

    if (!log) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (wasHelpful) {
      await log.markAsHelpful(rating, feedback);
      logger.info(`👍 Helpful feedback: ${conversationId} (${rating}/5)`);
    } else {
      await log.markAsUnhelpful(feedback);
      logger.info(`👎 Unhelpful feedback: ${conversationId}`);
    }
  }

  /**
   * LẤY training data để fine-tune chatbot
   */
  async getTrainingData(limit: number = 1000): Promise<
    Array<{
      input: string;
      output: string;
      quality: number;
    }>
  > {
    const logs = await ConversationLog.getTrainingData(limit);

    return logs.map((log: any) => ({
      input: log.userMessage,
      output: log.aiResponse,
      quality: log.userRating || 4,
    }));
  }

  /**
   * EXPORT training data for fine-tuning
   */
  async exportForFineTuning(format: 'jsonl' | 'csv' = 'jsonl'): Promise<string> {
    const logs = await ConversationLog.find({
      approvedForTraining: true,
      wasHelpful: true,
    })
      .sort({ timestamp: -1 })
      .limit(10000);

    if (format === 'jsonl') {
      return logs
        .map(log =>
          JSON.stringify({
            messages: [
              { role: 'user', content: log.userMessage },
              { role: 'assistant', content: log.aiResponse },
            ],
          })
        )
        .join('\n');
    } else {
      // CSV format
      const headers = 'user_message,ai_response,rating,was_helpful\n';
      const rows = logs
        .map(log =>
          [
            `"${log.userMessage.replace(/"/g, '""')}"`,
            `"${log.aiResponse.replace(/"/g, '""')}"`,
            log.userRating || 0,
            log.wasHelpful ? 'true' : 'false',
          ].join(',')
        )
        .join('\n');

      return headers + rows;
    }
  }

  /**
   * PHÂN TÍCH insights để cải thiện chatbot
   */
  async getLearningInsights(periodDays: number = 30): Promise<LearningInsights> {
    const qualityMetrics = await ConversationLog.getQualityMetrics(periodDays);
    const metrics = qualityMetrics[0] || {};

    // Find conversations needing review
    const needsReview = await ConversationLog.countDocuments({
      needsReview: true,
      reviewedAt: { $exists: false },
    });

    // Common intents (mock - would use NLP)
    const topIntents = [
      { intent: 'greeting', count: 150 },
      { intent: 'mental_health_question', count: 120 },
      { intent: 'test_request', count: 80 },
    ];

    // Improvement areas
    const improvementAreas: string[] = [];
    if (metrics.helpful / metrics.total < 0.7) {
      improvementAreas.push('Improve response relevance');
    }
    if (metrics.avgRating < 4) {
      improvementAreas.push('Enhance response quality');
    }
    if (needsReview > 10) {
      improvementAreas.push(`Review ${needsReview} flagged conversations`);
    }

    return {
      totalConversations: metrics.total || 0,
      helpfulRate: metrics.total > 0 ? metrics.helpful / metrics.total : 0,
      avgRating: metrics.avgRating || 0,
      avgResponseTime: metrics.avgResponseTime || 0,
      topIntents,
      improvementAreas,
    };
  }

  /**
   * TÌM patterns từ conversations
   */
  async findCommonQuestions(limit: number = 20): Promise<
    Array<{
      question: string;
      count: number;
      avgRating: number;
    }>
  > {
    return ConversationLog.aggregate([
      {
        $match: {
          wasHelpful: true,
        },
      },
      {
        $group: {
          _id: { $toLower: '$userMessage' },
          count: { $sum: 1 },
          avgRating: { $avg: '$userRating' },
        },
      },
      {
        $match: {
          count: { $gte: 2 },
        },
      },
      {
        $project: {
          question: '$_id',
          count: 1,
          avgRating: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ]);
  }

  /**
   * GET conversations cần review
   */
  async getConversationsNeedingReview(limit: number = 50): Promise<IConversationLog[]> {
    return ConversationLog.find({
      needsReview: true,
      reviewedAt: { $exists: false },
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

export const conversationLearningService = new ConversationLearningService();
