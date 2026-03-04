/**
 * MONGODB MODEL: A/B Testing Experiment
 *
 * Persists experiment definitions, variant assignments, and metrics
 * for the A/B testing framework.
 *
 * @module models/ABExperiment
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// INTERFACES
// =============================================================================

export interface IVariantMetrics {
  exposures: number;
  assessments: number;
  truePositives: number;
  falsePositives: number;
  avgRiskScore: number;
  hitlActivations: number;
  avgSatisfaction: number;
  satisfactionCount: number;
  customEvents: Record<string, number>;
}

export interface IExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
  description: string;
  metrics: IVariantMetrics;
}

export interface IABExperiment extends Document {
  experimentId: string;
  name: string;
  description: string;
  primaryMetric: string;
  status: 'draft' | 'running' | 'paused' | 'concluded';
  variants: IExperimentVariant[];
  minSampleSize: number;
  confidenceThreshold: number;
  winner?: string;
  startedAt?: Date;
  concludedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const VariantMetricsSchema = new Schema<IVariantMetrics>(
  {
    exposures: { type: Number, default: 0 },
    assessments: { type: Number, default: 0 },
    truePositives: { type: Number, default: 0 },
    falsePositives: { type: Number, default: 0 },
    avgRiskScore: { type: Number, default: 0 },
    hitlActivations: { type: Number, default: 0 },
    avgSatisfaction: { type: Number, default: 0 },
    satisfactionCount: { type: Number, default: 0 },
    customEvents: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ExperimentVariantSchema = new Schema<IExperimentVariant>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    config: { type: Schema.Types.Mixed, default: {} },
    description: { type: String, default: '' },
    metrics: { type: VariantMetricsSchema, default: () => ({}) },
  },
  { _id: false }
);

const ABExperimentSchema = new Schema<IABExperiment>(
  {
    experimentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    primaryMetric: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'running', 'paused', 'concluded'],
      default: 'draft',
      index: true,
    },
    variants: {
      type: [ExperimentVariantSchema],
      required: true,
      validate: {
        validator: (v: IExperimentVariant[]) => v.length >= 2,
        message: 'Experiment must have at least 2 variants',
      },
    },
    minSampleSize: {
      type: Number,
      default: 50,
      min: 10,
    },
    confidenceThreshold: {
      type: Number,
      default: 0.95,
      min: 0.8,
      max: 0.99,
    },
    winner: {
      type: String,
    },
    startedAt: {
      type: Date,
    },
    concludedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'ab_experiments',
  }
);

// =============================================================================
// INDEXES
// =============================================================================

ABExperimentSchema.index({ status: 1, createdAt: -1 });

// =============================================================================
// EXPORT
// =============================================================================

export const ABExperiment = mongoose.model<IABExperiment>(
  'ABExperiment',
  ABExperimentSchema
);

export default ABExperiment;
