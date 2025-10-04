const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend Test Server is running!',
    timestamp: new Date().toISOString(),
    chatbot: 'ready'
  });
});

// Chatbot endpoints
app.post('/api/v2/chatbot/message', (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    data: {
      message: `CHUN: Xin chào! Tôi đã nhận được tin nhắn "${message}". Tôi đang ở đây để hỗ trợ bạn.`,
      crisisDetected: false,
      nextActions: ['Tiếp tục trò chuyện', 'Làm bài test'],
      emergencyContacts: [],
      confidence: 0.9,
      aiGenerated: true
    }
  });
});

app.get('/api/v2/chatbot/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      chatbot: 'CHUN',
      version: '1.0.0',
      features: ['NLU', 'Crisis Detection', 'Vietnamese Support']
    }
  });
});

app.get('/api/v2/chatbot/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalMessages: 0,
      crisisDetected: 0,
      uptime: process.uptime(),
      status: 'operational'
    }
  });
});

app.get('/api/v2/chatbot/emergency-resources', (req, res) => {
  res.json({
    success: true,
    data: {
      emergencyContacts: [
        { name: 'Tư vấn tâm lý 24/7', phone: '1900 599 958' },
        { name: 'Cảnh sát khẩn cấp', phone: '113' },
        { name: 'Cấp cứu y tế', phone: '115' }
      ],
      crisisHotlines: ['1900 599 958'],
      resources: ['Kỹ thuật grounding', 'Thở sâu', 'Liên hệ chuyên gia']
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🚀 SoulFriend Test Server Started!      ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
  console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
  console.log(`║   Chatbot: Ready                           ║`);
  console.log('╚════════════════════════════════════════════╝');
});
