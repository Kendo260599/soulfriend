/**
 * FINAL TEST DEPLOYMENT
 * Test the deployed SoulFriend backend with learning system
 */

const https = require('https');

console.log('🧪 Final Test of Deployed SoulFriend Backend...');
console.log('===============================================');

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test health endpoint
async function testHealth() {
  console.log('\n1️⃣ Testing Health Endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log('   Response:', response.data);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test conversation learning endpoints
async function testLearningEndpoints() {
  console.log('\n2️⃣ Testing Learning Endpoints...');
  
  const endpoints = [
    { name: 'Learning Insights', path: '/api/conversation-learning/insights' },
    { name: 'Training Data', path: '/api/conversation-learning/training-data' },
    { name: 'Common Questions', path: '/api/conversation-learning/common-questions' },
    { name: 'Needs Review', path: '/api/conversation-learning/needs-review' }
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`   🧪 Testing ${endpoint.name}...`);
      const response = await makeRequest({
        hostname: 'soulfriend-api.onrender.com',
        port: 443,
        path: endpoint.path,
        method: 'GET'
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ${endpoint.name} working`);
        successCount++;
      } else {
        console.log(`   ❌ ${endpoint.name} failed (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} error:`, error.message);
    }
  }

  console.log(`   📊 Learning endpoints: ${successCount}/${endpoints.length} working`);
  return successCount === endpoints.length;
}

// Test chatbot message endpoint
async function testChatbotMessage() {
  console.log('\n3️⃣ Testing Chatbot Message Endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/v2/chatbot/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      message: 'Test learning system - Tôi muốn học cách quản lý stress',
      userId: 'test_user_123',
      sessionId: 'test_session_456'
    }));
    
    if (response.status === 200) {
      console.log('✅ Chatbot message endpoint working');
      console.log('   Response:', response.data);
      return true;
    } else {
      console.log('❌ Chatbot message endpoint failed');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Chatbot message error:', error.message);
    return false;
  }
}

// Test feedback endpoint
async function testFeedbackEndpoint() {
  console.log('\n4️⃣ Testing Feedback Endpoint...');
  
  try {
    // First, send a message to get a conversation ID
    const messageResponse = await makeRequest({
      hostname: 'soulfriend-api.onrender.com',
      port: 443,
      path: '/api/v2/chatbot/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      message: 'Test feedback system',
      userId: 'test_user_feedback'
    }));

    if (messageResponse.status === 200 && messageResponse.data.success) {
      const conversationId = messageResponse.data.data?.conversationId;
      
      if (conversationId) {
        console.log(`   📝 Got conversation ID: ${conversationId}`);
        
        // Now test feedback
        const feedbackResponse = await makeRequest({
          hostname: 'soulfriend-api.onrender.com',
          port: 443,
          path: '/api/conversation-learning/feedback',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }, JSON.stringify({
          conversationId: conversationId,
          wasHelpful: true,
          rating: 5,
          feedback: 'Test feedback for learning system'
        }));
        
        if (feedbackResponse.status === 200) {
          console.log('✅ Feedback endpoint working');
          console.log('   Response:', feedbackResponse.data);
          return true;
        } else {
          console.log('❌ Feedback endpoint failed');
          console.log('   Status:', feedbackResponse.status);
          console.log('   Response:', feedbackResponse.data);
          return false;
        }
      } else {
        console.log('❌ No conversation ID received');
        return false;
      }
    } else {
      console.log('❌ Cannot test feedback - message endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Feedback test error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🎯 Testing SoulFriend Backend with Learning System...');
  console.log('   URL: https://soulfriend-api.onrender.com');
  console.log('');
  
  const results = {
    health: false,
    learning: false,
    chatbot: false,
    feedback: false
  };

  // Test 1: Health
  results.health = await testHealth();
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Learning endpoints
  results.learning = await testLearningEndpoints();
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Chatbot message
  results.chatbot = await testChatbotMessage();
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Feedback
  results.feedback = await testFeedbackEndpoint();

  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log('Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Learning Endpoints:', results.learning ? '✅ PASS' : '❌ FAIL');
  console.log('Chatbot Message:', results.chatbot ? '✅ PASS' : '❌ FAIL');
  console.log('Feedback System:', results.feedback ? '✅ PASS' : '❌ FAIL');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log('');
  console.log(`Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 75) {
    console.log('🎉 DEPLOYMENT SUCCESS! Learning system is working!');
  } else if (successRate >= 50) {
    console.log('⚠️ PARTIAL SUCCESS: Some features working, needs attention');
  } else {
    console.log('❌ DEPLOYMENT ISSUES: Most features not working');
  }

  console.log('\n🔗 Available URLs:');
  console.log('   Backend: https://soulfriend-api.onrender.com');
  console.log('   Health: https://soulfriend-api.onrender.com/api/health');
  console.log('   Learning: https://soulfriend-api.onrender.com/api/conversation-learning/insights');
  console.log('   Chatbot: https://soulfriend-api.onrender.com/api/v2/chatbot/message');
}

// Run tests
runTests().catch(console.error);
