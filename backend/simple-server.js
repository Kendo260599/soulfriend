/**
 * Simple Server - JavaScript Version
 * NO COMPLEX MIDDLEWARE - Focus on AI + Database
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Simple middleware
app.use(cors());
app.use(express.json());

// Gemini AI Setup
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

console.log('✅ Gemini AI initialized successfully');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Simple health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbConnected = dbStatus === 1;
  
  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    message: 'Simple SoulFriend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: 'initialized',
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      state: dbStatus
    }
  });
});

// Chatbot endpoint
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, userId = 'anonymous' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`📨 User (${userId}): ${message}`);

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
  const dbStatus = mongoose.connection.readyState;
  res.json({
    message: 'Simple server is working!',
    gemini: 'ready',
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    mongodb_state: dbStatus
  });
});

// Start server
async function startServer() {
  const dbConnected = await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🚀 SIMPLE SERVER STARTED!               ║');
    console.log('║   ✅ Gemini AI Ready                       ║');
    console.log(`║   ${dbConnected ? '✅' : '❌'} Database ${dbConnected ? 'Connected' : 'Disconnected'}                    ║`);
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   Port: ${PORT}                               ║`);
    console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
    console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
    console.log(`║   Test: http://localhost:${PORT}/api/test     ║`);
    console.log('╚════════════════════════════════════════════╝');
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down simple server...');
  await mongoose.connection.close();
  process.exit(0);
});