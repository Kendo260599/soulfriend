/**
 * RESEARCH CONSENT MODEL
 * 
 * Theo dõi informed consent cho nghiên cứu PDD/SPSI
 * 
 * GDPR / IRB compliant:
 * - Explicit opt-in required
 * - Consent version tracking
 * - Withdrawal support (right to be forgotten)
 * - Separate consent for different data usage
 * 
 * @module models/ResearchConsent
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IResearchConsent extends Document {
  userId: string;               // real userId (not hashed — needed for consent lookup)
  participantHash: string;      // SHA256(userId + salt) — links to anonymized data

  // Consent flags
  consentGiven: boolean;
  consentVersion: string;       // e.g., '1.0', '1.1'
  consentDate: Date;
  withdrawDate?: Date;

  // Granular consent
  scopes: {
    anonymizedConversation: boolean;
    emotionalMetrics: boolean;
    testResults: boolean;
    interventionOutcomes: boolean;
    longitudinalTracking: boolean;
  };

  // IRB / Ethics
  irbProtocol?: string;         // e.g., 'IRB-2024-001'
  studyId?: string;

  // Metadata
  ipAtConsent?: string;         // IP at time of consent (for audit)
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ResearchConsentSchema = new Schema<IResearchConsent>(
  {
    userId: { type: String, required: true, unique: true },
    participantHash: { type: String, required: true, unique: true },

    consentGiven: { type: Boolean, required: true, default: false },
    consentVersion: { type: String, required: true, default: '1.0' },
    consentDate: { type: Date, required: true, default: Date.now },
    withdrawDate: { type: Date },

    scopes: {
      anonymizedConversation: { type: Boolean, default: false },
      emotionalMetrics: { type: Boolean, default: true },
      testResults: { type: Boolean, default: true },
      interventionOutcomes: { type: Boolean, default: true },
      longitudinalTracking: { type: Boolean, default: true },
    },

    irbProtocol: { type: String },
    studyId: { type: String },

    ipAtConsent: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    collection: 'research_consents',
  }
);

// Index for consent lookup
ResearchConsentSchema.index({ userId: 1, consentGiven: 1 });

export const ResearchConsent = mongoose.model<IResearchConsent>('ResearchConsent', ResearchConsentSchema);
