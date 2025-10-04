/**
 * Minimal Backend Server - For Testing Chatbot AI
 * Removes all complex middleware to isolate issues
 */

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Gemini AI
let geminiAI;
let model;
let aiReady = false;
let modelName = 'unknown';

async function initializeGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in .env');
      return;
    }

    geminiAI = new GoogleGenerativeAI(apiKey);
    
    // Try different models in order of preference
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest', 
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];

    for (const modelToTry of modelsToTry) {
      try {
        console.log(`🔍 Trying model: ${modelToTry}...`);
        model = geminiAI.getGenerativeModel({ model: modelToTry });
        
        // Test the model with a simple prompt
        const testResult = await model.generateContent('Hello');
        if (testResult && testResult.response) {
          aiReady = true;
          modelName = modelToTry;
          console.log(`✅ Gemini AI initialized successfully with ${modelToTry}`);
          return;
        }
      } catch (error) {
        console.log(`   ❌ ${modelToTry} not available`);
        continue;
      }
    }

    console.error('❌ No compatible Gemini model found');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend V3.0 API is running successfully!',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: aiReady ? 'initialized' : 'not initialized',
    model: modelName,
    chatbot: aiReady ? 'ready' : 'offline'
  });
});

// Chatbot message endpoint
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId, context } = req.body;

    console.log(`📨 Received message from ${userId}: ${message}`);

    if (!aiReady) {
      return res.json({
        success: false,
        error: 'AI service not initialized',
        message: 'Chatbot is in offline mode'
      });
    }

    // Generate AI response
    const prompt = `Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.

⚠️ QUAN TRỌNG:
- Bạn KHÔNG phải chuyên gia y tế/tâm lý
- Bạn là công cụ hỗ trợ sàng lọc sơ bộ
- KHÔNG chẩn đoán bệnh lý hoặc kê đơn thuốc
- Mọi lời khuyên chỉ mang tính tham khảo

🌸 TÍNH CÁCH:
- Ấm áp, đồng cảm, không phán xét
- Chuyên nghiệp nhưng gần gũi
- Sử dụng emoji phù hợp (💙 🌸 ⚠️)
- Xưng hô: "Mình" (CHUN) - "Bạn" (User)

🚨 CRISIS PROTOCOL:
- Nếu phát hiện ý định tự tử: Hotline NGAY 1900 599 958
- Nếu phát hiện bạo hành: Gọi 113 ngay lập tức

Người dùng: ${message}

Hãy trả lời bằng tiếng Việt, ngắn gọn và thân thiện (tối đa 200 từ).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiMessage = response.text();

    console.log(`🤖 AI Response generated: ${aiMessage.substring(0, 50)}...`);

    // Detect crisis keywords
    const crisisKeywords = ['tự tử', 'tự sát', 'chết', 'không muốn sống'];
    const hasCrisis = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    const riskLevel = hasCrisis ? 'HIGH' : 'LOW';

    res.json({
      success: true,
      data: {
        message: aiMessage,
        riskLevel: riskLevel,
        confidence: 0.9,
        aiGenerated: true,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        nextActions: hasCrisis ? [
          '1900 599 958 - Tư vấn tâm lý 24/7',
          '113 - Cảnh sát khẩn cấp',
          'Tìm người thân đáng tin cậy'
        ] : [
          'Tiếp tục trò chuyện',
          'Thực hiện test tâm lý',
          'Xem tài liệu hỗ trợ'
        ],
        emergencyContacts: hasCrisis ? [
          { name: 'Tư vấn tâm lý 24/7', phone: '1900 599 958' },
          { name: 'Cảnh sát khẩn cấp', phone: '113' }
        ] : null
      }
    });

  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
    });
  }
});

// Chatbot session endpoint
app.post('/api/v2/chatbot/session', (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.json({
    success: true,
    data: {
      sessionId: sessionId,
      createdAt: new Date().toISOString()
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'SoulFriend API',
    version: '3.0.0',
    description: 'Mental health support platform for Vietnamese women',
    endpoints: {
      health: '/api/health',
      chatbot: {
        message: 'POST /api/v2/chatbot/message',
        session: 'POST /api/v2/chatbot/session'
      }
    },
    status: aiReady ? 'AI Online' : 'AI Offline'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    suggestion: 'Check the API documentation at /api'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server after Gemini initialization
async function startServer() {
  // Initialize Gemini first
  await initializeGemini();
  
  // Then start the server
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🚀 SoulFriend Minimal Server Started!  ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
    console.log(`║   AI Status: ${(aiReady ? 'Online ✅' : 'Offline ⚠️').padEnd(29)}║`);
    if (aiReady) {
      console.log(`║   Model: ${modelName.padEnd(33)}║`);
    }
    console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
    console.log(`║   Chatbot: http://localhost:${PORT}/api/v2    ║`);
    console.log('╚════════════════════════════════════════════╝');
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();

