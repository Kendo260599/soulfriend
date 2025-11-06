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
            console.log('Testing default mode...');
            const defaultResponse = await axios.post(API_URL, {
                message: testCase.message,
                userId: 'test_user',
                sessionId: 'test_session_default',
                mode: 'default',
            });

            console.log('✅ Default Mode Response:');
            console.log(defaultResponse.data.data.message.substring(0, 200) + '...\n');

            // Test EM-style mode
            console.log('Testing EM-style mode...');
            const emResponse = await axios.post(API_URL, {
                message: testCase.message,
                userId: 'test_user',
                sessionId: 'test_session_em',
                mode: 'em_style',
            });

            console.log('✅ EM-style Mode Response:');
            const emMessage = emResponse.data.data.message;
            console.log(emMessage.substring(0, Math.min(400, emMessage.length)));
            if (emMessage.length > 400) console.log('...\n');
            else console.log('\n');

            // Check if EM-style has structure
            const hasStructure =
                emMessage.includes('Mục tiêu') ||
                emMessage.includes('Phương án') ||
                emMessage.includes('Assumption') ||
                emMessage.includes('**Mục tiêu**');

            if (hasStructure) {
                console.log('✅ EM-style có structure đúng format');
                
                // Count elements
                const hasGoal = emMessage.includes('Mục tiêu') || emMessage.includes('**Mục tiêu**');
                const hasOptions = emMessage.includes('Phương án') || emMessage.includes('**Phương án**');
                const hasAssumption = emMessage.includes('Assumption') || emMessage.includes('**Assumption**');
                
                console.log(`   - Mục tiêu: ${hasGoal ? '✅' : '❌'}`);
                console.log(`   - Phương án: ${hasOptions ? '✅' : '❌'}`);
                console.log(`   - Assumption: ${hasAssumption ? '✅' : '❌'}`);
            } else {
                console.log('⚠️  EM-style thiếu structure');
            }
        } catch (error) {
            if (error.response) {
                console.error(`❌ API Error: ${error.response.status} - ${error.response.data.message || error.response.data.error || JSON.stringify(error.response.data)}\n`);
            } else if (error.request) {
                console.error(`❌ Network Error: Cannot connect to ${API_URL}`);
                console.error('   → Is the backend server running? Try: cd backend && npm run dev\n');
            } else {
                console.error(`❌ Error: ${error.message}\n`);
            }
        }

        // Wait a bit between tests
        if (testCase !== testCases[testCases.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n✨ Test completed!\n');
}

testEMStyle().catch(console.error);














