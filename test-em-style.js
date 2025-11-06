/**
 * Quick test script for EM-style Reasoner
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v2/chatbot/message';

async function testEMStyle() {
    console.log('🧪 Testing EM-style Reasoner\n');

    const testCases = [
        {
            name: 'Burnout test',
            message: 'Mình kiệt sức vì công việc và con nhỏ, không còn sức để làm gì.',
        },
        {
            name: 'Anxiety test',
            message: 'Ngày mai phải thuyết trình, sợ toát mồ hôi.',
        },
        {
            name: 'Sleep test',
            message: 'Mình khó ngủ, hay thức giấc giữa đêm, sáng dậy mệt.',
        },
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.name}`);
        console.log(`Input: "${testCase.message}"\n`);

        try {
            // Test default mode
            const defaultResponse = await axios.post(API_URL, {
                message: testCase.message,
                userId: 'test_user',
                sessionId: 'test_session_default',
                mode: 'default',
            });

            console.log('✅ Default Mode Response:');
            console.log(defaultResponse.data.data.message.substring(0, 200) + '...\n');

            // Test EM-style mode
            const emResponse = await axios.post(API_URL, {
                message: testCase.message,
                userId: 'test_user',
                sessionId: 'test_session_em',
                mode: 'em_style',
            });

            console.log('✅ EM-style Mode Response:');
            console.log(emResponse.data.data.message.substring(0, 300) + '...\n');

            // Check if EM-style has structure
            const emMessage = emResponse.data.data.message;
            const hasStructure =
                emMessage.includes('Mục tiêu') ||
                emMessage.includes('Phương án') ||
                emMessage.includes('Assumption');

            if (hasStructure) {
                console.log('✅ EM-style có structure đúng format\n');
            } else {
                console.log('⚠️  EM-style thiếu structure\n');
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testEMStyle().catch(console.error);














