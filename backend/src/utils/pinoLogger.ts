/**
 * Production-grade logging system using Pino
 * SoulFriend V4.0 - Advanced Logging & Monitoring
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import config from '../config/environment';

// Create base logger
const baseLogger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '[{time}] {level}: {msg}',
      errorLikeObjectKeys: ['err', 'error'],
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.secret',
      '*.key',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Create HTTP logger middleware
export const httpLogger = pinoHttp({
  logger: baseLogger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${err?.message || 'Internal Server Error'}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  customProps: (req, res) => {
    return {
      requestId: req.id,
      userAgent: req.headers['user-agent'],
      ip: (req as any).ip,
      userId: (req as any).user?.id,
    };
  },
});

// Create specialized loggers
export const logger = {
  // Base logger
  ...baseLogger,

  // Security logger
  security: baseLogger.child({ category: 'security' }),
  
  // Audit logger
  audit: baseLogger.child({ category: 'audit' }),
  
  // Performance logger
  performance: baseLogger.child({ category: 'performance' }),
  
  // Database logger
  database: baseLogger.child({ category: 'database' }),
  
  // API logger
  api: baseLogger.child({ category: 'api' }),
  
  // Chatbot logger
  chatbot: baseLogger.child({ category: 'chatbot' }),
  
  // Health check logger
  health: baseLogger.child({ category: 'health' }),
};

// Request ID generator
export const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Logging utilities
export const logError = (error: Error, context?: any) => {
  logger.error({
    err: error,
    ...context,
  }, error.message);
};

export const logSecurity = (message: string, context?: any) => {
  logger.security.warn({
    ...context,
  }, `🔒 SECURITY: ${message}`);
};

export const logAudit = (action: string, userId?: string, context?: any) => {
  logger.audit.info({
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...context,
  }, `📋 AUDIT: ${action}`);
};

export const logPerformance = (operation: string, duration: number, context?: any) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.performance[level]({
    operation,
    duration,
    ...context,
  }, `⚡ PERFORMANCE: ${operation} took ${duration}ms`);
};

export const logDatabase = (operation: string, collection?: string, context?: any) => {
  logger.database.debug({
    operation,
    collection,
    ...context,
  }, `🗄️ DATABASE: ${operation}`);
};

export const logAPI = (method: string, path: string, statusCode: number, duration: number, context?: any) => {
  const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
  logger.api[level]({
    method,
    path,
    statusCode,
    duration,
    ...context,
  }, `🌐 API: ${method} ${path} - ${statusCode} (${duration}ms)`);
};

export const logChatbot = (message: string, context?: any) => {
  logger.chatbot.info({
    ...context,
  }, `🤖 CHATBOT: ${message}`);
};

export const logHealth = (message: string, context?: any) => {
  logger.health.info({
    ...context,
  }, `💚 HEALTH: ${message}`);
};

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down logger...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down logger...');
  process.exit(0);
});

export default logger;
