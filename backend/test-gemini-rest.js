// Test Gemini API using REST directly
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 Testing Gemini API with key:', API_KEY.substring(0, 20) + '...\n');

// Try different endpoints
const endpoints = [
  `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
  `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
];

const testPayload = JSON.stringify({
  contents: [{
    parts: [{ text: 'Hello' }]
  }]
});

async function testEndpoint(url, index) {
  return new Promise((resolve) => {
    console.log(`${index}. Testing: ${url.split('?')[0]}`);
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          const text = json.candidates[0].content.parts[0].text;
          console.log(`   ✅ SUCCESS! Response: "${text.substring(0, 40)}..."`);
          console.log(`   🎯 Use this endpoint!\n`);
          resolve(url);
        } else {
          console.log(`   ❌ Failed: ${res.statusCode} - ${data.substring(0, 100)}\n`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}\n`);
      resolve(null);
    });
    
    req.write(testPayload);
    req.end();
  });
}

async function main() {
  for (let i = 0; i < endpoints.length; i++) {
    const result = await testEndpoint(endpoints[i], i + 1);
    if (result) {
      console.log('\n✅ Found working endpoint!');
      break;
    }
  }
}

main();


