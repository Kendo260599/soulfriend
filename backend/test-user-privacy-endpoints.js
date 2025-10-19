/**
 * Comprehensive Test for User Privacy Features
 * Tests all user privacy endpoints end-to-end
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_TIMEOUT = 10000;

// Test data
const testData = {
  testResults: [
    {
      testType: 'PHQ-9',
      answers: [1, 2, 1, 0, 2, 1, 1, 0, 1],
      totalScore: 9,
      evaluation: { level: 'mild', description: 'Mild depression symptoms' },
      completedAt: new Date().toISOString()
    }
  ],
  consentHistory: [
    {
      id: 'consent_test_001',
      agreed: true,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    }
  ]
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SoulFriend-Test-Client/1.0'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testUserDataEndpoint() {
  console.log('\n🔍 Testing GET /api/user/data...');
  
  const result = await apiCall('GET', '/api/user/data');
  
  if (result.success) {
    console.log('✅ User data endpoint working');
    console.log('📊 Response structure:', {
      hasSuccess: 'success' in result.data,
      hasData: 'data' in result.data,
      hasPersonalInfo: result.data.data?.personalInfo ? 'Yes' : 'No',
      hasTestResults: result.data.data?.testResults ? 'Yes' : 'No',
      hasConsentHistory: result.data.data?.consentHistory ? 'Yes' : 'No'
    });
    return true;
  } else {
    console.log('❌ User data endpoint failed:', result.error);
    return false;
  }
}

async function testUserExportEndpoint() {
  console.log('\n📤 Testing GET /api/user/export...');
  
  const result = await apiCall('GET', '/api/user/export');
  
  if (result.success) {
    console.log('✅ User export endpoint working');
    console.log('📊 Export structure:', {
      hasExportInfo: 'exportInfo' in result.data,
      hasPersonalInfo: 'personalInfo' in result.data,
      hasTestResults: 'testResults' in result.data,
      hasConsentHistory: 'consentHistory' in result.data,
      hasPrivacySettings: 'privacySettings' in result.data
    });
    return true;
  } else {
    console.log('❌ User export endpoint failed:', result.error);
    return false;
  }
}

async function testWithdrawConsentEndpoint() {
  console.log('\n🔄 Testing POST /api/user/withdraw-consent...');
  
  const result = await apiCall('POST', '/api/user/withdraw-consent');
  
  if (result.success) {
    console.log('✅ Withdraw consent endpoint working');
    console.log('📊 Response:', {
      hasSuccess: 'success' in result.data,
      hasMessage: 'message' in result.data,
      hasWithdrawalId: 'withdrawalId' in result.data,
      hasEffectiveDate: 'effectiveDate' in result.data
    });
    return true;
  } else {
    console.log('❌ Withdraw consent endpoint failed:', result.error);
    return false;
  }
}

async function testUpdateConsentEndpoint() {
  console.log('\n⚙️ Testing POST /api/user/update-consent...');
  
  const consentData = {
    dataProcessing: true,
    marketing: false,
    analytics: true
  };
  
  const result = await apiCall('POST', '/api/user/update-consent', consentData);
  
  if (result.success) {
    console.log('✅ Update consent endpoint working');
    console.log('📊 Response:', {
      hasSuccess: 'success' in result.data,
      hasMessage: 'message' in result.data,
      hasConsentId: 'consentId' in result.data,
      hasUpdatedAt: 'updatedAt' in result.data
    });
    return true;
  } else {
    console.log('❌ Update consent endpoint failed:', result.error);
    return false;
  }
}

async function testAuditLogEndpoint() {
  console.log('\n📋 Testing GET /api/user/audit-log...');
  
  const result = await apiCall('GET', '/api/user/audit-log');
  
  if (result.success) {
    console.log('✅ Audit log endpoint working');
    console.log('📊 Response:', {
      hasSuccess: 'success' in result.data,
      hasData: 'data' in result.data,
      hasNote: 'note' in result.data,
      dataType: Array.isArray(result.data.data) ? 'Array' : typeof result.data.data
    });
    return true;
  } else {
    console.log('❌ Audit log endpoint failed:', result.error);
    return false;
  }
}

async function testDeleteDataEndpoint() {
  console.log('\n🗑️ Testing DELETE /api/user/data...');
  
  const result = await apiCall('DELETE', '/api/user/data');
  
  if (result.success) {
    console.log('✅ Delete data endpoint working');
    console.log('📊 Response:', {
      hasSuccess: 'success' in result.data,
      hasMessage: 'message' in result.data,
      hasDeletionId: 'deletionId' in result.data,
      hasDeletedAt: 'deletedAt' in result.data,
      hasRetentionPeriod: 'retentionPeriod' in result.data
    });
    return true;
  } else {
    console.log('❌ Delete data endpoint failed:', result.error);
    return false;
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing GET /api/health...');
  
  const result = await apiCall('GET', '/api/health');
  
  if (result.success) {
    console.log('✅ Health endpoint working');
    console.log('📊 Server status:', result.data.status);
    return true;
  } else {
    console.log('❌ Health endpoint failed:', result.error);
    return false;
  }
}

// Main test runner
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive User Privacy Test');
  console.log(`🌐 Testing against: ${API_BASE_URL}`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const results = {
    health: await testHealthEndpoint(),
    userData: await testUserDataEndpoint(),
    userExport: await testUserExportEndpoint(),
    withdrawConsent: await testWithdrawConsentEndpoint(),
    updateConsent: await testUpdateConsentEndpoint(),
    auditLog: await testAuditLogEndpoint(),
    deleteData: await testDeleteDataEndpoint()
  };
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${test}`);
  });
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! User privacy features are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  runComprehensiveTest().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTest,
  testUserDataEndpoint,
  testUserExportEndpoint,
  testWithdrawConsentEndpoint,
  testUpdateConsentEndpoint,
  testAuditLogEndpoint,
  testDeleteDataEndpoint,
  testHealthEndpoint
};
