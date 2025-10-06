/**
 * Simple Health Check Server
 * Test backend without complex middleware
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // Use different port to avoid conflict

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple backend is running!',
    timestamp: new Date().toISOString(),
    chatbot: 'online',
    gemini: 'ready'
  });
});

// Chatbot message endpoint
app.post('/api/v2/chatbot/message', async (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    data: {
      message: `Echo: ${message}. Backend AI đang hoạt động!`,
      riskLevel: 'LOW',
      confidence: 0.8,
      aiGenerated: true,
      nextActions: ['Tiếp tục trò chuyện', 'Thử các tính năng khác']
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Simple backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Chatbot: http://localhost:${PORT}/api/v2/chatbot/message`);
});


