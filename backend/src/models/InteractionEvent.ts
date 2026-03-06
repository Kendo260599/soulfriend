/**
 * INTERACTION EVENT MODEL
 * 
 * V5 Learning Pipeline — Module 1: Data Capture Loop
 * Lưu trữ mọi tương tác user-AI để phục vụ nghiên cứu & cải tiến
 * 
 * @module models/InteractionEvent
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IInteractionEvent extends Document {
  sessionId: string;
  userId: string;
  timestamp: Date;

  // User input
  userText: string;
  userTextLength: number;

  // AI response
  aiResponse: string;
  aiResponseLength: number;
  responseTimeMs: number;

  // Analysis scores
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  sentimentScore: number; // -1.0 to 1.0

  // Conversation context
  conversationStage: 'opening' | 'exploration' | 'deepening' | 'resolution' | 'closing';
  conversationDepth: number; // message index in session
  topicCategory?: string;

  // Escalation
  escalationTriggered: boolean;
  escalationType?: 'crisis' | 'expert_referral' | 'hotline' | 'none';

  // Quality signals
  aiModelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;

  // Metadata
  platform: 'web' | 'mobile' | 'api';
  locale: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const InteractionEventSchema = new Schema<IInteractionEvent>(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },

    userText: { type: String, required: true },
    userTextLength: { type: Number, required: true },

    aiResponse: { type: String, required: true },
    aiResponseLength: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },

    riskLevel: {
      type: String,
      enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'EXTREME'],
      default: 'NONE',
    },
    sentiment: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
      default: 'neutral',
    },
    sentimentScore: { type: Number, default: 0, min: -1, max: 1 },

    conversationStage: {
      type: String,
      enum: ['opening', 'exploration', 'deepening', 'resolution', 'closing'],
      default: 'opening',
    },
    conversationDepth: { type: Number, default: 0 },
    topicCategory: { type: String },

    escalationTriggered: { type: Boolean, default: false },
    escalationType: {
      type: String,
      enum: ['crisis', 'expert_referral', 'hotline', 'none'],
      default: 'none',
    },

    aiModelUsed: { type: String, default: 'gpt-4o-mini' },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },

    platform: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
    locale: { type: String, default: 'vi' },
  },
  {
    timestamps: true,
    collection: 'interaction_events',
  }
);

// Compound indexes for analytics queries
InteractionEventSchema.index({ userId: 1, timestamp: -1 });
InteractionEventSchema.index({ sessionId: 1, conversationDepth: 1 });
InteractionEventSchema.index({ riskLevel: 1, timestamp: -1 });
InteractionEventSchema.index({ sentiment: 1, timestamp: -1 });
InteractionEventSchema.index({ escalationTriggered: 1, timestamp: -1 });

// TTL: auto-delete after 2 years (anonymized data kept separately)
InteractionEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

export default mongoose.model<IInteractionEvent>('InteractionEvent', InteractionEventSchema);
