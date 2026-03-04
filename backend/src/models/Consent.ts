/**
 * Model cho việc lưu trữ thông tin đồng ý tham gia khảo sát
 * Enhanced with granular consent types, userId binding, and versioning
 */

import mongoose, { Document, Schema } from 'mongoose';

// Interface định nghĩa cấu trúc dữ liệu Consent
export interface IConsent extends Document {
  userId?: string; // Bind consent to specific user/session
  sessionId?: string; // ID phiên làm việc
  agreed: boolean; // Người dùng có đồng ý hay không
  timestamp: Date; // Thời gian đồng ý

  // Granular consent types (GDPR Art. 6 & 7)
  consentTypes: {
    dataProcessing: boolean; // Core data processing
    analytics: boolean; // Usage analytics
    research: boolean; // Research participation
    aiProcessing: boolean; // AI model processing
    marketing: boolean; // Marketing communications
  };

  // Consent version tracking
  consentVersion: string; // e.g., "2.0"
  policyVersion: string; // Privacy policy version consented to

  // Withdrawal tracking
  withdrawn: boolean;
  withdrawnAt?: Date;
  withdrawalReason?: string;

  // Metadata
  ipAddress?: string; // Địa chỉ IP của người dùng
  userAgent?: string; // Thông tin trình duyệt
  source: string; // 'web' | 'api' | 'import'

  // Expiry
  expiresAt?: Date; // Auto-expire consent (re-consent required)

  createdAt: Date;
  updatedAt: Date;
}

// Schema MongoDB cho Consent
const ConsentSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      maxlength: [100, 'Session ID không được vượt quá 100 ký tự'],
    },
    agreed: {
      type: Boolean,
      required: [true, 'Trạng thái đồng ý là bắt buộc'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp là bắt buộc'],
      default: Date.now,
    },

    // Granular consent types
    consentTypes: {
      dataProcessing: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      research: { type: Boolean, default: false },
      aiProcessing: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
    },

    // Version tracking
    consentVersion: {
      type: String,
      default: '2.0',
    },
    policyVersion: {
      type: String,
      default: '1.0',
    },

    // Withdrawal
    withdrawn: {
      type: Boolean,
      default: false,
    },
    withdrawnAt: Date,
    withdrawalReason: String,

    // Metadata
    ipAddress: {
      type: String,
      maxlength: [45, 'IP address không được vượt quá 45 ký tự'],
    },
    userAgent: {
      type: String,
      maxlength: [500, 'User agent không được vượt quá 500 ký tự'],
    },
    source: {
      type: String,
      enum: ['web', 'api', 'import'],
      default: 'web',
    },

    // Auto-expire
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'consents',
  }
);

// Indexes
ConsentSchema.index({ timestamp: -1 });
ConsentSchema.index({ agreed: 1 });
ConsentSchema.index({ userId: 1, timestamp: -1 });
ConsentSchema.index({ withdrawn: 1, userId: 1 });
ConsentSchema.index({ 'consentTypes.dataProcessing': 1 });

// Virtual field để hiển thị thời gian theo múi giờ Việt Nam
ConsentSchema.virtual('timestampVN').get(function (this: IConsent) {
  return this.timestamp.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
});

// Check if consent is still active (not withdrawn, not expired)
ConsentSchema.methods.isActive = function (): boolean {
  if (this.withdrawn) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return this.agreed;
};

// Statics: Get active consent for a user
ConsentSchema.statics.getActiveConsent = async function (userId: string) {
  return this.findOne({
    userId,
    agreed: true,
    withdrawn: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ timestamp: -1 });
};

// Statics: Withdraw consent for a user
ConsentSchema.statics.withdrawConsent = async function (
  userId: string,
  reason?: string
) {
  return this.updateMany(
    { userId, agreed: true, withdrawn: false },
    {
      $set: {
        withdrawn: true,
        withdrawnAt: new Date(),
        withdrawalReason: reason || 'User initiated withdrawal',
      },
    }
  );
};

ConsentSchema.set('toJSON', { virtuals: true });

const Consent = mongoose.model<IConsent>('Consent', ConsentSchema);
export default Consent;
