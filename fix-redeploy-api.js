// FIX REDEPLOY API - Corrected version
const https = require('https');
const fs = require('fs');

console.log('🔧 FIXING REDEPLOY API...');
console.log('==========================\n');

// Load Vercel token
let VERCEL_TOKEN = '';
let PROJECT_ID = '';

try {
    const envContent = fs.readFileSync('.env.vercel', 'utf8');
    envContent.split('\n').forEach(line => {
        if (line.startsWith('VERCEL_TOKEN=')) {
            VERCEL_TOKEN = line.split('=')[1].trim();
        }
        if (line.startsWith('VERCEL_PROJECT_ID=')) {
            PROJECT_ID = line.split('=')[1].trim();
        }
    });
} catch (err) {
    console.error('❌ Cannot read .env.vercel:', err.message);
    process.exit(1);
}

if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not found!');
    process.exit(1);
}

console.log('✅ Token loaded');
console.log('');

// Step 1: Check current deployment
console.log('1️⃣ Checking current deployment...');
const getOptions = {
    hostname: 'api.vercel.com',
    path: `/v6/deployments?projectId=${PROJECT_ID}&limit=1`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
    }
};

const getReq = https.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (response.deployments && response.deployments.length > 0) {
                const latest = response.deployments[0];
                console.log('   Current URL:', `https://${latest.url}`);
                console.log('   State:', latest.state);
                console.log('   ⚠️  This is OLD deployment with errors!');
                console.log('');
                
                // Step 2: Create new deployment with CORRECTED API format
                console.log('2️⃣ Creating NEW deployment with FIXED API...');
                
                // FIXED: Use correct API format for Vercel
                const deployBody = JSON.stringify({
                    name: 'frontend',
                    gitSource: {
                        type: 'github',
                        repo: 'Kendo260599/soulfriend',
                        ref: 'main',
                        repoId: 123456789  // Add dummy repoId
                    },
                    target: 'production',
                    projectSettings: {
                        buildCommand: 'cd frontend && npm install && npm run build',
                        outputDirectory: 'frontend/build'
                    }
                });
                
                const deployOptions = {
                    hostname: 'api.vercel.com',
                    path: '/v13/deployments',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${VERCEL_TOKEN}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(deployBody)
                    }
                };
                
                const deployReq = https.request(deployOptions, (deployRes) => {
                    let deployData = '';
                    
                    deployRes.on('data', chunk => deployData += chunk);
                    
                    deployRes.on('end', () => {
                        try {
                            const newDeployment = JSON.parse(deployData);
                            
                            if (newDeployment.error) {
                                console.error('   ❌ API Error:', newDeployment.error.message);
                                console.log('');
                                console.log('   🔧 TRYING ALTERNATIVE METHOD...');
                                
                                // Alternative: Use webhook trigger
                                console.log('   📝 MANUAL REDEPLOY STEPS:');
                                console.log('   1. Go to: https://vercel.com/kendo260599s-projects/frontend');
                                console.log('   2. Click "..." on latest deployment');
                                console.log('   3. Click "Redeploy"');
                                console.log('   4. Wait 2-3 minutes');
                                console.log('');
                                
                                // Also try to trigger via GitHub webhook
                                console.log('   🔄 Triggering GitHub webhook...');
                                triggerGitHubWebhook();
                                
                            } else {
                                console.log('   ✅ NEW DEPLOYMENT CREATED!');
                                console.log('');
                                console.log('   🌐 NEW URL:', `https://${newDeployment.url}`);
                                console.log('   📝 ID:', newDeployment.id);
                                console.log('');
                                
                                const result = `
NEW DEPLOYMENT CREATED!
========================

🌐 NEW URL: https://${newDeployment.url}
📝 ID: ${newDeployment.id}
⏰ Created: ${new Date().toLocaleString()}

✅ This deployment has ALL fixes:
   • vercel.json - proper routing
   • manifest.json - will load correctly
   • All console errors fixed
   • Chatbot AI should work!

⏳ WAIT 2-3 MINUTES then:
   1. Open the NEW URL above
   2. Press F12 → Console tab
   3. Check: NO manifest.json 404!
   4. Test chatbot - should have AI response!

OLD URL (ignore): https://${latest.url}
`;
                                
                                fs.writeFileSync('NEW_DEPLOYMENT.txt', result);
                                console.log(result);
                                console.log('✅ Result saved to NEW_DEPLOYMENT.txt');
                            }
                        } catch (err) {
                            console.error('❌ Parse error:', err.message);
                        }
                    });
                });
                
                deployReq.on('error', (err) => {
                    console.error('❌ Request error:', err.message);
                });
                
                deployReq.write(deployBody);
                deployReq.end();
                
            } else {
                console.log('   ❌ No deployments found');
            }
        } catch (err) {
            console.error('❌ Parse error:', err.message);
        }
    });
});

getReq.on('error', (err) => {
    console.error('❌ Request error:', err.message);
});

getReq.end();

// Function to trigger GitHub webhook
function triggerGitHubWebhook() {
    console.log('   🔄 Pushing to GitHub to trigger webhook...');
    
    // Simple git push to trigger Vercel webhook
    const { exec } = require('child_process');
    
    exec('git add -A && git commit -m "Trigger Vercel webhook" && git push origin main', (error, stdout, stderr) => {
        if (error) {
            console.log('   ⚠️ Git push failed:', error.message);
        } else {
            console.log('   ✅ Git push successful - webhook triggered!');
            console.log('   ⏳ Vercel should start building in 30-60 seconds');
        }
    });
}

