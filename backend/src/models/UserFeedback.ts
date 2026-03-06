/**
 * USER FEEDBACK MODEL
 * 
 * V5 Learning Pipeline — Module 3: User Feedback Loop
 * Người dùng đánh giá phản hồi AI (helpful/not helpful + emotion change)
 * 
 * @module models/UserFeedback
 * @version 5.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUserFeedback extends Document {
  interactionEventId: mongoose.Types.ObjectId;
  sessionId: string;
  userId: string;
  timestamp: Date;

  // User rating
  rating: 'helpful' | 'not_helpful';
  
  // Emotion change
  emotionChange: 'feel_better' | 'same' | 'still_confused' | 'feel_worse';

  // Optional free text
  freeTextFeedback?: string;

  // Context
  aiResponseSnippet: string; // first 200 chars of AI response
  conversationDepth: number;

  createdAt: Date;
  updatedAt: Date;
}

const UserFeedbackSchema = new Schema<IUserFeedback>(
  {
    interactionEventId: { type: Schema.Types.ObjectId, ref: 'InteractionEvent', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },

    rating: { type: String, enum: ['helpful', 'not_helpful'], required: true },
    emotionChange: {
      type: String,
      enum: ['feel_better', 'same', 'still_confused', 'feel_worse'],
      required: true,
    },
    freeTextFeedback: { type: String, maxlength: 1000 },

    aiResponseSnippet: { type: String, required: true },
    conversationDepth: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'user_feedbacks',
  }
);

UserFeedbackSchema.index({ rating: 1, timestamp: -1 });
UserFeedbackSchema.index({ emotionChange: 1, timestamp: -1 });

export default mongoose.model<IUserFeedback>('UserFeedback', UserFeedbackSchema);
