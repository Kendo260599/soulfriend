/**
 * Simple Server - NO COMPLEX MIDDLEWARE
 * Focus on AI + Database testing
 * Using OpenAI AI (GPT-4o-mini)
 */

// ============================================================================
// IMPORTANT: Initialize Sentry FIRST (before any other imports)
// ============================================================================
import { initSentry } from './config/sentry';
import { setupExpressErrorHandler, expressErrorHandler } from '@sentry/node';
initSentry();

import axios from 'axios';
import cors from 'cors';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import config from './config/environment';

const app = express();
const PORT = config.PORT;

// ============================================================================
// SENTRY MIDDLEWARE - Must be added BEFORE other middleware
// ============================================================================
setupExpressErrorHandler(app);

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
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }

    // Close any existing connection first
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing connection...');
      await mongoose.connection.close(true);
    }

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 60000, // Increased to 60 seconds
      connectTimeoutMS: 30000,
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

// Sentry test routes (for testing error monitoring)
app.get('/api/test/sentry/error', (req: Request, res: Response) => {
  const testError = new Error('Test error from Sentry - Server is working!');
  throw testError;
});

app.get('/api/test/sentry/capture', async (req: Request, res: Response) => {
  const { captureException, logger } = await import('./config/sentry');
  
  try {
    throw new Error('Manually captured test error');
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        action: 'test_sentry',
        endpoint: '/api/test/sentry/capture'
      });
    }
  }
  
  logger.info('Sentry test completed', { test: true });
  
  res.json({
    success: true,
    message: 'Error captured! Check your Sentry dashboard at: https://sentry.io'
  });
});

// ============================================================================
// SENTRY ERROR HANDLER - Must be AFTER routes, BEFORE custom error handlers
// ============================================================================
app.use(expressErrorHandler());

// Custom error handler (after Sentry)
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
async function startServer() {
  const dbConnected = await connectToDatabase();

  app.listen(PORT, () => {
    const sentryEnabled = config.SENTRY_DSN && config.NODE_ENV === 'production';
    
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🚀 SIMPLE SERVER STARTED!               ║');
    console.log('║   ✅ OpenAI AI Ready (GPT-4o-mini)      ║');
    console.log(
      `║   ${dbConnected ? '✅' : '❌'} Database ${dbConnected ? 'Connected' : 'Disconnected'}                    ║`
    );
    console.log(
      `║   ${sentryEnabled ? '✅' : '🔧'} Sentry ${sentryEnabled ? 'Enabled' : 'Dev Mode'}                   ║`
    );
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   Port: ${PORT}                               ║`);
    console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
    console.log(`║   Chat: http://localhost:${PORT}/api/chatbot/message ║`);
    console.log(`║   Test: http://localhost:${PORT}/api/test     ║`);
    console.log(`║   Sentry Test: http://localhost:${PORT}/api/test/sentry/error ║`);
    console.log('╚════════════════════════════════════════════╝');
  });
}

startServer().catch(console.error);

// Graceful shutdown - Single handler to avoid duplicate close
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n👋 Received ${signal}. Shutting down simple server gracefully...`);

  try {
    // Close MongoDB connection with force flag
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(true);
      console.log('✅ MongoDB connection closed');
    } else {
      console.log('ℹ️  MongoDB already disconnected');
    }

    console.log('✅ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
