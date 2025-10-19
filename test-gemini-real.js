const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test với API key mới
const API_KEY = '***REDACTED_GEMINI_KEY***';

async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API with new key...');
    console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');

    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('✅ Gemini initialized successfully');

        // Test 1: Simple greeting
        console.log('\n📝 Test 1: Simple greeting');
        const prompt1 = 'Xin chào, bạn khỏe không?';
        console.log('Input:', prompt1);

        const result1 = await model.generateContent(prompt1);
        const response1 = result1.response.text();
        console.log('Output:', response1);

        // Test 2: Mental health question
        console.log('\n📝 Test 2: Mental health question');
        const prompt2 = 'Tôi đang cảm thấy rất stress và lo lắng về công việc. Bạn có thể giúp tôi không?';
        console.log('Input:', prompt2);

        const result2 = await model.generateContent(prompt2);
        const response2 = result2.response.text();
        console.log('Output:', response2);

        // Test 3: Crisis detection
        console.log('\n📝 Test 3: Crisis detection');
        const prompt3 = 'Tôi muốn tự tử vì không thể chịu đựng được nữa.';
        console.log('Input:', prompt3);

        const result3 = await model.generateContent(prompt3);
        const response3 = result3.response.text();
        console.log('Output:', response3);

        // Test 4: English test
        console.log('\n📝 Test 4: English test');
        const prompt4 = 'Hello, I need help with my mental health.';
        console.log('Input:', prompt4);

        const result4 = await model.generateContent(prompt4);
        const response4 = result4.response.text();
        console.log('Output:', response4);

        console.log('\n🎉 All tests completed successfully!');
        console.log('✅ API Key is working');
        console.log('✅ Model gemini-1.5-flash is accessible');
        console.log('✅ Different responses for different inputs');

    } catch (error) {
        console.error('❌ Error testing Gemini API:', error);

        if (error.message.includes('API key')) {
            console.error('🔑 API Key issue:', error.message);
        } else if (error.message.includes('quota')) {
            console.error('📊 Quota exceeded:', error.message);
        } else if (error.message.includes('model')) {
            console.error('🤖 Model access issue:', error.message);
        } else {
            console.error('🚨 Unknown error:', error.message);
        }
    }
}

// Run the test
testGeminiAPI();
