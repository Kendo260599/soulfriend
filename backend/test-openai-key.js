/**
 * Test OpenAI API Key
 * Simple script to verify API key works
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env');
  process.exit(1);
}

console.log('🔍 Testing OpenAI API Key...\n');
console.log(`📝 API Key: ${OPENAI_API_KEY.substring(0, 20)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}\n`);

async function testAPIKey() {
  try {
    console.log('📡 Sending test request to OpenAI API...\n');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "API key test successful" if you can read this.'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content;
    
    if (aiResponse) {
      console.log('✅ API Key Test: SUCCESS');
      console.log(`📨 OpenAI Response: ${aiResponse}\n`);
      console.log('✅ API Key is valid and working!\n');
      return true;
    } else {
      console.log('❌ API Key Test: FAILED - Empty response');
      return false;
    }
  } catch (error) {
    console.log('❌ API Key Test: FAILED\n');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('\n❌ API Key is invalid or expired');
      } else if (error.response.status === 429) {
        console.log('\n⚠️  Rate limit exceeded - API key is valid but hit rate limit');
      } else {
        console.log('\n⚠️  API key might be valid but request failed for another reason');
      }
    } else if (error.request) {
      console.log('   Network Error: Could not reach OpenAI API');
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    return false;
  }
}

testAPIKey().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});










