/**
 * SAFETY LOG MODEL
 * 
 * V5 Learning Pipeline — Safety Violation Audit Trail
 * Lưu trữ tất cả guardrail violations để compliance & review
 * 
 * @module models/SafetyLog
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyLog extends Document {
  timestamp: Date;
  eventType: 'guardrail_violation' | 'crisis_detected' | 'content_blocked' | 'pii_leak_prevented';
  
  // Context
  sessionId?: string;
  userId?: string;
  
  // Violation details
  violations: Array<{
    rule: string;
    severity: 'warning' | 'critical' | 'block';
    description: string;
    matchedText?: string;
  }>;
  violationCount: number;
  
  // Action taken
  actionTaken: 'allowed' | 'sanitized' | 'blocked' | 'escalated';
  originalResponse?: string;
  sanitizedResponse?: string;
  
  // Crisis-specific
  crisisLevel?: string;
  riskLevel?: string;
  
  // Resolution
  reviewedByExpert: boolean;
  expertNotes?: string;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const SafetyLogSchema = new Schema<ISafetyLog>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    eventType: {
      type: String,
      enum: ['guardrail_violation', 'crisis_detected', 'content_blocked', 'pii_leak_prevented'],
      required: true,
      index: true,
    },
    
    sessionId: { type: String, index: true },
    userId: { type: String, index: true },
    
    violations: [{
      rule: { type: String, required: true },
      severity: { type: String, enum: ['warning', 'critical', 'block'], required: true },
      description: { type: String, required: true },
      matchedText: String,
    }],
    violationCount: { type: Number, default: 0 },
    
    actionTaken: {
      type: String,
      enum: ['allowed', 'sanitized', 'blocked', 'escalated'],
      required: true,
    },
    originalResponse: String,
    sanitizedResponse: String,
    
    crisisLevel: String,
    riskLevel: String,
    
    reviewedByExpert: { type: Boolean, default: false },
    expertNotes: String,
    resolvedAt: Date,
  },
  {
    timestamps: true,
    collection: 'v5_safety_logs',
  }
);

// Compound indexes for querying
SafetyLogSchema.index({ eventType: 1, timestamp: -1 });
SafetyLogSchema.index({ reviewedByExpert: 1, eventType: 1 });
SafetyLogSchema.index({ 'violations.severity': 1, timestamp: -1 });

// Auto-expire old logs after 2 years (compliance retention)
SafetyLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

export const SafetyLog = mongoose.model<ISafetyLog>('SafetyLog', SafetyLogSchema);
export default SafetyLog;
