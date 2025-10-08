/**
 * Model cho việc lưu trữ thông tin đồng ý tham gia khảo sát
 */

import mongoose, { Document, Schema } from 'mongoose';

// Interface định nghĩa cấu trúc dữ liệu Consent
export interface IConsent extends Document {
  agreed: boolean; // Người dùng có đồng ý hay không
  timestamp: Date; // Thời gian đồng ý
  ipAddress?: string; // Địa chỉ IP của người dùng
  userAgent?: string; // Thông tin trình duyệt
  sessionId?: string; // ID phiên làm việc (optional)
  createdAt: Date;
  updatedAt: Date;
}

// Schema MongoDB cho Consent
const ConsentSchema: Schema = new Schema(
  {
    agreed: {
      type: Boolean,
      required: [true, 'Trạng thái đồng ý là bắt buộc'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp là bắt buộc'],
      default: Date.now,
    },
    ipAddress: {
      type: String,
      maxlength: [45, 'IP address không được vượt quá 45 ký tự'], // IPv6 max length
    },
    userAgent: {
      type: String,
      maxlength: [500, 'User agent không được vượt quá 500 ký tự'],
    },
    sessionId: {
      type: String,
      maxlength: [100, 'Session ID không được vượt quá 100 ký tự'],
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    collection: 'consents', // Tên collection trong MongoDB
  }
);

// Tạo index để tối ưu query
ConsentSchema.index({ timestamp: -1 }); // Index giảm dần theo thời gian
ConsentSchema.index({ agreed: 1 }); // Index theo trạng thái đồng ý
ConsentSchema.index({ ipAddress: 1 }); // Index theo IP address

// Virtual field để hiển thị thời gian theo múi giờ Việt Nam
ConsentSchema.virtual('timestampVN').get(function (this: IConsent) {
  return this.timestamp.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
});

// Đảm bảo virtual fields được include khi convert sang JSON
ConsentSchema.set('toJSON', { virtuals: true });

// Export model
const Consent = mongoose.model<IConsent>('Consent', ConsentSchema);
export default Consent;
