/**
 * UPDATE RENDER SERVICE CONFIGURATION
 * Update start command to use new backend with learning system
 */

const https = require('https');

console.log('🔧 Updating Render Service Configuration...');
console.log('==========================================');

// Real API configuration
const config = {
  render: {
    apiKey: 'rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2',
    serviceId: 'srv-d3gn8vfdiees73d90vp0'
  }
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

// Update service configuration
async function updateServiceConfig() {
  console.log('\n1️⃣ Updating service configuration...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${config.render.serviceId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: 'npm install',
          startCommand: 'npm run start'
        }
      }
    });

    console.log('   Updating start command to: npm run start');
    console.log('   Build command: npm install');

    const response = await makeRequest(options, postData);
    
    if (response.status === 200) {
      console.log('✅ Service configuration updated successfully!');
      console.log('   New start command:', response.data.service?.serviceDetails?.envSpecificDetails?.startCommand);
      return true;
    } else {
      console.log('❌ Failed to update service configuration');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Update error:', error.message);
    return false;
  }
}

// Deploy the updated service
async function deployUpdatedService() {
  console.log('\n2️⃣ Deploying updated service...');
  
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
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Updated service deployed successfully!');
      console.log('   Deploy ID:', response.data.deploy?.id || 'N/A');
      console.log('   Status:', response.data.deploy?.status || 'N/A');
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

// Test the updated service
async function testUpdatedService() {
  console.log('\n3️⃣ Testing updated service...');
  
  // Wait for deployment to complete
  console.log('   ⏳ Waiting 60 seconds for deployment to complete...');
  await new Promise(resolve => setTimeout(resolve, 60000));

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

    // Test chatbot message endpoint
    console.log('   🧪 Testing chatbot message endpoint...');
    const messageResponse = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
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
      console.log('   ✅ Chatbot message endpoint working!');
      console.log('   Response:', messageResponse.data);
    } else {
      console.log('   ❌ Chatbot message endpoint failed');
      console.log('   Status:', messageResponse.status);
    }

  } catch (error) {
    console.log('   ❌ Test error:', error.message);
  }
}

// Main update function
async function updateService() {
  console.log('🎯 Updating SoulFriend Backend with Learning System...');
  console.log('   Service ID:', config.render.serviceId);
  console.log('');
  
  // Step 1: Update configuration
  const configSuccess = await updateServiceConfig();
  if (!configSuccess) {
    console.log('❌ Cannot proceed without updating configuration');
    return;
  }

  // Step 2: Deploy updated service
  const deploySuccess = await deployUpdatedService();
  if (!deploySuccess) {
    console.log('❌ Deployment failed');
    return;
  }

  // Step 3: Test updated service
  await testUpdatedService();

  console.log('\n🎉 UPDATE COMPLETE!');
  console.log('==================');
  console.log('Service updated with learning system');
  console.log('URL: https://soulfriend-api.onrender.com');
  console.log('');
  console.log('🧠 Learning Features Available:');
  console.log('   - Conversation Learning: /api/conversation-learning/*');
  console.log('   - Feedback System: /api/conversation-learning/feedback');
  console.log('   - Training Data: /api/conversation-learning/training-data');
  console.log('   - Learning Insights: /api/conversation-learning/insights');
}

// Run update
updateService().catch(console.error);
