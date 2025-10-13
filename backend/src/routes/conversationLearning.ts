/**
 * CONVERSATION LEARNING API ROUTES
 */

import { Router } from 'express';
import { conversationLearningService } from '../services/conversationLearningService';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * POST /api/conversation-learning/feedback
 * User feedback (thumbs up/down)
 */
router.post('/feedback', asyncHandler(async (req, res) => {
  try {
    const { conversationId, wasHelpful, rating, feedback } = req.body;

    await conversationLearningService.recordFeedback(conversationId, wasHelpful, rating, feedback);

    res.json({
      success: true,
      message: 'Feedback recorded. Chatbot sẽ học từ phản hồi này!',
    });
  } catch (error: any) {
    logger.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}));

/**
 * GET /api/conversation-learning/insights
 * Learning insights và metrics
 */
router.get('/insights', asyncHandler(async (req, res) => {
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
      error: error.message,
    });
  }
}));

/**
 * GET /api/conversation-learning/training-data
 * Export training data
 */
router.get('/training-data', asyncHandler(async (req, res) => {
  try {
    const format = (req.query.format as 'jsonl' | 'csv') || 'jsonl';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

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
      error: error.message,
    });
  }
}));

/**
 * GET /api/conversation-learning/common-questions
 * Tìm câu hỏi phổ biến
 */
router.get('/common-questions', asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

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
      error: error.message,
    });
  }
}));

/**
 * GET /api/conversation-learning/needs-review
 * Conversations cần review
 */
router.get('/needs-review', asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

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
      error: error.message,
    });
  }
}));

export default router;
