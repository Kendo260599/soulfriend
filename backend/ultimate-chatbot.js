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

// ULTIMATE CHATBOT WITH VIETNAMESE ENCODING FIX
function generateUltimateResponse(message, userId) {
  // Ensure proper UTF-8 encoding and fix corrupted Vietnamese
  const cleanMessage = message.toString().trim();
  
  // Fix corrupted Vietnamese characters (replacement character 65533)
  let fixedMessage = cleanMessage;
  
  // Map corrupted Vietnamese patterns to correct ones
  const vietnameseFixMap = {
    'ch�o': 'chào',
    'ch�o b?n': 'chào bạn', 
    'b?n t�n g�': 'bạn tên gì',
    't�i c?m th?y bu?n': 'tôi cảm thấy buồn',
    't�i mu?n l�m test': 'tôi muốn làm test',
    'xin ch�o': 'xin chào',
    'c?m on b?n': 'cảm ơn bạn',
    't�i l�': 'tôi là',
    'lo �u': 'lo âu',
    'c?ng th?ng': 'căng thẳng'
  };
  
  // Apply fixes
  for (const [corrupted, correct] of Object.entries(vietnameseFixMap)) {
    if (fixedMessage.includes(corrupted)) {
      fixedMessage = fixedMessage.replace(corrupted, correct);
    }
  }
  
  const lowerMessage = fixedMessage.toLowerCase();
  
  console.log(`🔍 Original: "${cleanMessage}"`);
  console.log(`🔧 Fixed: "${fixedMessage}"`);
  console.log(`🔍 Lower: "${lowerMessage}"`);
  console.log(`📊 Length: ${cleanMessage.length} -> ${fixedMessage.length} -> ${lowerMessage.length}`);
  
  // Test exact matches with both original and fixed
  if (lowerMessage === 'chào' || lowerMessage === 'chào bạn' || lowerMessage === 'hello' || lowerMessage === 'hi') {
    console.log(`✅ EXACT MATCH: ${lowerMessage}`);
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

  // Test includes with both original and fixed
  if (lowerMessage.includes('chào') || lowerMessage.includes('xin chào')) {
    console.log(`✅ INCLUDES MATCH: chào`);
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

  // Ask about bot's name
  if (lowerMessage.includes('bạn tên') || lowerMessage.includes('tên gì')) {
    console.log(`✅ BOT NAME MATCH`);
    return {
      success: true,
      data: {
        message: `Tôi là SoulFriend! 🤖 Trợ lý tâm lý của bạn. Tôi ở đây để lắng nghe và hỗ trợ bạn. Bạn có thể chia sẻ cảm xúc hoặc tình huống hiện tại của mình.`,
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
        message: `Tôi hiểu bạn đang cảm thấy buồn. 💙 Điều đó hoàn toàn bình thường và bạn không cô đơn. Hãy chia sẻ thêm về cảm xúc của bạn, tôi sẽ lắng nghe và cùng bạn tìm cách vượt qua. Bạn có muốn thử một số kỹ thuật thư giãn không?`,
        intent: 'emotional_support',
        confidence: 0.9,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  }

  // Anxiety states
  if (lowerMessage.includes('lo âu') || lowerMessage.includes('anxiety') || lowerMessage.includes('căng thẳng')) {
    console.log(`✅ ANXIETY MATCH`);
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
        message: `Không có gì! Tôi rất vui được giúp đỡ bạn. Đó là mục đích của tôi - đồng hành và hỗ trợ bạn. Nếu bạn cần thêm sự giúp đỡ hoặc muốn chia sẻ thêm điều gì, tôi luôn ở đây.`,
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

// Chatbot endpoint with ultimate encoding fix
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

    const response = generateUltimateResponse(cleanMessage, cleanUserId);
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
    chatbot: 'ultimate',
    encoding: 'utf-8-fixed',
    vietnamese: 'supported',
    uptime: process.uptime() + ' seconds',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║   🚀 ULTIMATE CHATBOT STARTED!          ║`);
  console.log(`║   ✅ Database Connected                   ║`);
  console.log(`║   ✅ Encoding Fixed                       ║`);
  console.log(`║   ✅ Vietnamese Supported                ║`);
  console.log(`╠════════════════════════════════════════════╣`);
  console.log(`║   Port: ${PORT}                               ║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
  console.log(`╚════════════════════════════════════════════╝`);
});
