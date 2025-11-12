/**
 * Model cho tài khoản admin quản trị hệ thống
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface định nghĩa cấu trúc dữ liệu Admin
export interface IAdmin extends Document {
  username: string;             // Tên đăng nhập
  email: string;                // Email admin
  password: string;             // Mật khẩu đã mã hóa
  fullName: string;             // Họ tên đầy đủ
  role: 'super_admin' | 'admin'; // Vai trò admin
  isActive: boolean;            // Trạng thái kích hoạt
  lastLogin?: Date;             // Lần đăng nhập cuối
  loginAttempts: number;        // Số lần đăng nhập sai
  lockUntil?: Date;             // Thời gian khóa tài khoản
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
}

// Schema MongoDB cho Admin
const AdminSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Tên đăng nhập là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [30, 'Tên đăng nhập không được vượt quá 30 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'admins'
});

// Virtual field để kiểm tra tài khoản có bị khóa không
AdminSchema.virtual('isLocked').get(function(this: IAdmin) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Tạo index
AdminSchema.index({ username: 1 });
AdminSchema.index({ email: 1 });
AdminSchema.index({ isActive: 1 });

// Middleware để hash password trước khi lưu
AdminSchema.pre('save', async function(this: IAdmin, next) {
  // Chỉ hash password khi nó được modify
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password với salt rounds = 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method để so sánh password
AdminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method để tăng số lần đăng nhập sai
AdminSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // Nếu có lockUntil và đã hết hạn, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Khóa tài khoản sau 5 lần đăng nhập sai
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Khóa 2 tiếng
    };
  }
  
  return this.updateOne(updates);
};

// Static method để tìm admin và reset login attempts khi đăng nhập thành công
AdminSchema.statics.resetLoginAttempts = function(adminId: string) {
  return this.updateOne(
    { _id: adminId },
    {
      $unset: { lockUntil: 1 },
      $set: { 
        loginAttempts: 0,
        lastLogin: new Date()
      }
    }
  );
};

// Đảm bảo virtual fields được include khi convert sang JSON
AdminSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password; // Không trả về password trong JSON
    return ret;
  }
});

// Export model
const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export default Admin;