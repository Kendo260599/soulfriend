/**
 * DEPLOY WITH REAL RENDER API KEY
 * Deploy SoulFriend backend with actual API credentials
 */

const https = require('https');

console.log('🚀 Deploying with Real Render API Key...');
console.log('==========================================');

// Real API configuration
const config = {
  render: {
    apiKey: 'rnd_4Ctg1gYspxLQlWbMd340k3k0BUs2',
    serviceId: 'srv-8jGdu2vni' // Assuming this is correct, will verify
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

// First, let's get the list of services to find the correct service ID
async function getServices() {
  console.log('\n1️⃣ Getting Render services...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1/services',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Services retrieved successfully!');
      console.log('Raw response:', JSON.stringify(response.data, null, 2));
      
      if (Array.isArray(response.data)) {
        console.log('Available services:');
        const services = response.data.map(item => item.service).filter(Boolean);
        services.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name || 'Unknown'} (ID: ${service.id || 'Unknown'})`);
          console.log(`      Type: ${service.type || 'Unknown'}`);
          console.log(`      Start Command: ${service.serviceDetails?.envSpecificDetails?.startCommand || 'N/A'}`);
          console.log(`      URL: ${service.serviceDetails?.url || 'N/A'}`);
          console.log('');
        });
        return services;
      } else {
        console.log('Response is not an array:', typeof response.data);
        return [];
      }
    } else {
      console.log('❌ Failed to get services');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting services:', error.message);
    return null;
  }
}

// Deploy specific service
async function deployService(serviceId) {
  console.log(`\n2️⃣ Deploying service ${serviceId}...`);
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${serviceId}/deploys`,
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
      console.log('✅ Deployment triggered successfully!');
      console.log('   Deploy ID:', response.data.deploy?.id || 'N/A');
      console.log('   Status:', response.data.deploy?.status || 'N/A');
      console.log('   URL:', response.data.deploy?.url || 'N/A');
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

// Test the deployed service
async function testDeployment(serviceUrl) {
  console.log('\n3️⃣ Testing deployed service...');
  
  if (!serviceUrl) {
    console.log('   ⚠️ No service URL provided, skipping test');
    return;
  }

  try {
    // Test health endpoint
    console.log('   🧪 Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: serviceUrl.replace('https://', '').replace('http://', ''),
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
      hostname: serviceUrl.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/api/conversation-learning/insights',
      method: 'GET'
    });
    
    if (learningResponse.status === 200) {
      console.log('   ✅ Learning endpoint working');
      console.log('   Response:', learningResponse.data);
    } else {
      console.log('   ❌ Learning endpoint failed');
    }

  } catch (error) {
    console.log('   ❌ Test error:', error.message);
  }
}

// Main deployment function
async function deploy() {
  console.log('🎯 Deploying SoulFriend Backend with Learning System...');
  console.log('   API Key:', config.render.apiKey.substring(0, 10) + '...');
  console.log('');
  
  // Step 1: Get services
  const services = await getServices();
  if (!services) {
    console.log('❌ Cannot proceed without service list');
    return;
  }

  // Step 2: Find the correct service (look for soulfriend or backend)
  const targetService = services.find(service => 
    service.name.toLowerCase().includes('soulfriend') || 
    service.name.toLowerCase().includes('backend') ||
    service.name.toLowerCase().includes('api')
  );

  if (!targetService) {
    console.log('❌ No suitable service found');
    console.log('Available services:', services.map(s => s.name));
    return;
  }

  console.log(`\n🎯 Found target service: ${targetService.name} (${targetService.id})`);

  // Step 3: Deploy the service
  const deploySuccess = await deployService(targetService.id);
  
  if (deploySuccess) {
    console.log('\n🎉 DEPLOYMENT SUCCESS!');
    console.log('=====================');
    console.log('Service:', targetService.name);
    console.log('ID:', targetService.id);
    console.log('Status: Deployed');
    console.log('');
    console.log('⏳ Please wait 2-3 minutes for deployment to complete...');
    console.log('Then test the following URLs:');
    console.log('   Health: https://soulfriend-api.onrender.com/api/health');
    console.log('   Learning: https://soulfriend-api.onrender.com/api/conversation-learning/insights');
    
    // Wait and test
    console.log('\n⏳ Waiting 30 seconds before testing...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await testDeployment('https://soulfriend-api.onrender.com');
    
  } else {
    console.log('\n❌ DEPLOYMENT FAILED');
    console.log('Please check the service ID and try manual deployment.');
  }
}

// Run deployment
deploy().catch(console.error);
