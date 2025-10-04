// Check available models from Gemini API
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...\n');
console.log('📋 Checking available models from API...\n');

// List models endpoint
const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

https.get(listUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      console.log('✅ Available models:\n');
      
      if (json.models && json.models.length > 0) {
        json.models.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`);
          if (model.displayName) console.log(`   Display: ${model.displayName}`);
          if (model.description) console.log(`   Info: ${model.description.substring(0, 80)}...`);
          if (model.supportedGenerationMethods) {
            console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
          }
          console.log('');
        });
        
        // Find first model that supports generateContent
        const workingModel = json.models.find(m => 
          m.supportedGenerationMethods && 
          m.supportedGenerationMethods.includes('generateContent')
        );
        
        if (workingModel) {
          console.log(`\n🎯 Recommended model: ${workingModel.name}`);
          console.log(`   Use: "${workingModel.name.replace('models/', '')}"`);
        }
      } else {
        console.log('⚠️  No models found in response');
      }
    } else {
      console.log(`❌ Failed: ${res.statusCode}`);
      console.log(data);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error:', error.message);
});

