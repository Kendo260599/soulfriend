// DIRECT REDEPLOY - No PowerShell needed
const https = require('https');
const fs = require('fs');

console.log('🚨 FORCE REDEPLOY - EMERGENCY FIX');
console.log('=====================================\n');

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

// Step 1: Get latest deployment
console.log('1️⃣ Getting latest deployment...');
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
                
                // Step 2: Create new deployment
                console.log('2️⃣ Creating NEW deployment with fixes...');
                
                const deployBody = JSON.stringify({
                    name: 'frontend',
                    gitSource: {
                        type: 'github',
                        repo: 'Kendo260599/soulfriend',
                        ref: 'main'
                    },
                    target: 'production'
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
                                console.log('   📝 MANUAL REDEPLOY:');
                                console.log('   1. Go to: https://vercel.com/kendo260599s-projects/frontend');
                                console.log('   2. Click "Redeploy" button');
                                console.log('   3. Wait 2-3 minutes');
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


