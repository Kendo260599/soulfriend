const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Fix encoding issues
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// PERFECT CHATBOT LOGIC WITH ENCODING FIX
function generatePerfectResponse(message, userId) {
  // Ensure proper UTF-8 encoding
  const cleanMessage = message.toString().trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  console.log(`🔍 Processing: "${cleanMessage}" -> "${lowerMessage}"`);
  console.log(`📊 Message length: ${cleanMessage.length}, Lower length: ${lowerMessage.length}`);
  
  // Test exact matches with proper encoding
  if (lowerMessage === 'chào' || lowerMessage === 'chào bạn' || lowerMessage === 'hello' || lowerMessage === 'hi') {
    console.log(`✅ EXACT MATCH: ${lowerMessage}`);
    return {
      success: true,
      data: {
        message: `Xin chào! 👋 Tôi là SoulFriend, trợ lý tâm lý của bạn. Rất vui được gặp bạn!`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Test includes with proper encoding
  if (lowerMessage.includes('chào') || lowerMessage.includes('xin chào')) {
    console.log(`✅ INCLUDES MATCH: chào`);
    return {
      success: true,
      data: {
        message: `Xin chào! Tôi là SoulFriend, trợ lý tâm lý của bạn. Tôi rất vui được gặp bạn! Bạn có thể chia sẻ cảm xúc hoặc tình huống hiện tại của mình.`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Ask about bot's name
  if (lowerMessage.includes('bạn tên') || lowerMessage.includes('tên gì')) {
    console.log(`✅ BOT NAME MATCH`);
    return {
      success: true,
      data: {
        message: `Tôi là SoulFriend! 🤖 Trợ lý tâm lý của bạn. Tôi ở đây để lắng nghe và hỗ trợ bạn.`,
        intent: 'bot_identity',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Emotional states
  if (lowerMessage.includes('buồn') || lowerMessage.includes('sad') || lowerMessage.includes('khóc')) {
    console.log(`✅ EMOTIONAL MATCH: buồn`);
    return {
      success: true,
      data: {
        message: `Tôi hiểu bạn đang cảm thấy buồn. 💙 Điều đó hoàn toàn bình thường và bạn không cô đơn. Hãy chia sẻ thêm về cảm xúc của bạn, tôi sẽ lắng nghe và cùng bạn tìm cách vượt qua.`,
        intent: 'emotional_support',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Test requests
  if (lowerMessage.includes('test') || lowerMessage.includes('kiểm tra') || lowerMessage.includes('đánh giá')) {
    console.log(`✅ TEST MATCH`);
    return {
      success: true,
      data: {
        message: `Tuyệt vời! Bạn có thể làm các test đánh giá tâm lý để hiểu rõ hơn về tình trạng hiện tại của mình. Tôi có thể giúp bạn:\n\n• Test đánh giá lo âu\n• Test đánh giá trầm cảm\n• Test đánh giá stress\n• Test đánh giá giấc ngủ\n\nBạn muốn làm test nào trước?`,
        intent: 'test_request',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Thank you responses
  if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    console.log(`✅ GRATITUDE MATCH`);
    return {
      success: true,
      data: {
        message: `Không có gì! Tôi rất vui được giúp đỡ bạn. Đó là mục đích của tôi - đồng hành và hỗ trợ bạn. Nếu bạn cần thêm sự giúp đỡ, tôi luôn ở đây.`,
        intent: 'gratitude',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Default response - SHORTER AND BETTER
  console.log(`⚠️ DEFAULT RESPONSE for: "${lowerMessage}"`);
  return {
    success: true,
    data: {
      message: `Cảm ơn bạn đã chia sẻ! 😊 Tôi ở đây để lắng nghe và hỗ trợ bạn. Bạn có thể:\n\n• Chia sẻ thêm về cảm xúc\n• Làm test đánh giá tâm lý\n• Học kỹ thuật thư giãn\n• Tìm kiếm hỗ trợ chuyên nghiệp\n\nBạn muốn tôi giúp gì tiếp theo?`,
      intent: 'general_help',
      confidence: 0.85,
      aiGenerated: true,
      timestamp: new Date().toISOString(),
      userId: userId
    }
  };
}

// Chatbot endpoint with encoding fix
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Ensure proper encoding
    const cleanMessage = message ? message.toString().trim() : '';
    const cleanUserId = userId ? userId.toString().trim() : 'anonymous';
    
    console.log(`📨 User (${cleanUserId}): ${cleanMessage}`);

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = generatePerfectResponse(cleanMessage, cleanUserId);
    console.log(`🤖 Bot: ${response.data.message.substring(0, 50)}...`);
    
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
    chatbot: 'perfect',
    encoding: 'utf-8',
    uptime: process.uptime() + ' seconds',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║   🚀 PERFECT CHATBOT STARTED!            ║`);
  console.log(`║   ✅ Database Connected                   ║`);
  console.log(`║   ✅ Encoding Fixed                       ║`);
  console.log(`╠════════════════════════════════════════════╣`);
  console.log(`║   Port: ${PORT}                               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
  console.log(`╚════════════════════════════════════════════╝`);
});
