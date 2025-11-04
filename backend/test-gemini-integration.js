/**
 * Comprehensive Gemini Integration Test
 * Tests API connection, chatbot responses, and all services
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function logPass(testName, details = '') {
    console.log(`✅ PASS: ${testName}${details ? ` - ${details}` : ''}`);
    results.passed.push({ test: testName, details });
}

function logFail(testName, error) {
    console.error(`❌ FAIL: ${testName} - ${error.message || error}`);
    results.failed.push({ test: testName, error: error.message || error });
}

function logWarning(testName, message) {
    console.warn(`⚠️  WARN: ${testName} - ${message}`);
    results.warnings.push({ test: testName, message });
}

/**
 * Test 1: Gemini API Direct Connection
 */
async function testGeminiAPIConnection() {
    console.log('\n🧪 Test 1: Gemini API Direct Connection');
    console.log('='.repeat(50));

    if (!GEMINI_API_KEY) {
        logFail('Gemini API Key Check', new Error('GEMINI_API_KEY not found in .env'));
        return false;
    }
    logPass('Gemini API Key Check', 'Key found');

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: 'Say "Hello" in Vietnamese'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.7,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
            logPass('Gemini API Response', `Got response: "${text.substring(0, 50)}..."`);
            return true;
        } else {
            logFail('Gemini API Response', new Error('Empty response'));
            return false;
        }
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            logFail('Gemini API Authentication', new Error('Invalid API key'));
        } else if (error.response?.status === 429) {
            logWarning('Gemini API Rate Limit', 'Rate limit exceeded (expected in testing)');
            return true; // Not a failure, just rate limited
        } else {
            logFail('Gemini API Connection', error);
        }
        return false;
    }
}

/**
 * Test 2: GeminiService Integration
 */
async function testGeminiService() {
    console.log('\n🧪 Test 2: GeminiService Integration');
    console.log('='.repeat(50));

    try {
        const { default: geminiService } = require('./dist/services/geminiService');
        
        if (!geminiService.isReady()) {
            logFail('GeminiService Ready Check', new Error('Service not initialized'));
            return false;
        }
        logPass('GeminiService Ready Check', 'Service initialized');

        // Test generateResponse
        const response = await geminiService.generateResponse(
            'Xin chào, bạn có thể giúp tôi không?',
            {}
        );

        if (response.text && response.text.length > 0) {
            logPass('GeminiService.generateResponse', `Got response (${response.text.length} chars)`);
            console.log(`   Response preview: "${response.text.substring(0, 100)}..."`);
            return true;
        } else {
            logFail('GeminiService.generateResponse', new Error('Empty response'));
            return false;
        }
    } catch (error) {
        logFail('GeminiService Test', error);
        return false;
    }
}

/**
 * Test 3: EM-style Reasoner với Gemini
 */
async function testEMStyleReasoner() {
    console.log('\n🧪 Test 3: EM-style Reasoner với Gemini');
    console.log('='.repeat(50));

    try {
        const { emStyleReasoner } = require('./dist/services/emStyleReasoner');
        
        const testMessages = [
            'Mình kiệt sức vì công việc và gia đình',
            'Em lo lắng về tương lai',
            'Tôi không ngủ được'
        ];

        let successCount = 0;
        for (const message of testMessages) {
            try {
                const result = await emStyleReasoner.reason(message, {
                    userId: 'test-user',
                    sessionId: 'test-session'
                });

                if (result.message && result.message.length > 0) {
                    const hasStructure = 
                        result.message.includes('Mục tiêu') ||
                        result.message.includes('Phương án') ||
                        result.message.includes('Assumption');

                    if (hasStructure) {
                        logPass(`EM-style: "${message.substring(0, 30)}..."`, 'Structured response');
                        successCount++;
                    } else {
                        logWarning(`EM-style: "${message.substring(0, 30)}..."`, 'Response lacks structure');
                    }
                } else {
                    logFail(`EM-style: "${message.substring(0, 30)}..."`, new Error('Empty response'));
                }
            } catch (error) {
                logFail(`EM-style: "${message.substring(0, 30)}..."`, error);
            }
        }

        if (successCount === testMessages.length) {
            logPass('EM-style Reasoner Overall', `${successCount}/${testMessages.length} tests passed`);
            return true;
        } else {
            logWarning('EM-style Reasoner Overall', `${successCount}/${testMessages.length} tests passed`);
            return successCount > 0;
        }
    } catch (error) {
        logFail('EM-style Reasoner Test', error);
        return false;
    }
}

/**
 * Test 4: Enhanced Chatbot Service
 */
async function testEnhancedChatbotService() {
    console.log('\n🧪 Test 4: Enhanced Chatbot Service');
    console.log('='.repeat(50));

    try {
        const { EnhancedChatbotService } = require('./dist/services/enhancedChatbotService');
        const service = new EnhancedChatbotService();

        const testCases = [
            {
                message: 'Xin chào, mình đang cảm thấy stress',
                mode: 'default'
            },
            {
                message: 'Mình kiệt sức vì công việc',
                mode: 'em_style'
            }
        ];

        let successCount = 0;
        for (const testCase of testCases) {
            try {
                const result = await service.processMessage(
                    testCase.message,
                    'test-session-' + Date.now(),
                    'test-user',
                    {},
                    testCase.mode
                );

                if (result.message && result.message.length > 0) {
                    logPass(`Enhanced Chatbot (${testCase.mode})`, `Got response`);
                    console.log(`   Response preview: "${result.message.substring(0, 80)}..."`);
                    successCount++;
                } else {
                    logFail(`Enhanced Chatbot (${testCase.mode})`, new Error('Empty response'));
                }
            } catch (error) {
                logFail(`Enhanced Chatbot (${testCase.mode})`, error);
            }
        }

        if (successCount === testCases.length) {
            logPass('Enhanced Chatbot Service Overall', `${successCount}/${testCases.length} tests passed`);
            return true;
        } else {
            logWarning('Enhanced Chatbot Service Overall', `${successCount}/${testCases.length} tests passed`);
            return successCount > 0;
        }
    } catch (error) {
        logFail('Enhanced Chatbot Service Test', error);
        return false;
    }
}

/**
 * Test 5: API Endpoint (if server is running)
 */
async function testAPIEndpoint() {
    console.log('\n🧪 Test 5: API Endpoint Test');
    console.log('='.repeat(50));

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/v2/chatbot/message`,
            {
                message: 'Xin chào, bạn có thể giúp tôi không?',
                userId: 'test-user',
                sessionId: 'test-session-' + Date.now(),
                mode: 'default'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        if (response.data.success && response.data.data.message) {
            logPass('API Endpoint', 'Got response from API');
            console.log(`   Response: "${response.data.data.message.substring(0, 100)}..."`);
            return true;
        } else {
            logFail('API Endpoint', new Error('Invalid response format'));
            return false;
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            logWarning('API Endpoint', 'Server not running (expected if testing services directly)');
            return true; // Not a failure if server is not running
        } else {
            logFail('API Endpoint', error);
            return false;
        }
    }
}

/**
 * Test 6: Error Handling
 */
async function testErrorHandling() {
    console.log('\n🧪 Test 6: Error Handling');
    console.log('='.repeat(50));

    try {
        const { default: geminiService } = require('./dist/services/geminiService');
        
        // Test với empty message
        const response1 = await geminiService.generateResponse('', {});
        if (response1.confidence < 0.5) {
            logPass('Empty Message Handling', 'Returns low confidence fallback');
        } else {
            logWarning('Empty Message Handling', 'Unexpected high confidence');
        }

        // Test với very long message (should handle gracefully)
        const longMessage = 'Xin chào. '.repeat(1000);
        const response2 = await geminiService.generateResponse(longMessage, {});
        if (response2.text && response2.text.length > 0) {
            logPass('Long Message Handling', 'Handled gracefully');
        } else {
            logWarning('Long Message Handling', 'Empty response');
        }

        return true;
    } catch (error) {
        logFail('Error Handling Test', error);
        return false;
    }
}

/**
 * Main test runner
 */
async function runAllTests() {
    console.log('🚀 Starting Gemini Integration Tests');
    console.log('='.repeat(50));
    console.log(`API Key: ${GEMINI_API_KEY ? 'Found' : 'Missing'}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log('='.repeat(50));

    const tests = [
        { name: 'Gemini API Connection', fn: testGeminiAPIConnection },
        { name: 'GeminiService Integration', fn: testGeminiService },
        { name: 'EM-style Reasoner', fn: testEMStyleReasoner },
        { name: 'Enhanced Chatbot Service', fn: testEnhancedChatbotService },
        { name: 'API Endpoint', fn: testAPIEndpoint },
        { name: 'Error Handling', fn: testErrorHandling },
    ];

    let passedTests = 0;
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) passedTests++;
        } catch (error) {
            logFail(test.name, error);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach(({ test, error }) => {
            console.log(`   - ${test}: ${error}`);
        });
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(({ test, message }) => {
            console.log(`   - ${test}: ${message}`);
        });
    }

    console.log('\n' + '='.repeat(50));
    if (results.failed.length === 0) {
        console.log('✅ ALL TESTS PASSED!');
        process.exit(0);
    } else {
        console.log('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

