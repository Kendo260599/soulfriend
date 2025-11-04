/**
 * Quick API Key Verification Test
 * Kiểm tra API key có hoạt động không
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Kiểm tra Gemini API Key...\n');
console.log('='.repeat(50));

if (!GEMINI_API_KEY) {
    console.error('❌ LỖI: GEMINI_API_KEY không tìm thấy trong .env');
    process.exit(1);
}

console.log(`✅ API Key found: ${GEMINI_API_KEY.substring(0, 20)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`);
console.log(`📏 Key length: ${GEMINI_API_KEY.length} characters\n`);

console.log('🧪 Testing API connection...\n');

async function testAPIKey() {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: 'Xin chào, bạn có thể nói "Hello" bằng tiếng Việt không?'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.7,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text && text.trim().length > 0) {
            console.log('='.repeat(50));
            console.log('✅ API KEY HOẠT ĐỘNG TỐT!\n');
            console.log('📝 Response từ Gemini:');
            console.log(`   "${text.trim()}"\n`);
            console.log('='.repeat(50));
            console.log('✅ Status: API key hợp lệ và hoạt động');
            console.log('✅ Model: Gemini 1.5 Pro');
            console.log('✅ Connection: Successful\n');
            return true;
        } else {
            console.error('❌ API trả về response rỗng');
            return false;
        }
    } catch (error) {
        console.error('='.repeat(50));
        console.error('❌ API KEY KHÔNG HOẠT ĐỘNG!\n');
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            console.error(`📊 HTTP Status: ${status}`);
            console.error(`📋 Error Details:`, JSON.stringify(data, null, 2));
            
            if (status === 401 || status === 403) {
                console.error('\n❌ Vấn đề: API key không hợp lệ hoặc đã hết hạn');
                console.error('💡 Giải pháp: Kiểm tra lại API key trong .env');
            } else if (status === 429) {
                console.error('\n⚠️  Vấn đề: Rate limit exceeded (quá nhiều requests)');
                console.error('💡 Giải pháp: Đợi vài phút rồi thử lại');
            } else if (status === 400) {
                console.error('\n❌ Vấn đề: Bad request - có thể do format request không đúng');
                console.error('💡 Giải pháp: Kiểm tra lại code');
            } else {
                console.error(`\n❌ Vấn đề: HTTP ${status} - ${data?.error?.message || 'Unknown error'}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('\n❌ Vấn đề: Timeout - không kết nối được tới API');
            console.error('💡 Giải pháp: Kiểm tra internet connection');
        } else {
            console.error('\n❌ Vấn đề: Network error');
            console.error(`   Error: ${error.message}`);
        }
        
        console.error('\n' + '='.repeat(50));
        return false;
    }
}

// Run test
testAPIKey()
    .then(success => {
        if (success) {
            console.log('🎉 Test hoàn thành thành công!');
            process.exit(0);
        } else {
            console.log('💥 Test thất bại');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });

