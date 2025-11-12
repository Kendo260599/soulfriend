/**
 * CONVERSATION LOG MODEL
 *
 * Lưu trữ tất cả conversations để chatbot tự học
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IConversationLog extends Document {
  // Conversation info
  conversationId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;

  // User input
  userMessage: string;
  userIntent?: string;
  userSentiment?: string;

  // AI response
  aiResponse: string;
  aiConfidence: number;
  responseTime: number; // milliseconds

  // Context
  conversationContext?: {
    previousMessages?: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    userProfile?: any;
    testResults?: any[];
  };

  // Quality metrics
  wasHelpful?: boolean;
  userRating?: number; // 1-5 stars
  userFeedback?: string;

  // Auto-analysis
  responseQuality?: {
    relevance: number; // 0-1
    clarity: number; // 0-1
    empathy: number; // 0-1
    accuracy: number; // 0-1
  };

  // Learning flags
  needsReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedForTraining: boolean;

  // Metadata
  language: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markAsHelpful(rating?: number, feedback?: string): Promise<IConversationLog>;
  markAsUnhelpful(feedback?: string): Promise<IConversationLog>;
}

export interface IConversationLogModel extends mongoose.Model<IConversationLog> {
  getTrainingData(limit?: number): Promise<IConversationLog[]>;
  getQualityMetrics(periodDays?: number): Promise<any[]>;
}

const ConversationLogSchema = new Schema<IConversationLog>(
  {
    conversationId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // User input
    userMessage: {
      type: String,
      required: true,
    },
    userIntent: String,
    userSentiment: String,

    // AI response
    aiResponse: {
      type: String,
      required: true,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    responseTime: Number,

    // Context
    conversationContext: {
      previousMessages: [
        {
          role: { type: String, enum: ['user', 'assistant'] },
          content: String,
          timestamp: Date,
        },
      ],
      userProfile: Schema.Types.Mixed,
      testResults: [Schema.Types.Mixed],
    },

    // Quality metrics
    wasHelpful: Boolean,
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userFeedback: String,

    // Auto-analysis
    responseQuality: {
      relevance: { type: Number, min: 0, max: 1 },
      clarity: { type: Number, min: 0, max: 1 },
      empathy: { type: Number, min: 0, max: 1 },
      accuracy: { type: Number, min: 0, max: 1 },
    },

    // Learning flags
    needsReview: {
      type: Boolean,
      default: false,
    },
    reviewedBy: String,
    reviewedAt: Date,
    approvedForTraining: {
      type: Boolean,
      default: false,
    },

    // Metadata
    language: {
      type: String,
      default: 'vi',
    },
    platform: String,
  },
  {
    timestamps: true,
    collection: 'conversation_logs',
  }
);

// Composite indexes for performance (removes duplicate single-field indexes)
ConversationLogSchema.index({ sessionId: 1, timestamp: -1 });
ConversationLogSchema.index({ userId: 1, timestamp: -1 });
ConversationLogSchema.index({ conversationId: 1 });
ConversationLogSchema.index({ timestamp: -1 });
ConversationLogSchema.index({ needsReview: 1, approvedForTraining: 1 });

// Methods
ConversationLogSchema.methods.markAsHelpful = function (rating?: number, feedback?: string) {
  this.wasHelpful = true;
  if (rating) {
    this.userRating = rating;
  }
  if (feedback) {
    this.userFeedback = feedback;
  }
  this.approvedForTraining = rating ? rating >= 4 : true;
  return this.save();
};

ConversationLogSchema.methods.markAsUnhelpful = function (feedback?: string) {
  this.wasHelpful = false;
  if (feedback) {
    this.userFeedback = feedback;
  }
  this.needsReview = true;
  return this.save();
};

// Statics
ConversationLogSchema.statics.getTrainingData = async function (limit?: number): Promise<any[]> {
  const query = this.find({
    approvedForTraining: true,
    wasHelpful: true,
  }).sort({ timestamp: -1 });

  if (limit) {
    query.limit(limit);
  }

  return query.exec();
};

ConversationLogSchema.statics.getQualityMetrics = async function (periodDays: number = 30) {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: periodStart },
        wasHelpful: { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        helpful: { $sum: { $cond: ['$wasHelpful', 1, 0] } },
        avgRating: { $avg: '$userRating' },
        avgResponseTime: { $avg: '$responseTime' },
      },
    },
  ]);
};

// Indexes for performance optimization
ConversationLogSchema.index({ sessionId: 1, timestamp: -1 });
ConversationLogSchema.index({ userId: 1, timestamp: -1 });
ConversationLogSchema.index({ conversationId: 1 });
ConversationLogSchema.index({ timestamp: -1 });
ConversationLogSchema.index({ needsReview: 1, approvedForTraining: 1 });

export const ConversationLog = mongoose.model<IConversationLog, IConversationLogModel>(
  'ConversationLog',
  ConversationLogSchema
);

export default ConversationLog;
