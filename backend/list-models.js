// List available Gemini models for your API key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

console.log('🔑 API Key:', apiKey.substring(0, 20) + '...');
console.log('📋 Listing available models...\n');

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // Try v1 API
    const modelsToTest = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest',
      'gemini-pro-vision',
      'models/gemini-pro',
      'models/gemini-1.5-flash',
    ];

    console.log('Testing models:\n');

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        const text = await result.response.text();
        
        console.log(`✅ ${modelName} - WORKS!`);
        console.log(`   Response: "${text.substring(0, 40)}..."\n`);
        
        // Found a working model, exit
        console.log(`\n🎯 Use this model: "${modelName}"`);
        break;
      } catch (error) {
        console.log(`❌ ${modelName} - ${error.message.substring(0, 80)}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();

