/**
 * HITL FEEDBACK SERVICE - AI MODEL IMPROVEMENT LOOP
 * 
 * Hệ thống thu thập dữ liệu từ các sự kiện HITL đã giải quyết
 * và đưa vào vòng lặp huấn luyện để cải thiện mô hình Crisis Detection
 * 
 * @module HITLFeedbackService
 * @version 1.0.0
 */

import logger from '../utils/logger';
import { CriticalAlert } from './criticalInterventionService';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Phản hồi từ chuyên gia lâm sàng về chất lượng phát hiện
 */
export interface HITLFeedback {
  alertId: string;
  timestamp: Date;
  
  // Đánh giá độ chính xác của AI
  wasActualCrisis: boolean;           // True Positive hay False Positive
  crisisConfidenceScore: number;       // 0-100: Độ nghiêm trọng thực tế
  
  // Chi tiết về sự việc
  actualRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  actualRiskType?: 'suicidal' | 'psychosis' | 'self_harm' | 'violence' | 'none';
  
  // Phản hồi từ chuyên gia
  clinicalNotes: string;
  missedIndicators?: string[];         // Các dấu hiệu AI bỏ sót
  falseIndicators?: string[];          // Các dấu hiệu AI phát hiện sai
  suggestedKeywords?: string[];        // Keywords nên thêm
  unnecessaryKeywords?: string[];      // Keywords nên bỏ
  
  // Kết quả can thiệp
  responseTimeSeconds: number;         // Thời gian phản hồi thực tế
  interventionSuccess: boolean;        // Can thiệp có thành công không
  userOutcome: 'safe' | 'hospitalized' | 'referred' | 'deceased' | 'unknown';
  
  // Metadata
  reviewedBy: string;                  // ID của chuyên gia đánh giá
  reviewedAt: Date;
}

/**
 * Dữ liệu huấn luyện được tạo từ HITL feedback
 */
export interface TrainingDataPoint {
  id: string;
  timestamp: Date;
  
  // Input data
  userMessage: string;
  userProfile?: any;
  testResults?: any[];
  context?: any;
  
  // Ground truth labels (từ human expert)
  label: 'crisis' | 'no_crisis';
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  riskType?: string;
  
  // AI prediction (để so sánh)
  aiPrediction: {
    label: 'crisis' | 'no_crisis';
    riskLevel: string;
    confidence: number;
    detectedKeywords: string[];
  };
  
  // Expert annotations
  expertAnnotations: {
    correctKeywords: string[];          // Keywords chính xác
    incorrectKeywords: string[];        // Keywords sai
    missingKeywords: string[];          // Keywords thiếu
    contextualFactors: string[];        // Yếu tố ngữ cảnh quan trọng
  };
  
  // Quality metrics
  wasCorrectPrediction: boolean;
  predictionError?: string;             // 'false_positive' | 'false_negative'
}

/**
 * Thống kê hiệu suất mô hình
 */
export interface ModelPerformanceMetrics {
  // Basic metrics
  totalAlerts: number;
  totalReviewed: number;
  
  // Accuracy metrics
  truePositives: number;                // Phát hiện đúng khủng hoảng
  trueNegatives: number;                // Không báo động sai
  falsePositives: number;               // Báo động nhầm (quan trọng!)
  falseNegatives: number;               // Bỏ sót khủng hoảng (rất nghiêm trọng!)
  
  // Calculated metrics
  accuracy: number;                     // (TP + TN) / Total
  precision: number;                    // TP / (TP + FP) - Độ chính xác khi báo động
  recall: number;                       // TP / (TP + FN) - Tỷ lệ phát hiện được
  f1Score: number;                      // Harmonic mean of precision & recall
  falsePositiveRate: number;            // FP / (FP + TN)
  falseNegativeRate: number;            // FN / (FN + TP) - Rất quan trọng!
  
  // Response time metrics
  avgResponseTimeSeconds: number;
  medianResponseTimeSeconds: number;
  
  // Outcome metrics
  interventionSuccessRate: number;      // % can thiệp thành công
  
  // Time range
  periodStart: Date;
  periodEnd: Date;
  
  // Trend data (so với kỳ trước)
  trends?: {
    accuracyChange: number;             // +/- %
    falsePositiveChange: number;        // +/- %
    falseNegativeChange: number;        // +/- %
  };
}

/**
 * Phân tích keyword để cải thiện detection
 */
export interface KeywordAnalysis {
  keyword: string;
  
  // Usage statistics
  timesDetected: number;
  timesConfirmed: number;               // Lần được chuyên gia xác nhận
  timesFalsePositive: number;           // Lần gây false positive
  
  // Calculated metrics
  accuracy: number;                     // timesConfirmed / timesDetected
  falsePositiveRate: number;            // timesFalsePositive / timesDetected
  
  // Recommendations
  recommendation: 'keep' | 'adjust_weight' | 'remove' | 'add_context_check';
  suggestedWeight?: number;             // 0-1: Trọng số đề xuất
  requiredContext?: string[];           // Context cần có để keyword hợp lệ
}

/**
 * Đề xuất cải thiện mô hình
 */
export interface ModelImprovementSuggestions {
  timestamp: Date;
  basedOnAlerts: number;
  
  // Keyword improvements
  keywordsToAdd: string[];              // Keywords mới nên thêm
  keywordsToRemove: string[];           // Keywords nên loại bỏ
  keywordsToAdjust: {
    keyword: string;
    currentWeight: number;
    suggestedWeight: number;
    reason: string;
  }[];
  
  // Pattern improvements
  contextualRules: {
    description: string;
    condition: string;
    action: string;
    expectedImpact: string;
  }[];
  
  // Model adjustments
  thresholdAdjustments: {
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    reason: string;
  }[];
  
  // Expected impact
  expectedImprovements: {
    accuracyIncrease: string;           // e.g., "+3-5%"
    falsePositiveReduction: string;     // e.g., "-20-30%"
    falseNegativeReduction: string;     // e.g., "-10-15%"
  };
}

// =============================================================================
// HITL FEEDBACK SERVICE
// =============================================================================

export class HITLFeedbackService {
  private feedbackData: Map<string, HITLFeedback> = new Map();
  private trainingData: TrainingDataPoint[] = [];
  private keywordStats: Map<string, KeywordAnalysis> = new Map();

  constructor() {
    logger.info('🔄 HITLFeedbackService initialized - AI improvement loop ready');
  }

  /**
   * STEP 1: Thu thập feedback từ chuyên gia lâm sàng
   */
  async collectFeedback(
    alert: CriticalAlert,
    feedback: Omit<HITLFeedback, 'alertId' | 'timestamp'>
  ): Promise<HITLFeedback> {
    const completeFeedback: HITLFeedback = {
      alertId: alert.id,
      timestamp: new Date(),
      ...feedback
    };

    this.feedbackData.set(alert.id, completeFeedback);

    logger.info(`📊 Feedback collected for alert ${alert.id}`, {
      wasActualCrisis: feedback.wasActualCrisis,
      actualRiskLevel: feedback.actualRiskLevel,
      responseTime: feedback.responseTimeSeconds
    });

    // STEP 2: Tạo training data point
    await this.createTrainingDataPoint(alert, completeFeedback);

    // STEP 3: Cập nhật keyword statistics
    await this.updateKeywordStatistics(alert, completeFeedback);

    // STEP 4: Trigger model improvement analysis (nếu đủ dữ liệu)
    await this.checkAndTriggerModelImprovement();

    return completeFeedback;
  }

  /**
   * STEP 2: Tạo training data point từ alert + feedback
   */
  private async createTrainingDataPoint(
    alert: CriticalAlert,
    feedback: HITLFeedback
  ): Promise<void> {
    const trainingPoint: TrainingDataPoint = {
      id: `TRAINING_${alert.id}`,
      timestamp: new Date(),
      
      // Input data
      userMessage: alert.userMessage,
      userProfile: alert.userProfile,
      testResults: alert.testResults,
      context: {
        sessionId: alert.sessionId,
        userId: alert.userId
      },
      
      // Ground truth (từ human expert)
      label: feedback.wasActualCrisis ? 'crisis' : 'no_crisis',
      riskLevel: feedback.actualRiskLevel,
      riskType: feedback.actualRiskType,
      
      // AI prediction
      aiPrediction: {
        label: 'crisis', // AI đã detect là crisis
        riskLevel: alert.riskLevel,
        confidence: 0.96, // Current model confidence
        detectedKeywords: alert.detectedKeywords
      },
      
      // Expert annotations
      expertAnnotations: {
        correctKeywords: feedback.wasActualCrisis 
          ? alert.detectedKeywords.filter(kw => 
              !feedback.falseIndicators?.includes(kw)
            )
          : [],
        incorrectKeywords: feedback.falseIndicators || [],
        missingKeywords: feedback.suggestedKeywords || [],
        contextualFactors: []
      },
      
      // Quality metrics
      wasCorrectPrediction: feedback.wasActualCrisis,
      predictionError: feedback.wasActualCrisis ? undefined : 'false_positive'
    };

    this.trainingData.push(trainingPoint);

    logger.info(`🎯 Training data point created: ${trainingPoint.id}`, {
      label: trainingPoint.label,
      wasCorrect: trainingPoint.wasCorrectPrediction
    });

    // TODO: Save to database for long-term storage
    // await database.trainingData.insert(trainingPoint);
  }

  /**
   * STEP 3: Cập nhật thống kê keyword
   */
  private async updateKeywordStatistics(
    alert: CriticalAlert,
    feedback: HITLFeedback
  ): Promise<void> {
    for (const keyword of alert.detectedKeywords) {
      let stats = this.keywordStats.get(keyword);
      
      if (!stats) {
        stats = {
          keyword,
          timesDetected: 0,
          timesConfirmed: 0,
          timesFalsePositive: 0,
          accuracy: 0,
          falsePositiveRate: 0,
          recommendation: 'keep'
        };
      }

      // Update counts
      stats.timesDetected++;
      
      if (feedback.wasActualCrisis) {
        // Keyword correctly identified crisis
        if (!feedback.falseIndicators?.includes(keyword)) {
          stats.timesConfirmed++;
        }
      } else {
        // False positive - keyword triggered incorrectly
        stats.timesFalsePositive++;
      }

      // Recalculate metrics
      stats.accuracy = stats.timesConfirmed / stats.timesDetected;
      stats.falsePositiveRate = stats.timesFalsePositive / stats.timesDetected;

      // Generate recommendation
      stats.recommendation = this.generateKeywordRecommendation(stats);
      
      if (stats.recommendation === 'adjust_weight') {
        // Suggest lower weight for keywords with high false positive rate
        stats.suggestedWeight = Math.max(0.1, 1 - stats.falsePositiveRate);
      }

      this.keywordStats.set(keyword, stats);
    }

    logger.info(`📈 Keyword statistics updated for ${alert.detectedKeywords.length} keywords`);
  }

  /**
   * Generate recommendation for keyword based on statistics
   */
  private generateKeywordRecommendation(stats: KeywordAnalysis): 
    'keep' | 'adjust_weight' | 'remove' | 'add_context_check' {
    
    // Remove keywords with very high false positive rate
    if (stats.falsePositiveRate > 0.7 && stats.timesDetected >= 5) {
      return 'remove';
    }
    
    // Adjust weight for keywords with moderate false positive rate
    if (stats.falsePositiveRate > 0.3 && stats.falsePositiveRate <= 0.7) {
      return 'adjust_weight';
    }
    
    // Add context check for keywords that sometimes work, sometimes don't
    if (stats.accuracy > 0.4 && stats.accuracy < 0.8 && stats.timesDetected >= 3) {
      return 'add_context_check';
    }
    
    // Keep keywords with good accuracy
    return 'keep';
  }

  /**
   * STEP 4: Phân tích và tạo đề xuất cải thiện model
   */
  async generateModelImprovements(): Promise<ModelImprovementSuggestions> {
    logger.info('🔬 Analyzing HITL feedback data to generate model improvements...');

    const suggestions: ModelImprovementSuggestions = {
      timestamp: new Date(),
      basedOnAlerts: this.feedbackData.size,
      keywordsToAdd: [],
      keywordsToRemove: [],
      keywordsToAdjust: [],
      contextualRules: [],
      thresholdAdjustments: [],
      expectedImprovements: {
        accuracyIncrease: '',
        falsePositiveReduction: '',
        falseNegativeReduction: ''
      }
    };

    // Analyze keywords
    for (const [keyword, stats] of this.keywordStats) {
      if (stats.recommendation === 'remove') {
        suggestions.keywordsToRemove.push(keyword);
        logger.warn(`❌ Suggest removing keyword: "${keyword}" (FP rate: ${(stats.falsePositiveRate * 100).toFixed(1)}%)`);
      }
      
      if (stats.recommendation === 'adjust_weight' && stats.suggestedWeight) {
        suggestions.keywordsToAdjust.push({
          keyword,
          currentWeight: 1.0,
          suggestedWeight: stats.suggestedWeight,
          reason: `High false positive rate: ${(stats.falsePositiveRate * 100).toFixed(1)}%`
        });
        logger.info(`⚖️ Suggest adjusting keyword: "${keyword}" weight to ${stats.suggestedWeight.toFixed(2)}`);
      }
    }

    // Find keywords to add (from expert suggestions)
    const suggestedKeywordsCount = new Map<string, number>();
    for (const feedback of this.feedbackData.values()) {
      for (const keyword of feedback.suggestedKeywords || []) {
        suggestedKeywordsCount.set(keyword, (suggestedKeywordsCount.get(keyword) || 0) + 1);
      }
    }

    // Add keywords suggested by multiple experts
    for (const [keyword, count] of suggestedKeywordsCount) {
      if (count >= 2) { // Suggested by at least 2 experts
        suggestions.keywordsToAdd.push(keyword);
        logger.info(`✅ Suggest adding keyword: "${keyword}" (suggested ${count} times)`);
      }
    }

    // Analyze false positives patterns
    const falsePositives = Array.from(this.feedbackData.values())
      .filter(f => !f.wasActualCrisis);
    
    if (falsePositives.length > 0) {
      suggestions.contextualRules.push({
        description: 'Add context checking for metaphorical language',
        condition: 'When crisis keywords detected in context of past events or hypothetical scenarios',
        action: 'Reduce risk score by 50% and require additional confirmation',
        expectedImpact: 'Reduce false positives from metaphorical/past tense usage'
      });
    }

    // Calculate expected improvements
    const currentMetrics = await this.calculatePerformanceMetrics();
    suggestions.expectedImprovements = {
      accuracyIncrease: this.estimateAccuracyImprovement(suggestions, currentMetrics),
      falsePositiveReduction: this.estimateFPReduction(suggestions, currentMetrics),
      falseNegativeReduction: this.estimateFNReduction(suggestions, currentMetrics)
    };

    logger.info('✅ Model improvement suggestions generated', {
      keywordsToAdd: suggestions.keywordsToAdd.length,
      keywordsToRemove: suggestions.keywordsToRemove.length,
      keywordsToAdjust: suggestions.keywordsToAdjust.length
    });

    return suggestions;
  }

  /**
   * Tính toán performance metrics của model
   */
  async calculatePerformanceMetrics(
    periodDays: number = 30
  ): Promise<ModelPerformanceMetrics> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter feedback within period
    const periodFeedback = Array.from(this.feedbackData.values())
      .filter(f => f.timestamp >= periodStart);

    const totalReviewed = periodFeedback.length;
    
    // Calculate confusion matrix
    const truePositives = periodFeedback.filter(f => f.wasActualCrisis).length;
    const falsePositives = periodFeedback.filter(f => !f.wasActualCrisis).length;
    
    // Note: We don't have true negatives / false negatives data in current system
    // because we only create alerts for detected crises
    // TODO: Implement random sampling of non-crisis conversations for TN/FN analysis
    const trueNegatives = 0;  // Would need to sample non-crisis conversations
    const falseNegatives = 0; // Would need expert review of missed crises

    // Calculate metrics
    const accuracy = totalReviewed > 0 
      ? (truePositives + trueNegatives) / totalReviewed 
      : 0;
    
    const precision = (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    
    const recall = (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;
    
    const falsePositiveRate = (falsePositives + trueNegatives) > 0
      ? falsePositives / (falsePositives + trueNegatives)
      : 0;
    
    const falseNegativeRate = (falseNegatives + truePositives) > 0
      ? falseNegatives / (falseNegatives + truePositives)
      : 0;

    // Response time metrics
    const responseTimes = periodFeedback.map(f => f.responseTimeSeconds);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const medianResponseTime = sortedResponseTimes.length > 0
      ? sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)]
      : 0;

    // Intervention success rate
    const interventionSuccess = periodFeedback.filter(f => f.interventionSuccess).length;
    const interventionSuccessRate = totalReviewed > 0
      ? interventionSuccess / totalReviewed
      : 0;

    const metrics: ModelPerformanceMetrics = {
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
      periodEnd: now
    };

    logger.info('📊 Performance metrics calculated', {
      period: `${periodDays} days`,
      totalReviewed,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      precision: `${(precision * 100).toFixed(1)}%`,
      recall: `${(recall * 100).toFixed(1)}%`,
      falsePositiveRate: `${(falsePositiveRate * 100).toFixed(1)}%`
    });

    return metrics;
  }

  /**
   * Estimate accuracy improvement from suggestions
   */
  private estimateAccuracyImprovement(
    suggestions: ModelImprovementSuggestions,
    currentMetrics: ModelPerformanceMetrics
  ): string {
    let estimatedImprovement = 0;

    // Each keyword removal/adjustment could reduce FP
    estimatedImprovement += suggestions.keywordsToRemove.length * 0.01; // 1% per keyword
    estimatedImprovement += suggestions.keywordsToAdjust.length * 0.005; // 0.5% per adjustment

    // Adding keywords could improve detection
    estimatedImprovement += suggestions.keywordsToAdd.length * 0.01; // 1% per new keyword

    const minImprovement = Math.max(0, estimatedImprovement - 0.02);
    const maxImprovement = estimatedImprovement + 0.02;

    return `+${(minImprovement * 100).toFixed(1)}-${(maxImprovement * 100).toFixed(1)}%`;
  }

  /**
   * Estimate false positive reduction
   */
  private estimateFPReduction(
    suggestions: ModelImprovementSuggestions,
    currentMetrics: ModelPerformanceMetrics
  ): string {
    const keywordsToFix = suggestions.keywordsToRemove.length + suggestions.keywordsToAdjust.length;
    const estimatedReduction = Math.min(0.5, keywordsToFix * 0.05); // 5% per keyword, max 50%

    const minReduction = Math.max(0, estimatedReduction - 0.1);
    const maxReduction = Math.min(1, estimatedReduction + 0.1);

    return `-${(minReduction * 100).toFixed(0)}-${(maxReduction * 100).toFixed(0)}%`;
  }

  /**
   * Estimate false negative reduction
   */
  private estimateFNReduction(
    suggestions: ModelImprovementSuggestions,
    currentMetrics: ModelPerformanceMetrics
  ): string {
    const newKeywords = suggestions.keywordsToAdd.length;
    const estimatedReduction = Math.min(0.3, newKeywords * 0.03); // 3% per keyword, max 30%

    const minReduction = Math.max(0, estimatedReduction - 0.05);
    const maxReduction = Math.min(1, estimatedReduction + 0.05);

    return `-${(minReduction * 100).toFixed(0)}-${(maxReduction * 100).toFixed(0)}%`;
  }

  /**
   * Check if we have enough data to trigger model improvement
   */
  private async checkAndTriggerModelImprovement(): Promise<void> {
    const MINIMUM_FEEDBACK_COUNT = 10; // Minimum 10 feedback entries

    if (this.feedbackData.size >= MINIMUM_FEEDBACK_COUNT) {
      logger.info(`🔔 Sufficient feedback data collected (${this.feedbackData.size}). Triggering model improvement analysis...`);
      
      const suggestions = await this.generateModelImprovements();
      
      // TODO: Automatically apply improvements or send to human review
      logger.info('📋 Model improvement suggestions ready for review/application');
    }
  }

  /**
   * Get training data for model fine-tuning
   */
  getTrainingData(limit?: number): TrainingDataPoint[] {
    const data = limit ? this.trainingData.slice(-limit) : this.trainingData;
    logger.info(`📦 Retrieved ${data.length} training data points for fine-tuning`);
    return data;
  }

  /**
   * Export training data in format for ML model
   */
  async exportTrainingDataForFineTuning(format: 'jsonl' | 'csv' = 'jsonl'): Promise<string> {
    if (format === 'jsonl') {
      // JSONL format for OpenAI fine-tuning or similar
      return this.trainingData
        .map(point => JSON.stringify({
          prompt: `Detect crisis in message: "${point.userMessage}"`,
          completion: point.label === 'crisis' 
            ? `Crisis detected: ${point.riskLevel} risk of ${point.riskType}`
            : 'No crisis detected'
        }))
        .join('\n');
    }
    
    // CSV format
    const headers = 'message,label,risk_level,risk_type,was_correct\n';
    const rows = this.trainingData
      .map(point => [
        `"${point.userMessage.replace(/"/g, '""')}"`,
        point.label,
        point.riskLevel,
        point.riskType || 'none',
        point.wasCorrectPrediction
      ].join(','))
      .join('\n');
    
    return headers + rows;
  }

  /**
   * Get keyword statistics for analysis
   */
  getKeywordStatistics(): KeywordAnalysis[] {
    return Array.from(this.keywordStats.values())
      .sort((a, b) => b.timesDetected - a.timesDetected);
  }

  /**
   * Get all feedback data
   */
  getAllFeedback(): HITLFeedback[] {
    return Array.from(this.feedbackData.values());
  }
}

// Export singleton instance
export const hitlFeedbackService = new HITLFeedbackService();

