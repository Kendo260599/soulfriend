// Trigger Vercel Redeploy via API
const fs = require('fs');
const https = require('https');

// Load tokens
const envContent = fs.readFileSync('.env.vercel', 'utf8');
const token = envContent.match(/VERCEL_TOKEN=(.+)/)?.[1]?.trim();
const projectId = envContent.match(/VERCEL_PROJECT_ID=(.+)/)?.[1]?.trim();

console.log('🚀 TRIGGERING VERCEL REDEPLOY...\n');

// Get latest deployment
const options = {
    hostname: 'api.vercel.com',
    path: `/v6/deployments?projectId=${projectId}&limit=1`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            if (response.deployments && response.deployments.length > 0) {
                const latest = response.deployments[0];
                const created = new Date(latest.createdAt);
                const elapsed = (Date.now() - created) / 1000 / 60;
                
                console.log('📊 LATEST DEPLOYMENT:');
                console.log(`   URL: https://${latest.url}`);
                console.log(`   State: ${latest.state}`);
                console.log(`   Ready: ${latest.readyState}`);
                console.log(`   Age: ${elapsed.toFixed(1)} minutes\n`);
                
                if (latest.state === 'READY' && latest.readyState === 'READY') {
                    console.log('✅ DEPLOYMENT IS LIVE!\n');
                    console.log('🧪 TEST NOW:');
                    console.log(`   1. Open: https://${latest.url}`);
                    console.log('   2. Press F12 for Console');
                    console.log('   3. Check for errors');
                    console.log('   4. Test chatbot\n');
                } else {
                    console.log('⏳ Still deploying...\n');
                    console.log('Wait 1-2 minutes and run again: node trigger-redeploy.js\n');
                }
                
                // Save to file
                fs.writeFileSync('deployment-result.txt', `
Latest Deployment Check
Time: ${new Date().toISOString()}

URL: https://${latest.url}
State: ${latest.state}
Ready: ${latest.readyState}
Age: ${elapsed.toFixed(1)} minutes

Status: ${latest.state === 'READY' && latest.readyState === 'READY' ? 'LIVE' : 'DEPLOYING'}
`);
                console.log('✅ Result saved to deployment-result.txt\n');
                
            } else {
                console.log('❌ No deployments found\n');
            }
            
        } catch (error) {
            console.error('❌ Error parsing response:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
});

req.end();


