/**
 * SESSION METRICS MODEL
 * 
 * Stores aggregated session-level psychological metrics.
 * Used by the Adaptive Session Manager (Phase 7) to optimize
 * engagement timing, track recovery patterns, and predict
 * session readiness.
 * 
 * @module models/SessionMetrics
 * @version 1.0.0 — Phase 7: Adaptive Session Manager
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionMetrics extends Document {
  userId: string;
  sessionId: string;

  // Timing
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  hourOfDay: number;         // 0-23, for optimal window analysis

  // EBH trajectory
  startEBH: number;
  endEBH: number;
  deltaEBH: number;         // negative = improved
  minEBH: number;
  maxEBH: number;

  // ES trajectory
  startES: number;
  endES: number;
  deltaES: number;           // positive = improved

  // Engagement
  messageCount: number;
  engagementLevel: 'low' | 'medium' | 'high';
  sessionDepth: number;      // [0,1] — emotional depth of conversation

  // Recovery
  messagesToRecovery: number; // -1 if never recovered
  recoveryRate: number;       // EBH improvement per message

  // Classification
  sessionType: 'crisis' | 'intervention' | 'maintenance' | 'growth';
  startZone: string;
  endZone: string;
  trend: string;             // improving, stable, deteriorating

  // Effectiveness
  effectivenessScore: number; // [0,1]
  interventionApplied: boolean;
  interventionType?: string;

  // Predictions
  optimalNextHours: number[]; // recommended hours for next session

  // Metadata
  createdAt: Date;
}

const SessionMetricsSchema = new Schema<ISessionMetrics>({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  hourOfDay: { type: Number, required: true },

  startEBH: { type: Number, required: true },
  endEBH: { type: Number, required: true },
  deltaEBH: { type: Number, required: true },
  minEBH: { type: Number, required: true },
  maxEBH: { type: Number, required: true },

  startES: { type: Number, default: 0 },
  endES: { type: Number, default: 0 },
  deltaES: { type: Number, default: 0 },

  messageCount: { type: Number, required: true },
  engagementLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  sessionDepth: { type: Number, default: 0 },

  messagesToRecovery: { type: Number, default: -1 },
  recoveryRate: { type: Number, default: 0 },

  sessionType: { type: String, enum: ['crisis', 'intervention', 'maintenance', 'growth'], default: 'maintenance' },
  startZone: { type: String, required: true },
  endZone: { type: String, required: true },
  trend: { type: String, default: 'stable' },

  effectivenessScore: { type: Number, default: 0 },
  interventionApplied: { type: Boolean, default: false },
  interventionType: { type: String },

  optimalNextHours: { type: [Number], default: [] },

  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'session_metrics',
});

// Compound index for user session queries
SessionMetricsSchema.index({ userId: 1, createdAt: -1 });
SessionMetricsSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const SessionMetrics = mongoose.model<ISessionMetrics>('SessionMetrics', SessionMetricsSchema);
