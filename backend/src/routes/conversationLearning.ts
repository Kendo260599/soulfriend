/**
 * CONVERSATION LEARNING API ROUTES
 */

import { Router } from 'express';
import { conversationLearningService } from '../services/conversationLearningService';
import ConversationLog from '../models/ConversationLog';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticateExpert } from './expertAuth';

const router = Router();

// All conversation learning routes require expert authentication
router.use(authenticateExpert);

/**
 * POST /api/conversation-learning/feedback
 * User feedback (thumbs up/down)
 */
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    try {
      const { conversationId, wasHelpful, rating, feedback } = req.body;

      await conversationLearningService.recordFeedback(
        conversationId,
        wasHelpful,
        rating,
        feedback
      );

      res.json({
        success: true,
        message: 'Feedback recorded. Chatbot sẽ học từ phản hồi này!',
      });
    } catch (error: any) {
      logger.error('Error recording feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback',
      });
    }
  })
);

/**
 * GET /api/conversation-learning/insights
 * Learning insights và metrics
 */
router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    try {
      const periodDays = parseInt(req.query.days as string) || 30;

      const insights = await conversationLearningService.getLearningInsights(periodDays);

      res.json({
        success: true,
        insights,
        message: `Analyzed ${insights.totalConversations} conversations from last ${periodDays} days`,
      });
    } catch (error: any) {
      logger.error('Error getting insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get insights',
      });
    }
  })
);

/**
 * GET /api/conversation-learning/training-data
 * Export training data
 */
router.get(
  '/training-data',
  asyncHandler(async (req, res) => {
    try {
      const format = (req.query.format as 'jsonl' | 'csv') || 'jsonl';
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : undefined;

      if (format === 'jsonl' || format === 'csv') {
        const data = await conversationLearningService.exportForFineTuning(format);

        res.setHeader('Content-Type', format === 'jsonl' ? 'application/jsonl' : 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="chatbot-training-${Date.now()}.${format}"`
        );
        res.send(data);
      } else {
        const data = await conversationLearningService.getTrainingData(limit);

        res.json({
          success: true,
          count: data.length,
          data,
        });
      }
    } catch (error: any) {
      logger.error('Error exporting training data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export training data',
      });
    }
  })
);

/**
 * GET /api/conversation-learning/common-questions
 * Tìm câu hỏi phổ biến
 */
router.get(
  '/common-questions',
  asyncHandler(async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const questions = await conversationLearningService.findCommonQuestions(limit);

      res.json({
        success: true,
        count: questions.length,
        questions,
      });
    } catch (error: any) {
      logger.error('Error finding common questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find common questions',
      });
    }
  })
);

/**
 * GET /api/conversation-learning/needs-review
 * Conversations cần review
 */
router.get(
  '/needs-review',
  asyncHandler(async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const conversations = await conversationLearningService.getConversationsNeedingReview(limit);

      res.json({
        success: true,
        count: conversations.length,
        conversations,
      });
    } catch (error: any) {
      logger.error('Error getting conversations for review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversations for review',
      });
    }
  })
);

/**
 * POST /api/conversation-learning/approve/:conversationId
 * Expert approves conversation for training data
 */
router.post(
  '/approve/:conversationId',
  asyncHandler(async (req, res) => {
    try {
      const { conversationId } = req.params;
      const reviewedBy = (req as any).expert?.email || 'unknown';

      const doc = await ConversationLog.findOne({ conversationId });
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      doc.approvedForTraining = true;
      doc.needsReview = false;
      doc.reviewedBy = reviewedBy;
      doc.reviewedAt = new Date();
      await doc.save();

      logger.info('Conversation approved for training', { conversationId, reviewedBy });

      res.json({
        success: true,
        message: `Conversation ${conversationId} đã được duyệt cho training.`,
        conversationId,
      });
    } catch (error: any) {
      logger.error('Error approving conversation:', error);
      res.status(500).json({ success: false, error: 'Failed to approve conversation' });
    }
  })
);

/**
 * POST /api/conversation-learning/reject/:conversationId
 * Expert rejects conversation (not suitable for training)
 */
router.post(
  '/reject/:conversationId',
  asyncHandler(async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { reason } = req.body;
      const reviewedBy = (req as any).expert?.email || 'unknown';

      const doc = await ConversationLog.findOne({ conversationId });
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }

      doc.approvedForTraining = false;
      doc.needsReview = false;
      doc.reviewedBy = reviewedBy;
      doc.reviewedAt = new Date();
      if (reason) {
        doc.userFeedback = `[REJECTED] ${reason}`;
      }
      await doc.save();

      logger.info('Conversation rejected for training', { conversationId, reviewedBy, reason });

      res.json({
        success: true,
        message: `Conversation ${conversationId} đã bị từ chối.`,
        conversationId,
      });
    } catch (error: any) {
      logger.error('Error rejecting conversation:', error);
      res.status(500).json({ success: false, error: 'Failed to reject conversation' });
    }
  })
);

export default router;
