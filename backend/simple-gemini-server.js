/**
 * Simple Gemini Server - Direct API approach
 * Uses the most compatible Gemini model
 */

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://frontend-eh6y07i2z-kendo260599s-projects.vercel.app',
    'https://frontend-nmxya10gu-kendo260599s-projects.vercel.app',
    'https://frontend-itgyjx8eq-kendo260599s-projects.vercel.app',
    'https://frontend-aggftyjoo-kendo260599s-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json());

// Initialize Gemini with gemini-pro (most compatible)
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;
let aiReady = false;

console.log('🔧 Initializing Gemini AI...');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env');
} else {
  console.log(`🔑 API Key found: ${apiKey.substring(0, 20)}...`);
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    aiReady = true;
    console.log('✅ Gemini AI (gemini-2.5-flash) initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize:', error.message);
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend API Running',
    chatbot: aiReady ? 'ready' : 'offline',
    gemini: aiReady ? 'initialized' : 'not initialized',
    model: 'gemini-2.5-flash',
    timestamp: new Date().toISOString()
  });
});

// Chatbot endpoint
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    console.log(`📨 Message from ${userId}: "${message}"`);

    if (!aiReady) {
      return res.json({
        success: false,
        error: 'AI not available',
        data: {
          message: 'Xin lỗi, AI đang offline. Vui lòng thử lại sau.',
          riskLevel: 'LOW',
          aiGenerated: false
        }
      });
    }

    // Simple prompt
    const prompt = `Bạn là CHUN, trợ lý tâm lý AI cho phụ nữ Việt Nam. 
Trả lời ngắn gọn, ấm áp và thân thiện bằng tiếng Việt (tối đa 150 từ).

Người dùng nói: "${message}"

Hãy trả lời:`;

    console.log('🤖 Generating AI response...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ AI responded: "${text.substring(0, 50)}..."`);

    // Crisis detection
    const crisisWords = ['tự tử', 'tự sát', 'chết', 'giết mình'];
    const hasCrisis = crisisWords.some(word => message.toLowerCase().includes(word));

    res.json({
      success: true,
      data: {
        message: text,
        riskLevel: hasCrisis ? 'HIGH' : 'LOW',
        confidence: 0.9,
        aiGenerated: true,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        nextActions: hasCrisis ? [
          '1900 599 958 - Tư vấn tâm lý 24/7',
          '113 - Cảnh sát'
        ] : []
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        message: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        riskLevel: 'LOW',
        aiGenerated: false
      }
    });
  }
});

// Session endpoint
app.post('/api/v2/chatbot/session', (req, res) => {
  res.json({
    success: true,
    data: {
      sessionId: `session_${Date.now()}`,
      createdAt: new Date().toISOString()
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'SoulFriend Simple API',
    version: '1.0.0',
    aiStatus: aiReady ? 'Online' : 'Offline',
    endpoints: {
      health: 'GET /api/health',
      chatbot: 'POST /api/v2/chatbot/message'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🚀 SoulFriend Simple Server        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                            ║`);
  console.log(`║   AI: ${(aiReady ? 'Online ✅ ' : 'Offline ❌').padEnd(30)}║`);
  console.log(`║   URL: http://localhost:${PORT}           ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Ready to receive requests!');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

