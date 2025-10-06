// Test Gemini API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Gemini API Key...');
console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND'}`);

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
}

async function testAPI() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        console.log('🧪 Testing API call...');
        
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ API Key is working!');
        console.log('🤖 AI Response:', text);
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('🔑 API Key is invalid or expired');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error('🚫 API Key does not have permission');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error('📊 API quota exceeded');
        } else {
            console.error('🔧 Other error:', error);
        }
    }
}

testAPI();

