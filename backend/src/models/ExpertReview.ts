/**
 * EXPERT REVIEW MODEL
 * 
 * V5 Learning Pipeline — Module 4: Expert Review Learning
 * Chuyên gia đánh giá & chỉnh sửa phản hồi AI → AI học từ sửa đổi
 * 
 * @module models/ExpertReview
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IExpertReview extends Document {
  interactionEventId: mongoose.Types.ObjectId;
  evaluationScoreId?: mongoose.Types.ObjectId;
  sessionId: string;
  expertId: string;
  expertName: string;
  timestamp: Date;

  // Original AI response
  originalResponse: string;

  // Expert correction
  correctedResponse: string;

  // Expert assessment
  assessment: {
    empathyRating: number; // 1-5
    safetyRating: number; // 1-5
    clinicalAccuracy: number; // 1-5
    culturalFit: number; // 1-5
    overallRating: number; // 1-5
  };

  // Specific issues found
  issues: Array<{
    type: 'safety' | 'empathy' | 'accuracy' | 'cultural' | 'guideline' | 'tone';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;

  // Learning signal
  shouldRetrain: boolean;
  retrainPriority: 'low' | 'medium' | 'high' | 'urgent';
  learningNotes: string;

  // Status
  status: 'pending' | 'reviewed' | 'applied' | 'dismissed';

  createdAt: Date;
  updatedAt: Date;
}

const ExpertReviewSchema = new Schema<IExpertReview>(
  {
    interactionEventId: { type: Schema.Types.ObjectId, ref: 'InteractionEvent', required: true, index: true },
    evaluationScoreId: { type: Schema.Types.ObjectId, ref: 'EvaluationScore' },
    sessionId: { type: String, required: true },
    expertId: { type: String, required: true, index: true },
    expertName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },

    originalResponse: { type: String, required: true },
    correctedResponse: { type: String, required: true },

    assessment: {
      empathyRating: { type: Number, min: 1, max: 5, required: true },
      safetyRating: { type: Number, min: 1, max: 5, required: true },
      clinicalAccuracy: { type: Number, min: 1, max: 5, required: true },
      culturalFit: { type: Number, min: 1, max: 5, required: true },
      overallRating: { type: Number, min: 1, max: 5, required: true },
    },

    issues: [
      {
        type: { type: String, enum: ['safety', 'empathy', 'accuracy', 'cultural', 'guideline', 'tone'] },
        description: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      },
    ],

    shouldRetrain: { type: Boolean, default: false },
    retrainPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
    learningNotes: { type: String, default: '' },

    status: { type: String, enum: ['pending', 'reviewed', 'applied', 'dismissed'], default: 'pending' },
  },
  {
    timestamps: true,
    collection: 'expert_reviews',
  }
);

ExpertReviewSchema.index({ status: 1, timestamp: -1 });
ExpertReviewSchema.index({ shouldRetrain: 1, retrainPriority: 1 });
ExpertReviewSchema.index({ expertId: 1, timestamp: -1 });

export default mongoose.model<IExpertReview>('ExpertReview', ExpertReviewSchema);
