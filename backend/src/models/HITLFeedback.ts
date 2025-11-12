/**
 * MONGODB MODEL: HITL Feedback
 *
 * Lưu trữ feedback từ chuyên gia lâm sàng về các alerts đã resolved
 */

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// INTERFACES
// =============================================================================

export interface IHITLFeedback extends Document {
  // Alert info
  alertId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;

  // Ground truth from expert
  wasActualCrisis: boolean;
  crisisConfidenceScore: number;
  actualRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  actualRiskType?: string;

  // Original detection
  aiPrediction: {
    riskLevel: string;
    riskType: string;
    detectedKeywords: string[];
    confidence: number;
  };

  // User message
  userMessage: string;

  // Expert feedback
  clinicalNotes: string;
  missedIndicators?: string[];
  falseIndicators?: string[];
  suggestedKeywords?: string[];
  unnecessaryKeywords?: string[];

  // Intervention results
  responseTimeSeconds: number;
  interventionSuccess: boolean;
  userOutcome: 'safe' | 'hospitalized' | 'referred' | 'deceased' | 'unknown';

  // Reviewer info
  reviewedBy: string;
  reviewedAt: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const HITLFeedbackSchema = new Schema<IHITLFeedback>(
  {
    // Alert info
    alertId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Ground truth
    wasActualCrisis: {
      type: Boolean,
      required: true,
      index: true,
    },
    crisisConfidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    actualRiskLevel: {
      type: String,
      required: true,
      enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'EXTREME'],
      index: true,
    },
    actualRiskType: {
      type: String,
      enum: ['suicidal', 'psychosis', 'self_harm', 'violence', 'none'],
    },

    // AI prediction
    aiPrediction: {
      riskLevel: { type: String, required: true },
      riskType: { type: String, required: true },
      detectedKeywords: [{ type: String }],
      confidence: { type: Number, min: 0, max: 1 },
    },

    // User message
    userMessage: {
      type: String,
      required: true,
    },

    // Expert feedback
    clinicalNotes: {
      type: String,
      required: true,
    },
    missedIndicators: [{ type: String }],
    falseIndicators: [{ type: String }],
    suggestedKeywords: [{ type: String }],
    unnecessaryKeywords: [{ type: String }],

    // Intervention results
    responseTimeSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    interventionSuccess: {
      type: Boolean,
      required: true,
    },
    userOutcome: {
      type: String,
      required: true,
      enum: ['safe', 'hospitalized', 'referred', 'deceased', 'unknown'],
    },

    // Reviewer info
    reviewedBy: {
      type: String,
      required: true,
      index: true,
    },
    reviewedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'hitl_feedbacks',
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound indexes for common queries
HITLFeedbackSchema.index({ timestamp: -1, wasActualCrisis: 1 });
HITLFeedbackSchema.index({ reviewedBy: 1, timestamp: -1 });
HITLFeedbackSchema.index({ actualRiskLevel: 1, wasActualCrisis: 1 });

// =============================================================================
// METHODS
// =============================================================================

HITLFeedbackSchema.methods.isCorrectPrediction = function (): boolean {
  return this.wasActualCrisis;
};

HITLFeedbackSchema.methods.getPredictionError = function (): string | null {
  if (this.wasActualCrisis) {
    return null; // Correct prediction (True Positive)
  } else {
    return 'false_positive'; // AI detected crisis but it wasn't real
  }
};

// =============================================================================
// STATICS
// =============================================================================

HITLFeedbackSchema.statics.getPerformanceMetrics = async function (
  periodDays: number = 30
): Promise<any> {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  const feedbacks = await this.find({
    timestamp: { $gte: periodStart },
  });

  const total = feedbacks.length;
  const truePositives = feedbacks.filter((f: any) => f.wasActualCrisis).length;
  const falsePositives = feedbacks.filter((f: any) => !f.wasActualCrisis).length;

  const accuracy = total > 0 ? truePositives / total : 0;
  const precision =
    truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;

  return {
    totalReviewed: total,
    truePositives,
    falsePositives,
    accuracy,
    precision,
    periodStart,
    periodEnd: new Date(),
  };
};

HITLFeedbackSchema.statics.getKeywordStatistics = async function (): Promise<any[]> {
  const feedbacks = await this.find({});

  const keywordStats = new Map();

  for (const feedback of feedbacks) {
    for (const keyword of feedback.aiPrediction.detectedKeywords) {
      if (!keywordStats.has(keyword)) {
        keywordStats.set(keyword, {
          keyword,
          timesDetected: 0,
          timesConfirmed: 0,
          timesFalsePositive: 0,
        });
      }

      const stats = keywordStats.get(keyword);
      stats.timesDetected++;

      if (feedback.wasActualCrisis) {
        if (!feedback.falseIndicators?.includes(keyword)) {
          stats.timesConfirmed++;
        }
      } else {
        stats.timesFalsePositive++;
      }
    }
  }

  return Array.from(keywordStats.values()).map(stats => ({
    ...stats,
    accuracy: stats.timesConfirmed / stats.timesDetected,
    falsePositiveRate: stats.timesFalsePositive / stats.timesDetected,
  }));
};

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface IHITLFeedbackModel extends mongoose.Model<IHITLFeedback> {
  getQualityMetrics(periodDays?: number): Promise<any>;
  getKeywordStatistics(): Promise<any[]>;
}

// =============================================================================
// INDEXES
// =============================================================================

HITLFeedbackSchema.index({ alertId: 1, status: 1 });
HITLFeedbackSchema.index({ expertId: 1, createdAt: -1 });
HITLFeedbackSchema.index({ wasActualCrisis: 1, timestamp: -1 });
HITLFeedbackSchema.index({ status: 1, reviewedAt: -1 });

// =============================================================================
// EXPORT
// =============================================================================

export const HITLFeedback = mongoose.model<IHITLFeedback, IHITLFeedbackModel>(
  'HITLFeedback',
  HITLFeedbackSchema
);

export default HITLFeedback;
