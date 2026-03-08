/**
 * Script tạo tài khoản Expert cho hệ thống
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Expert from '../models/Expert';

dotenv.config();

const createExpertAccount = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = 'secret@gmail.com';

    // Kiểm tra đã tồn tại chưa
    const existing = await Expert.findOne({ email });
    if (existing) {
      console.log('ℹ️  Expert account already exists:', email);
      // Update to active/verified if needed
      if (!existing.verified || !existing.active) {
        existing.verified = true;
        existing.active = true;
        await existing.save();
        console.log('✅ Updated account to verified & active');
      }
      process.exit(0);
    }

    // Tạo expert mới
    const expert = new Expert({
      email,
      password: 'mymy123@', // Will be hashed by pre-save hook
      name: 'Secret Expert',
      role: 'supervisor',
      specialty: ['crisis_intervention', 'mental_health'],
      verified: true,
      active: true,
      availability: 'available',
    });

    await expert.save();

    console.log('✅ Expert account created successfully');
    console.log(`   Email: ${expert.email}`);
    console.log(`   Name: ${expert.name}`);
    console.log(`   Role: ${expert.role}`);
    console.log(`   Verified: ${expert.verified}`);
    console.log(`   Active: ${expert.active}`);
  } catch (error) {
    console.error('❌ Error creating expert account:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createExpertAccount();
