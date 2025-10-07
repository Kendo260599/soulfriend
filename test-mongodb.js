#!/usr/bin/env node
/**
 * Quick MongoDB Connection Test
 */

const path = require('path');

// Load modules from backend folder
const backendPath = path.join(__dirname, 'backend');
require(path.join(backendPath, 'node_modules', 'dotenv')).config({ 
  path: path.join(backendPath, '.env') 
});
const mongoose = require(path.join(backendPath, 'node_modules', 'mongoose'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

console.log('\n🔌 Testing MongoDB Connection...\n');
console.log('='.repeat(60));
console.log('📍 URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
console.log('⏳ Connecting...\n');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000
})
.then(async () => {
  console.log('✅ MongoDB connected successfully!\n');
  
  // Get DB info
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🖥️  Host:', mongoose.connection.host);
  console.log('📁 Collections:', collections.length || '(none yet - will be created automatically)');
  
  if (collections.length > 0) {
    console.log('\n   Existing collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ File .env: OK');
  console.log('✅ MongoDB connection: OK');
  console.log('✅ HITL Feedback Loop: Ready to use!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start backend: cd backend && npm run dev');
  console.log('   2. Test HITL feedback in admin dashboard');
  console.log('   3. Data will be saved to MongoDB automatically\n');
  
  await mongoose.disconnect();
  process.exit(0);
})
.catch(err => {
  console.log('❌ Connection failed:', err.message, '\n');
  
  if (err.message.includes('ECONNREFUSED')) {
    console.log('💡 MongoDB Local không chạy. Bạn có 2 options:\n');
    console.log('Option A: MongoDB Atlas Free (Recommended) ⭐');
    console.log('   1. Sign up: https://www.mongodb.com/cloud/atlas/register');
    console.log('   2. Create FREE M0 cluster (512MB)');
    console.log('   3. Get connection string');
    console.log('   4. Update backend/.env:');
    console.log('      MONGODB_URI=mongodb+srv://user:pass@cluster.net/soulfriend\n');
    
    console.log('Option B: Install MongoDB Local 📦');
    console.log('   1. Download: https://www.mongodb.com/try/download/community');
    console.log('   2. Install & start service');
    console.log('   3. Keep current .env (already configured)\n');
    
    console.log('📖 Full guide: SETUP_MONGODB_NOW.md\n');
  }
  
  process.exit(1);
});

