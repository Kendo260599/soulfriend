/**
 * Script để tạo admin mặc định cho hệ thống
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Kết nối MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin mặc định đã tồn tại');
      process.exit(0);
    }

    // Tạo admin mặc định
    const defaultAdmin = new Admin({
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@soulfriend.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Kendo2605@',
      fullName: 'System Administrator',
      role: 'super_admin',
    });

    await defaultAdmin.save();
    console.log('✅ Tạo admin mặc định thành công');
    console.log(`Username: ${defaultAdmin.username}`);
    console.log(`Email: ${defaultAdmin.email}`);
    console.log('⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin mặc định:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultAdmin();
