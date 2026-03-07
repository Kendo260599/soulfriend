/**
 * INTERVENTION RECORD MODEL
 * 
 * PGE Phase 2 — Positive Attractor & Escape Force
 * Lưu trữ lịch sử can thiệp và kết quả, dùng cho:
 * 
 * 1. Theo dõi hiệu quả can thiệp (trước/sau EBH, ES)
 * 2. Học ma trận B (Intervention Matrix) từ dữ liệu thực tế
 * 3. Policy learning — tìm can thiệp tối ưu cho từng trạng thái
 * 
 * 4 loại can thiệp:
 * - cognitive_reframing: Tái cấu trúc nhận thức  
 * - social_connection: Kết nối xã hội
 * - behavioral_activation: Kích hoạt hành vi
 * - emotional_regulation: Điều chỉnh cảm xúc
 * 
 * @module models/InterventionRecord
 * @version 1.0.0 — PGE Phase 2
 */

import mongoose, { Document, Schema } from 'mongoose';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export type InterventionType =
  | 'cognitive_reframing'
  | 'social_connection'
  | 'behavioral_activation'
  | 'emotional_regulation';

export const INTERVENTION_TYPES: InterventionType[] = [
  'cognitive_reframing',
  'social_connection',
  'behavioral_activation',
  'emotional_regulation',
];

export const INTERVENTION_DIMENSION = INTERVENTION_TYPES.length; // 4

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  cognitive_reframing: 'Tái cấu trúc nhận thức',
  social_connection: 'Kết nối xã hội',
  behavioral_activation: 'Kích hoạt hành vi',
  emotional_regulation: 'Điều chỉnh cảm xúc',
};

export const INTERVENTION_DESCRIPTIONS: Record<InterventionType, string> = {
  cognitive_reframing: 'Thay đổi cách nhìn nhận vấn đề, thách thức suy nghĩ tiêu cực, phát triển góc nhìn cân bằng hơn',
  social_connection: 'Kết nối với người thân, bạn bè, cộng đồng; chia sẻ cảm xúc; tham gia hoạt động nhóm',
  behavioral_activation: 'Thực hiện hoạt động có ý nghĩa, tập thể dục, xây dựng thói quen tích cực, chia nhỏ mục tiêu',
  emotional_regulation: 'Thực hành mindfulness, hít thở sâu, thư giãn cơ, journaling, grounding techniques',
};

// ────────────────────────────────────────────────
// Interface
// ────────────────────────────────────────────────

export interface IInterventionRecord extends Document {
  userId: string;
  sessionId: string;

  // Intervention details
  interventionType: InterventionType;
  interventionVector: number[];       // I(t) — 4D intervention intensity vector
  interventionIntensity: number;      // ||I(t)|| — tổng cường độ can thiệp

  // Pre-intervention state
  preState: number[];                 // S(t) before intervention — 24D vector
  preEBH: number;                     // EBH score before
  preES: number;                      // Emotional Star score before
  preZone: string;                    // Zone classification before

  // Post-intervention state (filled after outcome observed)
  postState?: number[];               // S(t+1) after intervention — 24D vector  
  postEBH?: number;                   // EBH score after
  postES?: number;                    // Emotional Star score after
  postZone?: string;                  // Zone classification after

  // Effectiveness metrics (computed from pre/post)
  deltaEBH?: number;                  // postEBH - preEBH (negative = improvement)
  deltaES?: number;                   // postES - preES (positive = improvement)
  effectiveness?: number;            // Combined effectiveness score [0, 1]
  escapeForceAchieved?: number;       // ||B·I|| — actual escape force generated

  // Recommendation metadata
  predictedEffectiveness: number;     // Model's prediction of effectiveness
  recommendationReason: string;       // Why this intervention was recommended
  alternativeInterventions: Array<{
    type: InterventionType;
    predictedEffectiveness: number;
  }>;

  // Response tracking
  wasAccepted: boolean;               // Did user accept the recommendation?
  responseText?: string;              // Chatbot's intervention message

  // Learning
  rewardSignal?: number;              // RL reward: Δ(EBH reduction) normalized
  usedForLearning: boolean;           // Was this record used to update B matrix?

  // Timestamps
  recommendedAt: Date;
  outcomeRecordedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────

const InterventionRecordSchema = new Schema<IInterventionRecord>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    interventionType: {
      type: String,
      enum: INTERVENTION_TYPES,
      required: true,
      index: true,
    },
    interventionVector: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === INTERVENTION_DIMENSION,
        message: `Intervention vector must have ${INTERVENTION_DIMENSION} elements`,
      },
    },
    interventionIntensity: { type: Number, default: 0 },

    preState: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 24,
        message: 'Pre-state vector must have 24 elements',
      },
    },
    preEBH: { type: Number, required: true, min: 0, max: 1 },
    preES: { type: Number, required: true },
    preZone: { type: String, required: true },

    postState: { type: [Number] },
    postEBH: { type: Number, min: 0, max: 1 },
    postES: { type: Number },
    postZone: { type: String },

    deltaEBH: { type: Number },
    deltaES: { type: Number },
    effectiveness: { type: Number, min: 0, max: 1 },
    escapeForceAchieved: { type: Number },

    predictedEffectiveness: { type: Number, default: 0, min: 0, max: 1 },
    recommendationReason: { type: String, default: '' },
    alternativeInterventions: [{
      type: { type: String, enum: INTERVENTION_TYPES },
      predictedEffectiveness: { type: Number },
    }],

    wasAccepted: { type: Boolean, default: true },
    responseText: { type: String },

    rewardSignal: { type: Number },
    usedForLearning: { type: Boolean, default: false },

    recommendedAt: { type: Date, default: Date.now },
    outcomeRecordedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'pge_intervention_records',
  }
);

// Compound indexes
InterventionRecordSchema.index({ userId: 1, recommendedAt: -1 });
InterventionRecordSchema.index({ userId: 1, interventionType: 1, recommendedAt: -1 });
InterventionRecordSchema.index({ usedForLearning: 1, effectiveness: -1 });
InterventionRecordSchema.index({ interventionType: 1, effectiveness: -1 });

// TTL: auto-delete after 3 years
InterventionRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 365 * 24 * 3600 });

export const InterventionRecord = mongoose.model<IInterventionRecord>(
  'InterventionRecord',
  InterventionRecordSchema
);

export default InterventionRecord;
