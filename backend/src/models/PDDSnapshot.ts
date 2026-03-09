/**
 * PDD SNAPSHOT MODEL
 * 
 * Psychological Dynamics Dataset — Periodic Snapshots
 * 
 * Tổng hợp dữ liệu research theo khoảng thời gian:
 * - Daily: trung bình các metrics trong ngày
 * - Weekly: tổng hợp tuần
 * - Monthly: tổng hợp tháng
 * 
 * Dùng cho:
 * - Phân tích time-series (H1: SPSI tương quan DASS)
 * - Phân tích time-lag (H2: SPSI dự báo crisis)
 * - Population-level statistics
 * 
 * @module models/PDDSnapshot
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

// ────────────────────────────────────────────────
// Emotional Trajectory Point
// ────────────────────────────────────────────────
export interface IEmotionalTrajectoryPoint {
  variable: string;    // e.g., 'stress', 'anxiety'
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  trend: number;       // slope over the period
}

// ────────────────────────────────────────────────
// Session Summary
// ────────────────────────────────────────────────
export interface ISessionSummary {
  sessionCount: number;
  totalMessages: number;
  totalDurationMs: number;
  avgMessagesPerSession: number;
  avgDurationMs: number;
}

// ────────────────────────────────────────────────
// Intervention Summary
// ────────────────────────────────────────────────
export interface IInterventionSummary {
  totalSuggested: number;
  totalAccepted: number;
  acceptanceRate: number;
  avgEffectiveness: number;
  types: Record<string, number>;
}

// ────────────────────────────────────────────────
// Main Interface
// ────────────────────────────────────────────────
export interface IPDDSnapshot extends Document {
  participantHash: string;
  periodStart: Date;
  periodEnd: Date;
  granularity: 'daily' | 'weekly' | 'monthly';

  // SPSI metrics
  spsi: {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
    trend: number;       // slope
    alertCount: number;
  };

  // EBH metrics
  ebh: {
    mean: number;
    max: number;
    timeInCritical: number;  // % of time in critical/black_hole
  };

  // Emotional trajectories (key variable trends)
  emotionalTrajectories: IEmotionalTrajectoryPoint[];

  // Session activity
  sessions: ISessionSummary;

  // Interventions
  interventions: IInterventionSummary;

  // Self-report data (DASS-21, etc.)
  selfReports: {
    count: number;
    avgDepression?: number;
    avgAnxiety?: number;
    avgStress?: number;
    latestSeverity?: string;
  };

  // Data quality
  dataCompleteness: number;   // [0,1] — how much data is available
  eventCount: number;         // total research events in period

  createdAt: Date;
}

// ────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────
const EmotionalTrajectorySchema = new Schema({
  variable: { type: String, required: true },
  mean: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  stdDev: { type: Number, default: 0 },
  trend: { type: Number, default: 0 },
}, { _id: false });

const SessionSummarySchema = new Schema({
  sessionCount: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  totalDurationMs: { type: Number, default: 0 },
  avgMessagesPerSession: { type: Number, default: 0 },
  avgDurationMs: { type: Number, default: 0 },
}, { _id: false });

const InterventionSummarySchema = new Schema({
  totalSuggested: { type: Number, default: 0 },
  totalAccepted: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 0, min: 0, max: 1 },
  avgEffectiveness: { type: Number, default: 0 },
  types: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const PDDSnapshotSchema = new Schema<IPDDSnapshot>(
  {
    participantHash: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    granularity: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },

    spsi: {
      mean: { type: Number, default: 0 },
      min: { type: Number, default: 1 },
      max: { type: Number, default: 0 },
      stdDev: { type: Number, default: 0 },
      trend: { type: Number, default: 0 },
      alertCount: { type: Number, default: 0 },
    },

    ebh: {
      mean: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      timeInCritical: { type: Number, default: 0, min: 0, max: 1 },
    },

    emotionalTrajectories: [EmotionalTrajectorySchema],
    sessions: { type: SessionSummarySchema, default: () => ({}) },
    interventions: { type: InterventionSummarySchema, default: () => ({}) },

    selfReports: {
      count: { type: Number, default: 0 },
      avgDepression: Number,
      avgAnxiety: Number,
      avgStress: Number,
      latestSeverity: String,
    },

    dataCompleteness: { type: Number, default: 0, min: 0, max: 1 },
    eventCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'pdd_snapshots',
  }
);

// Compound indexes
PDDSnapshotSchema.index({ participantHash: 1, granularity: 1, periodStart: -1 });
PDDSnapshotSchema.index({ granularity: 1, periodStart: -1 });
PDDSnapshotSchema.index(
  { participantHash: 1, granularity: 1, periodStart: 1 },
  { unique: true }
);

// TTL: 5 years
PDDSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 365 * 24 * 3600 });

export const PDDSnapshot = mongoose.model<IPDDSnapshot>('PDDSnapshot', PDDSnapshotSchema);
