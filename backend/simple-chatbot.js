const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ULTRA SIMPLE CHATBOT LOGIC
function generateResponse(message, userId) {
  const lowerMessage = message.toLowerCase();
  console.log(`🔍 Processing: "${message}" -> "${lowerMessage}"`);

  // Test exact match
  if (lowerMessage === 'chào') {
    console.log(`✅ EXACT MATCH: chào`);
    return {
      success: true,
      data: {
        message: `Xin chào! 👋 Tôi là SoulFriend!`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Test includes
  if (lowerMessage.includes('chào')) {
    console.log(`✅ INCLUDES MATCH: chào`);
    return {
      success: true,
      data: {
        message: `Xin chào! Tôi là SoulFriend, trợ lý tâm lý của bạn.`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Default
  console.log(`⚠️ DEFAULT RESPONSE`);
  return {
    success: true,
    data: {
      message: `Cảm ơn bạn đã chia sẻ! 😊 Tôi ở đây để lắng nghe và hỗ trợ bạn.`,
      intent: 'general_help',
      confidence: 0.85,
      aiGenerated: true,
      timestamp: new Date().toISOString(),
      userId: userId
    }
  };
}

// Chatbot endpoint
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    console.log(`📨 User (${userId}): ${message}`);

    const response = generateResponse(message, userId);
    console.log(`🤖 Bot: ${response.data.message}`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Chatbot service error',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    chatbot: 'ready',
    uptime: process.uptime() + ' seconds',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║   🚀 SIMPLE CHATBOT STARTED!             ║`);
  console.log(`║   ✅ Database Connected                   ║`);
  console.log(`╠════════════════════════════════════════════╣`);
  console.log(`║   Port: ${PORT}                               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
  console.log(`╚════════════════════════════════════════════╝`);
});
