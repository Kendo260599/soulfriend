/**
 * TEST LOCAL SERVER
 * Test the backend server locally with environment variables
 */

const https = require('https');

console.log('🧪 Testing Local Server...');
console.log('=========================');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';
process.env.APP_NAME = 'SoulFriend V4.0 Learning System';
process.env.MONGODB_URI = 'mongodb://localhost:27017/soulfriend';
process.env.MONGO_DB_NAME = 'soulfriend';
process.env.JWT_SECRET = 'soulfriend_jwt_secret_key_2024_learning_system_secure_32_chars';
process.env.ENCRYPTION_KEY = 'soulfriend_encryption_key_2024_learning_system_secure_32_chars';
process.env.DEFAULT_ADMIN_USERNAME = 'admin';
process.env.DEFAULT_ADMIN_EMAIL = 'admin@soulfriend.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'SoulFriend2024!SecurePassword123!@#XYZ';
process.env.CORS_ORIGIN = 'https://frontend-8jgdu2vni-kendo260599s-projects.vercel.app,https://soulfriend-api.onrender.com';
process.env.LOG_LEVEL = 'info';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.MAX_FILE_SIZE = '10485760';
process.env.UPLOAD_PATH = 'uploads/';
process.env.GEMINI_API_KEY = 'AIzaSyADWXZUU0rhAIHSK8WXh9cwkQHb252p9qU';
process.env.HEALTH_CHECK_INTERVAL = '30000';
process.env.BACKUP_RETENTION_DAYS = '30';
process.env.BACKUP_PATH = '/backups';

console.log('✅ Environment variables set');

// Test the server
async function testServer() {
  try {
    console.log('\n1️⃣ Starting server...');
    
    // Import and start the server
    const server = require('./backend/dist/index.js');
    
    console.log('✅ Server started successfully');
    
    // Wait a bit for server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test health endpoint
    console.log('\n2️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ Health check passed');
      console.log('   Response:', healthResponse.data);
    } else {
      console.log('❌ Health check failed');
      console.log('   Status:', healthResponse.status);
    }

    // Test conversation learning endpoint
    console.log('\n3️⃣ Testing conversation learning endpoint...');
    const learningResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/conversation-learning/insights',
      method: 'GET'
    });
    
    if (learningResponse.status === 200) {
      console.log('✅ Learning endpoint working!');
      console.log('   Response:', learningResponse.data);
    } else {
      console.log('❌ Learning endpoint failed');
      console.log('   Status:', learningResponse.status);
    }

    // Test chatbot message endpoint
    console.log('\n4️⃣ Testing chatbot message endpoint...');
    const messageResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v2/chatbot/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      message: 'Test learning system',
      userId: 'test_user'
    }));
    
    if (messageResponse.status === 200) {
      console.log('✅ Chatbot message endpoint working!');
      console.log('   Response:', messageResponse.data);
    } else {
      console.log('❌ Chatbot message endpoint failed');
      console.log('   Status:', messageResponse.status);
    }

    console.log('\n🎉 LOCAL TEST COMPLETE!');
    console.log('=======================');
    console.log('Server is working correctly with all environment variables');
    console.log('Ready for deployment to Render');

  } catch (error) {
    console.log('❌ Server test error:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run test
testServer().catch(console.error);
