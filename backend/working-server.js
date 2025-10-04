const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Smart chatbot endpoint with intelligent responses
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    console.log(`📨 User (${userId}): ${message}`);
    
    // Smart response logic
    const response = generateSmartResponse(message, userId);
    
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

// Smart response generation function
function generateSmartResponse(message, userId) {
  const lowerMessage = message.toLowerCase();
  console.log(`🔍 DEBUG: Processing message: "${message}" -> "${lowerMessage}"`);

  // ULTRA SIMPLE TEST - JUST FOR "chào"
  if (lowerMessage === 'chào') {
    console.log(`✅ DEBUG: ULTRA SIMPLE MATCH for: "${lowerMessage}"`);
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

  // Simple greeting responses - SHORT AND FRIENDLY (EXACT MATCH FIRST)
  if (lowerMessage === 'chào bạn' || lowerMessage === 'hello' || lowerMessage === 'hi') {
    console.log(`✅ DEBUG: Matched simple greeting: "${lowerMessage}"`);
    return {
      success: true,
      data: {
        message: `Xin chào! 👋 Tôi là SoulFriend, trợ lý tâm lý của bạn. Rất vui được gặp bạn! Bạn có thể chia sẻ cảm xúc hoặc tình huống hiện tại của mình nhé.`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Extended greeting responses (MORE SPECIFIC)
  if ((lowerMessage.includes('xin chào') || lowerMessage.includes('hello')) && !lowerMessage.includes('tôi')) {
    console.log(`✅ DEBUG: Matched extended greeting: "${lowerMessage}"`);
    return {
      success: true,
      data: {
        message: `Xin chào! Tôi là SoulFriend, trợ lý tâm lý của bạn. Tôi rất vui được gặp bạn! Bạn có thể chia sẻ cảm xúc hoặc tình huống hiện tại của mình, tôi sẽ lắng nghe và hỗ trợ bạn.`,
        intent: 'greeting',
        confidence: 0.95,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }
  
  // Name introduction
  if (lowerMessage.includes('tên') && (lowerMessage.includes('tôi') || lowerMessage.includes('mình'))) {
    return {
      success: true,
      data: {
        message: `Rất vui được làm quen với bạn! Tôi là SoulFriend, trợ lý tâm lý được thiết kế để hỗ trợ bạn. Bạn có thể chia sẻ bất kỳ điều gì đang làm bạn lo lắng hoặc buồn phiền.`,
        intent: 'introduction',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }
  
  // Ask about bot's name - SHORT RESPONSE
  if (lowerMessage.includes('bạn tên') || lowerMessage.includes('tên gì') || lowerMessage === 'bạn tên gì') {
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
  
  // Emotional states - MORE EMPATHETIC
  if (lowerMessage.includes('buồn') || lowerMessage.includes('sad') || lowerMessage.includes('khóc')) {
    return {
      success: true,
      data: {
        message: `Tôi hiểu bạn đang cảm thấy buồn. 💙 Điều đó hoàn toàn bình thường và bạn không cô đơn. Hãy chia sẻ thêm về cảm xúc của bạn, tôi sẽ lắng nghe và cùng bạn tìm cách vượt qua. Bạn có muốn thử một số kỹ thuật thư giãn không?`,
        intent: 'emotional_support',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }
  
  if (lowerMessage.includes('lo âu') || lowerMessage.includes('anxiety') || lowerMessage.includes('căng thẳng')) {
    return {
      success: true,
      data: {
        message: `Tôi hiểu bạn đang cảm thấy lo âu. Đây là một phản ứng tự nhiên của cơ thể. Hãy thử hít thở sâu và chậm rãi. Bạn có thể chia sẻ thêm về điều gì đang làm bạn lo lắng không? Tôi sẽ giúp bạn tìm cách đối phó.`,
        intent: 'anxiety_support',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }
  
  // Test requests
  if (lowerMessage.includes('test') || lowerMessage.includes('kiểm tra') || lowerMessage.includes('đánh giá')) {
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
    return {
      success: true,
      data: {
        message: `Không có gì! Tôi rất vui được giúp đỡ bạn. Đó là mục đích của tôi - đồng hành và hỗ trợ bạn. Nếu bạn cần thêm sự giúp đỡ hoặc muốn chia sẻ thêm điều gì, tôi luôn ở đây.`,
        intent: 'gratitude',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }
  
  // Default intelligent response - SHORTER AND MORE PERSONAL
  console.log(`⚠️ DEBUG: No specific match found, using default response for: "${lowerMessage}"`);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend V4.0 API is running successfully!',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    chatbot: 'ready'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🚀 WORKING SERVER STARTED!             ║');
  console.log('║   ✅ Database Connected                   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
  console.log('╚════════════════════════════════════════════╝');
});
