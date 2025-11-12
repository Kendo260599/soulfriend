/**
 * Expert Model
 * Stores mental health professionals who can intervene in crisis situations
 */

import bcrypt from 'bcrypt';
import mongoose, { Document, Schema } from 'mongoose';

export interface IExpert extends Document {
  email: string; // Expert email (unique)
  password: string; // Hashed password
  name: string; // Full name
  role: 'crisis_counselor' | 'therapist' | 'admin' | 'supervisor';
  phone?: string; // Contact phone
  specialty: string[]; // ['crisis_intervention', 'mental_health', etc.]
  availability: 'available' | 'busy' | 'offline';
  verified: boolean; // Email verified
  active: boolean; // Account active
  lastLogin?: Date; // Last login timestamp
  interventionStats?: {
    totalInterventions: number;
    activeInterventions: number;
    resolvedInterventions: number;
    averageResponseTime?: number; // in seconds
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ExpertSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['crisis_counselor', 'therapist', 'admin', 'supervisor'],
      default: 'crisis_counselor',
      required: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    specialty: {
      type: [String],
      default: ['crisis_intervention'],
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      required: false,
    },
    interventionStats: {
      totalInterventions: { type: Number, default: 0 },
      activeInterventions: { type: Number, default: 0 },
      resolvedInterventions: { type: Number, default: 0 },
      averageResponseTime: { type: Number, required: false },
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    collection: 'experts',
  }
);

// Hash password before saving
ExpertSchema.pre('save', async function (next) {
  const expert = this as unknown as IExpert;

  // Only hash if password is modified
  if (!expert.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    expert.password = await bcrypt.hash(expert.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
ExpertSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Indexes (email already indexed via unique: true)
ExpertSchema.index({ role: 1, availability: 1 }); // Find available experts by role
ExpertSchema.index({ active: 1, verified: 1 }); // Find active verified experts

export default mongoose.model<IExpert>('Expert', ExpertSchema);

