/**
 * EVALUATION SCORE MODEL
 * 
 * V5 Learning Pipeline — Module 2: Evaluation Loop
 * AI tự đánh giá chất lượng phản hồi của chính nó
 * 
 * @module models/EvaluationScore
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEvaluationScore extends Document {
  interactionEventId: mongoose.Types.ObjectId;
  sessionId: string;
  userId: string;
  timestamp: Date;

  // Core scores (0.0 - 1.0)
  empathyScore: number;
  helpfulnessScore: number;
  safetyScore: number;
  clinicalAlignment: number;
  responseQuality: number;

  // Detailed breakdown
  guidelineAdherence: {
    noDirectDiagnosis: boolean;
    noMedicationAdvice: boolean;
    properEscalation: boolean;
    culturalSensitivity: boolean;
    privacyRespect: boolean;
  };

  // Composite score
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Evaluation metadata
  evaluationModel: string;
  evaluationPromptVersion: string;
  evaluationTimeMs: number;

  // Flags
  needsHumanReview: boolean;
  reviewReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const EvaluationScoreSchema = new Schema<IEvaluationScore>(
  {
    interactionEventId: { type: Schema.Types.ObjectId, ref: 'InteractionEvent', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },

    empathyScore: { type: Number, required: true, min: 0, max: 1 },
    helpfulnessScore: { type: Number, required: true, min: 0, max: 1 },
    safetyScore: { type: Number, required: true, min: 0, max: 1 },
    clinicalAlignment: { type: Number, required: true, min: 0, max: 1 },
    responseQuality: { type: Number, required: true, min: 0, max: 1 },

    guidelineAdherence: {
      noDirectDiagnosis: { type: Boolean, default: true },
      noMedicationAdvice: { type: Boolean, default: true },
      properEscalation: { type: Boolean, default: true },
      culturalSensitivity: { type: Boolean, default: true },
      privacyRespect: { type: Boolean, default: true },
    },

    overallScore: { type: Number, required: true, min: 0, max: 1 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], required: true },

    evaluationModel: { type: String, default: 'gpt-4o-mini' },
    evaluationPromptVersion: { type: String, default: '1.0' },
    evaluationTimeMs: { type: Number, default: 0 },

    needsHumanReview: { type: Boolean, default: false },
    reviewReason: { type: String },
  },
  {
    timestamps: true,
    collection: 'evaluation_scores',
  }
);

EvaluationScoreSchema.index({ overallScore: 1, timestamp: -1 });
EvaluationScoreSchema.index({ grade: 1, timestamp: -1 });
EvaluationScoreSchema.index({ needsHumanReview: 1, timestamp: -1 });

export default mongoose.model<IEvaluationScore>('EvaluationScore', EvaluationScoreSchema);
