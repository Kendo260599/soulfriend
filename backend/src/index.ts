/**
 * SoulFriend V4.0 - Server chính
 * Production-Grade Server with Security, Monitoring & Performance
 * Version: 1.0.2 - Real-Time Expert Intervention with Socket.io
 */

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import * as Sentry from '@sentry/node';

// Extend Express Request type for rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

// Configuration
import databaseConnection from './config/database';
import config from './config/environment';
import { qstashService } from './config/qstash';
import { redisConnection } from './config/redis';
import { initSentry } from './config/sentry';

// Redis Service
import redisService from './services/redisService';

// Middleware
import { auditLogger } from './middleware/auditLogger';
import { authenticateAdmin } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { authRateLimiter, rateLimiter } from './middleware/rateLimiter';

// Routes
import adminRoutes from './routes/admin';
import chatbotRoutes from './routes/chatbot';
import consentRoutes from './routes/consent';
import conversationLearningRoutes from './routes/conversationLearning';
import criticalAlertsRoutes from './routes/criticalAlerts';
import expertAuthRoutes from './routes/expertAuth';
import hitlFeedbackRoutes from './routes/hitlFeedback';
import hitlInterventionRoutes from './routes/hitlIntervention';
import fineTuningRoutes from './routes/fineTuning';
import abTestingRoutes from './routes/abTesting';
import qstashTestRoutes from './routes/qstashTest';
import qstashWebhookRoutes from './routes/qstashWebhooks';
import researchRoutes from './routes/research';
import sentryTestRoutes from './routes/sentryTestRoutes';
import testRoutes from './routes/tests';
import userRoutes from './routes/user';
import memoryTestRoutes from './routes/memoryTest';

// Import Models (để MongoDB tạo collections)
import './models/ConversationLog';
import './models/Expert';
import './models/HITLFeedback';
import './models/InterventionMessage';
import './models/TrainingDataPoint';
import './models/LongTermMemory';
import './models/ABExperiment';
import './models/CriticalAlert';
import './models/AuditLog';

// Services
import emailService from './services/emailService';
import { logger } from './utils/logger';

// Socket.io
import { initializeSocketServer } from './socket/socketServer';

// Initialize Express
const app = express();
const PORT = config.PORT;

// Create HTTP Server for Socket.io
const httpServer = createServer(app);

// ====================
// SENTRY INITIALIZATION
// ====================
initSentry();

// ====================
// PREFLIGHT HANDLER - MUST BE FIRST
// ====================
// Handle preflight requests BEFORE any other middleware
// cors() middleware handles this, but keep explicit handler for edge cases
app.options(/.*/, (req: Request, res: Response) => {
  const origin = req.headers.origin as string | undefined;

  if (origin && ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.endsWith('.soulfriend.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-API-Version'
  );
  res.header('Access-Control-Max-Age', '86400');

  res.status(204).end();
});

// ====================
// SECURITY MIDDLEWARE
// ====================

// Helmet - Security headers (configured to not interfere with CORS)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginResourcePolicy: false, // Allow CORS
    crossOriginEmbedderPolicy: false, // Allow CORS
  })
);

// CORS configuration - MUST be before other middleware
const ALLOWED_ORIGINS = [
  'https://soulfriend.vercel.app',
  'https://soulfriend-v4.vercel.app',
  process.env.FRONTEND_URL,
  ...(config.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.endsWith('.soulfriend.vercel.app'))) {
        return callback(null, origin);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Version'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-Id', 'X-Response-Time'],
    optionsSuccessStatus: 200,
  })
);

// CORS headers handled by cors() middleware above — removed duplicate manual CORS handler

// Body parsing with UTF-8 support (CRITICAL for Vietnamese characters!)
app.use(express.json({ 
  limit: '10mb', 
  type: 'application/json',
  verify: (req: any, res: any, buf: Buffer) => {
    // Preserve raw buffer for UTF-8 validation
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 50000
}));
app.use(express.text({ type: 'text/plain', defaultCharset: 'utf-8' }));

// ⚠️ CRITICAL: Vietnamese UTF-8 Fix Middleware
// Must come AFTER body parsers to fix corrupted encoding
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    // Recursively fix all string values in request body
    const fixEncoding = (obj: any, _path?: string): any => {
      if (typeof obj === 'string') {
        try {
          // If string contains replacement characters (�), it's corrupted
          if (obj.includes('�') || obj.charCodeAt(0) === 65533) {
            // Try to recover specific field from raw body
            if (req.rawBody && _path) {
              try {
                const parsed = JSON.parse(req.rawBody);
                const parts = _path.split('.');
                let value: any = parsed;
                for (const part of parts) {
                  value = value?.[part];
                }
                if (typeof value === 'string') {
                  return value.normalize('NFC');
                }
              } catch { /* fall through to NFC normalize */ }
            }
          }
          // Normalize Vietnamese characters (NFC = Canonical Composition)
          return obj.normalize('NFC');
        } catch {
          return obj;
        }
      } else if (Array.isArray(obj)) {
        return obj.map((item, i) => fixEncoding(item, _path ? `${_path}.${i}` : `${i}`));
      } else if (obj !== null && typeof obj === 'object') {
        const fixed: any = {};
        for (const key in obj) {
          fixed[key] = fixEncoding(obj[key], _path ? `${_path}.${key}` : key);
        }
        return fixed;
      }
      return obj;
    };
    
    req.body = fixEncoding(req.body);
  }
  next();
});

// Sanitize user input against NoSQL injection
// Strips MongoDB operators ($gt, $ne, etc.) from request body, query, and params
app.use((req: Request, _res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) continue; // Strip MongoDB operators
      clean[key] = typeof obj[key] === 'object' ? sanitize(obj[key]) : obj[key];
    }
    return clean;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'object') {
        req.query[key] = undefined;
      }
    }
  }
  next();
});

// ====================
// LOGGING & MONITORING
// ====================

// Request context: assigns unique request ID + tracks response time
import { requestContext } from './middleware/requestContext';
app.use(requestContext);

// Audit logging for sensitive operations
app.use(auditLogger.middleware);

// ====================
// RATE LIMITING
// ====================

// Global rate limiting
app.use(rateLimiter.middleware);

// Stricter rate limiting for auth endpoints
app.use('/api/auth', authRateLimiter.middleware);
app.use('/api/admin/login', authRateLimiter.middleware);
app.use('/api/v2/expert/login', authRateLimiter.middleware);
app.use('/api/v2/expert/register', authRateLimiter.middleware);

// ====================
// API VERSIONING
// ====================

// API v2 routes (new)
app.use('/api/v2/consent', consentRoutes);
app.use('/api/v2/tests', testRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/user', userRoutes);
app.use('/api/v2/research', researchRoutes);
app.use('/api/v2/chatbot', chatbotRoutes);

// ✨ NEW: HITL Feedback Loop & Conversation Learning
app.use('/api/hitl-feedback', hitlFeedbackRoutes);

// ✨ NEW: HITL Intervention - Clinical Team Direct Chat
app.use('/api/hitl', hitlInterventionRoutes);
app.use('/api/conversation-learning', conversationLearningRoutes);
app.use('/api/alerts', criticalAlertsRoutes);

// ✨ NEW: Expert Authentication & Dashboard
app.use('/api/v2/expert', expertAuthRoutes);

// ✨ NEW: Auto Fine-Tuning Pipeline & A/B Testing
app.use('/api/fine-tuning', fineTuningRoutes);
app.use('/api/ab-testing', abTestingRoutes);

// ✨ NEW: QStash Webhooks for Scheduled Tasks
app.use('/api/webhooks/qstash', qstashWebhookRoutes);

// 🧪 TEST: QStash Testing Endpoints (Development ONLY)
if (config.NODE_ENV === 'development') {
  app.use('/api/test/qstash', qstashTestRoutes);
  console.log('🧪 QStash test routes enabled at /api/test/qstash');
  
  app.use('/api/test/sentry', sentryTestRoutes);
  console.log('🧪 Sentry test routes enabled at /api/test/sentry');
  
  app.use('/api/test/memory', memoryTestRoutes);
  console.log('🧪 Memory test routes enabled at /api/test/memory');
}

// API v1 routes (legacy - deprecated)
app.use('/api/consent', consentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ====================
// HEALTH CHECK ENDPOINTS
// ====================

// Basic health check - ULTRA SIMPLE VERSION
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    message: 'SoulFriend V4.0 API is running successfully!',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    openai: 'initialized',
    chatbot: 'ready',
  });
});

// Detailed health check (includes database status) - Admin only
app.get('/api/health/detailed', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const dbStatus = databaseConnection.getConnectionState();
    const dbHealthy = databaseConnection.isHealthy();
    const redisHealthy = redisConnection.isHealthy();

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!dbHealthy) overallStatus = 'unhealthy';
    else if (!redisHealthy) overallStatus = 'degraded';

    // Get circuit breaker stats
    let circuitBreakers: any[] = [];
    try {
      const { getAllCircuitStats } = await import('./services/circuitBreakerService');
      circuitBreakers = getAllCircuitStats();
      // If any circuit is OPEN, mark degraded
      if (circuitBreakers.some((cb: any) => cb.state === 'OPEN')) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } catch { /* circuit breaker not available */ }

    const health = {
      status: overallStatus,
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'operational',
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          state: dbStatus,
          message: getDbStatusMessage(dbStatus),
        },
        cache: {
          status: redisHealthy ? 'connected' : 'disconnected',
          configured: config.REDIS_URL ? 'yes' : 'no',
        },
        vectorDb: {
          status: 'checking',
          configured: config.PINECONE_API_KEY ? 'yes' : 'no',
          indexName: config.PINECONE_INDEX_NAME,
        },
        qstash: {
          status: qstashService.isReady() ? 'enabled' : 'disabled',
          configured: process.env.QSTASH_TOKEN ? 'yes' : 'no',
        },
      },
      circuitBreakers,
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
      },
    };

    // Alert on degraded/unhealthy status via email
    if (overallStatus !== 'healthy') {
      try {
        const alertEmail = process.env.ALERT_EMAIL || process.env.SMTP_FROM;
        if (alertEmail && emailService.isReady()) {
          await emailService.send({
            to: alertEmail,
            subject: `⚠️ SoulFriend Health Alert: ${overallStatus.toUpperCase()}`,
            html: `<h2>Health Status: ${overallStatus}</h2><pre>${JSON.stringify(health.services, null, 2)}</pre><p>Circuit Breakers:</p><pre>${JSON.stringify(circuitBreakers, null, 2)}</pre><p>Time: ${health.timestamp}</p>`,
          });
        }
      } catch (alertErr) {
        // Don't fail health check due to alert failure
        console.warn('Failed to send health alert email:', alertErr);
      }
    }

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

// Readiness probe (for Kubernetes)
app.get('/api/ready', (req: Request, res: Response) => {
  if (databaseConnection.isHealthy()) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Database not ready' });
  }
});

// Liveness probe (for Kubernetes)
app.get('/api/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

// ====================
// API DOCUMENTATION
// ====================

app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'SoulFriend API',
    version: '4.0.0',
    description: 'Mental health support platform for Vietnamese women',
    endpoints: {
      health: '/api/health',
      healthDetailed: '/api/health/detailed',
      v2: {
        consent: '/api/v2/consent',
        tests: '/api/v2/tests',
        admin: '/api/v2/admin',
        user: '/api/v2/user',
        research: '/api/v2/research',
        chatbot: '/api/v2/chatbot',
      },
      v1_deprecated: {
        note: 'v1 endpoints are deprecated and will be removed in v5.0',
        consent: '/api/consent',
        tests: '/api/tests',
        admin: '/api/admin',
        user: '/api/user',
        research: '/api/research',
        chatbot: '/api/chatbot',
      },
    },
    documentation: '/api/docs',
  });
});

// ====================
// ERROR HANDLING
// ====================

// 404 handler
app.use((req: Request, res: Response) => {
  // CRITICAL: Set CORS headers even on 404 errors
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-API-Version'
  );

  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    suggestion: 'Check the API documentation at /api',
  });
});

// Sentry error handler - automatically adds error middleware
Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use(errorHandler);

// ====================
// DATABASE & SERVER STARTUP
// ====================

const startServer = async () => {
  try {
    console.log('📊 Starting server...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`📊 Config PORT: ${PORT}`);
    console.log(`📊 Process.env.PORT: ${process.env.PORT}`);

    // Initialize Socket.io BEFORE starting server
    console.log('🔌 Initializing Socket.io for real-time communication...');
    const io = initializeSocketServer(httpServer);
    
    // Make io available to the app
    app.set('io', io);
    (global as any).io = io;
    
    console.log('✅ Socket.io initialized successfully');

    // Start HTTP server FIRST - before database connection
    // This ensures Render health check can reach server immediately
    const actualPort = parseInt(process.env.PORT || String(PORT) || '8080', 10);
    console.log(`📊 Starting server on port: ${actualPort}`);

    const server = httpServer.listen(actualPort, '0.0.0.0', () => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🚀 SoulFriend V4.0 Server Started!     ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║   Environment: ${config.NODE_ENV.padEnd(28)}║`);
      console.log(`║   Port: ${actualPort.toString().padEnd(35)}║`);
      console.log(`║   API v2: http://localhost:${actualPort}/api/v2     ║`);
      console.log(`║   Health: http://localhost:${actualPort}/api/health ║`);
      console.log(`║   Socket.io: ENABLED (real-time chat)    ║`);
      console.log('╚════════════════════════════════════════════╝');

      // Connect to database AFTER server starts (non-blocking)
      console.log('📊 Connecting to database (non-blocking)...');
      databaseConnection.connect().catch(err => {
        console.warn('⚠️  Database connection failed, continuing without database:', err.message);
      });

      // Connect to Redis AFTER server starts (non-blocking)
      console.log('🔴 Connecting to Redis Cloud (non-blocking)...');
      redisService.connect().then(() => {
        console.log('✅ Redis Cloud connected - Caching enabled!');
      }).catch(err => {
        console.warn('⚠️  Redis connection failed, continuing without cache:', err instanceof Error ? err.message : err);
      });

      // Initialize Pinecone Vector Store AFTER server starts (non-blocking)
      console.log('🧠 Initializing Pinecone Vector Store (non-blocking)...');
      import('./services/vectorStore').then(({ vectorStore }) => {
        vectorStore.initialize().then(() => {
          console.log('✅ Pinecone Vector Store ready for memory system');
        }).catch(err => {
          console.warn('⚠️  Pinecone initialization failed, continuing without vector memory:', err instanceof Error ? err.message : err);
        });
      }).catch(err => {
        console.warn('⚠️  Failed to import vectorStore:', err);
      });

      // Start memory consolidation service (24h periodic cleanup)
      import('./services/memoryConsolidationService').then(({ memoryConsolidationService }) => {
        memoryConsolidationService.startPeriodicConsolidation();
        console.log('✅ Memory consolidation service started (24h interval)');
      }).catch(err => {
        console.warn('⚠️  Memory consolidation service failed to start:', err instanceof Error ? err.message : err);
      });

      // Start data retention service (daily GDPR cleanup)
      import('./services/dataRetentionService').then(({ dataRetentionService }) => {
        dataRetentionService.startPeriodicEnforcement();
        console.log('✅ Data retention service started (24h interval)');
      }).catch(err => {
        console.warn('⚠️  Data retention service failed to start:', err instanceof Error ? err.message : err);
      });

      // Test email service connection
      if (emailService.isReady()) {
    emailService.testConnection().then((success: boolean) => {
      if (success) {
        console.log('✅ Email service ready for HITL alerts');
      } else {
        console.warn('⚠️  Email service connection test failed');
      }
    }).catch((err: Error) => {
      console.warn('⚠️  Email service connection test error:', err.message);
    });
  } else {
    console.warn('⚠️  Email service not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required)');
  }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${actualPort} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server failed to start:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('🔒 HTTP server closed');

        try {
          // Close Redis connection
          try {
            await redisService.disconnect();
            console.log('🔌 Redis disconnected');
          } catch (redisErr) {
            console.warn('⚠️  Redis disconnect error:', redisErr);
          }

          // Close memory system's Redis connection (ioredis)
          try {
            const { memorySystem } = await import('./services/memorySystem');
            await memorySystem.disconnect();
          } catch (memErr) {
            console.warn('⚠️  Memory system disconnect error:', memErr);
          }

          // Close MongoDB connection
          await databaseConnection.disconnect();

          // Close logger streams
          logger.close();

          console.log('👋 Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⏰ Shutdown timeout - forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);

    // Even if there's an error, try to start the server in fallback mode
    console.log('🔄 Attempting to start server in FALLBACK mode...');

    try {
      const actualPort = parseInt(process.env.PORT || String(PORT) || '8080', 10);
      console.log(`📊 Starting fallback server on port: ${actualPort}`);

      const server = httpServer.listen(actualPort, '0.0.0.0', () => {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║   🚀 SoulFriend V4.0 Server Started!     ║');
        console.log('║   ⚠️  FALLBACK MODE (Error Recovery)     ║');
        console.log('╠════════════════════════════════════════════╣');
        console.log(`║   Environment: ${config.NODE_ENV.padEnd(28)}║`);
        console.log(`║   Port: ${actualPort.toString().padEnd(35)}║`);
        console.log(`║   API v2: http://localhost:${actualPort}/api/v2     ║`);
        console.log(`║   Health: http://localhost:${actualPort}/api/health ║`);
        console.log('║   ⚠️  Server running in fallback mode    ║');
        console.log('╚════════════════════════════════════════════╝');
      });

      // Handle server errors in fallback mode
      server.on('error', (error: any) => {
        console.error('❌ Fallback server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${actualPort} is already in use`);
        }
        process.exit(1);
      });

      // Graceful shutdown for fallback mode
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n⚠️  Received ${signal}. Shutting down...`);
        server.close(() => {
          console.log('👋 Server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (fallbackError) {
      console.error('❌ Failed to start fallback server:', fallbackError);
      process.exit(1);
    }
  }
};

// Helper function
function getDbStatusMessage(state: number): string {
  const states: { [key: number]: string } = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
    99: 'Uninitialized',
  };
  return states[state] || 'Unknown';
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
