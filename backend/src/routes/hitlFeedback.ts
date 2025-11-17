/**
 * HITL FEEDBACK API ROUTES
 *
 * API endpoints để thu thập feedback và theo dõi cải tiến mô hình
 */

import { Router } from 'express';
import { hitlFeedbackService } from '../services/hitlFeedbackService';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * POST /api/hitl-feedback/:alertId
 * Submit feedback for a resolved alert
 */
router.post(
  '/:alertId',
  asyncHandler(async (req, res) => {
    try {
      const { alertId } = req.params;
      const feedbackData = req.body;

      // Validate required fields
      if (typeof feedbackData.wasActualCrisis !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: wasActualCrisis',
        });
      }

      // Mock alert data (in production, fetch from database)
      const alert = {
        id: alertId,
        timestamp: new Date(),
        userId: 'user_123',
        sessionId: 'session_456',
        riskLevel: 'CRITICAL' as const,
        riskType: 'suicidal' as const,
        userMessage: feedbackData.userMessage || 'Message content',
        detectedKeywords: feedbackData.detectedKeywords || [],
        status: 'resolved' as const,
      };

      const feedback = await hitlFeedbackService.collectFeedback(alert, feedbackData);

      res.json({
        success: true,
        message: 'Feedback collected successfully',
        feedback,
        trainingDataCreated: true,
      });
    } catch (error: any) {
      logger.error('Error collecting HITL feedback:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/hitl-feedback/metrics
 * Get model performance metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    try {
      const periodDays = parseInt(req.query.days as string) || 30;

      const metrics = await hitlFeedbackService.calculatePerformanceMetrics(periodDays);

      res.json({
        success: true,
        metrics,
        analysis: {
          summary: generateMetricsSummary(metrics),
          recommendations: generateRecommendations(metrics),
        },
      });
    } catch (error: any) {
      logger.error('Error calculating metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/hitl-feedback/improvements
 * Get model improvement suggestions
 */
router.get(
  '/improvements',
  asyncHandler(async (req, res) => {
    try {
      const suggestions = await hitlFeedbackService.generateModelImprovements();

      res.json({
        success: true,
        suggestions,
        readyToApply: true,
        impact: {
          description: 'Expected improvements based on HITL feedback analysis',
          ...suggestions.expectedImprovements,
        },
      });
    } catch (error: any) {
      logger.error('Error generating improvements:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/hitl-feedback/keywords
 * Get keyword statistics and analysis
 */
router.get(
  '/keywords',
  asyncHandler(async (req, res) => {
    try {
      const keywordStats = hitlFeedbackService.getKeywordStatistics();

      res.json({
        success: true,
        keywords: keywordStats,
        summary: {
          total: keywordStats.length,
          highAccuracy: keywordStats.filter(k => k.accuracy > 0.8).length,
          needsAdjustment: keywordStats.filter(k => k.recommendation === 'adjust_weight').length,
          shouldRemove: keywordStats.filter(k => k.recommendation === 'remove').length,
        },
      });
    } catch (error: any) {
      logger.error('Error getting keyword statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/hitl-feedback/training-data
 * Get training data for model fine-tuning
 */
router.get(
  '/training-data',
  asyncHandler(async (req, res) => {
    try {
      const format = (req.query.format as 'jsonl' | 'csv') || 'jsonl';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      if (format === 'jsonl' || format === 'csv') {
        const exportedData = await hitlFeedbackService.exportTrainingDataForFineTuning(format);

        res.setHeader('Content-Type', format === 'jsonl' ? 'application/jsonl' : 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="crisis-detection-training-${Date.now()}.${format}"`
        );
        res.send(exportedData);
      } else {
        // JSON format
        const trainingData = hitlFeedbackService.getTrainingData(limit);

        res.json({
          success: true,
          count: trainingData.length,
          data: trainingData,
          format: 'json',
        });
      }
    } catch (error: any) {
      logger.error('Error exporting training data:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * GET /api/hitl-feedback/all
 * Get all feedback entries with pagination
 */
router.get(
  '/all',
  asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const allFeedback = hitlFeedbackService.getAllFeedback();
      const total = allFeedback.length;
      const paginatedFeedback = allFeedback.slice(skip, skip + limit);

      res.json({
        success: true,
        count: paginatedFeedback.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        feedback: paginatedFeedback,
      });
    } catch (error: any) {
      logger.error('Error getting all feedback:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateMetricsSummary(metrics: any): string {
  const { accuracy, precision, recall, falsePositiveRate, falseNegativeRate } = metrics;

  let summary = 'Model Performance Summary:\n';
  summary += `- Accuracy: ${(accuracy * 100).toFixed(1)}% (${accuracy > 0.9 ? 'Excellent' : accuracy > 0.8 ? 'Good' : 'Needs Improvement'})\n`;
  summary += `- Precision: ${(precision * 100).toFixed(1)}% (${precision > 0.85 ? 'High confidence' : 'Moderate confidence'})\n`;
  summary += `- Recall: ${(recall * 100).toFixed(1)}% (${recall > 0.95 ? 'Excellent detection' : 'Could miss some cases'})\n`;
  summary += `- False Positive Rate: ${(falsePositiveRate * 100).toFixed(1)}% (${falsePositiveRate < 0.1 ? 'Low' : 'Needs reduction'})\n`;
  summary += `- False Negative Rate: ${(falseNegativeRate * 100).toFixed(1)}% (${falseNegativeRate < 0.05 ? 'Excellent' : 'Critical - needs improvement'})`;

  return summary;
}

function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.falsePositiveRate > 0.15) {
    recommendations.push('⚠️ High false positive rate - Review and adjust keyword weights');
  }

  if (metrics.falseNegativeRate > 0.05) {
    recommendations.push('🚨 CRITICAL: False negative rate too high - Add more detection keywords');
  }

  if (metrics.precision < 0.8) {
    recommendations.push('💡 Low precision - Consider adding contextual checks');
  }

  if (metrics.recall < 0.9) {
    recommendations.push('🔍 Detection coverage could be improved - Add more crisis indicators');
  }

  if (metrics.avgResponseTimeSeconds > 180) {
    recommendations.push('⏱️ Response time high - Consider staffing adjustments');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Model performing well - Continue monitoring');
  }

  return recommendations;
}

export default router;
