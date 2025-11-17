/**
 * Test Chatbot with Short Messages
 * Verify that Pinecone gets updated with new insights
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const PRODUCTION_API = 'https://soulfriend-api.onrender.com';

// Use production by default
const BASE_URL = PRODUCTION_API;

// Test messages (including short ones that should now work)
const TEST_MESSAGES = [
  'Tôi buồn',           // 7 chars - should create micro-insight
  'Cảm ơn',             // 7 chars - should create micro-insight
  'Lo lắng quá',        // 12 chars - should create micro-insight
  'Tôi đang stress về công việc và gia đình', // Long message - full insight
];

async function testChatbot() {
  try {
    console.log('\n🧪 TESTING CHATBOT WITH SHORT MESSAGES...\n');
    console.log(`API URL: ${BASE_URL}\n`);

    const userId = `test_pinecone_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;

    console.log(`Test User ID: ${userId}`);
    console.log(`Session ID: ${sessionId}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    for (let i = 0; i < TEST_MESSAGES.length; i++) {
      const message = TEST_MESSAGES[i];
      console.log(`📝 Message ${i + 1}/${TEST_MESSAGES.length}: "${message}" (${message.length} chars)`);

      try {
        const response = await axios.post(`${BASE_URL}/api/v2/chatbot/message`, {
          message,
          userId,
          sessionId,
        }, {
          timeout: 30000, // 30 second timeout
        });

        console.log(`✅ Response received:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Crisis Level: ${response.data.crisisLevel || 'none'}`);
        console.log(`   Emotional State: ${response.data.emotionalState || 'none'}`);
        console.log(`   Response: ${response.data.response?.substring(0, 100)}...`);
        
        if (response.data.memoryContext) {
          console.log(`   Memory Context:`);
          console.log(`     - Working Memory: ${response.data.memoryContext.hasWorkingMemory ? '✅' : '❌'}`);
          console.log(`     - Short-term: ${response.data.memoryContext.shortTermCount} items`);
          console.log(`     - Long-term: ${response.data.memoryContext.longTermCount} items`);
        }

        console.log('');

        // Wait 2 seconds between messages
        if (i < TEST_MESSAGES.length - 1) {
          console.log('⏳ Waiting 2 seconds before next message...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.log('⚠️  Request timeout - API might be slow or down\n');
        } else if (error.response) {
          console.log(`❌ Error ${error.response.status}: ${error.response.statusText}`);
          console.log(`   Message: ${error.response.data?.message || 'No error message'}\n`);
        } else if (error.request) {
          console.log('❌ No response from server - check if API is running\n');
        } else {
          console.log(`❌ Error: ${error.message}\n`);
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Test completed!\n');
    console.log('📊 NEXT STEPS TO VERIFY PINECONE UPDATE:\n');
    console.log('1. Run: node check-pinecone.js');
    console.log('   → Vector count should be > 159 (was 159 before)\n');
    console.log('2. Check Render logs:');
    console.log('   → Look for "🔬 Micro-insight saved from short message"');
    console.log('   → Look for "✅ Long-term memory saved for user"');
    console.log('   → Look for "(Vector ID: ...)"');
    console.log(`   → User ID to search: ${userId}\n`);
    console.log('3. If vector count increased:');
    console.log('   ✅ Pinecone IS updating continuously!\n');
    console.log('4. If vector count same:');
    console.log('   ⚠️  Check logs for errors');
    console.log('   ⚠️  Verify PINECONE_API_KEY in Render env vars\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testChatbot();
