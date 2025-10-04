/**
 * SoulFriend V4.0 - Server chính
 * Production-Grade Server with Security, Monitoring & Performance
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

// Configuration
import config from './config/environment';
import databaseConnection from './config/database';

// Middleware
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import consentRoutes from './routes/consent';
import testRoutes from './routes/tests';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import researchRoutes from './routes/research';
import chatbotRoutes from './routes/chatbot';

// Initialize Express
const app = express();
const PORT = config.PORT;

// ====================
// SECURITY MIDDLEWARE
// ====================

// Helmet - Security headers
app.use(helmet({
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
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Version'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

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
    gemini: 'initialized',
    chatbot: 'ready'
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
          message: getDbStatusMessage(dbStatus)
        },
        cache: config.REDIS_URL ? 'configured' : 'not configured'
      },
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version
      }
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
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
        chatbot: '/api/v2/chatbot'
      },
      v1_deprecated: {
        note: 'v1 endpoints are deprecated and will be removed in v5.0',
        consent: '/api/consent',
        tests: '/api/tests',
        admin: '/api/admin',
        user: '/api/user',
        research: '/api/research',
        chatbot: '/api/chatbot'
      }
    },
    documentation: '/api/docs'
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
    suggestion: 'Check the API documentation at /api'
  });
});

// Global error handler
app.use(errorHandler);

// ====================
// DATABASE & SERVER STARTUP
// ====================

const startServer = async () => {
  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await databaseConnection.connect();
    console.log('✅ Database connected');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════╗');
      console.log('║   🚀 SoulFriend V4.0 Server Started!     ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║   Environment: ${config.NODE_ENV.padEnd(28)}║`);
      console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
      console.log(`║   API v2: http://localhost:${PORT}/api/v2     ║`);
      console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
      console.log('╚════════════════════════════════════════════╝');
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
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('⚠️  Database connection failed:', (error as Error).message);
    
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      console.log('🔄 Starting in FALLBACK mode (no database)...');
      
      const server = app.listen(PORT, () => {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║   🚀 SoulFriend V4.0 Server Started!     ║');
        console.log('║   ⚠️  FALLBACK MODE (No Database)        ║');
        console.log('╠════════════════════════════════════════════╣');
        console.log(`║   Environment: ${config.NODE_ENV.padEnd(28)}║`);
        console.log(`║   Port: ${PORT.toString().padEnd(35)}║`);
        console.log(`║   API v2: http://localhost:${PORT}/api/v2     ║`);
        console.log(`║   Health: http://localhost:${PORT}/api/health ║`);
        console.log('║   ⚠️  Chatbot works, Database disabled   ║');
        console.log('╚════════════════════════════════════════════╝');
      });

      // Graceful shutdown for fallback mode too
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n⚠️  Received ${signal}. Shutting down...`);
        server.close(() => {
          console.log('👋 Server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } else {
      console.error('❌ Cannot start in production without database');
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
    99: 'Uninitialized'
  };
  return states[state] || 'Unknown';
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;