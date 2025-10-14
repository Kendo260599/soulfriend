/**
 * Test Gemini API Key
 * Verify if Gemini API key is working
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '***REDACTED_GEMINI_KEY***';

console.log('🧪 Testing Gemini API Key...\n');

async function testGemini() {
  try {
    console.log('📝 API Key:', GEMINI_API_KEY.substring(0, 10) + '...' + GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4));
    console.log('');
    
    // Initialize Gemini
    console.log('🔧 Initializing Gemini...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Test with gemini-pro
    console.log('🧪 Testing with gemini-pro model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = 'Xin chào, bạn là ai? Trả lời ngắn gọn bằng tiếng Việt.';
    console.log(`📨 Sending prompt: "${prompt}"`);
    console.log('');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini API is working!');
    console.log('');
    console.log('📤 Response from Gemini:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(text);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Gemini API Key: VALID');
    console.log('✅ Model gemini-pro: WORKING');
    
  } catch (error) {
    console.log('');
    console.log('❌ ERROR: Gemini API failed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.message.includes('API key')) {
      console.log('🔑 API Key Issue:');
      console.log('   - API key may be invalid');
      console.log('   - API key may be expired');
      console.log('   - API key may not have Gemini API enabled');
      console.log('');
      console.log('📋 Steps to fix:');
      console.log('   1. Go to: https://makersuite.google.com/app/apikey');
      console.log('   2. Create a new API key');
      console.log('   3. Update GEMINI_API_KEY in Railway');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.log('📊 Quota Issue:');
      console.log('   - Free tier quota may be exceeded');
      console.log('   - Rate limit reached');
      console.log('');
      console.log('📋 Steps to fix:');
      console.log('   1. Wait for quota reset');
      console.log('   2. Or upgrade to paid tier');
    } else if (error.message.includes('404')) {
      console.log('🔧 Model Issue:');
      console.log('   - Model gemini-pro may not be available');
      console.log('   - Try gemini-1.0-pro or gemini-1.5-pro');
    } else {
      console.log('🔍 Debug Info:');
      console.log('   Error type:', error.constructor.name);
      console.log('   Error code:', error.code);
      console.log('   Full error:', error);
    }
    
    console.log('');
    console.log('❌ Gemini API Key: INVALID or NOT WORKING');
  }
}

testGemini();
