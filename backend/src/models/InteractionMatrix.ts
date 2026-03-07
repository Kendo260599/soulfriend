/**
 * INTERACTION MATRIX MODEL
 * 
 * PGE — Psychological Gravity Engine
 * Lưu trữ ma trận tương tác A[24×24] — mô tả cách các biến tâm lý ảnh hưởng lẫn nhau.
 * 
 * Ma trận được học từ dữ liệu: A = argmin ||S(t+1) − A·S(t)||² + λ||A||₁
 * Mỗi user có ma trận riêng (personalized) + ma trận trung bình (population).
 * 
 * @module models/InteractionMatrix
 * @version 1.0.0 — PGE Phase 1
 */

import mongoose, { Document, Schema } from 'mongoose';
import { PSY_DIMENSION } from './PsychologicalState';

export interface IFeedbackLoop {
  path: string[];           // e.g. ['stress', 'rumination', 'anxiety', 'stress']
  totalWeight: number;      // tổng trọng số vòng lặp
  avgWeight: number;        // trọng số trung bình mỗi cạnh
  type: 'positive' | 'negative'; // positive = tự củng cố, negative = tự triệt tiêu
  length: number;           // độ dài vòng lặp
}

export interface IInteractionMatrix extends Document {
  userId: string;           // 'population' cho ma trận trung bình
  scope: 'individual' | 'population';
  
  // Ma trận A = number[][] (24×24)
  matrix: number[][];
  
  // Metadata học
  dataPointCount: number;   // số cặp (S(t), S(t+1)) đã dùng
  lastTrainedAt: Date;
  regularizationLambda: number;
  trainingLoss: number;     // ||S(t+1) − A·S(t)||²
  
  // Phân tích cấu trúc
  feedbackLoops: IFeedbackLoop[];
  eigenvalues: number[];    // eigenvalues of A → stability analysis
  spectralRadius: number;   // max |eigenvalue| → nếu >1 thì hệ bất ổn
  isStable: boolean;        // spectralRadius < 1
  
  // Top interactions
  strongestPositive: Array<{ from: string; to: string; weight: number }>;
  strongestNegative: Array<{ from: string; to: string; weight: number }>;

  // Version control
  version: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const InteractionMatrixSchema = new Schema<IInteractionMatrix>(
  {
    userId: { type: String, required: true, index: true },
    scope: {
      type: String,
      enum: ['individual', 'population'],
      default: 'individual',
    },

    matrix: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (m: number[][]) =>
          m.length === PSY_DIMENSION && m.every(row => row.length === PSY_DIMENSION),
        message: `Matrix phải có kích thước ${PSY_DIMENSION}×${PSY_DIMENSION}`,
      },
    },

    dataPointCount: { type: Number, default: 0 },
    lastTrainedAt: { type: Date, default: Date.now },
    regularizationLambda: { type: Number, default: 0.01 },
    trainingLoss: { type: Number, default: 0 },

    feedbackLoops: [{
      path: [String],
      totalWeight: Number,
      avgWeight: Number,
      type: { type: String, enum: ['positive', 'negative'] },
      length: Number,
    }],

    eigenvalues: [Number],
    spectralRadius: { type: Number, default: 0 },
    isStable: { type: Boolean, default: true },

    strongestPositive: [{
      from: String,
      to: String,
      weight: Number,
    }],
    strongestNegative: [{
      from: String,
      to: String,
      weight: Number,
    }],

    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: 'pge_interaction_matrices',
  }
);

InteractionMatrixSchema.index({ userId: 1, scope: 1, version: -1 });
InteractionMatrixSchema.index({ scope: 1, lastTrainedAt: -1 });

export const InteractionMatrix = mongoose.model<IInteractionMatrix>(
  'InteractionMatrix',
  InteractionMatrixSchema
);

export default InteractionMatrix;
