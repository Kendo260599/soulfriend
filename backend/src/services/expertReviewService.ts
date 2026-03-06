/**
 * EXPERT REVIEW SERVICE
 * 
 * V5 Learning Pipeline — Module 4: Human-in-the-Loop Learning
 * Expert đánh giá & chỉnh sửa phản hồi AI → AI học từ sửa đổi
 * 
 * @module services/expertReviewService
 * @version 5.0.0
 */

import ExpertReview, { IExpertReview } from '../models/ExpertReview';
import { logger } from '../utils/logger';

class ExpertReviewService {
  /**
   * Expert submit review cho một AI response
   */
  async submitReview(data: {
    interactionEventId: string;
    evaluationScoreId?: string;
    sessionId: string;
    expertId: string;
    expertName: string;
    originalResponse: string;
    correctedResponse: string;
    assessment: {
      empathyRating: number;
      safetyRating: number;
      clinicalAccuracy: number;
      culturalFit: number;
      overallRating: number;
    };
    issues?: Array<{
      type: string;
      description: string;
      severity: string;
    }>;
    shouldRetrain?: boolean;
    retrainPriority?: string;
    learningNotes?: string;
  }): Promise<IExpertReview | null> {
    try {
      const review = new ExpertReview({
        interactionEventId: data.interactionEventId,
        evaluationScoreId: data.evaluationScoreId,
        sessionId: data.sessionId,
        expertId: data.expertId,
        expertName: data.expertName,
        originalResponse: data.originalResponse,
        correctedResponse: data.correctedResponse,
        assessment: data.assessment,
        issues: data.issues || [],
        shouldRetrain: data.shouldRetrain || false,
        retrainPriority: data.retrainPriority || 'low',
        learningNotes: data.learningNotes || '',
        status: 'reviewed',
      });

      const saved = await review.save();
      logger.info(
        `[ExpertReview] Expert ${data.expertName} reviewed interaction ${data.interactionEventId}, retrain=${data.shouldRetrain}`
      );
      return saved;
    } catch (error) {
      logger.error('[ExpertReview] Failed to save review:', error);
      return null;
    }
  }

  /**
   * Lấy reviews chưa applied (cho training pipeline)
   */
  async getPendingForTraining(limit = 100): Promise<any[]> {
    return ExpertReview.find({
      status: 'reviewed',
      shouldRetrain: true,
    })
      .sort({ retrainPriority: -1, timestamp: -1 })
      .limit(limit)
      .populate('interactionEventId')
      .lean();
  }

  /**
   * Đánh dấu review đã applied vào training
   */
  async markAsApplied(reviewIds: string[]): Promise<number> {
    const result = await ExpertReview.updateMany(
      { _id: { $in: reviewIds } },
      { $set: { status: 'applied' } }
    );
    return result.modifiedCount;
  }

  /**
   * Thống kê expert reviews
   */
  async getStats(startDate: Date, endDate: Date): Promise<any> {
    const stats = await ExpertReview.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgEmpathy: { $avg: '$assessment.empathyRating' },
          avgSafety: { $avg: '$assessment.safetyRating' },
          avgClinical: { $avg: '$assessment.clinicalAccuracy' },
          avgCultural: { $avg: '$assessment.culturalFit' },
          avgOverall: { $avg: '$assessment.overallRating' },
          retrainCount: { $sum: { $cond: ['$shouldRetrain', 1, 0] } },
          appliedCount: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
        },
      },
    ]);

    if (!stats.length) return { totalReviews: 0 };

    const s = stats[0];
    return {
      totalReviews: s.totalReviews,
      avgAssessment: {
        empathy: Number(s.avgEmpathy.toFixed(1)),
        safety: Number(s.avgSafety.toFixed(1)),
        clinicalAccuracy: Number(s.avgClinical.toFixed(1)),
        culturalFit: Number(s.avgCultural.toFixed(1)),
        overall: Number(s.avgOverall.toFixed(1)),
      },
      retrainRate: Number((s.retrainCount / s.totalReviews).toFixed(3)),
      appliedRate: Number((s.appliedCount / s.totalReviews).toFixed(3)),
    };
  }

  /**
   * Lấy reviews theo expert
   */
  async getByExpert(expertId: string, limit = 50): Promise<any[]> {
    return ExpertReview.find({ expertId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Lấy tất cả reviews cần expert xem (từ evaluation engine)
   */
  async getInteractionsNeedingReview(limit = 30): Promise<any[]> {
    // Get evaluations marked for human review that haven't been reviewed yet
    const EvaluationScore = (await import('../models/EvaluationScore')).default;
    
    const pendingEvals = await EvaluationScore.find({ needsHumanReview: true })
      .sort({ overallScore: 1 }) // worst first
      .limit(limit)
      .populate('interactionEventId')
      .lean();

    // Filter out already reviewed ones
    const reviewedIds = await ExpertReview.distinct('interactionEventId');
    return pendingEvals.filter(
      (e: any) => !reviewedIds.some((rid: any) => rid.toString() === e.interactionEventId?._id?.toString())
    );
  }
}

export const expertReviewService = new ExpertReviewService();
export default expertReviewService;
