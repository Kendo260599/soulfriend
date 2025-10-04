const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function listAvailableModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found');
      return;
    }

    console.log('🔑 API Key found:', apiKey.substring(0, 20) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models
    try {
      const models = await genAI.listModels();
      console.log('📋 Available models:');
      models.forEach(model => {
        console.log(`   • ${model.name}`);
        console.log(`     Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'Unknown'}`);
      });
    } catch (listError) {
      console.log('⚠️  Cannot list models:', listError.message);
    }

    // Test different model names
    const testModels = [
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-1.0-flash',
      'models/gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro'
    ];

    console.log('\n🧪 Testing models:');
    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`   ✅ ${modelName}: Working`);
        break; // Stop at first working model
      } catch (error) {
        console.log(`   ❌ ${modelName}: ${error.message.split('\n')[0]}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAvailableModels();
