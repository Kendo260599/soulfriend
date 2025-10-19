const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test với API key mới - đơn giản hơn
const API_KEY = '***REDACTED_GEMINI_KEY***';

async function testGeminiSimple() {
    console.log('🧪 Testing Gemini API (Simple Test)...');
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
    console.log('⏳ Waiting 30 seconds to avoid rate limit...');

    // Wait 30 seconds to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('✅ Gemini initialized successfully');

        // Single simple test
        console.log('\n📝 Single Test: Simple greeting');
        const prompt = 'Hello, how are you?';
        console.log('Input:', prompt);

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        console.log('Output:', response);

        console.log('\n🎉 Test completed successfully!');
        console.log('✅ API Key is working');
        console.log('✅ Model gemini-1.5-flash is accessible');
        console.log('✅ Response received:', response.length, 'characters');

    } catch (error) {
        console.error('❌ Error testing Gemini API:', error.message);

        if (error.message.includes('429') || error.message.includes('quota')) {
            console.error('📊 Rate limit exceeded - API key is working but quota is full');
            console.error('💡 Wait a few minutes and try again');
        } else if (error.message.includes('API key')) {
            console.error('🔑 API Key issue:', error.message);
        } else {
            console.error('🚨 Other error:', error.message);
        }
    }
}

// Run the test
testGeminiSimple();
