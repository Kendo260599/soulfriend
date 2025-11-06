/**
 * InterventionMessage Model
 * Stores real-time messages exchanged during HITL interventions
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IInterventionMessage extends Document {
  alertId: string; // Reference to HITL alert
  sessionId: string; // Chat session ID
  userId: string; // User involved
  sender: 'user' | 'expert' | 'system'; // Who sent the message
  senderName?: string; // Expert name (for expert messages)
  senderId?: string; // Expert ID (for expert messages)
  message: string; // Message content
  timestamp: Date; // When message was sent
  read: boolean; // Has it been read by recipient
  metadata?: {
    expertRole?: string; // crisis_counselor, admin, etc.
    interventionAction?: string; // joined, left, closed, etc.
    [key: string]: any;
  };
}

const InterventionMessageSchema: Schema = new Schema(
  {
    alertId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'expert', 'system'],
      required: true,
    },
    senderName: {
      type: String,
      required: false,
    },
    senderId: {
      type: String,
      required: false,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: 'intervention_messages',
  }
);

// Indexes for performance
InterventionMessageSchema.index({ alertId: 1, timestamp: 1 }); // Get messages by alert chronologically
InterventionMessageSchema.index({ sessionId: 1, timestamp: 1 }); // Get session messages
InterventionMessageSchema.index({ userId: 1, timestamp: -1 }); // Get user's recent messages

export default mongoose.model<IInterventionMessage>(
  'InterventionMessage',
  InterventionMessageSchema
);

