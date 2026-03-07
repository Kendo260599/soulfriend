/**
 * COHORT PROFILE MODEL
 * 
 * Stores population-level cohort clustering results and per-user cohort assignments.
 * Supports peer comparison, population benchmarks, and intervention effectiveness tracking.
 * 
 * @module models/CohortProfile
 * @version 1.0.0 — Phase 8: Cohort Analytics
 */

import mongoose, { Schema, Document } from 'mongoose';

// ════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════

export interface ICohortAssignment extends Document {
  userId: string;
  cohortId: number;
  cohortLabel: string;
  similarity: number;          // cosine similarity to cohort centroid [0,1]
  meanStateVector: number[];   // user's average state vector
  assignedAt: Date;
  // Peer comparison metrics
  peerComparison: {
    ebhPercentile: number;       // user's EBH rank within cohort [0,1]
    effectivenessPercentile: number;
    recoveryRatePercentile: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICohortSnapshot extends Document {
  snapshotDate: Date;
  totalUsers: number;
  cohorts: Array<{
    cohortId: number;
    label: string;
    centroid: number[];
    memberCount: number;
    variance: number;
    avgEBH: number;
    avgEffectiveness: number;
    avgRecoveryRate: number;
    dominantSessionType: string;
    topInterventions: Array<{ type: string; successRate: number }>;
  }>;
  populationStats: {
    ebhMean: number;
    ebhStd: number;
    dangerCount: number;
    safeCount: number;
    effectivenessMean: number;
    effectivenessStd: number;
  };
  transitionPatterns: Array<{
    from: string;
    to: string;
    count: number;
    probability: number;
  }>;
  createdAt: Date;
}

// ════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════

const CohortAssignmentSchema = new Schema<ICohortAssignment>({
  userId: { type: String, required: true },
  cohortId: { type: Number, required: true },
  cohortLabel: { type: String, required: true },
  similarity: { type: Number, default: 0 },
  meanStateVector: [{ type: Number }],
  assignedAt: { type: Date, default: Date.now },
  peerComparison: {
    ebhPercentile: { type: Number, default: 0.5 },
    effectivenessPercentile: { type: Number, default: 0.5 },
    recoveryRatePercentile: { type: Number, default: 0.5 },
  },
}, {
  timestamps: true,
});

CohortAssignmentSchema.index({ userId: 1 }, { unique: true });
CohortAssignmentSchema.index({ cohortId: 1 });

const CohortSnapshotSchema = new Schema<ICohortSnapshot>({
  snapshotDate: { type: Date, required: true },
  totalUsers: { type: Number, required: true },
  cohorts: [{
    cohortId: Number,
    label: String,
    centroid: [Number],
    memberCount: Number,
    variance: Number,
    avgEBH: Number,
    avgEffectiveness: Number,
    avgRecoveryRate: Number,
    dominantSessionType: String,
    topInterventions: [{ type: String, successRate: Number }],
  }],
  populationStats: {
    ebhMean: Number,
    ebhStd: Number,
    dangerCount: Number,
    safeCount: Number,
    effectivenessMean: Number,
    effectivenessStd: Number,
  },
  transitionPatterns: [{
    from: String,
    to: String,
    count: Number,
    probability: Number,
  }],
}, {
  timestamps: true,
});

CohortSnapshotSchema.index({ snapshotDate: -1 });

// ════════════════════════════════════════════
// MODELS
// ════════════════════════════════════════════

export const CohortAssignment = mongoose.model<ICohortAssignment>('CohortAssignment', CohortAssignmentSchema);
export const CohortSnapshot = mongoose.model<ICohortSnapshot>('CohortSnapshot', CohortSnapshotSchema);
