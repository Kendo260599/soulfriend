/**
 * MONGODB MODEL: Audit Log
 *
 * Persistent, queryable audit trail for all security-sensitive operations.
 * Replaces file-based audit logging for container-safe deployments.
 *
 * TTL index auto-deletes logs after retention period (default 3 years).
 */

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// INTERFACE
// =============================================================================

export interface IAuditLog extends Document {
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  expertId?: string;

  // Action details
  action: string; // e.g., 'data_access', 'data_delete', 'login', 'consent_update'
  category: 'auth' | 'data_access' | 'data_modify' | 'data_delete' | 'consent' | 'admin' | 'system';
  resource: string; // e.g., '/api/user/data', 'memory_system'
  method: string; // HTTP method or 'SYSTEM'

  // Request context
  ip: string;
  userAgent: string;
  path: string;
  statusCode?: number;

  // Outcome
  result: 'success' | 'failure';
  errorMessage?: string;

  // Change tracking
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
    description?: string;
  };

  // GDPR compliance metadata
  legalBasis?: string; // e.g., 'GDPR Art. 6(1)(a) - Consent', 'Art. 17 - Right to erasure'
  dataCategories?: string[]; // e.g., ['personal_info', 'test_results', 'conversations']
  processingPurpose?: string;

  // Retention
  expiresAt: Date;

  createdAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    userId: { type: String, index: true },
    userEmail: String,
    expertId: String,

    action: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['auth', 'data_access', 'data_modify', 'data_delete', 'consent', 'admin', 'system'],
      index: true,
    },
    resource: { type: String, required: true },
    method: { type: String, required: true },

    ip: { type: String, default: 'unknown' },
    userAgent: { type: String, default: 'unknown' },
    path: { type: String, required: true },
    statusCode: Number,

    result: {
      type: String,
      required: true,
      enum: ['success', 'failure'],
      index: true,
    },
    errorMessage: String,

    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
      fields: [String],
      description: String,
    },

    legalBasis: String,
    dataCategories: [String],
    processingPurpose: String,

    // TTL field — auto-delete after 3 years (1095 days)
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// TTL index — MongoDB auto-deletes expired documents
AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Composite indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, result: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, category: 1, timestamp: -1 });

// =============================================================================
// STATICS
// =============================================================================

AuditLogSchema.statics.getRecentByUser = async function (
  userId: string,
  limit: number = 50
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

AuditLogSchema.statics.generateReport = async function (
  startDate: Date,
  endDate: Date
) {
  const [stats] = await this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successes: { $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] } },
        failures: { $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] } },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
  ]);

  const categoryBreakdown = await this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const actionBreakdown = await this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return {
    period: { start: startDate, end: endDate },
    totalEvents: stats?.total || 0,
    successfulEvents: stats?.successes || 0,
    failedEvents: stats?.failures || 0,
    uniqueUsers: stats?.uniqueUsers?.filter(Boolean)?.length || 0,
    categoryBreakdown: categoryBreakdown.reduce((acc: any, c: any) => {
      acc[c._id] = c.count;
      return acc;
    }, {}),
    actionBreakdown: actionBreakdown.reduce((acc: any, a: any) => {
      acc[a._id] = a.count;
      return acc;
    }, {}),
  };
};

// =============================================================================
// EXPORT
// =============================================================================

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLogModel;
