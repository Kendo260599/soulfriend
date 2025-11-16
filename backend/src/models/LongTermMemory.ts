/**
 * LONG-TERM MEMORY MODEL
 * 
 * Model riêng cho long-term memories (insights, patterns, preferences)
 * Khác với ConversationLog (lưu conversations đầy đủ)
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ILongTermMemory extends Document {
  userId: string;
  type: 'insight' | 'pattern' | 'preference' | 'milestone';
  content: string;
  
  metadata: {
    confidence: number; // 0.0-1.0
    source: string; // 'user_feedback', 'conversation_analysis', 'test_results', etc.
    category?: string; // 'work_stress', 'communication_preference', 'coping_strategy', etc.
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
      enum: ['insight', 'pattern', 'preference', 'milestone'],
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
