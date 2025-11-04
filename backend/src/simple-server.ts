/**
 * Simple Server - NO COMPLEX MIDDLEWARE
 * Focus on AI + Database testing
 * Using OpenAI AI (GPT-4o-mini)
 */

import axios from 'axios';
import cors from 'cors';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import config from './config/environment';

const app = express();
const PORT = config.PORT;

// Simple middleware
app.use(cors());
app.use(express.json());

// OpenAI AI Setup
const OPENAI_API_KEY = config.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found');
  process.exit(1);
}

const openAIClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

console.log('✅ OpenAI AI initialized successfully');

// MongoDB Connection
const MONGODB_URI = config.MONGODB_URI;

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
    console.error('❌ MongoDB connection failed:', (error as Error).message);
    return false;
  }
}

// Simple health check
app.get('/api/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const dbConnected = dbStatus === 1;

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    message: 'Simple SoulFriend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    openai: 'initialized',
    ai_model: 'gpt-4o-mini',
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      state: dbStatus,
    },
  });
});

// Chatbot endpoint
app.post('/api/chatbot/message', async (req: Request, res: Response) => {
  try {
    const { message, userId = 'anonymous' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    console.log(`📨 User (${userId}): ${message}`);

    // Generate AI response using OpenAI
    const systemPrompt = `Bạn là CHUN - AI Companion chuyên về sức khỏe tâm lý cho phụ nữ Việt Nam.
    
⚠️ QUAN TRỌNG:
- Bạn KHÔNG phải chuyên gia y tế/tâm lý
- Bạn là công cụ hỗ trợ sàng lọc sơ bộ
- KHÔNG chẩn đoán bệnh lý hoặc kê đơn thuốc
- Mọi lời khuyên chỉ mang tính tham khảo

🌸 TÍNH CÁCH:
- Ấm áp, đồng cảm, không phán xét
- Chuyên nghiệp nhưng gần gũi
- Xưng hô: "Mình" (CHUN) - "Bạn" (User)`;

    const response = await openAIClient.post<any>('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
    });

    const aiResponse = response.data?.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`🤖 AI Response: ${aiResponse}`);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        aiGenerated: true,
        confidence: 0.95,
        intent: 'general_help',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: 'AI response failed',
      details: (error as Error).message,
    });
  }
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    message: 'Simple server is working!',
    openai: 'ready',
    ai_model: 'gpt-4o-mini',
    database: dbStatus === 1 ? 'connected' : 'disconnected',
    mongodb_state: dbStatus,
  });
});

// Start server
async function startServer() {
  const dbConnected = await connectToDatabase();

  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🚀 SIMPLE SERVER STARTED!               ║');
    console.log('║   ✅ OpenAI AI Ready (GPT-4o-mini)      ║');
    console.log(
      `║   ${dbConnected ? '✅' : '❌'} Database ${dbConnected ? 'Connected' : 'Disconnected'}                    ║`
    );
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
