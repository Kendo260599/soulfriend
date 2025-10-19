// Phân tích API key format
const API_KEY = '***REDACTED_OPENROUTER_KEY***';

console.log('🔍 API Key Analysis:');
console.log('🔑 Full Key:', API_KEY);
console.log('📏 Length:', API_KEY.length);
console.log('🎯 Prefix:', API_KEY.substring(0, 10));

// Phân tích format
const prefix = API_KEY.substring(0, 10);
console.log('\n📊 Format Analysis:');

if (prefix.startsWith('sk-or-v1-')) {
    console.log('✅ Format: sk-or-v1-*');
    console.log('🤔 Possible services:');
    console.log('   - OpenRouter (most likely)');
    console.log('   - Custom/Private API');
    console.log('   - Third-party AI aggregator');
}

// Test OpenRouter (most likely based on format)
console.log('\n🧪 Testing OpenRouter...');

const https = require('https');

function testOpenRouter() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/models',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
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
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        message: res.statusMessage,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        message: res.statusMessage,
                        data: data.substring(0, 200)
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Test OpenRouter
testOpenRouter()
    .then(result => {
        console.log(`✅ OpenRouter: ${result.status} - ${result.message}`);

        if (result.status === 200) {
            console.log('🎉 SUCCESS! This is an OpenRouter API key!');
            console.log('📊 Available models:', result.data.data?.length || 'Unknown');

            if (result.data.data && result.data.data.length > 0) {
                console.log('🤖 Sample models:');
                result.data.data.slice(0, 5).forEach(model => {
                    console.log(`   - ${model.id} (${model.name})`);
                });
            }
        } else {
            console.log('❌ Not OpenRouter or invalid key');
            console.log('📊 Response:', result.data);
        }
    })
    .catch(error => {
        console.log('❌ OpenRouter test failed:', error.message);
    });
