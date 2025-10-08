/**
 * CHECK BUILD LOGS
 * Get detailed build logs from Render to identify deployment issues
 */

const https = require('https');

console.log('🔍 Checking Build Logs...');
console.log('========================');

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

// Get service details and recent deploys
async function getServiceDetails() {
  console.log('\n1️⃣ Getting service details...');
  
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
      console.log('✅ Service details retrieved');
      const service = response.data;
      console.log('   Service:', service.name);
      console.log('   ID:', service.id);
      console.log('   Status:', service.suspended);
      console.log('   Start Command:', service.serviceDetails?.envSpecificDetails?.startCommand);
      console.log('   Build Command:', service.serviceDetails?.envSpecificDetails?.buildCommand);
      console.log('   Root Dir:', service.rootDir);
      console.log('   Branch:', service.branch);
      return service;
    } else {
      console.log('❌ Failed to get service details');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting service details:', error.message);
    return null;
  }
}

// Get recent deploys
async function getRecentDeploys() {
  console.log('\n2️⃣ Getting recent deploys...');
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${config.render.serviceId}/deploys`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Recent deploys retrieved');
      const deploys = response.data;
      
      if (Array.isArray(deploys) && deploys.length > 0) {
        console.log(`   Found ${deploys.length} recent deploys:`);
        
        deploys.slice(0, 3).forEach((deploy, index) => {
          console.log(`   ${index + 1}. Deploy ID: ${deploy.id}`);
          console.log(`      Status: ${deploy.status}`);
          console.log(`      Created: ${deploy.createdAt}`);
          console.log(`      Commit: ${deploy.commit?.message || 'N/A'}`);
          console.log('');
        });
        
        return deploys[0]; // Return most recent deploy
      } else {
        console.log('   No deploys found');
        return null;
      }
    } else {
      console.log('❌ Failed to get recent deploys');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting recent deploys:', error.message);
    return null;
  }
}

// Get deploy logs
async function getDeployLogs(deployId) {
  console.log(`\n3️⃣ Getting logs for deploy ${deployId}...`);
  
  try {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/deploys/${deployId}/logs`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.render.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Deploy logs retrieved');
      console.log('   Logs:');
      console.log('   =====');
      
      if (response.data.logs) {
        response.data.logs.forEach(log => {
          console.log(`   [${log.timestamp}] ${log.message}`);
        });
      } else {
        console.log('   No logs available');
      }
      
      return response.data;
    } else {
      console.log('❌ Failed to get deploy logs');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting deploy logs:', error.message);
    return null;
  }
}

// Check current code structure
async function checkCodeStructure() {
  console.log('\n4️⃣ Checking code structure...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check if backend directory exists
    const backendPath = path.join(process.cwd(), 'backend');
    if (!fs.existsSync(backendPath)) {
      console.log('❌ Backend directory not found');
      return false;
    }
    
    console.log('✅ Backend directory exists');
    
    // Check package.json
    const packageJsonPath = path.join(backendPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('✅ package.json found');
      console.log('   Start script:', packageJson.scripts?.start);
      console.log('   Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    } else {
      console.log('❌ package.json not found');
      return false;
    }
    
    // Check if dist directory exists
    const distPath = path.join(backendPath, 'dist');
    if (fs.existsSync(distPath)) {
      console.log('✅ dist directory exists');
    } else {
      console.log('❌ dist directory not found - needs build');
    }
    
    // Check main files
    const mainFiles = ['src/index.ts', 'src/routes/conversationLearning.ts', 'src/services/conversationLearningService.ts'];
    mainFiles.forEach(file => {
      const filePath = path.join(backendPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    });
    
    return true;
  } catch (error) {
    console.log('❌ Error checking code structure:', error.message);
    return false;
  }
}

// Main function
async function checkBuildLogs() {
  console.log('🎯 Analyzing Build Issues...');
  console.log('   Service ID:', config.render.serviceId);
  console.log('');
  
  // Step 1: Get service details
  const service = await getServiceDetails();
  if (!service) {
    console.log('❌ Cannot proceed without service details');
    return;
  }
  
  // Step 2: Get recent deploys
  const recentDeploy = await getRecentDeploys();
  if (!recentDeploy) {
    console.log('❌ Cannot proceed without deploy information');
    return;
  }
  
  // Step 3: Get deploy logs
  if (recentDeploy.id) {
    await getDeployLogs(recentDeploy.id);
  }
  
  // Step 4: Check code structure
  await checkCodeStructure();
  
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('==================');
  console.log('Service Status:', service.suspended === 'not_suspended' ? 'Active' : 'Suspended');
  console.log('Start Command:', service.serviceDetails?.envSpecificDetails?.startCommand);
  console.log('Build Command:', service.serviceDetails?.envSpecificDetails?.buildCommand);
  console.log('Recent Deploy Status:', recentDeploy.status);
  console.log('');
  console.log('🔧 NEXT STEPS:');
  console.log('1. Review logs above for specific errors');
  console.log('2. Fix any code issues found');
  console.log('3. Trigger new deployment');
}

// Run analysis
checkBuildLogs().catch(console.error);
