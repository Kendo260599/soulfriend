/**
 * SoulFriend V4.0 - Server chính
 * Production-Grade Server with Security, Monitoring & Performance
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

// Configuration
import config from './config/environment';
import databaseConnection from './config/database';

// Middleware
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';
import { errorHandler } from './middleware/errorHandler';
import { httpLogger, logger, generateRequestId } from './utils/pinoLogger';
import {
  securityHeaders,
  apiRateLimit,
  authRateLimit,
  chatbotRateLimit,
  adminRateLimit,
  securityLogger,
  corsOptions,
  validateRequest,
  requestSizeLimit,
  securityErrorHandler,
} from './middleware/security';

// Routes
import consentRoutes from './routes/consent';
import testRoutes from './routes/tests';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import researchRoutes from './routes/research';
import chatbotRoutes from './routes/chatbot';
import hitlFeedbackRoutes from './routes/hitlFeedback';
import conversationLearningRoutes from './routes/conversationLearning';

// Import Models (để MongoDB tạo collections)
import './models/HITLFeedback';
import './models/TrainingDataPoint';
import './models/ConversationLog';

// Initialize Express
const app = express();
const PORT = config.PORT;

// ====================
// LOGGING MIDDLEWARE
// ====================

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = generateRequestId();
  next();
});

// HTTP request/response logging
app.use(httpLogger);

// ====================
// SECURITY MIDDLEWARE
// ====================

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Security logging
app.use(securityLogger);

// Request validation
app.use(validateRequest);

// Request size limiting
app.use(requestSizeLimit((config.MAX_FILE_SIZE || 10485760).toString()));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize user input against NoSQL injection
app.use(mongoSanitize());

// ====================
// LOGGING & MONITORING
// ====================

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
    }, 'Request completed');
  });

  next();
});

// Audit logging for sensitive operations
app.use(auditLogger.middleware);

// ====================
// RATE LIMITING
// ====================

// Global API rate limiting
app.use('/api', apiRateLimit);

// Stricter rate limiting for specific endpoints
app.use('/api/admin', adminRateLimit);
app.use('/api/v2/admin', adminRateLimit);
app.use('/api/chatbot', chatbotRateLimit);
app.use('/api/v2/chatbot', chatbotRateLimit);
app.use('/api/hitl-feedback', authRateLimit);
app.use('/api/conversation-learning', authRateLimit);

// Legacy rate limiting (keep for backward compatibility)
app.use(rateLimiter.middleware);
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
  const healthData = {
    status: 'healthy',
    message: 'SoulFriend V4.0 API is running successfully!',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gemini: 'initialized',
    chatbot: 'ready',
  };
  
  logger.info({ 
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Health check requested');
  
  res.json(healthData);
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
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    suggestion: 'Check the API documentation at /api',
  });
});

// Security error handler (must be before general error handler)
app.use(securityErrorHandler);

// Global error handler
app.use(errorHandler);

// ====================
// DATABASE & SERVER STARTUP
// ====================

const startServer = async () => {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await databaseConnection.connect();
    logger.info('Database connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info({
        environment: config.NODE_ENV,
        port: PORT,
        apiV2: `http://localhost:${PORT}/api/v2`,
        health: `http://localhost:${PORT}/api/health`,
        database: getDbStatusMessage(databaseConnection.getConnectionState()),
      }, 'SoulFriend V4.0 Server Started!');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await databaseConnection.disconnect();
          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error({ error: (error as Error).message }, 'Error during shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Shutdown timeout - forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error({ error: error.message, stack: error.stack }, 'Uncaught Exception');
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Database connection failed');

    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      logger.warn('Starting in FALLBACK mode (no database)...');

      const server = app.listen(PORT, () => {
        logger.warn({
          environment: config.NODE_ENV,
          port: PORT,
          apiV2: `http://localhost:${PORT}/api/v2`,
          health: `http://localhost:${PORT}/api/health`,
          mode: 'FALLBACK - No Database',
        }, 'SoulFriend V4.0 Server Started in FALLBACK MODE!');
      });

      // Graceful shutdown for fallback mode too
      const gracefulShutdown = async (signal: string) => {
        logger.warn(`Received ${signal}. Shutting down...`);
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } else {
      logger.error('Cannot start in production without database');
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
