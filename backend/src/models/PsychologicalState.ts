/**
 * PSYCHOLOGICAL STATE MODEL
 * 
 * PGE — Psychological Gravity Engine
 * Lưu trữ vector trạng thái tâm lý S(t) = [s₁, s₂, ..., s₂₄] cho mỗi user message
 * 
 * 24 biến tâm lý được chia thành 6 nhóm:
 * - Negative emotions (8): stress, anxiety, sadness, anger, loneliness, shame, guilt, hopelessness
 * - Positive emotions (4): hope, calmness, joy, gratitude
 * - Cognition (4): selfWorth, selfEfficacy, rumination, cognitiveClarity
 * - Behavioral (4): avoidance, helpSeeking, socialEngagement, motivation
 * - Social (3): trustInOthers, perceivedSupport, fearOfJudgment
 * - Energy (1): mentalFatigue
 * 
 * @module models/PsychologicalState  
 * @version 1.0.0 — PGE Phase 1
 */

import mongoose, { Document, Schema } from 'mongoose';

// ────────────────────────────────────────────────
// 24 Psychological State Variables
// ────────────────────────────────────────────────
export const PSY_VARIABLES = [
  // Negative emotions (0-7)
  'stress', 'anxiety', 'sadness', 'anger',
  'loneliness', 'shame', 'guilt', 'hopelessness',
  // Positive emotions (8-11)
  'hope', 'calmness', 'joy', 'gratitude',
  // Cognition (12-15)
  'selfWorth', 'selfEfficacy', 'rumination', 'cognitiveClarity',
  // Behavioral (16-19)
  'avoidance', 'helpSeeking', 'socialEngagement', 'motivation',
  // Social (20-22)
  'trustInOthers', 'perceivedSupport', 'fearOfJudgment',
  // Energy (23)
  'mentalFatigue',
] as const;

export type PsyVariable = typeof PSY_VARIABLES[number];

export const PSY_DIMENSION = PSY_VARIABLES.length; // 24

export const PSY_GROUPS = {
  negativeEmotions: PSY_VARIABLES.slice(0, 8),
  positiveEmotions: PSY_VARIABLES.slice(8, 12),
  cognition: PSY_VARIABLES.slice(12, 16),
  behavioral: PSY_VARIABLES.slice(16, 20),
  social: PSY_VARIABLES.slice(20, 23),
  energy: PSY_VARIABLES.slice(23, 24),
} as const;

// ────────────────────────────────────────────────
// Interface
// ────────────────────────────────────────────────
export interface IStateVector {
  stress: number;
  anxiety: number;
  sadness: number;
  anger: number;
  loneliness: number;
  shame: number;
  guilt: number;
  hopelessness: number;
  hope: number;
  calmness: number;
  joy: number;
  gratitude: number;
  selfWorth: number;
  selfEfficacy: number;
  rumination: number;
  cognitiveClarity: number;
  avoidance: number;
  helpSeeking: number;
  socialEngagement: number;
  motivation: number;
  trustInOthers: number;
  perceivedSupport: number;
  fearOfJudgment: number;
  mentalFatigue: number;
}

export interface IPsychologicalState extends Document {
  userId: string;
  sessionId: string;
  messageIndex: number; // vị trí tin nhắn trong session (t)
  timestamp: Date;

  // State vector S(t)
  stateVector: IStateVector;

  // Computed metrics
  potentialEnergy: number;     // U(S) = ½ SᵀWS
  forceNorm: number;           // ||F|| = ||−∇U(S)||
  ebhScore: number;            // Emotional Black Hole score [0,1]
  
  // Trajectory metrics
  negativeInertia: number;     // I_neg — emotional inertia of negative group
  loopStrength: number;        // L — feedback loop strength
  hopeDelta: number;           // Δhope = hope(t) - hope(t-1)

  // Classification
  zone: 'safe' | 'caution' | 'risk' | 'critical' | 'black_hole';
  dominantEmotion: string;
  attractorState?: 'burnout' | 'depression' | 'anxiety_spiral' | 'recovery' | 'stable' | 'growth';

  // Source
  sourceText: string;          // user message that produced this vector
  extractionMethod: 'openai' | 'rule_based' | 'hybrid';
  confidence: number;          // confidence of emotion extraction [0,1]

  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────
const stateVectorFields: Record<string, any> = {};
for (const v of PSY_VARIABLES) {
  stateVectorFields[v] = { type: Number, default: 0, min: 0, max: 1 };
}

const PsychologicalStateSchema = new Schema<IPsychologicalState>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messageIndex: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },

    stateVector: {
      type: new Schema(stateVectorFields, { _id: false }),
      required: true,
    },

    potentialEnergy: { type: Number, default: 0 },
    forceNorm: { type: Number, default: 0 },
    ebhScore: { type: Number, default: 0, min: 0, max: 1 },

    negativeInertia: { type: Number, default: 0 },
    loopStrength: { type: Number, default: 0 },
    hopeDelta: { type: Number, default: 0 },

    zone: {
      type: String,
      enum: ['safe', 'caution', 'risk', 'critical', 'black_hole'],
      default: 'safe',
    },
    dominantEmotion: { type: String, default: 'neutral' },
    attractorState: {
      type: String,
      enum: ['burnout', 'depression', 'anxiety_spiral', 'recovery', 'stable', 'growth'],
    },

    sourceText: { type: String, required: true },
    extractionMethod: {
      type: String,
      enum: ['openai', 'rule_based', 'hybrid'],
      default: 'hybrid',
    },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
  },
  {
    timestamps: true,
    collection: 'pge_psychological_states',
  }
);

// Compound indexes
PsychologicalStateSchema.index({ userId: 1, sessionId: 1, messageIndex: 1 }, { unique: true });
PsychologicalStateSchema.index({ userId: 1, timestamp: -1 });
PsychologicalStateSchema.index({ zone: 1, timestamp: -1 });
PsychologicalStateSchema.index({ ebhScore: -1, timestamp: -1 });

// TTL: auto-delete after 3 years
PsychologicalStateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 365 * 24 * 3600 });

export const PsychologicalState = mongoose.model<IPsychologicalState>(
  'PsychologicalState',
  PsychologicalStateSchema
);

export default PsychologicalState;
