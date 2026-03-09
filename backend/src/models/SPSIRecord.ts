/**
 * SPSI RECORD MODEL
 * 
 * Social Psychological Stress Index — Chỉ số Căng thẳng Tâm lý Xã hội
 * 
 * Lưu trữ SPSI score tính toán từ PGE state vector:
 *   SPSI_t = w1·Stress + w2·Anxiety + w3·Rumination + w4·Loneliness - w5·Hope
 *   Chuẩn hóa [0,1]
 * 
 * Mục đích: Phát hiện sớm xu hướng stress tâm lý xã hội trước khủng hoảng
 * 
 * @module models/SPSIRecord
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

// ────────────────────────────────────────────────
// SPSI Component Interface
// ────────────────────────────────────────────────
export interface ISPSIComponents {
  stress: number;
  anxiety: number;
  rumination: number;
  loneliness: number;
  hopelessness: number;
  hope: number;          // protective factor (subtracted)
  perceivedSupport: number; // protective factor
  gratitude: number;     // protective factor
  sadness: number;
}

export interface ISPSIWeights {
  stress: number;
  anxiety: number;
  rumination: number;
  loneliness: number;
  hopelessness: number;
  hope: number;
  perceivedSupport: number;
  gratitude: number;
  sadness: number;
}

// ────────────────────────────────────────────────
// Trend & Alert Types
// ────────────────────────────────────────────────
export type SPSIAlertLevel = 'none' | 'watch' | 'warning' | 'critical';

export interface ISPSITrend {
  direction: 'rising' | 'falling' | 'stable';
  slope: number;          // rate of change per day
  changePercent: number;  // % change over window
  windowDays: number;     // observation window
}

// ────────────────────────────────────────────────
// Main Interface
// ────────────────────────────────────────────────
export interface ISPSIRecord extends Document {
  userId: string;
  sessionId: string;
  timestamp: Date;

  // Core SPSI
  spsiScore: number;           // [0,1] — composite index
  components: ISPSIComponents; // raw values from state vector
  weights: ISPSIWeights;       // weights used for computation

  // Aggregation level
  granularity: 'message' | 'session' | 'daily';

  // Trend analysis
  trend: ISPSITrend;
  alertLevel: SPSIAlertLevel;

  // Context
  ebhScore: number;            // concurrent EBH score
  zone: string;                // concurrent zone
  messageCount: number;        // messages in aggregation window

  // Validation
  confidence: number;          // [0,1] — data confidence
  dataQuality: number;         // [0,1] — quality metric

  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────
const SPSIComponentsSchema = new Schema({
  stress: { type: Number, default: 0, min: 0, max: 1 },
  anxiety: { type: Number, default: 0, min: 0, max: 1 },
  rumination: { type: Number, default: 0, min: 0, max: 1 },
  loneliness: { type: Number, default: 0, min: 0, max: 1 },
  hopelessness: { type: Number, default: 0, min: 0, max: 1 },
  hope: { type: Number, default: 0, min: 0, max: 1 },
  perceivedSupport: { type: Number, default: 0, min: 0, max: 1 },
  gratitude: { type: Number, default: 0, min: 0, max: 1 },
  sadness: { type: Number, default: 0, min: 0, max: 1 },
}, { _id: false });

const SPSIWeightsSchema = new Schema({
  stress: { type: Number, default: 0.25 },
  anxiety: { type: Number, default: 0.20 },
  rumination: { type: Number, default: 0.15 },
  loneliness: { type: Number, default: 0.15 },
  hopelessness: { type: Number, default: 0.10 },
  hope: { type: Number, default: 0.15 },
  perceivedSupport: { type: Number, default: 0.08 },
  gratitude: { type: Number, default: 0.07 },
  sadness: { type: Number, default: 0.10 },
}, { _id: false });

const SPSITrendSchema = new Schema({
  direction: { type: String, enum: ['rising', 'falling', 'stable'], default: 'stable' },
  slope: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  windowDays: { type: Number, default: 7 },
}, { _id: false });

const SPSIRecordSchema = new Schema<ISPSIRecord>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },

    spsiScore: { type: Number, required: true, min: 0, max: 1 },
    components: { type: SPSIComponentsSchema, required: true },
    weights: { type: SPSIWeightsSchema, required: true },

    granularity: {
      type: String,
      enum: ['message', 'session', 'daily'],
      default: 'message',
    },

    trend: { type: SPSITrendSchema, default: () => ({}) },
    alertLevel: {
      type: String,
      enum: ['none', 'watch', 'warning', 'critical'],
      default: 'none',
    },

    ebhScore: { type: Number, default: 0, min: 0, max: 1 },
    zone: { type: String, default: 'safe' },
    messageCount: { type: Number, default: 1 },

    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    dataQuality: { type: Number, default: 1.0, min: 0, max: 1 },
  },
  {
    timestamps: true,
    collection: 'spsi_records',
  }
);

// Compound indexes
SPSIRecordSchema.index({ userId: 1, timestamp: -1 });
SPSIRecordSchema.index({ userId: 1, granularity: 1, timestamp: -1 });
SPSIRecordSchema.index({ alertLevel: 1, timestamp: -1 });
SPSIRecordSchema.index({ spsiScore: -1, timestamp: -1 });

// TTL: 3 years
SPSIRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 365 * 24 * 3600 });

export const SPSIRecord = mongoose.model<ISPSIRecord>('SPSIRecord', SPSIRecordSchema);
