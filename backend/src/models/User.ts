/**
 * User Model - Regular user authentication
 * 
 * Minimal data collection for privacy:
 * - Only email + hashed password
 * - No personal info (name, phone, etc.)
 * - Anonymous display name auto-generated
 * 
 * @module models/User
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    displayName: {
      type: String,
      default: function () {
        return `User_${Math.random().toString(36).substring(2, 8)}`;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for fast lookups
// email already has unique index from field definition
UserSchema.index({ createdAt: -1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
