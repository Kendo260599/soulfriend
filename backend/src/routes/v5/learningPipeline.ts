/**
 * V5 LEARNING PIPELINE ROUTES
 * 
 * API endpoints cho hệ thống học tập liên tục V5
 * Bao gồm: Interaction Capture, Evaluation, Feedback, Expert Review,
 * Data Curation, Model Improvement, Safety Guardrails
 * 
 * @module routes/v5/learningPipeline
 * @version 5.0.0
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authenticateAdmin } from '../../middleware/auth';
import { authenticateExpert } from '../expertAuth';
import { interactionCaptureService } from '../../services/interactionCaptureService';
import InteractionEvent from '../../models/InteractionEvent';
import { responseEvaluationService } from '../../services/responseEvaluationService';
import { userFeedbackService } from '../../services/userFeedbackService';
import { expertReviewService } from '../../services/expertReviewService';
import { trainingDataCurationService } from '../../services/trainingDataCurationService';
import { modelImprovementService } from '../../services/modelImprovementService';
import { safetyGuardrailService } from '../../services/safetyGuardrailService';
import { eventQueueService } from '../../services/eventQueueService';
import { logger } from '../../utils/logger';

const router = Router();

// ================================
// MODULE 1: INTERACTION CAPTURE
// ================================

/**
 * GET /api/v5/learning/interactions/session/:sessionId
 * Lấy danh sách interactions theo session
 */
router.get(
  '/interactions/session/:sessionId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const interactions = await interactionCaptureService.getBySession(sessionId);
    res.json({ success: true, data: interactions, count: interactions.length });
  })
);

/**
 * GET /api/v5/learning/interactions/user/:userId
 * Lấy danh sách interactions theo user
 */
router.get(
  '/interactions/user/:userId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const interactions = await interactionCaptureService.getByUser(userId, limit);
    res.json({ success: true, data: interactions, count: interactions.length });
  })
);

/**
 * GET /api/v5/learning/interactions/stats
 * Thống kê interactions trong khoảng thời gian
 */
router.get(
  '/interactions/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const startDate = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.end ? new Date(req.query.end as string) : new Date();
    const stats = await interactionCaptureService.getStats(startDate, endDate);
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/v5/learning/interactions/review
 * Lấy interactions cần review (high risk / negative sentiment)
 */
router.get(
  '/interactions/review',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const interactions = await interactionCaptureService.getForReview(limit);
    res.json({ success: true, data: interactions, count: interactions.length });
  })
);

// ================================
// MODULE 2: RESPONSE EVALUATION
// ================================

/**
 * POST /api/v5/learning/evaluate/:interactionId
 * Đánh giá chất lượng response của AI
 */
router.post(
  '/evaluate/:interactionId',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionId } = req.params;
    const interaction = await InteractionEvent.findById(interactionId);
    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }
    const result = await responseEvaluationService.evaluate({
      interactionEventId: interactionId,
      sessionId: (interaction as any).sessionId,
      userId: (interaction as any).userId,
      userMessage: (interaction as any).userText,
      aiResponse: (interaction as any).aiResponse,
    });
    
    // Publish event
    await eventQueueService.publish('evaluation.completed', {
      interactionId,
      score: result?.overallScore,
      needsReview: result?.needsHumanReview,
    });
    
    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/v5/learning/evaluate/batch
 * Đánh giá hàng loạt interactions
 */
router.post(
  '/evaluate/batch',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionIds } = req.body;
    if (!Array.isArray(interactionIds) || interactionIds.length === 0) {
      return res.status(400).json({ success: false, error: 'interactionIds array is required' });
    }
    if (interactionIds.length > 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 interactions per batch' });
    }
    const interactions = await InteractionEvent.find({ _id: { $in: interactionIds } });
    const evaluationData = interactions.map((i: any) => ({
      interactionEventId: i._id.toString(),
      sessionId: i.sessionId,
      userId: i.userId,
      userMessage: i.userText,
      aiResponse: i.aiResponse,
    }));
    const successCount = await responseEvaluationService.batchEvaluate(evaluationData);
    res.json({ success: true, data: { evaluated: successCount, total: interactionIds.length }, count: successCount });
  })
);

/**
 * GET /api/v5/learning/evaluate/stats
 * Thống kê evaluation scores
 */
router.get(
  '/evaluate/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const stats = await responseEvaluationService.getStats(startDate, endDate);
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/v5/learning/evaluate/pending
 * Lấy danh sách evaluations cần human review
 */
router.get(
  '/evaluate/pending',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const reviews = await responseEvaluationService.getPendingReviews(limit);
    res.json({ success: true, data: reviews, count: reviews.length });
  })
);

// ================================
// MODULE 3: USER FEEDBACK
// ================================

/**
 * POST /api/v5/learning/feedback
 * Submit feedback từ user (không cần auth - user feedback)
 */
router.post(
  '/feedback',
  asyncHandler(async (req: Request, res: Response) => {
    const { interactionEventId, userId, sessionId, rating, emotionChange, freeTextFeedback, aiResponseSnippet } = req.body;

    if (!interactionEventId || !userId || !sessionId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'interactionEventId, userId, sessionId, và rating là bắt buộc',
      });
    }

    if (!['helpful', 'not_helpful'].includes(rating)) {
      return res.status(400).json({ success: false, error: 'rating phải là helpful hoặc not_helpful' });
    }

    const feedback = await userFeedbackService.submitFeedback({
      interactionEventId,
      userId,
      sessionId,
      rating,
      emotionChange,
      freeTextFeedback,
      aiResponseSnippet: aiResponseSnippet || '',
    });

    // Publish event
    if (feedback) {
      await eventQueueService.publish('feedback.received', {
        feedbackId: feedback._id,
        rating,
        emotionChange,
      });
    }

    res.json({ success: true, data: feedback, message: 'Cảm ơn bạn đã chia sẻ feedback!' });
  })
);

/**
 * GET /api/v5/learning/feedback/stats
 * Thống kê feedback
 */
router.get(
  '/feedback/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const stats = await userFeedbackService.getStats(startDate, endDate);
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/v5/learning/feedback/negative
 * Lấy feedbacks tiêu cực để cải thiện
 */
router.get(
  '/feedback/negative',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const feedbacks = await userFeedbackService.getNegativeFeedbacks(limit);
    res.json({ success: true, data: feedbacks, count: feedbacks.length });
  })
);

// ================================
// MODULE 4: EXPERT REVIEW
// ================================

/**
 * POST /api/v5/learning/expert-review
 * Expert submit review / correction cho AI response
 */
router.post(
  '/expert-review',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      interactionEventId, evaluationScoreId, expertId, expertName,
      sessionId, originalResponse, correctedResponse, assessment, issues, notes, learningNotes,
    } = req.body;

    if (!interactionEventId || !expertId || !originalResponse || !correctedResponse || !assessment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: interactionEventId, expertId, originalResponse, correctedResponse, assessment',
      });
    }

    const review = await expertReviewService.submitReview({
      interactionEventId,
      evaluationScoreId,
      sessionId: sessionId || '',
      expertId,
      expertName: expertName || '',
      originalResponse,
      correctedResponse,
      assessment,
      issues: issues || [],
      learningNotes: learningNotes || notes || '',
    });

    // Publish event
    if (review) {
      await eventQueueService.publish('expert_review.submitted', {
        reviewId: review._id,
        shouldRetrain: review.shouldRetrain,
        retrainPriority: review.retrainPriority,
      });
    }

    res.json({ success: true, data: review, message: 'Expert review submitted successfully' });
  })
);

/**
 * GET /api/v5/learning/expert-review/pending
 * Interactions cần expert review
 */
router.get(
  '/expert-review/pending',
  authenticateExpert,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const interactions = await expertReviewService.getInteractionsNeedingReview(limit);
    res.json({ success: true, data: interactions, count: interactions.length });
  })
);

/**
 * GET /api/v5/learning/expert-review/training-ready
 * Reviews sẵn sàng để training
 */
router.get(
  '/expert-review/training-ready',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const reviews = await expertReviewService.getPendingForTraining();
    res.json({ success: true, data: reviews, count: reviews.length });
  })
);

/**
 * GET /api/v5/learning/expert-review/stats
 * Thống kê expert review
 */
router.get(
  '/expert-review/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await expertReviewService.getStats(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    res.json({ success: true, data: stats });
  })
);

// ================================
// MODULE 5: DATA CURATION
// ================================

/**
 * POST /api/v5/learning/curate/expert-reviews
 * Curate training data từ expert reviews
 */
router.post(
  '/curate/expert-reviews',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const count = await trainingDataCurationService.curateFromExpertReviews();
    
    await eventQueueService.publish('training_data.curated', {
      source: 'expert_reviews',
      count,
    });
    
    res.json({ success: true, data: { created: count } });
  })
);

/**
 * POST /api/v5/learning/curate/high-quality
 * Curate training data từ high-quality interactions
 */
router.post(
  '/curate/high-quality',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const count = await trainingDataCurationService.curateFromHighQualityInteractions();
    
    await eventQueueService.publish('training_data.curated', {
      source: 'high_quality_interactions',
      count,
    });
    
    res.json({ success: true, data: { created: count } });
  })
);

/**
 * GET /api/v5/learning/curate/stats
 * Thống kê training dataset
 */
router.get(
  '/curate/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await trainingDataCurationService.getDatasetStats();
    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/v5/learning/curate/export
 * Export training data cho model improvement
 */
router.get(
  '/curate/export',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const trainingRunId = (req.query.runId as string) || ('run_' + Date.now());
    const data = await trainingDataCurationService.exportForTraining(trainingRunId);
    res.json({ success: true, data, count: data.length });
  })
);

// ================================
// MODULE 6: MODEL IMPROVEMENT
// ================================

/**
 * POST /api/v5/learning/improve/cycle
 * Chạy full improvement cycle (prompt → RAG → fine-tuning check)
 */
router.post(
  '/improve/cycle',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('[V5] Starting improvement cycle...');
    const result = await modelImprovementService.runImprovementCycle();
    
    await eventQueueService.publish('model.improved', {
      level1: result.level1_promptOptimization,
      level2: result.level2_ragImprovement,
      level3: result.level3_fineTuning,
    });
    
    res.json({ success: true, data: result, message: 'Improvement cycle completed' });
  })
);

/**
 * GET /api/v5/learning/improve/prompt-analysis
 * Phân tích prompt optimization
 */
router.get(
  '/improve/prompt-analysis',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const analysis = await modelImprovementService.analyzeForPromptOptimization();
    res.json({ success: true, data: analysis });
  })
);

/**
 * GET /api/v5/learning/improve/fine-tuning-readiness
 * Kiểm tra sẵn sàng fine-tuning
 */
router.get(
  '/improve/fine-tuning-readiness',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const readiness = await modelImprovementService.checkFineTuningReadiness();
    res.json({ success: true, data: readiness });
  })
);

// ================================
// MODULE 9: SAFETY GUARDRAILS
// ================================

/**
 * POST /api/v5/learning/safety/check-response
 * Kiểm tra response trước khi gửi cho user
 */
router.post(
  '/safety/check-response',
  asyncHandler(async (req: Request, res: Response) => {
    const { response, userMessage } = req.body;
    if (!response) {
      return res.status(400).json({ success: false, error: 'response text is required' });
    }
    const result = safetyGuardrailService.checkResponse(response, userMessage || '');
    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/v5/learning/safety/check-training-data
 * Kiểm tra training data trước khi sử dụng
 */
router.post(
  '/safety/check-training-data',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { input, output } = req.body;
    if (!input || !output) {
      return res.status(400).json({ success: false, error: 'input and output are required' });
    }
    const result = safetyGuardrailService.checkTrainingData(input, output);
    res.json({ success: true, data: result });
  })
);

// ================================
// EVENT QUEUE STATUS
// ================================

/**
 * GET /api/v5/learning/queue/stats
 * Thống kê event queue
 */
router.get(
  '/queue/stats',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = eventQueueService.getStats();
    res.json({ success: true, data: stats });
  })
);

export default router;
