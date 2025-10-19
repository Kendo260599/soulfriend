const https = require('https');

// Test model qwen-3-235b-a22b-instruct-2507
const API_KEY = 'csk_yd42vkfdymcx553ryny4r43kfnj2h932r68twvdvtnwyvjjh';
const MODEL = 'qwen-3-235b-a22b-instruct-2507';

console.log('🔍 Testing Qwen 3 235B model...');
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');
console.log('🤖 Model:', MODEL);

async function testQwenModel() {
  try {
    const result = await makeCerebrasRequest();
    console.log(`✅ Qwen 3 235B: ${result.status} - ${result.message}`);
    
    if (result.status === 200) {
      console.log('🎉 SUCCESS! Qwen 3 235B is working!');
      console.log('📊 Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Model failed');
      console.log('📊 Response:', result.data);
    }
  } catch (error) {
    console.log('❌ Error testing model:', error.message);
  }
}

function makeCerebrasRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam. Bạn ấm áp, đồng cảm và chuyên nghiệp. Sử dụng tiếng Việt và xưng hô "Mình" (CHUN) - "Bạn" (User).'
        },
        {
          role: 'user',
          content: 'Xin chào CHUN, tôi đang cảm thấy rất stress và lo lắng về công việc. Bạn có thể giúp tôi không?'
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.cerebras.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            message: res.statusMessage,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            message: res.statusMessage,
            data: data.substring(0, 500)
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test multiple scenarios
async function testMultipleScenarios() {
  const scenarios = [
    {
      name: 'Mental Health Support',
      message: 'Tôi đang cảm thấy rất buồn và cô đơn. Bạn có thể giúp tôi không?'
    },
    {
      name: 'Crisis Detection',
      message: 'Tôi muốn tự tử vì không thể chịu đựng được nữa.'
    },
    {
      name: 'General Chat',
      message: 'Bạn có thể giới thiệu về các bài tập thở để giảm stress không?'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    
    try {
      const result = await makeCerebrasRequestWithMessage(scenario.message);
      console.log(`✅ ${scenario.name}: ${result.status} - ${result.message}`);
      
      if (result.status === 200) {
        console.log('🎉 Scenario working!');
        const content = result.data.choices?.[0]?.message?.content || 'No content';
        console.log('📊 Response:', content.substring(0, 150) + '...');
      } else {
        console.log('❌ Scenario failed:', result.data);
      }
    } catch (error) {
      console.log('❌ Error with scenario:', error.message);
    }
  }
}

function makeCerebrasRequestWithMessage(userMessage) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam. Bạn ấm áp, đồng cảm và chuyên nghiệp. Sử dụng tiếng Việt và xưng hô "Mình" (CHUN) - "Bạn" (User).'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.cerebras.ai',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            message: res.statusMessage,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            message: res.statusMessage,
            data: data.substring(0, 500)
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  await testQwenModel();
  await testMultipleScenarios();
}

runTests();
