/**
 * USER FEEDBACK SERVICE
 * 
 * V5 Learning Pipeline — Module 3: User Feedback Loop
 * Thu thập đánh giá từ người dùng về phản hồi AI
 * 
 * @module services/userFeedbackService
 * @version 5.0.0
 */

import UserFeedback, { IUserFeedback } from '../models/UserFeedback';
import { logger } from '../utils/logger';

class UserFeedbackService {
  /**
   * Submit feedback từ user
   */
  async submitFeedback(data: {
    interactionEventId: string;
    sessionId: string;
    userId: string;
    rating: 'helpful' | 'not_helpful';
    emotionChange: 'feel_better' | 'same' | 'still_confused' | 'feel_worse';
    freeTextFeedback?: string;
    aiResponseSnippet: string;
    conversationDepth?: number;
  }): Promise<IUserFeedback | null> {
    try {
      const feedback = new UserFeedback({
        interactionEventId: data.interactionEventId,
        sessionId: data.sessionId,
        userId: data.userId,
        rating: data.rating,
        emotionChange: data.emotionChange,
        freeTextFeedback: data.freeTextFeedback,
        aiResponseSnippet: data.aiResponseSnippet.substring(0, 200),
        conversationDepth: data.conversationDepth || 0,
      });

      const saved = await feedback.save();
      logger.info(
        `[UserFeedback] Saved feedback ${saved._id}: rating=${data.rating}, emotion=${data.emotionChange}`
      );
      return saved;
    } catch (error) {
      logger.error('[UserFeedback] Failed to save feedback:', error);
      return null;
    }
  }

  /**
   * Thống kê feedback
   */
  async getStats(startDate: Date, endDate: Date): Promise<any> {
    const stats = await UserFeedback.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          helpfulCount: { $sum: { $cond: [{ $eq: ['$rating', 'helpful'] }, 1, 0] } },
          notHelpfulCount: { $sum: { $cond: [{ $eq: ['$rating', 'not_helpful'] }, 1, 0] } },
          feelBetterCount: { $sum: { $cond: [{ $eq: ['$emotionChange', 'feel_better'] }, 1, 0] } },
          sameCount: { $sum: { $cond: [{ $eq: ['$emotionChange', 'same'] }, 1, 0] } },
          stillConfusedCount: { $sum: { $cond: [{ $eq: ['$emotionChange', 'still_confused'] }, 1, 0] } },
          feelWorseCount: { $sum: { $cond: [{ $eq: ['$emotionChange', 'feel_worse'] }, 1, 0] } },
        },
      },
    ]);

    if (!stats.length) return { totalFeedbacks: 0 };

    const s = stats[0];
    return {
      totalFeedbacks: s.totalFeedbacks,
      helpfulRate: Number((s.helpfulCount / s.totalFeedbacks).toFixed(3)),
      emotionDistribution: {
        feel_better: s.feelBetterCount,
        same: s.sameCount,
        still_confused: s.stillConfusedCount,
        feel_worse: s.feelWorseCount,
      },
      positiveOutcomeRate: Number(
        ((s.feelBetterCount + s.sameCount) / s.totalFeedbacks).toFixed(3)
      ),
    };
  }

  /**
   * Lấy negative feedbacks (để ưu tiên cải tiến)
   */
  async getNegativeFeedbacks(limit = 50): Promise<any[]> {
    return UserFeedback.find({
      $or: [
        { rating: 'not_helpful' },
        { emotionChange: { $in: ['still_confused', 'feel_worse'] } },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('interactionEventId')
      .lean();
  }

  /**
   * Lấy feedback theo session
   */
  async getBySession(sessionId: string): Promise<any[]> {
    return UserFeedback.find({ sessionId }).sort({ timestamp: -1 }).lean();
  }
}

export const userFeedbackService = new UserFeedbackService();
export default userFeedbackService;
