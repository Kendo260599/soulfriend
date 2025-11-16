/**
 * LONG-TERM MEMORY MODEL
 * 
 * Model riêng cho long-term memories (insights, patterns, preferences)
 * Khác với ConversationLog (lưu conversations đầy đủ)
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ILongTermMemory extends Document {
  userId: string;
  type: 'insight' | 'pattern' | 'preference' | 'milestone' | 'trigger' | 'coping_strategy' | 'progress' | 'behavior';
  content: string;
  
  metadata: {
    confidence: number; // 0.0-1.0
    source: string; // 'user_feedback', 'conversation_analysis', 'test_results', etc.
    category?: string; // 'work_stress', 'communication_preference', 'coping_strategy', etc.
    intensity?: number; // 0.0-1.0 - Mức độ quan trọng
    frequency?: number; // Số lần xuất hiện
    lastSeen?: Date; // Lần cuối thấy pattern này
    relatedTopics?: string[]; // Topics liên quan
    timeContext?: {
      hour?: number; // Giờ trong ngày (0-23)
      dayOfWeek?: number; // Thứ (0-6)
      timePattern?: string; // 'morning', 'afternoon', 'evening', 'night'
    };
  };
  
  // Vector embedding metadata (for Pinecone sync)
  vectorId?: string; // Reference to Pinecone vector ID
  embeddingGenerated: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const LongTermMemorySchema = new Schema<ILongTermMemory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['insight', 'pattern', 'preference', 'milestone', 'trigger', 'coping_strategy', 'progress', 'behavior'],
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      intensity: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
      frequency: {
        type: Number,
        default: 1,
      },
      lastSeen: {
        type: Date,
        default: Date.now,
      },
      relatedTopics: [{
        type: String,
      }],
      timeContext: {
        hour: Number,
        dayOfWeek: Number,
        timePattern: String,
      },
      source: {
        type: String,
        required: true,
      },
      category: String,
    },
    vectorId: String,
    embeddingGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
LongTermMemorySchema.index({ userId: 1, createdAt: -1 });
LongTermMemorySchema.index({ userId: 1, type: 1 });
LongTermMemorySchema.index({ vectorId: 1 });

const LongTermMemory = mongoose.model<ILongTermMemory>('LongTermMemory', LongTermMemorySchema);

export default LongTermMemory;
