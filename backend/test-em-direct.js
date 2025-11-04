/**
 * Direct test script - Test EM-style Reasoner directly
 * Uses compiled JavaScript from dist/
 */

async function testDirect() {
    console.log('🧪 Testing EM-style Reasoner (Direct Service Test)\n');

    try {
        // Import from compiled dist
        const emStyleReasonerModule = require('./dist/services/emStyleReasoner');
        const enhancedChatbotServiceModule = require('./dist/services/enhancedChatbotService');

        const emStyleReasoner = emStyleReasonerModule.emStyleReasoner || emStyleReasonerModule.default;
        const enhancedChatbotService = enhancedChatbotServiceModule.enhancedChatbotService || enhancedChatbotServiceModule.default;

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

        console.log('✅ Services loaded successfully\n');

        for (const testCase of testCases) {
            console.log(`${'='.repeat(60)}`);
            console.log(`📋 Test: ${testCase.name}`);
            console.log(`Input: "${testCase.message}"\n`);

            try {
                // Test default mode
                console.log('🔵 Testing DEFAULT mode...\n');
                const defaultResponse = await enhancedChatbotService.processMessage(
                    testCase.message,
                    `test_session_default_${Date.now()}`,
                    'test_user',
                    {},
                    'default'
                );

                console.log('✅ Default Response (first 250 chars):');
                const defaultMsg = defaultResponse.message || defaultResponse.response || '';
                console.log(defaultMsg.substring(0, Math.min(250, defaultMsg.length)));
                if (defaultMsg.length > 250) console.log('...\n');
                else console.log('\n');

                // Test EM-style mode
                console.log('🔷 Testing EM-STYLE mode...\n');
                const emResponse = await enhancedChatbotService.processMessage(
                    testCase.message,
                    `test_session_em_${Date.now()}`,
                    'test_user',
                    {},
                    'em_style'
                );

                console.log('✅ EM-style Response:');
                const emMessage = emResponse.message || emResponse.response || '';
                console.log(emMessage);
                console.log('\n');

                // Validate structure
                const hasGoal = /Mục tiêu|Mục tiêu/i.test(emMessage);
                const hasConstraints = /Ràng buộc|Ràng buộc/i.test(emMessage);
                const hasVariables = /Biến số|Biến số/i.test(emMessage);
                const hasOptions = /Phương án|Phương án/i.test(emMessage);
                const hasAssumption = /Assumption|Assumption/i.test(emMessage);
                const hasTest = /\bTest\b/i.test(emMessage);

                console.log('📊 Structure Validation:');
                console.log(`   - Mục tiêu: ${hasGoal ? '✅' : '❌'}`);
                console.log(`   - Ràng buộc: ${hasConstraints ? '✅' : '❌'}`);
                console.log(`   - Biến số: ${hasVariables ? '✅' : '❌'}`);
                console.log(`   - Phương án: ${hasOptions ? '✅' : '❌'}`);
                console.log(`   - Assumption: ${hasAssumption ? '✅' : '❌'}`);
                console.log(`   - Test: ${hasTest ? '✅' : '❌'}`);

                const structureScore = [hasGoal, hasConstraints, hasVariables, hasOptions, hasAssumption, hasTest]
                    .filter(Boolean).length;
                const structurePercent = ((structureScore / 6) * 100).toFixed(0);

                console.log(`\n   Structure Score: ${structureScore}/6 (${structurePercent}%)`);

                if (structureScore >= 4) {
                    console.log('   ✅ EM-style response có structure tốt!\n');
                } else if (structureScore >= 2) {
                    console.log('   ⚠️  EM-style response thiếu một số elements (acceptable)\n');
                } else {
                    console.log('   ❌ EM-style response thiếu structure nghiêm trọng\n');
                }

                // Compare lengths
                const defaultLen = defaultMsg.length;
                const emLen = emMessage.length;
                console.log(`📏 Length Comparison:`);
                console.log(`   Default: ${defaultLen} chars`);
                console.log(`   EM-style: ${emLen} chars`);
                console.log(`   Ratio: ${((emLen / defaultLen) * 100).toFixed(0)}%\n`);

            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
                if (error.stack) {
                    console.error(error.stack.split('\n').slice(0, 5).join('\n'));
                }
            }

            // Wait between tests
            if (testCase !== testCases[testCases.length - 1]) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`${'='.repeat(60)}`);
        console.log('✨ Test completed!\n');
        console.log('💡 Next steps:');
        console.log('   1. Review responses - Are they structured correctly?');
        console.log('   2. Compare default vs EM-style - Which format is better?');
        console.log('   3. Optimize prompts if structure score < 4\n');

    } catch (error) {
        console.error('❌ Failed to load services:', error.message);
        if (error.stack) {
            console.error(error.stack.split('\n').slice(0, 10).join('\n'));
        }
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Build TypeScript: npm run build');
        console.error('   2. Check dist/ folder exists');
        console.error('   3. Verify training_samples.jsonl exists in backend/\n');
    }
}

testDirect().catch(console.error);
