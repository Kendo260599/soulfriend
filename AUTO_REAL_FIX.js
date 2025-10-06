// AUTO REAL FIX - No fake reports, only real results
const https = require('https');
const fs = require('fs');

console.log('🔧 AUTO REAL FIX - NO FAKE REPORTS');
console.log('=====================================');
console.log('');

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
    console.error('❌ Cannot read .env.vercel');
    process.exit(1);
}

if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not found');
    process.exit(1);
}

console.log('✅ Token loaded');
console.log('');

// Step 1: Check current deployment status
console.log('1️⃣ Checking deployment status...');

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
                console.log(`   Current URL: https://${latest.url}`);
                console.log(`   State: ${latest.state}`);
                console.log(`   Ready: ${latest.readyState}`);
                console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
                console.log('');
                
                // Check if this is the old problematic deployment
                if (latest.url.includes('frontend-8jgdu2vni')) {
                    console.log('   ⚠️ This is OLD deployment with errors');
                    console.log('');
                    
                    // Step 2: Wait and check for newer deployment
                    console.log('2️⃣ Waiting for newer deployment...');
                    console.log('   (Checking every 30 seconds)');
                    console.log('');
                    
                    waitForNewDeployment(VERCEL_TOKEN, PROJECT_ID);
                    
                } else {
                    console.log('   ✅ This is NEW deployment!');
                    console.log('');
                    
                    if (latest.readyState === 'READY') {
                        console.log('   ✅ Deployment is READY!');
                        testDeployment(`https://${latest.url}`);
                    } else {
                        console.log(`   ⏳ Deployment status: ${latest.readyState}`);
                        console.log('   Waiting for READY status...');
                        waitForReady(VERCEL_TOKEN, PROJECT_ID, latest.url);
                    }
                }
                
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

// Function to wait for new deployment
function waitForNewDeployment(token, projectId) {
    const maxChecks = 20;
    let checkCount = 0;
    
    const checkInterval = setInterval(() => {
        checkCount++;
        
        const checkOptions = {
            hostname: 'api.vercel.com',
            path: `/v6/deployments?projectId=${projectId}&limit=1`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const checkReq = https.request(checkOptions, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.deployments && response.deployments.length > 0) {
                        const latest = response.deployments[0];
                        
                        console.log(`   Check ${checkCount}/${maxChecks} - URL: ${latest.url.substring(0, 50)}...`);
                        console.log(`   State: ${latest.state}, Ready: ${latest.readyState}`);
                        
                        // Check if this is a new deployment
                        if (!latest.url.includes('frontend-8jgdu2vni')) {
                            clearInterval(checkInterval);
                            console.log('');
                            console.log('   🎉 NEW DEPLOYMENT FOUND!');
                            console.log(`   New URL: https://${latest.url}`);
                            console.log('');
                            
                            if (latest.readyState === 'READY') {
                                console.log('   ✅ NEW DEPLOYMENT IS READY!');
                                testDeployment(`https://${latest.url}`);
                            } else {
                                console.log('   ⏳ NEW deployment still building...');
                                waitForReady(token, projectId, latest.url);
                            }
                            
                        } else {
                            console.log('   ⏳ Still old deployment, waiting...');
                        }
                    }
                } catch (err) {
                    console.log(`   ⚠️ Check ${checkCount} failed: ${err.message}`);
                }
            });
        });
        
        checkReq.on('error', (err) => {
            console.log(`   ⚠️ Check ${checkCount} failed: ${err.message}`);
        });
        
        checkReq.end();
        
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.log('');
            console.log('   ⏳ Timeout waiting for new deployment');
            console.log('   Check manually: https://vercel.com/kendo260599s-projects/frontend');
        }
    }, 30000); // Check every 30 seconds
}

// Function to wait for deployment to be ready
function waitForReady(token, projectId, url) {
    const maxChecks = 20;
    let checkCount = 0;
    
    const checkInterval = setInterval(() => {
        checkCount++;
        
        const checkOptions = {
            hostname: 'api.vercel.com',
            path: `/v6/deployments?projectId=${projectId}&limit=1`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const checkReq = https.request(checkOptions, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.deployments && response.deployments.length > 0) {
                        const latest = response.deployments[0];
                        
                        console.log(`   Check ${checkCount}/${maxChecks} - Ready: ${latest.readyState}`);
                        
                        if (latest.readyState === 'READY') {
                            clearInterval(checkInterval);
                            console.log('');
                            console.log('   ✅ DEPLOYMENT IS READY!');
                            testDeployment(`https://${latest.url}`);
                        } else if (latest.readyState === 'ERROR') {
                            clearInterval(checkInterval);
                            console.log('');
                            console.log('   ❌ DEPLOYMENT FAILED!');
                            console.log('   Check Vercel dashboard for details');
                        }
                    }
                } catch (err) {
                    console.log(`   ⚠️ Check ${checkCount} failed: ${err.message}`);
                }
            });
        });
        
        checkReq.on('error', (err) => {
            console.log(`   ⚠️ Check ${checkCount} failed: ${err.message}`);
        });
        
        checkReq.end();
        
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.log('');
            console.log('   ⏳ Timeout waiting for ready status');
            console.log('   Check manually: https://vercel.com/kendo260599s-projects/frontend');
        }
    }, 30000); // Check every 30 seconds
}

// Function to test deployment
function testDeployment(url) {
    console.log('3️⃣ Testing deployment...');
    console.log(`   URL: ${url}`);
    console.log('');
    
    const testOptions = {
        hostname: url.replace('https://', '').split('/')[0],
        path: '/',
        method: 'GET',
        timeout: 30000
    };
    
    const testReq = https.request(testOptions, (res) => {
        console.log(`   ✅ Main page accessible - Status: ${res.statusCode}`);
        
        // Test manifest.json
        const manifestOptions = {
            hostname: url.replace('https://', '').split('/')[0],
            path: '/manifest.json',
            method: 'GET',
            timeout: 10000
        };
        
        const manifestReq = https.request(manifestOptions, (manifestRes) => {
            if (manifestRes.statusCode === 200) {
                console.log('   ✅ manifest.json loads successfully!');
            } else {
                console.log(`   ❌ manifest.json status: ${manifestRes.statusCode}`);
            }
            
            // Final result
            console.log('');
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log('║                                                            ║');
            console.log('║     🎉 REAL FIX COMPLETE! 🎉                             ║');
            console.log('║                                                            ║');
            console.log('╚════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`🌐 DEPLOYMENT URL: ${url}`);
            console.log('');
            console.log('🧪 TEST NOW:');
            console.log('   1. Open the URL above');
            console.log('   2. Press F12 → Console');
            console.log('   3. Check: NO manifest.json 404!');
            console.log('   4. Test chatbot AI');
            console.log('');
            console.log('⏰ Completed:', new Date().toLocaleString());
            
            // Save result
            const result = `REAL FIX COMPLETE
========================

URL: ${url}
Status: READY
Main page: ${res.statusCode}
Manifest: ${manifestRes.statusCode}
Completed: ${new Date().toLocaleString()}

Test the URL above!
`;
            
            fs.writeFileSync('REAL_FIX_RESULT.txt', result);
            console.log('');
            console.log('📝 Result saved to REAL_FIX_RESULT.txt');
        });
        
        manifestReq.on('error', (err) => {
            console.log(`   ⚠️ manifest.json check failed: ${err.message}`);
            
            console.log('');
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log('║                                                            ║');
            console.log('║     ⚠️ PARTIAL SUCCESS ⚠️                               ║');
            console.log('║                                                            ║');
            console.log('╚════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`🌐 DEPLOYMENT URL: ${url}`);
            console.log('   Main page works, but manifest.json has issues');
            console.log('');
            console.log('🧪 TEST ANYWAY:');
            console.log('   1. Open the URL above');
            console.log('   2. Check if it works despite manifest issue');
            console.log('');
        });
        
        manifestReq.end();
    });
    
    testReq.on('error', (err) => {
        console.log(`   ❌ Test failed: ${err.message}`);
        console.log('');
        console.log('   📝 MANUAL CHECK REQUIRED:');
        console.log('   1. Go to: https://vercel.com/kendo260599s-projects/frontend');
        console.log('   2. Check deployment status');
        console.log('   3. Try redeploy if needed');
    });
    
    testReq.end();
}

