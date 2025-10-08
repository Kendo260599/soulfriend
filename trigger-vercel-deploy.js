/**
 * TRIGGER VERCEL DEPLOYMENT
 * Simple script to trigger Vercel deployment via API
 */

const https = require('https');

// Vercel API configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'your-vercel-token-here';
const PROJECT_ID = 'prj_8jgdu2vni'; // SoulFriend frontend project
const TEAM_ID = 'kendo260599s-projects';

console.log('🚀 Triggering Vercel Deployment...');
console.log('Project ID:', PROJECT_ID);
console.log('Team ID:', TEAM_ID);

// Create deployment request
const deploymentData = {
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
};

const postData = JSON.stringify(deploymentData);

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: '/v13/deployments',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending deployment request...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ DEPLOYMENT SUCCESS!');
        console.log('URL:', `https://${response.url}`);
        console.log('ID:', response.id);
        console.log('State:', response.state);
        
        // Save deployment info
        const fs = require('fs');
        const deploymentInfo = {
          url: `https://${response.url}`,
          id: response.id,
          state: response.state,
          createdAt: new Date().toISOString(),
          features: [
            'Chatbot Learning System',
            'Conversation Learning Routes',
            'Feedback Loop',
            'Self-Learning Capabilities',
            'Quality Analysis',
            'Training Data Export'
          ]
        };
        
        fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('💾 Deployment info saved to deployment-info.json');
        
      } else {
        console.log('❌ DEPLOYMENT FAILED');
        console.log('Response:', response);
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

req.write(postData);
req.end();

console.log('⏳ Waiting for response...');
