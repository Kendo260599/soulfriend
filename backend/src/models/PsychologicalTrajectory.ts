/**
 * PSYCHOLOGICAL TRAJECTORY MODEL
 * 
 * PGE — Psychological Gravity Engine
 * Lưu trữ kết quả mô phỏng quỹ đạo tâm lý tương lai.
 * 
 * Mô phỏng: S(t+1) = S(t) + Δt·(A·S(t) + B·I(t))
 * Dự đoán trạng thái tương lai, phát hiện emotional black hole.
 * 
 * @module models/PsychologicalTrajectory
 * @version 1.0.0 — PGE Phase 1
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITrajectoryPoint {
  step: number;
  stateVector: Record<string, number>;
  potentialEnergy: number;
  ebhScore: number;
  zone: string;
}

export interface IPsychologicalTrajectory extends Document {
  userId: string;
  sessionId: string;
  simulatedAt: Date;
  
  // Starting point
  initialState: Record<string, number>;
  
  // Trajectory
  steps: number;              // number of simulated steps
  deltaT: number;             // time step size
  trajectory: ITrajectoryPoint[];
  
  // Predictions
  predictedZone: 'safe' | 'caution' | 'risk' | 'critical' | 'black_hole';
  predictedAttractor: string;
  convergenceStep: number;    // step at which trajectory converges (dS/dt ≈ 0)
  maxEbhScore: number;        // max EBH score across trajectory
  
  // Early warning
  earlyWarning: boolean;
  warningType?: 'approaching_attractor' | 'increasing_inertia' | 'loop_strengthening' | 'hope_depleting';
  warningMessage?: string;
  
  // Confidence
  matrixVersion: number;      // which InteractionMatrix version was used
  confidence: number;         // [0,1]
  
  createdAt: Date;
}

const TrajectoryPointSchema = new Schema({
  step: Number,
  stateVector: Schema.Types.Mixed,
  potentialEnergy: Number,
  ebhScore: Number,
  zone: String,
}, { _id: false });

const PsychologicalTrajectorySchema = new Schema<IPsychologicalTrajectory>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    simulatedAt: { type: Date, default: Date.now },
    
    initialState: { type: Schema.Types.Mixed, required: true },
    
    steps: { type: Number, default: 10 },
    deltaT: { type: Number, default: 1.0 },
    trajectory: [TrajectoryPointSchema],
    
    predictedZone: {
      type: String,
      enum: ['safe', 'caution', 'risk', 'critical', 'black_hole'],
      default: 'safe',
    },
    predictedAttractor: String,
    convergenceStep: { type: Number, default: -1 },
    maxEbhScore: { type: Number, default: 0 },
    
    earlyWarning: { type: Boolean, default: false },
    warningType: {
      type: String,
      enum: ['approaching_attractor', 'increasing_inertia', 'loop_strengthening', 'hope_depleting'],
    },
    warningMessage: String,
    
    matrixVersion: { type: Number, default: 1 },
    confidence: { type: Number, default: 0.5 },
  },
  {
    timestamps: true,
    collection: 'pge_trajectories',
  }
);

PsychologicalTrajectorySchema.index({ userId: 1, simulatedAt: -1 });
PsychologicalTrajectorySchema.index({ earlyWarning: 1, simulatedAt: -1 });

// TTL: 1 year
PsychologicalTrajectorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export const PsychologicalTrajectory = mongoose.model<IPsychologicalTrajectory>(
  'PsychologicalTrajectory',
  PsychologicalTrajectorySchema
);

export default PsychologicalTrajectory;
