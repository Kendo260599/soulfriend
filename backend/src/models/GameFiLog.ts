/**
 * GameFi Action Log — MongoDB Model
 *
 * Stores action logs separately (can grow large).
 * Replaces the in-memory logs[] array in dataLogger.ts.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IGameFiLog extends Document {
  logId: string;
  characterId: string;
  actionType: string;
  growthChange: Record<string, number>;
  questId?: string;
  emotion?: string;
  timestamp: number;
}

const GameFiLogSchema = new Schema<IGameFiLog>(
  {
    logId: { type: String, required: true, unique: true },
    characterId: { type: String, required: true, index: true },
    actionType: { type: String, required: true },
    growthChange: { type: Schema.Types.Mixed, default: {} },
    questId: { type: String },
    emotion: { type: String },
    timestamp: { type: Number, required: true, index: true },
  },
  {
    timestamps: false,
    collection: 'gamefi_logs',
  }
);

// Compound index for efficient per-character queries
GameFiLogSchema.index({ characterId: 1, timestamp: -1 });

export default mongoose.model<IGameFiLog>('GameFiLog', GameFiLogSchema);
