const https = require('https');

// Test Cerebras API key với model đúng
const API_KEY = 'csk_yd42vkfdymcx553ryny4r43kfnj2h932r68twvdvtnwyvjjh';

console.log('🔍 Testing Cerebras Chat with correct model...');
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');

async function testCerebrasChat() {
    try {
        const result = await makeCerebrasChatRequest();
        console.log(`✅ Cerebras Chat: ${result.status} - ${result.message}`);

        if (result.status === 200) {
            console.log('🎉 SUCCESS! Cerebras chat is working!');
            console.log('📊 Response:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ Chat failed');
            console.log('📊 Response:', result.data);
        }
    } catch (error) {
        console.log('❌ Error testing chat:', error.message);
    }
}

function makeCerebrasChatRequest() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: 'llama3.1-8b', // Sử dụng model có sẵn
            messages: [
                {
                    role: 'user',
                    content: 'Xin chào, bạn có thể giúp tôi về sức khỏe tâm lý không?'
                }
            ],
            max_tokens: 100,
            temperature: 0.7
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

// Test multiple models
async function testMultipleModels() {
    const models = ['llama3.1-8b', 'qwen-3-32b', 'llama-3.3-70b'];

    for (const model of models) {
        console.log(`\n🧪 Testing model: ${model}`);

        try {
            const result = await makeCerebrasChatRequestWithModel(model);
            console.log(`✅ ${model}: ${result.status} - ${result.message}`);

            if (result.status === 200) {
                console.log('🎉 Model working!');
                console.log('📊 Response:', result.data.choices?.[0]?.message?.content || 'No content');
            } else {
                console.log('❌ Model failed:', result.data);
            }
        } catch (error) {
            console.log('❌ Error with model:', error.message);
        }
    }
}

function makeCerebrasChatRequestWithModel(model) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: 'Hello, how are you?'
                }
            ],
            max_tokens: 50,
            temperature: 0.7
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
    await testCerebrasChat();
    await testMultipleModels();
}

runTests();
