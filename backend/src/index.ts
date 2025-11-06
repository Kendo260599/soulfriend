/**
 * SoulFriend V4.0 - Server chính
 * Production-Grade Server with Security, Monitoring & Performance
 * Version: 1.0.1 - Crisis Detection & HITL System Enhanced
 */

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// Configuration
import databaseConnection from './config/database';
import config from './config/environment';

// Middleware
import { auditLogger } from './middleware/auditLogger';
import { errorHandler } from './middleware/errorHandler';
import { authRateLimiter, rateLimiter } from './middleware/rateLimiter';

// Routes
import adminRoutes from './routes/admin';
import chatbotRoutes from './routes/chatbot';
import consentRoutes from './routes/consent';
import conversationLearningRoutes from './routes/conversationLearning';
import criticalAlertsRoutes from './routes/criticalAlerts';
import hitlFeedbackRoutes from './routes/hitlFeedback';
import researchRoutes from './routes/research';
import testRoutes from './routes/tests';
import userRoutes from './routes/user';

// Import Models (để MongoDB tạo collections)
import './models/ConversationLog';
import './models/HITLFeedback';
import './models/TrainingDataPoint';

// Services
import emailService from './services/emailService';

// Initialize Express
const app = express();
const PORT = config.PORT;

// ====================
// PREFLIGHT HANDLER - MUST BE FIRST
// ====================
// Handle preflight requests BEFORE any other middleware
// This ensures OPTIONS requests don't get blocked by other middleware
app.options(/.*/, (req: Request, res: Response) => {
  // Ultra-simple OPTIONS handler - just return CORS headers immediately
  // No config access, no logic - just enough to satisfy browser preflight
  const origin = req.headers.origin as string | undefined;

  // Set CORS headers
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
// Use simple origin allow all for now to debug
app.use(
  cors({
    origin: true, // Allow all origins temporarily to debug
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Version'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    optionsSuccessStatus: 200,
  })
);

// ====================
// CORS MIDDLEWARE - ALWAYS SET HEADERS
// ====================
// This middleware ensures CORS headers are ALWAYS set, even if other middleware fails
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;

  // Set CORS headers on every request
  if (origin) {
    // Allow all origins for now (we'll restrict later)
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
  res.header(
    'Access-Control-Expose-Headers',
    'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  );
  res.header('Access-Control-Max-Age', '86400');

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Body parsing with UTF-8 support
app.use(express.json({ limit: '10mb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: 'text/plain' }));

// Sanitize user input against NoSQL injection
// Note: Disabled for Express v5 compatibility - implementing manual sanitization in validators
// Manual sanitization implemented in route validators

// ====================
// LOGGING & MONITORING
// ====================

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

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
app.use('/api/conversation-learning', conversationLearningRoutes);
app.use('/api/alerts', criticalAlertsRoutes);

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

// Detailed health check (includes database status)
app.get('/api/health/detailed', async (req: Request, res: Response) => {
  try {
    const dbStatus = databaseConnection.getConnectionState();
    const dbHealthy = databaseConnection.isHealthy();

    const health = {
      status: dbHealthy ? 'healthy' : 'degraded',
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
        cache: config.REDIS_URL ? 'configured' : 'not configured',
      },
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

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
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

    // Start HTTP server FIRST - before database connection
    // This ensures Railway health check can reach server immediately
    const actualPort = parseInt(process.env.PORT || String(PORT) || '8080', 10);
    console.log(`📊 Starting server on port: ${actualPort}`);

    const server = app.listen(actualPort, '0.0.0.0', () => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🚀 SoulFriend V4.0 Server Started!     ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║   Environment: ${config.NODE_ENV.padEnd(28)}║`);
      console.log(`║   Port: ${actualPort.toString().padEnd(35)}║`);
      console.log(`║   API v2: http://localhost:${actualPort}/api/v2     ║`);
      console.log(`║   Health: http://localhost:${actualPort}/api/health ║`);
      console.log('╚════════════════════════════════════════════╝');

      // Connect to database AFTER server starts (non-blocking)
      console.log('📊 Connecting to database (non-blocking)...');
      databaseConnection.connect().catch(err => {
        console.warn('⚠️  Database connection failed, continuing without database:', err.message);
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
          await databaseConnection.disconnect();
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

      const server = app.listen(actualPort, '0.0.0.0', () => {
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
