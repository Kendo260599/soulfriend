/**
 * Test OpenAI API Integration
 * Verify API key and test chatbot responses
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API Integration...\n');
console.log(`📝 API Key: ${OPENAI_API_KEY.substring(0, 20)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}\n`);

// Test 1: Direct API Connection
async function testDirectAPI() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Direct API Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.'
          },
          {
            role: 'user',
            content: 'Xin chào, bạn có thể giúp mình không?'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content;
    
    if (aiResponse) {
      console.log('✅ API Connection: SUCCESS');
      console.log(`📨 Response: ${aiResponse}\n`);
      return true;
    } else {
      console.log('❌ API Connection: FAILED - Empty response');
      return false;
    }
  } catch (error) {
    console.log('❌ API Connection: FAILED');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

// Test 2: OpenAIService
async function testOpenAIService() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: OpenAIService');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const openAIService = require('./dist/services/openAIService').default;
    
    if (!openAIService.isReady()) {
      console.log('❌ OpenAIService: NOT READY');
      return false;
    }

    console.log('✅ OpenAIService: Initialized');
    console.log(`   Model: ${openAIService.getStatus().model}\n`);

    const response = await openAIService.generateResponse(
      'Mình đang cảm thấy căng thẳng và lo lắng về công việc.',
      {
        userId: 'test-user',
        sessionId: 'test-session'
      }
    );

    if (response.confidence > 0.5) {
      console.log('✅ OpenAIService.generateResponse(): SUCCESS');
      console.log(`   Confidence: ${response.confidence}`);
      console.log(`   Response: ${response.text.substring(0, 150)}...\n`);
      return true;
    } else {
      console.log('⚠️ OpenAIService.generateResponse(): LOW CONFIDENCE');
      console.log(`   Confidence: ${response.confidence}`);
      console.log(`   Response: ${response.text}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenAIService: FAILED');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 3: EM-Style Reasoner
async function testEMStyleReasoner() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: EM-Style Reasoner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { EMStyleReasoner } = require('./dist/services/emStyleReasoner');
    const reasoner = new EMStyleReasoner();

    const response = await reasoner.reason(
      'Mình không ngủ được, đầu lúc nào cũng căng.',
      'test-user',
      'test-session'
    );

    if (response && response.message) {
      console.log('✅ EM-Style Reasoner: SUCCESS');
      console.log(`   Response: ${response.message.substring(0, 200)}...\n`);
      return true;
    } else {
      console.log('❌ EM-Style Reasoner: FAILED - No response');
      return false;
    }
  } catch (error) {
    console.log('❌ EM-Style Reasoner: FAILED');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 4: Enhanced Chatbot Service
async function testEnhancedChatbot() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Enhanced Chatbot Service');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { EnhancedChatbotService } = require('./dist/services/enhancedChatbotService');
    const chatbot = new EnhancedChatbotService();

    const response = await chatbot.processMessage(
      'Mình đang cảm thấy rất mệt mỏi và không có động lực.',
      'test-user',
      'test-session',
      {
        userProfile: {
          age: 30,
          gender: 'female'
        }
      }
    );

    if (response && response.response) {
      console.log('✅ Enhanced Chatbot Service: SUCCESS');
      console.log(`   Intent: ${response.intent}`);
      console.log(`   Confidence: ${response.confidence}`);
      console.log(`   Risk Level: ${response.riskLevel}`);
      console.log(`   Response: ${response.response.substring(0, 150)}...\n`);
      return true;
    } else {
      console.log('❌ Enhanced Chatbot Service: FAILED - No response');
      return false;
    }
  } catch (error) {
    console.log('❌ Enhanced Chatbot Service: FAILED');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🧪 OpenAI Integration Test Suite        ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const results = {
    directAPI: false,
    openAIService: false,
    emStyleReasoner: false,
    enhancedChatbot: false
  };

  // Test 1
  results.directAPI = await testDirectAPI();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2
  results.openAIService = await testOpenAIService();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3
  results.emStyleReasoner = await testEMStyleReasoner();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4
  results.enhancedChatbot = await testEnhancedChatbot();

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}\n`);

  Object.entries(results).forEach(([test, result]) => {
    console.log(`   ${result ? '✅' : '❌'} ${test}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed === total) {
    console.log('🎉 All tests passed! OpenAI integration is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});












