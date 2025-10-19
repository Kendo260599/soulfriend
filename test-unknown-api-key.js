const https = require('https');

// Test API key không xác định
const API_KEY = '***REDACTED_OPENROUTER_KEY***';

async function testUnknownAPIKey() {
    console.log('🔍 Testing unknown API key...');
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');

    // Test các AI services phổ biến
    const services = [
        {
            name: 'OpenAI',
            url: 'https://api.openai.com/v1/models',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        },
        {
            name: 'Anthropic Claude',
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            method: 'POST',
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }]
            })
        },
        {
            name: 'Google Gemini',
            url: 'https://generativelanguage.googleapis.com/v1beta/models',
            headers: { 'x-goog-api-key': API_KEY }
        },
        {
            name: 'Cohere',
            url: 'https://api.cohere.ai/v1/models',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        },
        {
            name: 'Hugging Face',
            url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        }
    ];

    for (const service of services) {
        console.log(`\n🧪 Testing ${service.name}...`);

        try {
            const result = await makeRequest(service);
            console.log(`✅ ${service.name}: ${result.status} - ${result.message}`);

            if (result.data) {
                console.log(`📊 Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`❌ ${service.name}: ${error.message}`);
        }
    }
}

function makeRequest(service) {
    return new Promise((resolve, reject) => {
        const url = new URL(service.url);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: service.method || 'GET',
            headers: service.headers
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

        if (service.body) {
            req.write(service.body);
        }

        req.end();
    });
}

// Run the test
testUnknownAPIKey();
