/**
 * Test Gemini API Key và Chatbot Status
 */

const API_BASE_URL = 'https://soulfriend-production.up.railway.app/api';

async function testGeminiAPI() {
    console.log('🔍 Testing Gemini API Status...');
    console.log('='.repeat(50));

    try {
        // Test chatbot endpoint
        const response = await fetch(`${API_BASE_URL}/v2/chatbot/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                message: "Xin chào, bạn là ai?",
                sessionId: "test123",
                userId: "test"
            })
        });

        const data = await response.json();

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(data, null, 2));

        if (data.success && data.data) {
            if (data.data.aiGenerated === true) {
                console.log('✅ SUCCESS: Gemini AI is working!');
                console.log('🤖 AI Response:', data.data.response);
            } else {
                console.log('⚠️ WARNING: Chatbot is in offline mode');
                console.log('💬 Offline Response:', data.data.response);
                console.log('🔧 Reason: Gemini API key not configured or invalid');
            }
        } else {
            console.log('❌ ERROR: Invalid response format');
        }

    } catch (error) {
        console.log('❌ ERROR:', error.message);
        console.log('🔧 Possible causes:');
        console.log('   - Backend server not running');
        console.log('   - Network connection issues');
        console.log('   - CORS problems');
    }
}

// Run test
testGeminiAPI();


