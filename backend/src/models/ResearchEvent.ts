/**
 * RESEARCH EVENT MODEL
 * 
 * PDD (Psychological Dynamics Dataset) — Event Logging Layer
 * 
 * Ghi lại mọi sự kiện research-relevant trong hệ thống:
 * - message_event: mỗi tin nhắn user/bot
 * - survey_event: hoàn thành DASS-21 hoặc self-report
 * - mood_event: daily mood check-in
 * - intervention_event: hệ thống đề xuất can thiệp
 * - session_event: bắt đầu/kết thúc session
 * - crisis_event: phát hiện khủng hoảng
 * 
 * Privacy: userId được hash (SHA256), không lưu PII
 * 
 * @module models/ResearchEvent
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

// ────────────────────────────────────────────────
// Event Types
// ────────────────────────────────────────────────
export type ResearchEventType =
  | 'message_event'
  | 'survey_event'
  | 'mood_event'
  | 'intervention_event'
  | 'session_event'
  | 'crisis_event';

// ────────────────────────────────────────────────
// Event Payload Interfaces
// ────────────────────────────────────────────────
export interface IMessageEventPayload {
  role: 'user' | 'assistant';
  messageIndex: number;
  wordCount: number;
  // NO raw text — anonymized summary only
  emotionSummary?: Record<string, number>;
  spsiScore?: number;
  ebhScore?: number;
  zone?: string;
}

export interface ISurveyEventPayload {
  testType: 'dass21' | 'phq9' | 'gad7' | 'custom';
  totalScore: number;
  subscaleScores?: Record<string, number>;
  severity?: string;
  completionTimeMs?: number;
}

export interface IMoodEventPayload {
  moodRating: number;      // 1-10
  energyRating?: number;   // 1-10
  sleepQuality?: number;   // 1-10
  socialContact?: boolean;
  selfReportText?: boolean; // flag only, no text
}

export interface IInterventionEventPayload {
  interventionType: string;
  reason: string;
  accepted: boolean;
  preEBH: number;
  postEBH?: number;
  effectiveness?: number;
}

export interface ISessionEventPayload {
  action: 'start' | 'end' | 'timeout';
  durationMs?: number;
  messageCount?: number;
  avgSPSI?: number;
  peakEBH?: number;
}

export interface ICrisisEventPayload {
  riskLevel: 'high' | 'critical';
  triggerSource: string;
  escalated: boolean;
  responseTimeMs?: number;
}

export type ResearchEventPayload =
  | IMessageEventPayload
  | ISurveyEventPayload
  | IMoodEventPayload
  | IInterventionEventPayload
  | ISessionEventPayload
  | ICrisisEventPayload;

// ────────────────────────────────────────────────
// Main Interface
// ────────────────────────────────────────────────
export interface IResearchEvent extends Document {
  // Anonymized identifiers
  participantHash: string;     // SHA256(userId + salt)
  sessionHash: string;         // SHA256(sessionId + salt)

  eventType: ResearchEventType;
  timestamp: Date;
  payload: ResearchEventPayload;

  // Quality & consent
  consentVersion: string;
  dataQuality: number;         // [0,1]

  // Research metadata
  cohortId?: string;
  studyPhase?: string;

  createdAt: Date;
}

// ────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────
const ResearchEventSchema = new Schema<IResearchEvent>(
  {
    participantHash: { type: String, required: true, index: true },
    sessionHash: { type: String, required: true, index: true },

    eventType: {
      type: String,
      required: true,
      enum: [
        'message_event',
        'survey_event',
        'mood_event',
        'intervention_event',
        'session_event',
        'crisis_event',
      ],
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },

    payload: { type: Schema.Types.Mixed, required: true },

    consentVersion: { type: String, required: true, default: '1.0' },
    dataQuality: { type: Number, default: 1.0, min: 0, max: 1 },

    cohortId: { type: String },
    studyPhase: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'research_events',
  }
);

// Compound indexes for research queries
ResearchEventSchema.index({ participantHash: 1, eventType: 1, timestamp: -1 });
ResearchEventSchema.index({ eventType: 1, timestamp: -1 });
ResearchEventSchema.index({ participantHash: 1, timestamp: -1 });

// TTL: 5 years for research data
ResearchEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 365 * 24 * 3600 });

export const ResearchEvent = mongoose.model<IResearchEvent>('ResearchEvent', ResearchEventSchema);
