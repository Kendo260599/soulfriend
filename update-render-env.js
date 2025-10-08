/**
 * UPDATE RENDER ENVIRONMENT VARIABLES
 * Set all required environment variables for SoulFriend backend
 */

const https = require('https');

console.log('🔧 Updating Render Environment Variables...');
console.log('==========================================');

// Real API configuration
const config = {
  render: {
    apiKey: 'rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2',
    serviceId: 'srv-d3gn8vfdiees73d90vp0'
  }
};

// Required environment variables
const envVars = {
  // Application
  NODE_ENV: 'production',
  PORT: '5000',
  APP_NAME: 'SoulFriend V4.0 Learning System',
  
  // Database
  MONGODB_URI: 'mongodb://localhost:27017/soulfriend',
  MONGO_DB_NAME: 'soulfriend',
  
  // Security
  JWT_SECRET: 'soulfriend_jwt_secret_key_2024_learning_system_secure_32_chars',
  ENCRYPTION_KEY: 'soulfriend_encryption_key_2024_learning_system_secure_32_chars',
  
  // Admin
  DEFAULT_ADMIN_USERNAME: 'admin',
  DEFAULT_ADMIN_EMAIL: 'admin@soulfriend.com',
  DEFAULT_ADMIN_PASSWORD: 'SoulFriend2024!SecureAdmin',
  
  // CORS
  CORS_ORIGIN: 'https://frontend-8jgdu2vni-kendo260599s-projects.vercel.app,https://soulfriend-api.onrender.com',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  
  // File upload
  MAX_FILE_SIZE: '10485760',
  UPLOAD_PATH: 'uploads/',
  
  // External APIs
  GEMINI_API_KEY: 'AIzaSyADWXZUU0rhAIHSK8WXh9cwkQHb252p9qU',
  
  // Monitoring
  HEALTH_CHECK_INTERVAL: '30000',
  
  // Backup
  BACKUP_RETENTION_DAYS: '30',
  BACKUP_PATH: '/backups'
};

// Helper function to make HTTPS requests
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

// Update environment variables
async function updateEnvironmentVariables() {
  console.log('\n1️⃣ Updating environment variables...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${config.render.serviceId}/env-vars`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    // Convert env vars to Render format
    const envVarsArray = Object.entries(envVars).map(([key, value]) => ({
      key,
      value
    }));

    const postData = JSON.stringify({
      envVars: envVarsArray
    });

    console.log('   Setting environment variables:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}=${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    });

    const response = await makeRequest(options, postData);
    
    if (response.status === 200) {
      console.log('✅ Environment variables updated successfully!');
      return true;
    } else {
      console.log('❌ Failed to update environment variables');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Update error:', error.message);
    return false;
  }
}

// Deploy the service with new environment
async function deployWithNewEnv() {
  console.log('\n2️⃣ Deploying with new environment...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${config.render.serviceId}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      clearCache: 'clear'
    });

    const response = await makeRequest(options, postData);
    
    if (response.status === 201 || response.status === 200 || response.status === 202) {
      console.log('✅ Service deployment triggered with new environment!');
      console.log('   Status:', response.status);
      return true;
    } else {
      console.log('❌ Deployment failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Deployment error:', error.message);
    return false;
  }
}

// Test the service after deployment
async function testService() {
  console.log('\n3️⃣ Testing service after deployment...');
  
  // Wait for deployment to complete
  console.log('   ⏳ Waiting 90 seconds for deployment to complete...');
  await new Promise(resolve => setTimeout(resolve, 90000));

  try {
    // Test health endpoint
    console.log('   🧪 Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResponse.status === 200) {
      console.log('   ✅ Health check passed');
      console.log('   Response:', healthResponse.data);
    } else {
      console.log('   ❌ Health check failed');
      console.log('   Status:', healthResponse.status);
    }

    // Test conversation learning endpoint
    console.log('   🧪 Testing conversation learning endpoint...');
    const learningResponse = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/conversation-learning/insights',
      method: 'GET'
    });
    
    if (learningResponse.status === 200) {
      console.log('   ✅ Learning endpoint working!');
      console.log('   Response:', learningResponse.data);
    } else {
      console.log('   ❌ Learning endpoint failed');
      console.log('   Status:', learningResponse.status);
    }

  } catch (error) {
    console.log('   ❌ Test error:', error.message);
  }
}

// Main function
async function updateEnvironment() {
  console.log('🎯 Updating SoulFriend Backend Environment...');
  console.log('   Service ID:', config.render.serviceId);
  console.log('');
  
  // Step 1: Update environment variables
  const envSuccess = await updateEnvironmentVariables();
  if (!envSuccess) {
    console.log('❌ Cannot proceed without updating environment variables');
    return;
  }

  // Step 2: Deploy with new environment
  const deploySuccess = await deployWithNewEnv();
  if (!deploySuccess) {
    console.log('❌ Deployment failed');
    return;
  }

  // Step 3: Test service
  await testService();

  console.log('\n🎉 ENVIRONMENT UPDATE COMPLETE!');
  console.log('===============================');
  console.log('All required environment variables set');
  console.log('Service deployed with new configuration');
  console.log('URL: https://soulfriend-api.onrender.com');
  console.log('');
  console.log('🧠 Learning Features Should Now Be Available:');
  console.log('   - Conversation Learning: /api/conversation-learning/*');
  console.log('   - Feedback System: /api/conversation-learning/feedback');
  console.log('   - Training Data: /api/conversation-learning/training-data');
  console.log('   - Learning Insights: /api/conversation-learning/insights');
}

// Run update
updateEnvironment().catch(console.error);
