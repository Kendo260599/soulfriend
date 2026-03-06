/**
 * TRAINING DATASET MODEL
 * 
 * V5 Learning Pipeline — Module 5: Data Curation Pipeline
 * Dataset đã được lọc, anonymize, sẵn sàng cho training
 * 
 * @module models/TrainingDataset
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainingDataset extends Document {
  datasetId: string;
  version: string;
  timestamp: Date;

  // Curated pair
  input: string; // Anonymized user message
  expectedOutput: string; // Expert-corrected or high-quality AI response
  
  // Source
  sourceType: 'expert_correction' | 'high_quality_auto' | 'user_validated';
  sourceInteractionId?: mongoose.Types.ObjectId;
  sourceExpertReviewId?: mongoose.Types.ObjectId;

  // Quality
  qualityScore: number; // 0.0-1.0
  qualityChecks: {
    personalDataRemoved: boolean;
    unsafeContentRemoved: boolean;
    anonymized: boolean;
    expertValidated: boolean;
    duplicateChecked: boolean;
  };

  // Classification
  category: string; // 'crisis', 'empathy', 'coping', 'general', etc.
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  // Training status
  status: 'pending' | 'approved' | 'used' | 'rejected';
  usedInTrainingRun?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TrainingDatasetSchema = new Schema<ITrainingDataset>(
  {
    datasetId: { type: String, required: true, unique: true },
    version: { type: String, default: '1.0' },
    timestamp: { type: Date, default: Date.now },

    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },

    sourceType: {
      type: String,
      enum: ['expert_correction', 'high_quality_auto', 'user_validated'],
      required: true,
    },
    sourceInteractionId: { type: Schema.Types.ObjectId, ref: 'InteractionEvent' },
    sourceExpertReviewId: { type: Schema.Types.ObjectId, ref: 'ExpertReview' },

    qualityScore: { type: Number, required: true, min: 0, max: 1 },
    qualityChecks: {
      personalDataRemoved: { type: Boolean, default: false },
      unsafeContentRemoved: { type: Boolean, default: false },
      anonymized: { type: Boolean, default: false },
      expertValidated: { type: Boolean, default: false },
      duplicateChecked: { type: Boolean, default: false },
    },

    category: { type: String, required: true },
    tags: [{ type: String }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },

    status: { type: String, enum: ['pending', 'approved', 'used', 'rejected'], default: 'pending' },
    usedInTrainingRun: { type: String },
  },
  {
    timestamps: true,
    collection: 'training_datasets',
  }
);

TrainingDatasetSchema.index({ status: 1, qualityScore: -1 });
TrainingDatasetSchema.index({ category: 1, status: 1 });
TrainingDatasetSchema.index({ datasetId: 1 });

export default mongoose.model<ITrainingDataset>('TrainingDataset', TrainingDatasetSchema);
