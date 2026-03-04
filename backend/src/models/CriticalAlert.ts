/**
 * CRITICAL ALERT MODEL
 *
 * MongoDB persistence for crisis alerts — replaces in-memory Map
 * Ensures data survives server restarts and supports historical analytics
 *
 * @module models/CriticalAlert
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICriticalAlert extends Document {
  alertId: string; // Unique alert ID (ALERT_xxx)
  timestamp: Date;
  userId: string;
  sessionId: string;
  riskLevel: 'CRITICAL' | 'EXTREME';
  riskType: 'suicidal' | 'psychosis' | 'self_harm' | 'violence' | 'manipulation' | 'coercion';
  userMessage: string;
  detectedKeywords: string[];
  userProfile?: any;
  testResults?: any[];
  locationData?: {
    ip?: string;
    city?: string;
    country?: string;
  };
  status: 'pending' | 'acknowledged' | 'intervened' | 'resolved' | 'escalated';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  interventionNotes?: string;
  resolvedAt?: Date;
  resolution?: string;
  escalatedAt?: Date;
  escalationEmailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CriticalAlertSchema = new Schema<ICriticalAlert>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['CRITICAL', 'EXTREME'],
    },
    riskType: {
      type: String,
      required: true,
      enum: ['suicidal', 'psychosis', 'self_harm', 'violence', 'manipulation', 'coercion'],
    },
    userMessage: {
      type: String,
      required: true,
    },
    detectedKeywords: {
      type: [String],
      default: [],
    },
    userProfile: {
      type: Schema.Types.Mixed,
    },
    testResults: {
      type: [Schema.Types.Mixed],
    },
    locationData: {
      ip: String,
      city: String,
      country: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'acknowledged', 'intervened', 'resolved', 'escalated'],
      default: 'pending',
    },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    interventionNotes: String,
    resolvedAt: Date,
    resolution: String,
    escalatedAt: Date,
    escalationEmailSent: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'critical_alerts',
  }
);

// Indexes for performance
CriticalAlertSchema.index({ userId: 1, timestamp: -1 });
CriticalAlertSchema.index({ sessionId: 1 });
CriticalAlertSchema.index({ status: 1, timestamp: -1 });
CriticalAlertSchema.index({ riskLevel: 1, status: 1 });

export default mongoose.model<ICriticalAlert>('CriticalAlert', CriticalAlertSchema);
