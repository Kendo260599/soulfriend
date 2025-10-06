const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow everything for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;
let aiReady = false;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    aiReady = true;
    console.log('✅ Gemini AI initialized');
  } catch (error) {
    console.error('❌ Gemini init failed:', error.message);
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
    cors: 'enabled'
  });
});

// Chatbot endpoint
app.post('/api/v2/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId, context } = req.body;
    
    if (!aiReady) {
      return res.json({
        success: false,
        error: 'AI not initialized'
      });
    }

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      data: {
        message: text,
        aiGenerated: true,
        confidence: 0.9,
        riskLevel: 'LOW',
        nextActions: [],
        emergencyContacts: []
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SoulFriend Emergency Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Chatbot: http://localhost:${PORT}/api/v2/chatbot/message`);
});
