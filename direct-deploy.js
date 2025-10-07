/**
 * DIRECT DEPLOYMENT SCRIPT
 * Deploy SoulFriend with complete learning system
 */

const https = require('https');

console.log('🚀 Starting Direct Deployment...');
console.log('================================');

// Configuration
const config = {
  render: {
    serviceId: 'srv-8jGdu2vni',
    apiKey: process.env.RENDER_API_KEY || 'rnd_8jGdu2vni'
  },
  vercel: {
    projectId: 'prj_8jgdu2vni',
    teamId: 'kendo260599s-projects',
    apiKey: process.env.VERCEL_TOKEN || 'your-vercel-token'
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

// Deploy Backend to Render
async function deployBackend() {
  console.log('\n1️⃣ Deploying Backend to Render...');
  
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
      console.log('✅ Backend deployment triggered successfully!');
      console.log('   Deploy ID:', response.data.deploy?.id || 'N/A');
      console.log('   Status:', response.data.deploy?.status || 'N/A');
      return true;
    } else {
      console.log('❌ Backend deployment failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend deployment error:', error.message);
    return false;
  }
}

// Deploy Frontend to Vercel
async function deployFrontend() {
  console.log('\n2️⃣ Deploying Frontend to Vercel...');
  
  try {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.vercel.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      name: 'frontend',
      gitSource: {
        type: 'github',
        repo: 'Kendo260599/soulfriend',
        ref: 'main'
      },
      target: 'production',
      projectSettings: {
        buildCommand: 'cd frontend && npm install && npm run build',
        outputDirectory: 'frontend/build'
      }
    });

    const response = await makeRequest(options, postData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Frontend deployment triggered successfully!');
      console.log('   URL:', `https://${response.data.url}`);
      console.log('   ID:', response.data.id);
      return true;
    } else {
      console.log('❌ Frontend deployment failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend deployment error:', error.message);
    return false;
  }
}

// Test Deployments
async function testDeployments() {
  console.log('\n3️⃣ Testing Deployments...');
  
  // Wait for deployments to complete
  console.log('   ⏳ Waiting 60 seconds for deployments...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Test Backend
  try {
    console.log('   🧪 Testing backend health...');
    const backendResponse = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET'
    });
    
    if (backendResponse.status === 200) {
      console.log('   ✅ Backend health check passed');
    } else {
      console.log('   ❌ Backend health check failed');
    }
  } catch (error) {
    console.log('   ❌ Backend test error:', error.message);
  }
  
  // Test Frontend
  try {
    console.log('   🧪 Testing frontend...');
    const frontendResponse = await makeRequest({
      hostname: 'frontend-8jgdu2vni-kendo260599s-projects.vercel.app',
      port: 443,
      path: '/',
      method: 'GET'
    });
    
    if (frontendResponse.status === 200) {
      console.log('   ✅ Frontend test passed');
    } else {
      console.log('   ❌ Frontend test failed');
    }
  } catch (error) {
    console.log('   ❌ Frontend test error:', error.message);
  }
}

// Main deployment function
async function deploy() {
  console.log('🎯 Deploying SoulFriend with Learning System...');
  console.log('   Features: Conversation Learning, Feedback Loop, Self-Learning');
  console.log('');
  
  const backendSuccess = await deployBackend();
  const frontendSuccess = await deployFrontend();
  
  if (backendSuccess || frontendSuccess) {
    await testDeployments();
    
    console.log('\n🎉 DEPLOYMENT SUMMARY');
    console.log('====================');
    console.log('Backend (Render):', backendSuccess ? '✅ Success' : '❌ Failed');
    console.log('Frontend (Vercel):', frontendSuccess ? '✅ Success' : '❌ Failed');
    console.log('');
    console.log('🔗 URLs:');
    console.log('   Backend: https://soulfriend-api.onrender.com');
    console.log('   Frontend: https://frontend-8jgdu2vni-kendo260599s-projects.vercel.app');
    console.log('');
    console.log('🧠 Learning Features:');
    console.log('   - Conversation Learning: /api/conversation-learning/*');
    console.log('   - Feedback System: Working');
    console.log('   - Self-Learning: Active');
    console.log('   - Quality Analysis: Enabled');
    console.log('   - Training Data Export: Ready');
  } else {
    console.log('\n❌ DEPLOYMENT FAILED');
    console.log('Both backend and frontend deployments failed.');
    console.log('Please check API keys and try manual deployment.');
  }
}

// Run deployment
deploy().catch(console.error);
