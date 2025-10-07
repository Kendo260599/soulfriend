/**
 * TEST MONGODB CONNECTION
 * 
 * Script để test kết nối MongoDB
 * Run: node test-mongodb-connection.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env from backend
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.log('⚠️  .env file not found, using default MongoDB URI');
}

async function testMongoDBConnection() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';
  
  console.log('\n🔌 Testing MongoDB Connection...\n');
  console.log('='.repeat(60));
  
  try {
    // Hide password in logs
    const displayURI = MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@');
    console.log('📍 URI:', displayURI);
    console.log('⏳ Connecting...\n');
    
    // Connect with timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB connected successfully!\n');
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // List databases
    console.log('📊 Available Databases:');
    const { databases } = await admin.listDatabases();
    databases.forEach(database => {
      const sizeMB = (database.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`   - ${database.name.padEnd(20)} ${sizeMB} MB`);
    });
    
    // List collections in soulfriend database
    console.log('\n📁 Collections in "soulfriend":');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   (No collections yet - will be created automatically)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Server info
    console.log('\n🖥️  MongoDB Server Info:');
    const serverInfo = await admin.serverInfo();
    console.log(`   Version: ${serverInfo.version}`);
    console.log(`   Uptime: ${Math.floor(serverInfo.uptime)} seconds`);
    
    // Connection details
    console.log('\n🔗 Connection Details:');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Connection test completed successfully!\n');
    
    // Test creating a sample document
    console.log('🧪 Testing write operation...');
    const TestCollection = mongoose.connection.collection('connection_test');
    await TestCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'MongoDB connection test successful'
    });
    console.log('✅ Write test successful\n');
    
    // Cleanup
    await TestCollection.deleteMany({ test: true });
    console.log('✅ Cleanup completed\n');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('📝 Next steps:');
    console.log('   1. HITL Feedback system is ready to use');
    console.log('   2. Data will be saved to MongoDB automatically');
    console.log('   3. Check data in MongoDB Compass\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection test FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting - MongoDB Local:');
      console.error('   ❌ MongoDB service is not running');
      console.error('\n   📥 Option 1: Install MongoDB Local');
      console.error('      Download: https://www.mongodb.com/try/download/community');
      console.error('      Or Chocolatey: choco install mongodb');
      console.error('\n   ☁️  Option 2: Use MongoDB Atlas (Recommended)');
      console.error('      1. Sign up: https://www.mongodb.com/cloud/atlas/register');
      console.error('      2. Create FREE M0 cluster (512MB)');
      console.error('      3. Get connection string');
      console.error('      4. Update backend/.env:');
      console.error('         MONGODB_URI=mongodb+srv://user:pass@cluster.net/soulfriend');
      console.error('\n   📖 Full guide: SETUP_MONGODB_NOW.md');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check username and password in MONGODB_URI');
      console.error('   - Verify database user exists in MongoDB Atlas');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check network connection');
      console.error('   - Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0)');
      console.error('   - Check firewall settings');
    }
    
    console.error('\n📖 Full documentation: HITL_DATABASE_SETUP.md');
    console.error('📖 Quick start: SETUP_MONGODB_NOW.md\n');
    
    process.exit(1);
  }
}

// Run test
testMongoDBConnection();

