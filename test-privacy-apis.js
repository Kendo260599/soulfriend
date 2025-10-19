/**
 * Test file để kiểm tra các tính năng quản lý quyền riêng tư
 * Chạy file này để test các API endpoints
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Test data
const testUserData = {
    personalInfo: {
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
    },
    testResults: [
        {
            testId: 'test_1',
            testType: 'DASS-21',
            totalScore: 15,
            completedAt: new Date().toISOString(),
            evaluation: {
                level: 'mild',
                description: 'Mức độ nhẹ'
            }
        }
    ],
    consentHistory: [
        {
            consentId: 'consent_1',
            selectedTests: ['DASS-21'],
            timestamp: new Date().toISOString()
        }
    ]
};

// Test functions
async function testGetUserData() {
    console.log('🧪 Testing GET /api/user/data...');
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ GET /api/user/data - SUCCESS');
            console.log('📊 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ GET /api/user/data - FAILED');
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ GET /api/user/data - ERROR:', error.message);
    }
}

async function testExportUserData() {
    console.log('🧪 Testing GET /api/user/export...');
    try {
        const response = await fetch(`${API_BASE_URL}/user/export`);

        if (response.ok) {
            console.log('✅ GET /api/user/export - SUCCESS');
            console.log('📊 Content-Type:', response.headers.get('Content-Type'));
            console.log('📊 Content-Disposition:', response.headers.get('Content-Disposition'));

            // Try to parse as JSON
            const data = await response.json();
            console.log('📊 Data preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } else {
            const error = await response.text();
            console.log('❌ GET /api/user/export - FAILED');
            console.log('Error:', error);
        }
    } catch (error) {
        console.log('❌ GET /api/user/export - ERROR:', error.message);
    }
}

async function testWithdrawConsent() {
    console.log('🧪 Testing POST /api/user/withdraw-consent...');
    try {
        const response = await fetch(`${API_BASE_URL}/user/withdraw-consent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        if (response.ok) {
            console.log('✅ POST /api/user/withdraw-consent - SUCCESS');
            console.log('📊 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ POST /api/user/withdraw-consent - FAILED');
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ POST /api/user/withdraw-consent - ERROR:', error.message);
    }
}

async function testUpdateConsent() {
    console.log('🧪 Testing POST /api/user/update-consent...');
    try {
        const response = await fetch(`${API_BASE_URL}/user/update-consent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dataProcessing: true,
                marketing: false,
                analytics: true
            })
        });
        const data = await response.json();

        if (response.ok) {
            console.log('✅ POST /api/user/update-consent - SUCCESS');
            console.log('📊 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ POST /api/user/update-consent - FAILED');
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ POST /api/user/update-consent - ERROR:', error.message);
    }
}

async function testGetAuditLog() {
    console.log('🧪 Testing GET /api/user/audit-log...');
    try {
        const response = await fetch(`${API_BASE_URL}/user/audit-log`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ GET /api/user/audit-log - SUCCESS');
            console.log('📊 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ GET /api/user/audit-log - FAILED');
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ GET /api/user/audit-log - ERROR:', error.message);
    }
}

async function testDeleteUserData() {
    console.log('🧪 Testing DELETE /api/user/data...');
    console.log('⚠️  WARNING: This will delete all user data!');

    // Uncomment the following lines to actually test deletion
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/user/data`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ DELETE /api/user/data - SUCCESS');
        console.log('📊 Response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ DELETE /api/user/data - FAILED');
        console.log('Error:', data);
      }
    } catch (error) {
      console.log('❌ DELETE /api/user/data - ERROR:', error.message);
    }
    */

    console.log('⏭️  Skipping DELETE test for safety');
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Privacy Management API Tests...');
    console.log('='.repeat(50));

    await testGetUserData();
    console.log('');

    await testExportUserData();
    console.log('');

    await testWithdrawConsent();
    console.log('');

    await testUpdateConsent();
    console.log('');

    await testGetAuditLog();
    console.log('');

    await testDeleteUserData();
    console.log('');

    console.log('='.repeat(50));
    console.log('🏁 All tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    runAllTests().catch(console.error);
} else {
    // Browser environment
    console.log('📝 Privacy Management API Test Suite');
    console.log('Run runAllTests() to start testing');

    // Make functions available globally for browser testing
    window.testPrivacyAPIs = {
        runAllTests,
        testGetUserData,
        testExportUserData,
        testWithdrawConsent,
        testUpdateConsent,
        testGetAuditLog,
        testDeleteUserData
    };
}


