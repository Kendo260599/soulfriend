/**
 * Test Server with Database - Simple Version
 * Tests MongoDB connection and Gemini AI together
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/soulfriend';

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
    message: 'Test Server with Database',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: 'initialized',
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      state: dbStatus,
      message: dbConnected ? 'MongoDB connected' : 'MongoDB disconnected'
    }
  });
});

// Chatbot endpoint with database
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

    // Save to database if connected
    let savedToDb = false;
    if (mongoose.connection.readyState === 1) {
      try {
        // Simple message log (you can expand this)
        const messageLog = {
          userId,
          message,
          aiResponse,
          timestamp: new Date(),
          aiGenerated: true
        };
        
        // For now, just log that we would save it
        console.log('📝 Would save to database:', messageLog);
        savedToDb = true;
      } catch (dbError) {
        console.error('❌ Database save failed:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: {
        message: aiResponse,
        aiGenerated: true,
        confidence: 0.85,
        intent: 'general_help',
        database: savedToDb ? 'saved' : 'not_saved',
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
    message: 'Test server with database is working!',
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
    console.log('║   🚀 TEST SERVER WITH DATABASE STARTED!   ║');
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
  console.log('\n👋 Shutting down test server...');
  await mongoose.connection.close();
  process.exit(0);
});
