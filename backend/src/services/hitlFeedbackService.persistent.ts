/**
 * HITL FEEDBACK SERVICE - PERSISTENT VERSION WITH MONGODB
 *
 * Version sử dụng MongoDB để lưu trữ dữ liệu lâu dài
 * Thay thế cho version in-memory
 */

import logger from '../utils/logger';
import { CriticalAlert } from './criticalInterventionService';
import HITLFeedback, { IHITLFeedback } from '../models/HITLFeedback';
import TrainingDataPoint, { ITrainingDataPoint } from '../models/TrainingDataPoint';

// =============================================================================
// TYPES (same as before)
// =============================================================================

export interface HITLFeedbackInput {
  wasActualCrisis: boolean;
  crisisConfidenceScore: number;
  actualRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  actualRiskType?: string;
  clinicalNotes: string;
  missedIndicators?: string[];
  falseIndicators?: string[];
  suggestedKeywords?: string[];
  unnecessaryKeywords?: string[];
  responseTimeSeconds: number;
  interventionSuccess: boolean;
  userOutcome: 'safe' | 'hospitalized' | 'referred' | 'deceased' | 'unknown';
  reviewedBy: string;
  reviewedAt?: Date;
}

export interface ModelPerformanceMetrics {
  totalAlerts: number;
  totalReviewed: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgResponseTimeSeconds: number;
  medianResponseTimeSeconds: number;
  interventionSuccessRate: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface KeywordAnalysis {
  keyword: string;
  timesDetected: number;
  timesConfirmed: number;
  timesFalsePositive: number;
  accuracy: number;
  falsePositiveRate: number;
  recommendation: 'keep' | 'adjust_weight' | 'remove' | 'add_context_check';
  suggestedWeight?: number;
}

export interface ModelImprovementSuggestions {
  timestamp: Date;
  basedOnAlerts: number;
  keywordsToAdd: string[];
  keywordsToRemove: string[];
  keywordsToAdjust: {
    keyword: string;
    currentWeight: number;
    suggestedWeight: number;
    reason: string;
  }[];
  contextualRules: {
    description: string;
    condition: string;
    action: string;
    expectedImpact: string;
  }[];
  thresholdAdjustments: {
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    reason: string;
  }[];
  expectedImprovements: {
    accuracyIncrease: string;
    falsePositiveReduction: string;
    falseNegativeReduction: string;
  };
}

// =============================================================================
// HITL FEEDBACK SERVICE (PERSISTENT)
// =============================================================================

export class HITLFeedbackServicePersistent {
  constructor() {
    logger.info('🔄 HITLFeedbackService (Persistent/MongoDB) initialized');
  }

  /**
   * STEP 1: Thu thập feedback và lưu vào MongoDB
   */
  async collectFeedback(alert: CriticalAlert, feedback: HITLFeedbackInput): Promise<IHITLFeedback> {
    try {
      // Create feedback document
      const feedbackDoc = await HITLFeedback.create({
        alertId: alert.id,
        userId: alert.userId,
        sessionId: alert.sessionId,
        timestamp: new Date(),

        // Ground truth
        wasActualCrisis: feedback.wasActualCrisis,
        crisisConfidenceScore: feedback.crisisConfidenceScore,
        actualRiskLevel: feedback.actualRiskLevel,
        actualRiskType: feedback.actualRiskType,

        // AI prediction
        aiPrediction: {
          riskLevel: alert.riskLevel,
          riskType: alert.riskType,
          detectedKeywords: alert.detectedKeywords,
          confidence: 0.96,
        },

        // User message
        userMessage: alert.userMessage,

        // Expert feedback
        clinicalNotes: feedback.clinicalNotes,
        missedIndicators: feedback.missedIndicators,
        falseIndicators: feedback.falseIndicators,
        suggestedKeywords: feedback.suggestedKeywords,
        unnecessaryKeywords: feedback.unnecessaryKeywords,

        // Intervention results
        responseTimeSeconds: feedback.responseTimeSeconds,
        interventionSuccess: feedback.interventionSuccess,
        userOutcome: feedback.userOutcome,

        // Reviewer
        reviewedBy: feedback.reviewedBy,
        reviewedAt: feedback.reviewedAt || new Date(),
      });

      logger.info(`📊 Feedback saved to MongoDB: ${alert.id}`, {
        wasActualCrisis: feedback.wasActualCrisis,
        actualRiskLevel: feedback.actualRiskLevel,
      });

      // Create training data point
      await this.createTrainingDataPoint(alert, feedbackDoc);

      return feedbackDoc;
    } catch (error: any) {
      logger.error('Error collecting feedback:', error);
      throw error;
    }
  }

  /**
   * STEP 2: Tạo training data point
   */
  private async createTrainingDataPoint(
    alert: CriticalAlert,
    feedback: IHITLFeedback
  ): Promise<ITrainingDataPoint> {
    const trainingPoint = await TrainingDataPoint.create({
      trainingId: `TRAINING_${alert.id}`,
      alertId: alert.id,
      timestamp: new Date(),

      // Input
      userMessage: alert.userMessage,
      userProfile: alert.userProfile,
      testResults: alert.testResults,
      context: {
        sessionId: alert.sessionId,
        userId: alert.userId,
      },

      // Ground truth
      label: feedback.wasActualCrisis ? 'crisis' : 'no_crisis',
      riskLevel: feedback.actualRiskLevel,
      riskType: feedback.actualRiskType,

      // AI prediction
      aiPrediction: {
        label: 'crisis',
        riskLevel: alert.riskLevel,
        confidence: 0.96,
        detectedKeywords: alert.detectedKeywords,
      },

      // Expert annotations
      expertAnnotations: {
        correctKeywords: feedback.wasActualCrisis
          ? alert.detectedKeywords.filter(kw => !feedback.falseIndicators?.includes(kw))
          : [],
        incorrectKeywords: feedback.falseIndicators || [],
        missingKeywords: feedback.suggestedKeywords || [],
        contextualFactors: [],
      },

      // Quality
      wasCorrectPrediction: feedback.wasActualCrisis,
      predictionError: feedback.wasActualCrisis ? undefined : 'false_positive',

      // Metadata
      createdFrom: 'hitl_feedback',
      reviewedBy: feedback.reviewedBy,
    });

    logger.info(`🎯 Training data point saved: ${trainingPoint.trainingId}`);

    return trainingPoint;
  }

  /**
   * Calculate performance metrics từ MongoDB
   */
  async calculatePerformanceMetrics(periodDays: number = 30): Promise<ModelPerformanceMetrics> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date();

    const feedbacks = await HITLFeedback.find({
      timestamp: { $gte: periodStart, $lte: periodEnd },
    });

    const totalReviewed = feedbacks.length;
    const truePositives = feedbacks.filter(f => f.wasActualCrisis).length;
    const falsePositives = feedbacks.filter(f => !f.wasActualCrisis).length;
    const trueNegatives = 0;
    const falseNegatives = 0;

    const accuracy = totalReviewed > 0 ? truePositives / totalReviewed : 0;
    const precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;
    const falsePositiveRate =
      falsePositives + trueNegatives > 0 ? falsePositives / (falsePositives + trueNegatives) : 0;
    const falseNegativeRate =
      falseNegatives + truePositives > 0 ? falseNegatives / (falseNegatives + truePositives) : 0;

    // Response time metrics
    const responseTimes = feedbacks.map(f => f.responseTimeSeconds);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const medianResponseTime =
      sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;

    // Intervention success
    const interventionSuccess = feedbacks.filter(f => f.interventionSuccess).length;
    const interventionSuccessRate = totalReviewed > 0 ? interventionSuccess / totalReviewed : 0;

    return {
      totalAlerts: totalReviewed,
      totalReviewed,
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
      accuracy,
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      falseNegativeRate,
      avgResponseTimeSeconds: avgResponseTime,
      medianResponseTimeSeconds: medianResponseTime,
      interventionSuccessRate,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Get keyword statistics từ MongoDB
   */
  async getKeywordStatistics(): Promise<KeywordAnalysis[]> {
    const keywordStats = await HITLFeedback.getKeywordStatistics();

    return keywordStats.map((stats: any) => ({
      ...stats,
      recommendation: this.generateKeywordRecommendation(stats),
    }));
  }

  /**
   * Generate keyword recommendation
   */
  private generateKeywordRecommendation(
    stats: any
  ): 'keep' | 'adjust_weight' | 'remove' | 'add_context_check' {
    if (stats.falsePositiveRate > 0.7 && stats.timesDetected >= 5) {
      return 'remove';
    }
    if (stats.falsePositiveRate > 0.3 && stats.falsePositiveRate <= 0.7) {
      return 'adjust_weight';
    }
    if (stats.accuracy > 0.4 && stats.accuracy < 0.8 && stats.timesDetected >= 3) {
      return 'add_context_check';
    }
    return 'keep';
  }

  /**
   * Generate model improvements
   */
  async generateModelImprovements(): Promise<ModelImprovementSuggestions> {
    const keywordStats = await this.getKeywordStatistics();
    const feedbacks = await HITLFeedback.find({});

    const suggestions: ModelImprovementSuggestions = {
      timestamp: new Date(),
      basedOnAlerts: feedbacks.length,
      keywordsToAdd: [],
      keywordsToRemove: [],
      keywordsToAdjust: [],
      contextualRules: [],
      thresholdAdjustments: [],
      expectedImprovements: {
        accuracyIncrease: '',
        falsePositiveReduction: '',
        falseNegativeReduction: '',
      },
    };

    // Analyze keywords
    for (const stats of keywordStats) {
      if (stats.recommendation === 'remove') {
        suggestions.keywordsToRemove.push(stats.keyword);
      } else if (stats.recommendation === 'adjust_weight') {
        const suggestedWeight = Math.max(0.1, 1 - stats.falsePositiveRate);
        suggestions.keywordsToAdjust.push({
          keyword: stats.keyword,
          currentWeight: 1.0,
          suggestedWeight,
          reason: `High false positive rate: ${(stats.falsePositiveRate * 100).toFixed(1)}%`,
        });
      }
    }

    // Find suggested keywords
    const suggestedKeywordsCount = new Map<string, number>();
    for (const feedback of feedbacks) {
      for (const keyword of feedback.suggestedKeywords || []) {
        suggestedKeywordsCount.set(keyword, (suggestedKeywordsCount.get(keyword) || 0) + 1);
      }
    }

    for (const [keyword, count] of suggestedKeywordsCount) {
      if (count >= 2) {
        suggestions.keywordsToAdd.push(keyword);
      }
    }

    // Expected improvements
    const metrics = await this.calculatePerformanceMetrics();
    suggestions.expectedImprovements = {
      accuracyIncrease: this.estimateImpact(_suggestions, 'accuracy'),
      falsePositiveReduction: this.estimateImpact(_suggestions, 'fp'),
      falseNegativeReduction: this.estimateImpact(_suggestions, 'fn'),
    };

    return suggestions;
  }

  private estimateImpact(suggestions: any, type: string): string {
    if (type === 'accuracy') {
      const impact =
        suggestions.keywordsToAdd.length * 0.01 + suggestions.keywordsToRemove.length * 0.01;
      return `+${(impact * 100).toFixed(1)}-${((impact + 0.02) * 100).toFixed(1)}%`;
    } else if (type === 'fp') {
      const impact =
        (suggestions.keywordsToRemove.length + suggestions.keywordsToAdjust.length) * 0.05;
      return `-${(impact * 100).toFixed(0)}-${((impact + 0.1) * 100).toFixed(0)}%`;
    } else {
      const impact = suggestions.keywordsToAdd.length * 0.03;
      return `-${(impact * 100).toFixed(0)}-${((impact + 0.05) * 100).toFixed(0)}%`;
    }
  }

  /**
   * Get training data for export
   */
  async getTrainingData(limit?: number): Promise<any[]> {
    const query = TrainingDataPoint.find({}).sort({ timestamp: -1 });

    if (_limit) {
      query.limit(_limit);
    }

    const data = await query.exec();
    logger.info(`📦 Retrieved ${data.length} training data points from MongoDB`);
    return data;
  }

  /**
   * Export training data
   */
  async exportTrainingDataForFineTuning(format: 'jsonl' | 'csv' = 'jsonl'): Promise<string> {
    return TrainingDataPoint.exportForFineTuning(format);
  }

  /**
   * Get all feedback
   */
  async getAllFeedback(): Promise<IHITLFeedback[]> {
    return HITLFeedback.find({}).sort({ timestamp: -1 }).exec();
  }
}

// Export singleton
export const hitlFeedbackServicePersistent = new HITLFeedbackServicePersistent();
