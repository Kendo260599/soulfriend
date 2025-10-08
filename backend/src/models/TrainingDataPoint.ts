/**
 * MONGODB MODEL: Training Data Point
 *
 * Lưu trữ training data được tạo từ HITL feedback
 * Dùng để fine-tune AI model
 */

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// INTERFACE
// =============================================================================

export interface ITrainingDataPoint extends Document {
  // Identifier
  trainingId: string;
  alertId: string;
  timestamp: Date;

  // Input features
  userMessage: string;
  userProfile?: any;
  testResults?: any[];
  context?: any;

  // Ground truth labels (from human expert)
  label: 'crisis' | 'no_crisis';
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  riskType?: string;

  // AI prediction (for comparison)
  aiPrediction: {
    label: 'crisis' | 'no_crisis';
    riskLevel: string;
    confidence: number;
    detectedKeywords: string[];
  };

  // Expert annotations
  expertAnnotations: {
    correctKeywords: string[];
    incorrectKeywords: string[];
    missingKeywords: string[];
    contextualFactors: string[];
  };

  // Quality metrics
  wasCorrectPrediction: boolean;
  predictionError?: 'false_positive' | 'false_negative';

  // Metadata
  createdFrom: 'hitl_feedback' | 'manual_annotation';
  reviewedBy: string;

  // For fine-tuning
  exportedToFineTuning: boolean;
  exportedAt?: Date;
  fineTuningJobId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const TrainingDataPointSchema = new Schema<ITrainingDataPoint>(
  {
    trainingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    alertId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Input data
    userMessage: {
      type: String,
      required: true,
    },
    userProfile: Schema.Types.Mixed,
    testResults: [Schema.Types.Mixed],
    context: Schema.Types.Mixed,

    // Ground truth
    label: {
      type: String,
      required: true,
      enum: ['crisis', 'no_crisis'],
      index: true,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'EXTREME'],
    },
    riskType: String,

    // AI prediction
    aiPrediction: {
      label: {
        type: String,
        required: true,
        enum: ['crisis', 'no_crisis'],
      },
      riskLevel: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1 },
      detectedKeywords: [{ type: String }],
    },

    // Expert annotations
    expertAnnotations: {
      correctKeywords: [{ type: String }],
      incorrectKeywords: [{ type: String }],
      missingKeywords: [{ type: String }],
      contextualFactors: [{ type: String }],
    },

    // Quality
    wasCorrectPrediction: {
      type: Boolean,
      required: true,
      index: true,
    },
    predictionError: {
      type: String,
      enum: ['false_positive', 'false_negative'],
    },

    // Metadata
    createdFrom: {
      type: String,
      required: true,
      enum: ['hitl_feedback', 'manual_annotation'],
      default: 'hitl_feedback',
    },
    reviewedBy: {
      type: String,
      required: true,
    },

    // Fine-tuning tracking
    exportedToFineTuning: {
      type: Boolean,
      default: false,
      index: true,
    },
    exportedAt: Date,
    fineTuningJobId: String,
  },
  {
    timestamps: true,
    collection: 'training_data_points',
  }
);

// =============================================================================
// INDEXES
// =============================================================================

TrainingDataPointSchema.index({ timestamp: -1, label: 1 });
TrainingDataPointSchema.index({ wasCorrectPrediction: 1, predictionError: 1 });
TrainingDataPointSchema.index({ exportedToFineTuning: 1, timestamp: -1 });

// =============================================================================
// METHODS
// =============================================================================

TrainingDataPointSchema.methods.toFineTuningFormat = function (
  format: 'openai' | 'google' = 'openai'
): any {
  if (format === 'openai') {
    return {
      prompt: `Detect crisis in message: "${this.userMessage}"`,
      completion:
        this.label === 'crisis'
          ? `Crisis detected: ${this.riskLevel} risk of ${this.riskType || 'crisis'}`
          : 'No crisis detected',
    };
  } else {
    // Google Vertex AI format
    return {
      inputText: this.userMessage,
      outputText: this.label === 'crisis' ? 'crisis' : 'no_crisis',
      metadata: {
        riskLevel: this.riskLevel,
        riskType: this.riskType,
      },
    };
  }
};

// =============================================================================
// STATICS
// =============================================================================

TrainingDataPointSchema.statics.getUnexportedData = async function (
  limit?: number
): Promise<ITrainingDataPoint[]> {
  const query = this.find({ exportedToFineTuning: false }).sort({ timestamp: -1 });

  if (_limit) {
    query.limit(_limit);
  }

  return query.exec();
};

TrainingDataPointSchema.statics.markAsExported = async function (
  trainingIds: string[],
  jobId: string
): Promise<void> {
  await this.updateMany(
    { trainingId: { $in: trainingIds } },
    {
      $set: {
        exportedToFineTuning: true,
        exportedAt: new Date(),
        fineTuningJobId: jobId,
      },
    }
  );
};

TrainingDataPointSchema.statics.exportForFineTuning = async function (
  format: 'jsonl' | 'csv' = 'jsonl',
  limit?: number
): Promise<string> {
  const query = this.find({ exportedToFineTuning: false }).sort({ timestamp: -1 });

  if (_limit) {
    query.limit(_limit);
  }

  const data = await query.exec();

  if (format === 'jsonl') {
    return data
      .map((point: any) =>
        JSON.stringify({
          prompt: `Detect crisis in message: "${point.userMessage}"`,
          completion:
            point.label === 'crisis'
              ? `Crisis detected: ${point.riskLevel} risk`
              : 'No crisis detected',
        })
      )
      .join('\n');
  } else {
    // CSV format
    const headers = 'message,label,risk_level,risk_type,was_correct\n';
    const rows = data
      .map((point: any) =>
        [
          `"${point.userMessage.replace(/"/g, '""')}"`,
          point.label,
          point.riskLevel,
          point.riskType || 'none',
          point.wasCorrectPrediction,
        ].join(',')
      )
      .join('\n');

    return headers + rows;
  }
};

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface ITrainingDataPointModel extends mongoose.Model<ITrainingDataPoint> {
  exportForFineTuning(format?: 'jsonl' | 'csv', limit?: number): Promise<string>;
}

// =============================================================================
// EXPORT
// =============================================================================

export const TrainingDataPoint = mongoose.model<ITrainingDataPoint, ITrainingDataPointModel>(
  'TrainingDataPoint',
  TrainingDataPointSchema
);

export default TrainingDataPoint;
