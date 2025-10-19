const https = require('https');

// Test Cerebras API key
const API_KEY = '***REDACTED_CEREBRAS_KEY***';

console.log('🔍 Testing Cerebras API key...');
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
console.log('📏 Length:', API_KEY.length);

async function testCerebrasAPI() {
    try {
        // Test Cerebras API endpoint
        const result = await makeCerebrasRequest();
        console.log(`✅ Cerebras API: ${result.status} - ${result.message}`);

        if (result.status === 200) {
            console.log('🎉 SUCCESS! Cerebras API key is working!');
            console.log('📊 Response:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ API key issue or service unavailable');
            console.log('📊 Response:', result.data);
        }
    } catch (error) {
        console.log('❌ Error testing Cerebras API:', error.message);
    }
}

function makeCerebrasRequest() {
    return new Promise((resolve, reject) => {
        // Cerebras API endpoint for models
        const options = {
            hostname: 'api.cerebras.ai',
            port: 443,
            path: '/v1/models',
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
                        data: data.substring(0, 500)
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

// Test chat completion endpoint
async function testCerebrasChat() {
    console.log('\n🧪 Testing Cerebras Chat Completion...');

    try {
        const result = await makeCerebrasChatRequest();
        console.log(`✅ Cerebras Chat: ${result.status} - ${result.message}`);

        if (result.status === 200) {
            console.log('🎉 Chat completion working!');
            console.log('📊 Response:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ Chat completion failed');
            console.log('📊 Response:', result.data);
        }
    } catch (error) {
        console.log('❌ Error testing chat:', error.message);
    }
}

function makeCerebrasChatRequest() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: 'cerebras-llama-2-7b-chat',
            messages: [
                {
                    role: 'user',
                    content: 'Hello, how are you?'
                }
            ],
            max_tokens: 50
        });

        const options = {
            hostname: 'api.cerebras.ai',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
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
                        data: data.substring(0, 500)
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Run tests
async function runTests() {
    await testCerebrasAPI();
    await testCerebrasChat();
}

runTests();
