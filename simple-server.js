/**
 * Simple Server - NO DATABASE, ONLY AI TESTING
 * This server focuses ONLY on testing Gemini AI without any database dependencies
 */

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini AI Setup
const API_KEY = '***REDACTED_GEMINI_KEY***';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

console.log('✅ Gemini AI initialized successfully');

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple SoulFriend Server - AI Only',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: 'initialized',
    database: 'disabled'
  });
});

// Simple chatbot endpoint
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`📨 User message: ${message}`);

    // Generate AI response
    const result = await model.generateContent(
      `Bạn là trợ lý tâm lý CHUN. User nói: "${message}". Hãy trả lời đồng cảm bằng tiếng Việt, ngắn gọn và hỗ trợ.`
    );
    
    const response = await result.response;
    const aiResponse = response.text();

    console.log(`🤖 AI Response: ${aiResponse}`);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        aiGenerated: true,
        confidence: 0.85,
        intent: 'general_help',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI response failed',
      details: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Simple server is working!',
    gemini: 'ready',
    database: 'not needed'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🚀 SIMPLE SERVER STARTED!               ║');
  console.log('║   ✅ Gemini AI Ready                       ║');
  console.log('║   ❌ Database Disabled                     ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
  console.log(`║   Test: http://localhost:${PORT}/api/test     ║`);
  console.log('╚════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down simple server...');
  process.exit(0);
});
