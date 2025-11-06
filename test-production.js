/**
 * Production Testing Script for Crisis Detection & HITL
 * Tests the deployed Railway app directly
 */

const https = require('https');

const RAILWAY_URL = 'https://soulfriend-production.up.railway.app';

// Test cases
const TEST_CASES = [
  {
    name: 'Normal message (LOW risk)',
    message: 'Xin chào, hôm nay tôi cảm thấy ổn',
    expectedRiskLevel: 'LOW',
    expectedCrisisLevel: 'low',
  },
  {
    name: 'Direct suicidal intent (CRITICAL)',
    message: 'Tôi muốn chết',
    expectedRiskLevel: 'CRITICAL',
    expectedCrisisLevel: 'critical',
  },
  {
    name: 'Suicidal with plan and timeframe (CRITICAL)',
    message: 'Tôi muốn tự tử và sẽ làm đêm nay',
    expectedRiskLevel: 'CRITICAL',
    expectedCrisisLevel: 'critical',
  },
  {
    name: 'Self-harm intent (HIGH)',
    message: 'Tôi muốn tự làm đau mình',
    expectedRiskLevel: 'HIGH',
    expectedCrisisLevel: 'high',
  },
];

/**
 * Make HTTP POST request
 */
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'soulfriend-production.up.railway.app',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run a single test case
 */
async function runTest(testCase, index) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Test ${index + 1}/${TEST_CASES.length}: ${testCase.name}`);
  console.log(`Message: "${testCase.message}"`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    const sessionId = `test_${Date.now()}_${index}`;
    const result = await makeRequest('/api/v2/chatbot/message', {
      message: testCase.message,
      sessionId: sessionId,
      userId: 'production_test_user',
    });

    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`✓ Response received`);
      console.log(`  Full response:`, JSON.stringify(result.body, null, 2));
      
      const { riskLevel, crisisLevel, message: response } = result.body;
      
      console.log(`  Risk Level: ${riskLevel} (expected: ${testCase.expectedRiskLevel})`);
      console.log(`  Crisis Level: ${crisisLevel} (expected: ${testCase.expectedCrisisLevel})`);
      if (response) {
        console.log(`  Response preview: ${response.substring(0, 100)}...`);
      }
      
      // Verify expectations
      const riskMatch = riskLevel === testCase.expectedRiskLevel;
      const crisisMatch = crisisLevel === testCase.expectedCrisisLevel;
      
      if (riskMatch && crisisMatch) {
        console.log(`\n✅ PASS - All assertions matched`);
        return { passed: true, testCase };
      } else {
        console.log(`\n❌ FAIL - Mismatch detected`);
        if (!riskMatch) {
          console.log(`  Expected riskLevel: ${testCase.expectedRiskLevel}, got: ${riskLevel}`);
        }
        if (!crisisMatch) {
          console.log(`  Expected crisisLevel: ${testCase.expectedCrisisLevel}, got: ${crisisLevel}`);
        }
        return { passed: false, testCase, riskLevel, crisisLevel };
      }
    } else {
      console.log(`❌ FAIL - HTTP ${result.statusCode}`);
      console.log(`Response:`, result.body);
      return { passed: false, testCase, error: `HTTP ${result.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
    return { passed: false, testCase, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🧪 Production Testing Script for Crisis Detection & HITL     ║
║  Railway URL: ${RAILWAY_URL}                                   ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const results = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const result = await runTest(TEST_CASES[i], i);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    if (i < TEST_CASES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n\n╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║  📊 TEST SUMMARY                                              ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.testCase.name}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }
  
  console.log(`\n${failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

