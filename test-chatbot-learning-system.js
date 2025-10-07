/**
 * TEST CHATBOT LEARNING SYSTEM
 * Kiểm tra thực tế các tính năng học tập của chatbot AI
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5001';
const LOCAL_URL = 'http://localhost:5001';

// Test results
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

function logTest(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    testResults.errors.push(`${testName}: ${details}`);
  }
  testResults.details.push({ test: testName, passed, details });
}

// Test functions
async function testServerConnection() {
  console.log('\n🔍 Testing server connection...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    logTest('Server Health Check', response.status === 200, 
      response.status === 200 ? 'Server is running' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Server Health Check', false, error.message);
  }
}

// Global variable to store conversation ID
let testConversationId = null;

async function testConversationLearningEndpoints() {
  console.log('\n🧠 Testing Conversation Learning Endpoints...');
  
  // Test 1: Log a conversation
  try {
    const conversationData = {
      userId: 'test_user_123',
      sessionId: 'test_session_456',
      message: 'Tôi đang cảm thấy lo âu, làm sao để bớt căng thẳng?',
      userProfile: { age: 25, lifeStage: 'adult' }
    };

    const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/message`, {
      method: 'POST',
      body: conversationData
    });

    if (response.status === 200 && response.data.success) {
      testConversationId = response.data.data.conversationId;
      logTest('Log Conversation', true, 'Conversation logged successfully');
    } else {
      logTest('Log Conversation', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Log Conversation', false, error.message);
  }

  // Test 2: Record feedback
  try {
    if (testConversationId) {
      const feedbackData = {
        conversationId: testConversationId,
        wasHelpful: true,
        rating: 5,
        feedback: 'Rất hữu ích, cảm ơn!'
      };

      const response = await makeRequest(`${BASE_URL}/api/conversation-learning/feedback`, {
        method: 'POST',
        body: feedbackData
      });

      logTest('Record Feedback', response.status === 200, 
        response.status === 200 ? 'Feedback recorded successfully' : `Status: ${response.status}`);
    } else {
      logTest('Record Feedback', false, 'No conversation ID available');
    }
  } catch (error) {
    logTest('Record Feedback', false, error.message);
  }

  // Test 3: Get learning insights
  try {
    const response = await makeRequest(`${BASE_URL}/api/conversation-learning/insights?days=30`);
    
    logTest('Get Learning Insights', response.status === 200, 
      response.status === 200 ? 'Insights retrieved successfully' : `Status: ${response.status}`);
      
    if (response.status === 200 && response.data.success) {
      console.log('   📊 Learning Insights:', JSON.stringify(response.data.insights, null, 2));
    }
  } catch (error) {
    logTest('Get Learning Insights', false, error.message);
  }

  // Test 4: Get training data
  try {
    const response = await makeRequest(`${BASE_URL}/api/conversation-learning/training-data?limit=10`);
    
    logTest('Get Training Data', response.status === 200, 
      response.status === 200 ? 'Training data retrieved successfully' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Get Training Data', false, error.message);
  }

  // Test 5: Get common questions
  try {
    const response = await makeRequest(`${BASE_URL}/api/conversation-learning/common-questions?limit=5`);
    
    logTest('Get Common Questions', response.status === 200, 
      response.status === 200 ? 'Common questions retrieved successfully' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Get Common Questions', false, error.message);
  }

  // Test 6: Get conversations needing review
  try {
    const response = await makeRequest(`${BASE_URL}/api/conversation-learning/needs-review?limit=5`);
    
    logTest('Get Conversations Needing Review', response.status === 200, 
      response.status === 200 ? 'Review conversations retrieved successfully' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Get Conversations Needing Review', false, error.message);
  }
}

async function testChatbotCoreEndpoints() {
  console.log('\n🤖 Testing Core Chatbot Endpoints...');
  
  // Test 1: Create session
  try {
    const sessionData = {
      userId: 'test_user_learning',
      userProfile: {
        age: 30,
        lifeStage: 'adult',
        symptoms: ['anxiety', 'stress']
      }
    };

    const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/session`, {
      method: 'POST',
      body: sessionData
    });

    logTest('Create Chat Session', response.status === 200, 
      response.status === 200 ? 'Session created successfully' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Create Chat Session', false, error.message);
  }

  // Test 2: Send message
  try {
    const messageData = {
      sessionId: 'test_session_learning',
      message: 'Tôi muốn học cách quản lý stress hiệu quả',
      userId: 'test_user_learning'
    };

    const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/message`, {
      method: 'POST',
      body: messageData
    });

    logTest('Send Chat Message', response.status === 200, 
      response.status === 200 ? 'Message processed successfully' : `Status: ${response.status}`);
      
    if (response.status === 200 && response.data.success) {
      console.log('   💬 AI Response:', response.data.data?.message?.substring(0, 100) + '...');
    }
  } catch (error) {
    logTest('Send Chat Message', false, error.message);
  }

  // Test 3: Analyze intent
  try {
    const analyzeData = {
      message: 'Tôi cần làm test đánh giá tâm lý',
      userId: 'test_user_learning'
    };

    const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/analyze`, {
      method: 'POST',
      body: analyzeData
    });

    logTest('Analyze Intent', response.status === 200, 
      response.status === 200 ? 'Intent analyzed successfully' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Analyze Intent', false, error.message);
  }

  // Test 4: Safety check
  try {
    const safetyData = {
      message: 'Tôi đang cảm thấy rất tuyệt vọng',
      userId: 'test_user_learning'
    };

    const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/safety-check`, {
      method: 'POST',
      body: safetyData
    });

    logTest('Safety Check', response.status === 200, 
      response.status === 200 ? 'Safety check completed' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Safety Check', false, error.message);
  }
}

async function testDatabaseIntegration() {
  console.log('\n🗄️ Testing Database Integration...');
  
  // Test if conversation learning routes are properly integrated
  try {
    const response = await makeRequest(`${BASE_URL}/api/conversation-learning/insights`);
    
    logTest('Database Integration', response.status !== 404, 
      response.status !== 404 ? 'Learning endpoints are accessible' : 'Learning endpoints not found');
  } catch (error) {
    logTest('Database Integration', false, error.message);
  }
}

async function testSelfLearningFeatures() {
  console.log('\n🎯 Testing Self-Learning Features...');
  
  // Test 1: Multiple conversations to test learning
  const testMessages = [
    'Tôi đang cảm thấy lo âu',
    'Làm sao để giảm stress?',
    'Tôi muốn học kỹ thuật thư giãn',
    'Có test nào để đánh giá tâm lý không?'
  ];

  for (let i = 0; i < testMessages.length; i++) {
    try {
      const messageData = {
        sessionId: `learning_test_${i}`,
        message: testMessages[i],
        userId: 'learning_test_user'
      };

      const response = await makeRequest(`${BASE_URL}/api/v2/chatbot/message`, {
        method: 'POST',
        body: messageData
      });

      if (response.status === 200 && response.data.success) {
        // Store conversation ID for potential feedback testing
        const conversationId = response.data.data.conversationId;
        logTest(`Learning Test ${i + 1}`, true, `Message "${testMessages[i]}" processed (ID: ${conversationId})`);
        
        // Test feedback for the first conversation
        if (i === 0 && conversationId) {
          try {
            const feedbackData = {
              conversationId: conversationId,
              wasHelpful: true,
              rating: 4,
              feedback: 'Hữu ích cho việc học tập'
            };

            const feedbackResponse = await makeRequest(`${BASE_URL}/api/conversation-learning/feedback`, {
              method: 'POST',
              body: feedbackData
            });

            if (feedbackResponse.status === 200) {
              console.log(`   ✅ Feedback recorded for conversation ${conversationId}`);
            }
          } catch (feedbackError) {
            console.log(`   ⚠️ Feedback failed: ${feedbackError.message}`);
          }
        }
      } else {
        logTest(`Learning Test ${i + 1}`, false, `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Learning Test ${i + 1}`, false, error.message);
    }
  }
}

async function generateReport() {
  console.log('\n📊 TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n📋 Detailed Results:');
  testResults.details.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`   ${status} ${test.test}`);
    if (test.details) {
      console.log(`      ${test.details}`);
    }
  });

  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.totalTests) * 100
    },
    errors: testResults.errors,
    details: testResults.details
  };

  require('fs').writeFileSync('chatbot-learning-test-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n💾 Report saved to: chatbot-learning-test-report.json');
}

// Main execution
async function runTests() {
  console.log('🚀 Starting Chatbot Learning System Tests...');
  console.log(`Testing against: ${BASE_URL}`);
  
  await testServerConnection();
  await testConversationLearningEndpoints();
  await testChatbotCoreEndpoints();
  await testDatabaseIntegration();
  await testSelfLearningFeatures();
  await generateReport();
  
  console.log('\n✨ Testing completed!');
}

// Run tests
runTests().catch(console.error);
