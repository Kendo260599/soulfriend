/**
 * FIX RENDER DEPLOYMENT
 * Update Render service to use correct build and start commands
 */

const https = require('https');

console.log('🔧 Fixing Render Deployment...');
console.log('=============================');

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

// Get current service configuration
async function getServiceConfig() {
  console.log('\n1️⃣ Getting current service configuration...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${config.render.serviceId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Service configuration retrieved');
      const service = response.data;
      console.log('   Current build command:', service.serviceDetails?.envSpecificDetails?.buildCommand);
      console.log('   Current start command:', service.serviceDetails?.envSpecificDetails?.startCommand);
      return service;
    } else {
      console.log('❌ Failed to get service configuration');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting service configuration:', error.message);
    return null;
  }
}

// Update service configuration with correct commands
async function updateServiceConfig(service) {
  console.log('\n2️⃣ Updating service configuration...');
  
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

    // Update the service configuration with correct build and start commands
    const updatedService = {
      ...service,
      serviceDetails: {
        ...service.serviceDetails,
        envSpecificDetails: {
          ...service.serviceDetails.envSpecificDetails,
          buildCommand: 'npm install && npm run build',
          startCommand: 'node dist/index.js'
        }
      }
    };

    const postData = JSON.stringify(updatedService);

    console.log('   Updating build command to: npm install && npm run build');
    console.log('   Updating start command to: node dist/index.js');

    const response = await makeRequest(options, postData);
    
    if (response.status === 200) {
      console.log('✅ Service configuration updated successfully!');
      console.log('   New build command:', response.data.service?.serviceDetails?.envSpecificDetails?.buildCommand);
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
  console.log('\n3️⃣ Deploying updated service...');
  
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
      console.log('✅ Updated service deployment triggered!');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
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
  console.log('\n4️⃣ Testing service after deployment...');
  
  // Wait for deployment to complete
  console.log('   ⏳ Waiting 120 seconds for deployment to complete...');
  await new Promise(resolve => setTimeout(resolve, 120000));

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
async function fixDeployment() {
  console.log('🎯 Fixing SoulFriend Backend Deployment...');
  console.log('   Service ID:', config.render.serviceId);
  console.log('   Issue: Cannot find module dist/index.js');
  console.log('');
  
  // Step 1: Get current configuration
  const service = await getServiceConfig();
  if (!service) {
    console.log('❌ Cannot proceed without service configuration');
    return;
  }

  // Step 2: Update configuration with correct commands
  const configSuccess = await updateServiceConfig(service);
  if (!configSuccess) {
    console.log('❌ Cannot proceed without updating configuration');
    return;
  }

  // Step 3: Deploy updated service
  const deploySuccess = await deployUpdatedService();
  if (!deploySuccess) {
    console.log('❌ Deployment failed');
    return;
  }

  // Step 4: Test service
  await testService();

  console.log('\n🎉 DEPLOYMENT FIX COMPLETE!');
  console.log('===========================');
  console.log('Service updated with correct build and start commands');
  console.log('URL: https://soulfriend-api.onrender.com');
  console.log('');
  console.log('🧠 Learning Features Should Now Be Available:');
  console.log('   - Conversation Learning: /api/conversation-learning/*');
  console.log('   - Feedback System: /api/conversation-learning/feedback');
  console.log('   - Training Data: /api/conversation-learning/training-data');
  console.log('   - Learning Insights: /api/conversation-learning/insights');
}

// Run fix
fixDeployment().catch(console.error);
