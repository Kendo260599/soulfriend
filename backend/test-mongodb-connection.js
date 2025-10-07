/**
 * TEST MONGODB CONNECTION
 * 
 * Script để test kết nối MongoDB
 * Run: node backend/test-mongodb-connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

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
    console.log('   1. Start backend server: cd backend && npm run dev');
    console.log('   2. HITL Feedback data will be saved to MongoDB');
    console.log('   3. Check data in MongoDB Compass\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection test FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - MongoDB service is not running');
      console.error('   - Check if MongoDB is installed: mongod --version');
      console.error('   - Start MongoDB service:');
      console.error('     Windows: net start MongoDB');
      console.error('     macOS: brew services start mongodb-community');
      console.error('     Linux: sudo systemctl start mongod');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check username and password in MONGODB_URI');
      console.error('   - Verify database user exists in MongoDB Atlas');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check network connection');
      console.error('   - Verify IP whitelist in MongoDB Atlas');
      console.error('   - Check firewall settings');
    }
    
    console.error('\n📖 Full documentation: HITL_DATABASE_SETUP.md\n');
    
    process.exit(1);
  }
}

// Run test
testMongoDBConnection();

